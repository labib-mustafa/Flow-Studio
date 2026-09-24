import { AgentToolCall, AgentToolResult } from '../../types';
import { toast } from '../../../../../stores/toastStore';
import { useMailStore, useMailTemplateStore, EmailTemplate, FollowUpStep } from '../../../../../stores/mailStore';
import { useLeadStore } from '../../../../../stores/leadStore';

/**
 * Email campaign operations: templates, batches, the send queue, reply sync and
 * follow-up scheduling. This area previously had **zero** agent coverage.
 *
 * Two things make this module different from the others:
 *
 * 1. **Outbound mail is irreversible.** Sending cannot be undone — an undo
 *    branch would be theatre. The descriptions therefore require the model to
 *    confirm before `send_bulk_email` or `create_email_batch`, and Phase 4's
 *    confirmation gate is where that gets enforced.
 *
 * 2. **Credentials are deliberately not writable.** `followUpSettings` holds
 *    SMTP/IMAP username and password. A tool that writes them would route a
 *    live password through the model and into conversation history, so
 *    `update_followup_settings` accepts scheduling fields only. Credentials
 *    stay a Settings-tab action.
 *
 * Send actions are async but the dispatcher calls handlers synchronously, so
 * they are started and reported as started; the outcome arrives as a toast.
 */

const resolveLeads = (refs: unknown) => {
  const leads = useLeadStore.getState().leads || [];
  const list = Array.isArray(refs) ? refs.map((r) => String(r).trim().toLowerCase()).filter(Boolean) : [];
  const matched: { id: string; name: string }[] = [];
  const missed: string[] = [];

  for (const ref of list) {
    const hit =
      leads.find((l) => l.id.toLowerCase() === ref) ||
      leads.find((l) => (l.name || '').toLowerCase() === ref) ||
      leads.find((l) => (l.email || '').toLowerCase() === ref) ||
      leads.find((l) => (l.name || '').toLowerCase().includes(ref));
    if (hit) matched.push({ id: hit.id, name: hit.name });
    else missed.push(ref);
  }
  return { matched, missed };
};

export function handleEmailTools(call: AgentToolCall): AgentToolResult | null {
  const args = call.args || {};

  // ---------- Templates (read) ----------
  if (call.name === 'list_email_templates') {
    const templates = useMailTemplateStore.getState().templates || [];
    return {
      toolName: 'list_email_templates',
      description: templates.length
        ? `${templates.length} template(s): ${templates.map((t) => `"${t.name}"`).join(', ')}`
        : 'No email templates saved yet.',
      data: templates
    };
  }

  // ---------- Templates (write) ----------
  if (call.name === 'create_email_template') {
    if (!args.name || !args.subject || !args.body) {
      return {
        toolName: 'create_email_template',
        description: 'A template needs a name, subject and body.',
        data: {}
      };
    }
    useMailTemplateStore.getState().addTemplate({
      name: String(args.name),
      subject: String(args.subject),
      body: String(args.body)
    });
    const created = useMailTemplateStore.getState().templates;
    const template: EmailTemplate | undefined = created.find((t) => t.name === String(args.name));
    toast.success(`Saved email template "${args.name}"`);
    return {
      toolName: 'create_email_template',
      description: `Saved template "${args.name}"`,
      data: template || { name: args.name }
    };
  }

  if (call.name === 'update_email_template') {
    const ref = String(args.template || '').trim().toLowerCase();
    const target = (useMailTemplateStore.getState().templates || []).find(
      (t) => t.id.toLowerCase() === ref || t.name.toLowerCase() === ref || t.name.toLowerCase().includes(ref)
    );
    if (!target) return null;

    const updates: Partial<EmailTemplate> = {};
    if (args.name) updates.name = String(args.name);
    if (args.subject) updates.subject = String(args.subject);
    if (args.body) updates.body = String(args.body);
    if (Object.keys(updates).length === 0) {
      return {
        toolName: 'update_email_template',
        description: 'Provide at least one of name, subject or body.',
        data: { id: target.id }
      };
    }

    const previous: any = {};
    for (const key of Object.keys(updates)) previous[key] = (target as any)[key];

    useMailTemplateStore.getState().updateTemplate(target.id, updates);
    toast.success(`Updated template "${target.name}"`);
    return {
      toolName: 'update_email_template',
      description: `Updated template "${target.name}" (${Object.keys(updates).join(', ')})`,
      data: { id: target.id, ...updates, previous }
    };
  }

  if (call.name === 'delete_email_template') {
    const ref = String(args.template || '').trim().toLowerCase();
    const target = (useMailTemplateStore.getState().templates || []).find(
      (t) => t.id.toLowerCase() === ref || t.name.toLowerCase() === ref || t.name.toLowerCase().includes(ref)
    );
    if (!target) return null;
    useMailTemplateStore.getState().deleteTemplate(target.id);
    toast.success(`Deleted template "${target.name}"`);
    return {
      toolName: 'delete_email_template',
      description: `Deleted template "${target.name}"`,
      data: target
    };
  }

  // ---------- Batches (read) ----------
  if (call.name === 'list_email_campaigns') {
    const state = useMailStore.getState();
    const batches = state.batches || [];
    const queue = state.queue || [];
    const summary = batches.map((b) => {
      const items = queue.filter((q) => q.batchId === b.id);
      return {
        id: b.id,
        name: b.name,
        status: b.status,
        recipients: b.leadIds.length,
        steps: b.steps.length,
        scheduled: items.filter((q) => q.status === 'scheduled').length,
        sent: items.filter((q) => q.status === 'sent').length,
        cancelled: items.filter((q) => q.status === 'cancelled').length
      };
    });
    return {
      toolName: 'list_email_campaigns',
      description: batches.length
        ? `${batches.length} campaign(s): ${summary.map((s) => `"${s.name}" (${s.status})`).join(', ')}`
        : 'No email campaigns yet.',
      data: { campaigns: summary, settings: { maxAttempts: state.followUpSettings.maxAttempts, followUpDelays: state.followUpSettings.followUpDelays } }
    };
  }

  // ---------- Batch lifecycle ----------
  if (call.name === 'create_email_batch') {
    const { matched, missed } = resolveLeads(args.leads);
    if (matched.length === 0) {
      return {
        toolName: 'create_email_batch',
        description: `No matching leads found${missed.length ? `: ${missed.join(', ')}` : ''}.`,
        data: { missed }
      };
    }
    if (!args.subject || !args.body) {
      return {
        toolName: 'create_email_batch',
        description: 'A campaign needs a subject and a body.',
        data: { leads: matched.map((m) => m.name) }
      };
    }

    const rawSteps = Array.isArray(args.steps) ? args.steps : [];
    const steps: FollowUpStep[] = rawSteps.map((s: any, i: number) => ({
      stepIndex: i,
      delayDays: Number(s.delayDays) || 3,
      subjectTemplate: String(s.subject || args.subject),
      bodyTemplate: String(s.body || args.body)
    }));
    if (steps.length === 0) {
      steps.push({
        stepIndex: 0,
        delayDays: 0,
        subjectTemplate: String(args.subject),
        bodyTemplate: String(args.body)
      });
    }

    const senderType = args.senderType === 'team' ? 'team' : 'personal';
    useMailStore
      .getState()
      .createBatch(
        String(args.name || `Campaign ${new Date().toLocaleDateString()}`),
        matched.map((m) => m.id),
        String(args.subject),
        String(args.body),
        steps,
        senderType
      )
      .then((res) => {
        if (res?.success) toast.success(`Campaign scheduled for ${matched.length} lead(s)`);
        else toast.error(res?.errors?.[0] || 'Could not schedule the campaign');
      })
      .catch(() => toast.error('Could not schedule the campaign'));

    const warning = missed.length > 0 ? ` Unmatched: ${missed.join(', ')}.` : '';
    return {
      toolName: 'create_email_batch',
      description: `Scheduling a ${steps.length}-step campaign for ${matched.length} lead(s).${warning}`,
      data: { leadIds: matched.map((m) => m.id), steps: steps.length, senderType }
    };
  }

  if (call.name === 'manage_email_batch') {
    const ref = String(args.batch || '').trim().toLowerCase();
    const target = (useMailStore.getState().batches || []).find(
      (b) => b.id.toLowerCase() === ref || b.name.toLowerCase() === ref || b.name.toLowerCase().includes(ref)
    );
    if (!target) return null;

    if (args.action === 'pause') {
      useMailStore.getState().pauseBatch(target.id);
      toast.success(`Paused "${target.name}"`);
      return {
        toolName: 'manage_email_batch',
        description: `Paused campaign "${target.name}"`,
        data: { id: target.id, previous: { status: target.status } }
      };
    }
    if (args.action === 'resume') {
      useMailStore.getState().resumeBatch(target.id);
      toast.success(`Resumed "${target.name}"`);
      return {
        toolName: 'manage_email_batch',
        description: `Resumed campaign "${target.name}"`,
        data: { id: target.id, previous: { status: target.status } }
      };
    }
    if (args.action === 'delete') {
      const snapshot = { ...target, queue: (useMailStore.getState().queue || []).filter((q) => q.batchId === target.id) };
      useMailStore.getState().deleteBatch(target.id);
      toast.success(`Deleted campaign "${target.name}"`);
      return {
        toolName: 'manage_email_batch',
        description: `Deleted campaign "${target.name}" (${snapshot.leadIds.length} recipient(s))`,
        data: snapshot
      };
    }
    return null;
  }

  // ---------- Queue items ----------
  if (call.name === 'manage_queue_item') {
    const ref = String(args.item || '').trim().toLowerCase();
    const queue = useMailStore.getState().queue || [];
    const target =
      queue.find((q) => q.id.toLowerCase() === ref) ||
      // Fall back to matching by recipient name via the lead record.
      queue.find((q) => {
        const lead = (useLeadStore.getState().leads || []).find((l) => l.id === q.leadId);
        return (lead?.name || '').toLowerCase().includes(ref);
      });
    if (!target) return null;

    if (args.action === 'cancel') {
      useMailStore.getState().cancelQueueItem(target.id);
      toast.success('Cancelled queued email');
      return {
        toolName: 'manage_queue_item',
        description: `Cancelled the queued email (was ${target.status})`,
        data: { id: target.id, previous: { status: target.status } }
      };
    }
    if (args.action === 'sendNow') {
      useMailStore
        .getState()
        .sendQueueItemNow(target.id)
        .then((res) => {
          if (res?.success) toast.success('Queued email sent');
          else toast.error(res?.error || 'Could not send the queued email');
        })
        .catch(() => toast.error('Could not send the queued email'));
      return {
        toolName: 'manage_queue_item',
        description: 'Sending that queued email now',
        data: { id: target.id }
      };
    }
    if (args.action === 'edit') {
      const updates: any = {};
      if (args.subject) updates.subject = String(args.subject);
      if (args.body) updates.body = String(args.body);
      if (args.scheduledAt) updates.scheduledAt = String(args.scheduledAt);
      if (Object.keys(updates).length === 0) {
        return {
          toolName: 'manage_queue_item',
          description: 'Provide a subject, body or scheduledAt to edit.',
          data: { id: target.id }
        };
      }
      const previous: any = {};
      for (const key of Object.keys(updates)) previous[key] = (target as any)[key];
      useMailStore.getState().updateQueueItem(target.id, updates);
      toast.success('Updated queued email');
      return {
        toolName: 'manage_queue_item',
        description: `Updated the queued email (${Object.keys(updates).join(', ')})`,
        data: { id: target.id, ...updates, previous }
      };
    }
    return null;
  }

  if (call.name === 'process_email_queue') {
    useMailStore
      .getState()
      .processQueue()
      .then(() => toast.success('Queue processed'))
      .catch(() => toast.error('Could not process the queue'));
    return {
      toolName: 'process_email_queue',
      description: 'Processing the send queue now — due emails are being dispatched.',
      data: {}
    };
  }

  // ---------- Replies ----------
  if (call.name === 'sync_email_replies') {
    useMailStore
      .getState()
      .syncReplies()
      .then(() => toast.success('Replies synced'))
      .catch(() => toast.error('Could not sync replies'));
    return {
      toolName: 'sync_email_replies',
      description: 'Syncing replies from the mailbox now.',
      data: {}
    };
  }

  if (call.name === 'list_email_replies') {
    const replies = useMailStore.getState().replies || [];
    const leads = useLeadStore.getState().leads || [];
    const enriched = replies.slice(0, 25).map((r) => ({
      id: r.id,
      subject: r.subject,
      from: r.fromName || r.fromEmail || 'Unknown',
      lead: leads.find((l) => l.id === r.leadId)?.name || null,
      receivedAt: r.receivedAt,
      preview: (r.body || '').slice(0, 160)
    }));
    return {
      toolName: 'list_email_replies',
      description: replies.length ? `${replies.length} reply/replies on record.` : 'No replies on record.',
      data: enriched
    };
  }

  // ---------- Follow-up settings (scheduling only) ----------
  if (call.name === 'update_followup_settings') {
    const updates: any = {};
    if (args.maxAttempts !== undefined) {
      const n = Number(args.maxAttempts);
      if (Number.isFinite(n) && n >= 0 && n <= 10) updates.maxAttempts = n;
    }
    if (Array.isArray(args.followUpDelays)) {
      const delays = args.followUpDelays.map((d: any) => Number(d)).filter((d: number) => Number.isFinite(d) && d >= 0);
      if (delays.length > 0) updates.followUpDelays = delays;
    }
    if (args.useTeamEmail !== undefined) updates.useTeamEmail = Boolean(args.useTeamEmail);
    if (args.syncAllEmails !== undefined) updates.syncAllEmails = Boolean(args.syncAllEmails);
    if (args.displayName) updates.displayName = String(args.displayName);

    if (Object.keys(updates).length === 0) {
      return {
        toolName: 'update_followup_settings',
        description:
          'Provide maxAttempts, followUpDelays, useTeamEmail, syncAllEmails or displayName. SMTP/IMAP credentials are not settable here — that stays in Settings.',
        data: {}
      };
    }
    useMailStore.getState().updateFollowUpSettings(updates);
    toast.success('Updated follow-up settings');
    return {
      toolName: 'update_followup_settings',
      description: `Updated follow-up settings (${Object.keys(updates).join(', ')})`,
      data: updates
    };
  }

  // ---------- One-shot bulk send ----------
  if (call.name === 'send_bulk_email') {
    const { matched, missed } = resolveLeads(args.leads);
    if (matched.length === 0) {
      return {
        toolName: 'send_bulk_email',
        description: `No matching leads found${missed.length ? `: ${missed.join(', ')}` : ''}.`,
        data: { missed }
      };
    }
    if (!args.subject || !args.body) {
      return {
        toolName: 'send_bulk_email',
        description: 'Provide a subject and a body before sending.',
        data: { leads: matched.map((m) => m.name) }
      };
    }

    const leadIds = matched.map((m) => m.id);
    useMailStore
      .getState()
      .sendBulkMail(leadIds, String(args.subject), String(args.body), undefined, args.senderType === 'team' ? 'team' : 'personal')
      .then((res: any) => {
        if (res?.success) toast.success(`Sent to ${leadIds.length} lead(s)`);
        else toast.error(res?.errors?.[0] || 'Send failed');
      })
      .catch(() => toast.error('Send failed'));

    const warning = missed.length > 0 ? ` Unmatched: ${missed.join(', ')}.` : '';
    return {
      toolName: 'send_bulk_email',
      description: `Sending to ${matched.length} lead(s): ${matched.map((m) => m.name).join(', ')}.${warning}`,
      data: { leadIds, subject: args.subject }
    };
  }

  return null;
}
