import { AgentToolCall, AgentToolResult } from '../../types';
import { toast } from '../../../../../stores/toastStore';
import { useTaskStore } from '../../../../../stores/taskStore';
import { useProjectStore } from '../../../../../stores/projectStore';
import { useClientStore } from '../../../../../stores/clientStore';
import { useLeadStore } from '../../../../../stores/leadStore';
import { useBillingStore } from '../../../../../stores/billingStore';
import { useTimeStore } from '../../../../../stores/timeStore';
import { useEventStore } from '../../../../../stores/eventStore';
import { useActivityStore } from '../../../../../stores/activityStore';
import { useNotificationStore } from '../../../../../stores/notificationStore';

/**
 * Read-only "intelligence" tools: they report state rather than change it.
 *
 * This is a different class from everything else in the agent surface. It has
 * no confirmation burden and almost no undo burden, and it is what lets Nova
 * answer "where does this project actually stand" instead of only executing
 * commands. `mark_notifications_read` is the single write, and it is here
 * because leaving it out would make the read of notifications useless.
 *
 * Scope note: there is deliberately NO "list project files" tool. The file tree
 * is loaded by `TabbedFileExplorer` from either `window.electronAPI.projects.
 * getFolder()` or `POST /api/projects/get-folder`, and the tree-loading path was
 * never confirmed. A tool built on a guess would return invented filenames,
 * which is worse than not having the tool.
 */

const DAY_MS = 86400000;

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const parsed = new Date(String(value));
  return isNaN(parsed.getTime()) ? null : parsed;
};

const startOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const daysFromToday = (date: Date | null): number | null =>
  date ? Math.round((date.getTime() - startOfToday().getTime()) / DAY_MS) : null;

const hours = (seconds: number) => Math.round((seconds / 3600) * 10) / 10;

const isDone = (task: any) => task?.status === 'Complete' || task?.phase === 'done';

const tally = <T,>(items: T[], key: (item: T) => string): Record<string, number> =>
  items.reduce((acc: Record<string, number>, item) => {
    const k = key(item) || 'unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

export function handleInsightsTools(call: AgentToolCall): AgentToolResult | null {
  const args = call.args || {};

  // ---------- Studio overview ----------
  if (call.name === 'get_studio_overview') {
    const projects = useProjectStore.getState().projects || [];
    const tasks = useTaskStore.getState().tasks || [];
    const clients = useClientStore.getState().clients || [];
    const leads = useLeadStore.getState().leads || [];
    const invoices = useBillingStore.getState().paymentHistory || [];
    const entries = useTimeStore.getState().entries || [];
    const activities = useActivityStore.getState().activities || [];

    const openTasks = tasks.filter((t) => !isDone(t));
    const overdue = openTasks.filter((t) => {
      const d = daysFromToday(parseDate(t.dueDate));
      return d !== null && d < 0;
    });
    const pipelineValue = leads.reduce((s, l) => s + (l.estimated_value || 0), 0);
    const outstanding = invoices.filter((i) => i.status === 'Pending' || i.status === 'Overdue');
    const collected = invoices.filter((i) => i.status === 'Completed');
    const totalSeconds = entries.reduce((s, e) => s + (e.durationSeconds || 0), 0);
    const weekAgo = new Date(startOfToday().getTime() - 7 * DAY_MS);
    const recentActivity = activities.filter((a) => {
      const d = parseDate(a.timestamp);
      return d ? d >= weekAgo : false;
    });

    return {
      toolName: 'get_studio_overview',
      description:
        `${projects.length} project(s), ${openTasks.length} open task(s)${overdue.length ? ` (${overdue.length} overdue)` : ''}, ` +
        `${clients.length} client(s), ${leads.length} lead(s), outstanding ${outstanding.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()}, ` +
        `${hours(totalSeconds)}h logged.`,
      data: {
        projects: {
          total: projects.length,
          byStatus: tally(projects, (p) => p.status || 'Unknown'),
          avgCompletion: projects.length
            ? Math.round(projects.reduce((s, p) => s + (p.completion ?? p.progress ?? 0), 0) / projects.length)
            : 0,
          pinned: projects.filter((p) => p.isPinned).length
        },
        tasks: {
          total: tasks.length,
          open: openTasks.length,
          completed: tasks.length - openTasks.length,
          overdue: overdue.length,
          byPhase: tally(tasks, (t) => t.phase || 'todo'),
          byPriority: tally(openTasks, (t) => t.priority || 'none')
        },
        clients: {
          total: clients.length,
          byStatus: tally(clients, (c) => c.status || 'Unknown'),
          totalVolume: clients.reduce((s, c) => s + (c.totalVolume || 0), 0)
        },
        leads: {
          total: leads.length,
          byStatus: tally(leads, (l) => l.status || 'Unknown'),
          pipelineValue
        },
        billing: {
          invoiceCount: invoices.length,
          outstandingCount: outstanding.length,
          outstandingTotal: outstanding.reduce((s, i) => s + (i.amount || 0), 0),
          collectedTotal: collected.reduce((s, i) => s + (i.amount || 0), 0)
        },
        time: { totalHours: hours(totalSeconds), entryCount: entries.length },
        activity: { last7Days: recentActivity.length }
      }
    };
  }

  // ---------- Task board digest ----------
  if (call.name === 'get_task_board_digest') {
    const all = useTaskStore.getState().tasks || [];
    const scoped = args.project
      ? all.filter((t) => {
          const q = String(args.project).toLowerCase();
          const proj = (useProjectStore.getState().projects || []).find(
            (p) => (p.name || p.title || '').toLowerCase().includes(q)
          );
          return proj ? t.projectId === proj.id : true;
        })
      : all;

    const open = scoped.filter((t) => !isDone(t));
    const bucket = { overdue: [] as any[], today: [] as any[], thisWeek: [] as any[], later: [] as any[] };
    for (const t of open) {
      const d = daysFromToday(parseDate(t.dueDate));
      if (d === null) continue;
      if (d < 0) bucket.overdue.push(t);
      else if (d === 0) bucket.today.push(t);
      else if (d <= 7) bucket.thisWeek.push(t);
      else bucket.later.push(t);
    }
    const brief = (list: any[]) =>
      list
        .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
        .slice(0, 15)
        .map((t) => ({ title: t.title, dueDate: t.dueDate, priority: t.priority, phase: t.phase,
          assignees: (t.assignees || []).map((a: any) => a.name) }));

    const byAssignee: Record<string, number> = {};
    for (const t of open) {
      for (const a of t.assignees || []) byAssignee[a.name] = (byAssignee[a.name] || 0) + 1;
    }

    return {
      toolName: 'get_task_board_digest',
      description:
        `${scoped.length} task(s): ${bucket.overdue.length} overdue, ${bucket.today.length} due today, ` +
        `${bucket.thisWeek.length} due this week, ${open.length} still open.`,
      data: {
        total: scoped.length,
        open: open.length,
        byPhase: tally(scoped, (t) => t.phase || 'todo'),
        byPriority: tally(open, (t) => t.priority || 'none'),
        byAssignee,
        overdue: brief(bucket.overdue),
        dueToday: brief(bucket.today),
        dueThisWeek: brief(bucket.thisWeek),
        unassigned: open.filter((t) => !(t.assignees || []).length).length
      }
    };
  }

  // ---------- Project digest ----------
  if (call.name === 'get_project_digest') {
    const projects = useProjectStore.getState().projects || [];
    const q = String(args.project || '').trim().toLowerCase();
    const project = args.project
      ? projects.find((p) => p.id.toLowerCase() === q) ||
        projects.find((p) => (p.name || '').toLowerCase() === q || (p.title || '').toLowerCase() === q) ||
        projects.find((p) => (p.name || p.title || '').toLowerCase().includes(q))
      : useProjectStore.getState().currentProject;
    if (!project) return null;

    const tasks = (useTaskStore.getState().tasks || []).filter((t) => t.projectId === project.id);
    const open = tasks.filter((t) => !isDone(t));
    const entries = (useTimeStore.getState().entries || []).filter((e) => e.projectId === project.id);
    const notes = (() => {
      try {
        const raw = localStorage.getItem(`notes-list-${project.id}`);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    const moodboardCount = (() => {
      try {
        const raw = localStorage.getItem('flow-moodboard-storage');
        const parsed = raw ? JSON.parse(raw) : null;
        const items = parsed?.state?.items;
        return Array.isArray(items) ? items.length : null;
      } catch {
        return null;
      }
    })();

    const completion = project.completion ?? project.progress ?? 0;
    const deadlineDays = daysFromToday(parseDate(project.deadline));

    return {
      toolName: 'get_project_digest',
      description:
        `"${project.name || project.title}" — ${completion}% complete, ${open.length} open task(s)` +
        (deadlineDays !== null ? `, deadline in ${deadlineDays} day(s)` : '') +
        `, ${hours(entries.reduce((s, e) => s + (e.durationSeconds || 0), 0))}h logged.`,
      data: {
        project: {
          id: project.id,
          name: project.name || project.title,
          client: project.client,
          status: project.status,
          completion,
          deadline: project.deadline,
          deadlineInDays: deadlineDays,
          tags: project.tags,
          pinned: Boolean(project.isPinned)
        },
        tasks: {
          total: tasks.length,
          open: open.length,
          completed: tasks.length - open.length,
          byPhase: tally(tasks, (t) => t.phase || 'todo'),
          overdue: open.filter((t) => {
            const d = daysFromToday(parseDate(t.dueDate));
            return d !== null && d < 0;
          }).length
        },
        time: { totalHours: hours(entries.reduce((s, e) => s + (e.durationSeconds || 0), 0)), entryCount: entries.length },
        notes: { count: notes.length },
        moodboard: { cardCount: moodboardCount }
      }
    };
  }

  // ---------- Client digest ----------
  if (call.name === 'get_client_digest') {
    const clients = useClientStore.getState().clients || [];
    const projects = useProjectStore.getState().projects || [];
    const invoices = useBillingStore.getState().paymentHistory || [];
    const activities = useActivityStore.getState().activities || [];

    const shape = (c: any) => {
      const clientProjects = projects.filter((p) => (p.client || '').toLowerCase().includes((c.name || '').toLowerCase()));
      const clientInvoices = invoices.filter((i) =>
        (i.recipientName || '').toLowerCase().includes((c.name || '').toLowerCase())
      );
      const outstanding = clientInvoices.filter((i) => i.status === 'Pending' || i.status === 'Overdue');
      const lastActivity = activities.find(
        (a) => a.targetId === c.id || (a.targetName || '').toLowerCase() === (c.name || '').toLowerCase()
      );
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        projects: clientProjects.length,
        activeProjects: clientProjects.filter((p) => (p.status || '').toLowerCase().includes('active')).length,
        outstandingTotal: outstanding.reduce((s, i) => s + (i.amount || 0), 0),
        outstandingCount: outstanding.length,
        totalVolume: c.totalVolume,
        rating: c.rating,
        communicationRating: c.communicationRating,
        speedRating: c.speedRating,
        lastActivity: lastActivity ? { timestamp: lastActivity.timestamp, description: lastActivity.description } : null,
        relationshipRisk:
          outstanding.length > 0 && (c.outstandingDueDays || 0) > 30
            ? 'outstanding balance overdue more than 30 days'
            : null
      };
    };

    if (args.client) {
      const q = String(args.client).trim().toLowerCase();
      const target = clients.find((c) => c.id.toLowerCase() === q) ||
        clients.find((c) => (c.name || '').toLowerCase() === q) ||
        clients.find((c) => (c.name || '').toLowerCase().includes(q));
      if (!target) return null;
      const digest = shape(target);
      return {
        toolName: 'get_client_digest',
        description:
          `${digest.name}: ${digest.projects} project(s), ${digest.outstandingCount} unpaid invoice(s) ` +
          `worth ${digest.outstandingTotal.toLocaleString()}.`,
        data: digest
      };
    }

    const all = clients.map(shape);
    const atRisk = all.filter((c) => c.relationshipRisk);
    return {
      toolName: 'get_client_digest',
      description: `${clients.length} client(s); ${atRisk.length} with an outstanding balance over 30 days.`,
      data: { clients: all, atRisk: atRisk.map((c) => c.name) }
    };
  }

  // ---------- Lead pipeline digest ----------
  if (call.name === 'get_lead_pipeline_digest') {
    const leads = useLeadStore.getState().leads || [];
    const staleDays = Number(args.staleDays) || 14;
    const byStatus: Record<string, { count: number; value: number }> = {};
    for (const l of leads) {
      const key = l.status || 'Unknown';
      if (!byStatus[key]) byStatus[key] = { count: 0, value: 0 };
      byStatus[key].count += 1;
      byStatus[key].value += l.estimated_value || 0;
    }
    const stale = leads
      .filter((l) => {
        const d = daysFromToday(parseDate(l.last_updated_at));
        return d !== null && -d >= staleDays && l.status !== 'Archived';
      })
      .map((l) => ({ id: l.id, name: l.name, company: l.company, status: l.status, estimated_value: l.estimated_value, last_updated_at: l.last_updated_at }))
      .sort((a, b) => String(a.last_updated_at).localeCompare(String(b.last_updated_at)));

    const totalValue = leads.reduce((s, l) => s + (l.estimated_value || 0), 0);
    return {
      toolName: 'get_lead_pipeline_digest',
      description:
        `${leads.length} lead(s) worth ${totalValue.toLocaleString()}; ` +
        `${stale.length} untouched for ${staleDays}+ days.`,
      data: {
        total: leads.length,
        totalValue,
        byStatus,
        stale,
        topByValue: [...leads]
          .sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0))
          .slice(0, 10)
          .map((l) => ({ name: l.name, company: l.company, status: l.status, estimated_value: l.estimated_value }))
      }
    };
  }

  // ---------- Time summary ----------
  if (call.name === 'get_time_summary') {
    const state = useTimeStore.getState();
    const entries = state.entries || [];
    const since = args.sinceDays ? new Date(startOfToday().getTime() - Number(args.sinceDays) * DAY_MS) : null;
    const scoped = since ? entries.filter((e) => new Date(e.startTime) >= since) : entries;

    const byProject: Record<string, number> = {};
    for (const e of scoped) {
      const key = e.projectTitle || 'Unassigned';
      byProject[key] = (byProject[key] || 0) + (e.durationSeconds || 0);
    }
    const byDay: Record<string, number> = {};
    for (const e of scoped) {
      const d = new Date(e.startTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      byDay[key] = (byDay[key] || 0) + (e.durationSeconds || 0);
    }

    const active = state.activeTimer;
    const activeElapsed = active ? Math.floor((Date.now() - active.startTime) / 1000) : 0;

    return {
      toolName: 'get_time_summary',
      description: active
        ? `Timer running on "${active.taskTitle}" (${hours(activeElapsed)}h so far); ${hours(scoped.reduce((s, e) => s + (e.durationSeconds || 0), 0))}h logged in scope.`
        : `${hours(scoped.reduce((s, e) => s + (e.durationSeconds || 0), 0))}h logged across ${scoped.length} entr(ies).`,
      data: {
        activeTimer: active ? { ...active, elapsedHours: hours(activeElapsed) } : null,
        totalHours: hours(scoped.reduce((s, e) => s + (e.durationSeconds || 0), 0)),
        entryCount: scoped.length,
        byProject: Object.fromEntries(Object.entries(byProject).map(([k, v]) => [k, hours(v)])),
        byDay: Object.fromEntries(Object.entries(byDay).map(([k, v]) => [k, hours(v)]))
      }
    };
  }

  // ---------- Calendar agenda ----------
  if (call.name === 'get_calendar_agenda') {
    const days = Number(args.days) || 7;
    const today = startOfToday();
    const horizon = new Date(today.getTime() + days * DAY_MS);
    const events = (useEventStore.getState().events || [])
      .filter((e) => {
        const d = parseDate(e.date);
        return d !== null && d >= today && d <= horizon;
      })
      .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));

    return {
      toolName: 'get_calendar_agenda',
      description: events.length
        ? `${events.length} event(s) in the next ${days} day(s); next is "${events[0].title}" on ${events[0].date} at ${events[0].time}.`
        : `No events scheduled in the next ${days} day(s).`,
      data: events.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        type: e.type,
        participants: e.participants,
        inDays: daysFromToday(parseDate(e.date))
      }))
    };
  }

  // ---------- Activity feed ----------
  if (call.name === 'list_activities') {
    const state = useActivityStore.getState();
    const all = state.activities || [];
    const limit = Math.min(Number(args.limit) || 25, 100);
    const filtered = args.type ? all.filter((a) => a.type === args.type) : all;

    if (args.includeCounts) {
      return {
        toolName: 'list_activities',
        description: `${all.length} activity event(s) on record.`,
        data: { countsByDay: state.getActivityCounts(), total: all.length, byType: tally(all, (a) => a.type) }
      };
    }

    return {
      toolName: 'list_activities',
      description: filtered.length
        ? `${filtered.length} activity event(s)${args.type ? ` of type ${args.type}` : ''}, showing the newest ${Math.min(limit, filtered.length)}.`
        : 'No activity recorded yet.',
      data: filtered.slice(0, limit).map((a) => ({
        id: a.id,
        timestamp: a.timestamp,
        type: a.type,
        category: a.category,
        description: a.description,
        actorName: a.actorName,
        targetName: a.targetName
      }))
    };
  }

  // ---------- Notifications ----------
  if (call.name === 'list_notifications') {
    const all = useNotificationStore.getState().notifications || [];
    const unread = all.filter((n) => n.unread);
    return {
      toolName: 'list_notifications',
      description: unread.length ? `${unread.length} unread of ${all.length} notification(s).` : `All ${all.length} notification(s) read.`,
      data: all.slice(0, 30).map((n) => ({ id: n.id, title: n.title, message: n.message, time: n.time, unread: n.unread }))
    };
  }

  if (call.name === 'mark_notifications_read') {
    const store = useNotificationStore.getState();
    const all = store.notifications || [];
    if (args.all) {
      const previouslyUnread = all.filter((n) => n.unread).map((n) => n.id);
      store.markAllRead();
      toast.success('Marked all notifications read');
      return {
        toolName: 'mark_notifications_read',
        description: `Marked ${previouslyUnread.length} notification(s) read`,
        data: { previousUnreadIds: previouslyUnread }
      };
    }
    const id = args.id;
    if (id === undefined) {
      return {
        toolName: 'mark_notifications_read',
        description: 'Provide an id, or set all=true.',
        data: {}
      };
    }
    store.markAsRead(id);
    return {
      toolName: 'mark_notifications_read',
      description: `Marked notification ${id} read`,
      data: { previousUnreadIds: [id] }
    };
  }

  return null;
}
