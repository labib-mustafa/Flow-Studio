import { AgentToolCall } from '../types';

/**
 * Risk classification for agent tool calls.
 *
 * Background: the UI has always asked before destroying anything — every delete
 * button goes through `confirm.danger()`. The agent path did not. Nova could
 * clear a moodboard, wipe a board field across every task, bulk-delete leads,
 * empty the scraper staging area, send real outbound email and invite people by
 * email, all with no prompt, and the only thing discouraging it was wording in
 * the tool descriptions — text the model is free to ignore.
 *
 * This gate closes that gap by reusing the same `confirm` store the UI uses, so
 * a confirmation demanded by the agent looks and behaves identically to one
 * demanded by a button.
 *
 * Two categories are gated:
 *
 *  1. **Irreversible.** Deletes and bulk wipes. Undo covers many of these, but
 *     undo is a recovery mechanism, not consent — and several deletes genuinely
 *     cannot be restored (clients, invoices, projects).
 *  2. **Outbound.** Sending mail and inviting people leaves the app and cannot
 *     be recalled at all.
 *
 * Deliberately NOT gated: ordinary field edits, status changes, reordering,
 * tagging, and everything read-only. Gating those would train users to click
 * through prompts, which destroys the value of the gate.
 */

export interface GuardVerdict {
  title: string;
  message: string;
  confirmText: string;
}

type VerdictBuilder = (args: any) => GuardVerdict;

const count = (value: unknown): number => (Array.isArray(value) ? value.length : 0);

const list = (value: unknown, max = 5): string => {
  if (!Array.isArray(value) || value.length === 0) return '';
  const shown = value.slice(0, max).map((v) => String(v));
  return shown.join(', ') + (value.length > max ? `, +${value.length - max} more` : '');
};

/** Deletes and any operation that leaves the app. Keyed by tool name. */
const ALWAYS_CONFIRM: Record<string, VerdictBuilder> = {
  // ---- Destructive: records ----
  delete_tasks: (a) => ({
    title: 'Delete these tasks?',
    message: count(a.tasks) > 1
      ? `Permanently delete ${count(a.tasks)} tasks: ${list(a.tasks)}.`
      : `Permanently delete the task "${a.task || a.title || 'you named'}".`,
    confirmText: 'Delete'
  }),
  delete_project: (a) => ({
    title: 'Delete this project?',
    message: `Permanently delete the project "${a.projectName || a.project || a.name}". Its tasks and notes go with it.`,
    confirmText: 'Delete project'
  }),
  delete_client: (a) => ({
    title: 'Delete this client?',
    message: `Delete the client "${a.clientName || a.name}". This cannot be undone from the chat.`,
    confirmText: 'Delete client'
  }),
  delete_lead: (a) => ({
    title: 'Delete this lead?',
    message: `Delete the lead "${a.leadName || a.name}".`,
    confirmText: 'Delete lead'
  }),
  bulk_delete_leads: (a) => ({
    title: `Delete ${count(a.leads) || 'these'} leads?`,
    message: `Permanently delete ${count(a.leads)} leads: ${list(a.leads)}.`,
    confirmText: 'Delete leads'
  }),
  delete_team_member: (a) => ({
    title: 'Remove this team member?',
    message: `Remove "${a.name}" from the team.`,
    confirmText: 'Remove'
  }),
  delete_invoice: (a) => ({
    title: 'Delete this invoice?',
    message: `Permanently delete invoice ${a.invoiceIdentifier || a.invoiceNumber || a.invoiceId}.`,
    confirmText: 'Delete invoice'
  }),
  delete_event: (a) => ({
    title: 'Delete this calendar event?',
    message: `Delete the event "${a.eventTitle || a.title}".`,
    confirmText: 'Delete event'
  }),
  delete_project_notes: (a) => ({
    title: 'Delete these notes?',
    message: `Delete ${count(a.noteIds) || count(a.notes) || 'the'} note(s).`,
    confirmText: 'Delete notes'
  }),
  delete_email_template: (a) => ({
    title: 'Delete this template?',
    message: `Delete the email template "${a.template}".`,
    confirmText: 'Delete template'
  }),
  delete_lead_column: (a) => ({
    title: 'Delete this column?',
    message: `Delete the "${a.column}" column from the lead table.`,
    confirmText: 'Delete column'
  }),

  // ---- Destructive: bulk wipes ----
  clear_moodboard: () => ({
    title: 'Clear the entire moodboard?',
    message: 'Every card on this project\u2019s moodboard will be removed, not just the selection.',
    confirmText: 'Clear board'
  }),
  delete_moodboard_item: (a) => ({
    title: 'Delete this moodboard card?',
    message: `Remove "${a.item || a.title || 'this card'}" from the moodboard.`,
    confirmText: 'Delete card'
  }),
  clear_scraped_leads: () => ({
    title: 'Empty the scraper staging area?',
    message: 'All staged leads will be discarded. Leads already promoted to the pipeline are not affected.',
    confirmText: 'Clear staging'
  }),
  clear_scraper_logs: () => ({
    title: 'Clear the scraper log?',
    message: 'The scraper run log will be emptied.',
    confirmText: 'Clear log'
  }),

  // ---- Outbound: leaves the app, cannot be recalled ----
  send_bulk_email: (a) => ({
    title: `Send this email to ${count(a.leads)} recipient(s)?`,
    message:
      `Subject: "${a.subject}".\n\nOnce sent, email cannot be recalled. ` +
      `Recipients: ${list(a.leads)}.`,
    confirmText: 'Send now'
  }),
  create_email_batch: (a) => ({
    title: `Schedule a campaign for ${count(a.leads)} lead(s)?`,
    message:
      `Subject: "${a.subject}". ` +
      (count(a.steps) > 0 ? `${count(a.steps)} follow-up step(s) will be queued. ` : '') +
      `Emails will go out on schedule once queued. Recipients: ${list(a.leads)}.`,
    confirmText: 'Schedule'
  }),
  process_email_queue: (a) => ({
    title: 'Send every due email now?',
    message: 'The queue will be processed immediately and all emails that are due will be dispatched.',
    confirmText: 'Send all due'
  }),
  invite_team_member: (a) => ({
    title: 'Send this invitation?',
    message: `Invite ${a.email} to the team as ${a.role}. This sends a real email.`,
    confirmText: 'Send invite'
  }),
  resend_team_invite: (a) => ({
    title: 'Re-send this invitation?',
    message: `Send the invitation to ${a.invite} again.`,
    confirmText: 'Re-send'
  })
};

export const assessToolCall = (call: AgentToolCall): GuardVerdict | null => {
  const args = call.args || {};

  // Argument-conditional rules run first: they are more specific than the
  // tool-name table, and the same tool is benign in its other modes.
  if (call.name === 'update_task_field' && args.action === 'delete') {
    return {
      title: 'Delete a board field?',
      message:
        `"${args.field}" will be removed from the board, and its value erased from ` +
        `every task that has one. This is the most destructive action available on the task board.`,
      confirmText: 'Delete field'
    };
  }

  if (call.name === 'manage_email_batch' && args.action === 'delete') {
    return {
      title: 'Delete this campaign?',
      message: `Delete the campaign "${args.batch}". Every pending send in it is cancelled.`,
      confirmText: 'Delete campaign'
    };
  }

  if (call.name === 'manage_queue_item' && args.action === 'sendNow') {
    return {
      title: 'Send this queued email immediately?',
      message: 'The email will be dispatched now instead of waiting for its schedule. Email cannot be recalled.',
      confirmText: 'Send now'
    };
  }

  if (call.name === 'manage_team_role' && args.action === 'remove') {
    return {
      title: `Remove the role "${args.role}"?`,
      message: 'The role definition is deleted. Members who currently hold it keep it until reassigned.',
      confirmText: 'Remove role'
    };
  }

  const builder = ALWAYS_CONFIRM[call.name];
  if (builder) return builder(args);

  return null;
};
