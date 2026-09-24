import { AgentToolResult } from '../types';
import { useTaskStore } from '../../../../stores/taskStore';
import { useMoodboardStore } from '../../../../stores/moodboardStore';
import { useEventStore } from '../../../../stores/eventStore';
import { useTimeStore } from '../../../../stores/timeStore';
import { useProjectStore } from '../../../../stores/projectStore';
import { useTeamStore } from '../../../../stores/teamStore';
import { useClientStore } from '../../../../stores/clientStore';
import { useLeadStore } from '../../../../stores/leadStore';
import { useBillingStore } from '../../../../stores/billingStore';
import { useScraperStore } from '../../../../stores/scraperStore';
import { useNotificationStore } from '../../../../stores/notificationStore';

/**
 * Reverts what the agent just did.
 *
 * Two reversal strategies, chosen per tool:
 *
 *  1. **Snapshot restore.** Update handlers attach `previous` (the prior field
 *     values) to their result, and delete handlers already return the whole
 *     deleted entity. Restoring is then "write the snapshot back", which an
 *     upsert helper handles for both cases: if the id still exists we patch it,
 *     otherwise we re-insert it.
 *
 *  2. **History rewind.** Moodboard mutations push to the canvas history via
 *     `saveToHistory`, so the correct inverse is the store's own `undo()` —
 *     not a hand-rolled field restore, which would fight the history stack.
 *
 * Known limitations, stated rather than hidden:
 *  - `delete_client` / `delete_lead` / `delete_invoice` re-insertion is NOT
 *    supported by those stores (their add actions mint a fresh id), so undo
 *    patches field changes but cannot resurrect a deleted record. Those records
 *    do still sit in the recycle bin, which is the real recovery path.
 */

/**
 * Per-platform scraper config setters. Mirrored from scraperHandlers rather
 * than imported, so the undo path does not depend on the handler module's
 * internal shape.
 */
const SCRAPER_CONFIG_SETTERS: Record<string, (config: any) => void> = {
  'google-maps': (c) => useScraperStore.getState().setGmapsConfig(c),
  instagram: (c) => useScraperStore.getState().setIgConfig(c),
  linkedin: (c) => useScraperStore.getState().setLiConfig(c),
  'google-search': (c) => useScraperStore.getState().setGsConfig(c)
};

/** Update if the id exists, otherwise re-insert. Covers update *and* delete undo. */
const upsertById = (
  list: any[],
  snapshot: any,
  patch: (id: string, values: any) => void,
  replaceAll: (next: any[]) => void
): boolean => {
  if (!snapshot?.id) return false;
  if (list.some((item) => item?.id === snapshot.id)) {
    patch(snapshot.id, snapshot);
  } else {
    replaceAll([...list, snapshot]);
  }
  return true;
};

export const executeUndoForToolResults = (
  toolResults: AgentToolResult[] | undefined,
  projectId: string,
  setAvailableNotesCount: (n: number) => void
): number => {
  if (!toolResults || toolResults.length === 0) return 0;
  let revertedCount = 0;

  for (const tr of toolResults) {
    try {
      const data = tr.data;
      const results = Array.isArray(data) ? data : data ? [data] : [];

      // ---------- Task board ----------
      if (tr.toolName === 'create_tasks') {
        for (const t of results) {
          if (t?.id) {
            useTaskStore.getState().deleteTask(t.id);
            revertedCount++;
          }
        }
      } else if (tr.toolName === 'delete_tasks') {
        // Handler returns the deleted task objects, so re-insert them.
        for (const t of results) {
          if (upsertById(useTaskStore.getState().tasks, t, () => {}, (next) => useTaskStore.setState({ tasks: next }))) {
            revertedCount++;
          }
        }
      } else if (
        tr.toolName === 'update_task' ||
        tr.toolName === 'set_task_assignees' ||
        tr.toolName === 'set_task_dates' ||
        tr.toolName === 'set_task_type' ||
        tr.toolName === 'write_task_field_value'
      ) {
        const previous = data?.previous;
        const taskId = data?.id || data?.taskId;
        if (previous && taskId) {
          useTaskStore.getState().updateTask(taskId, previous);
          revertedCount++;
        }
      } else if (tr.toolName === 'bulk_update_tasks') {
        // One snapshot per affected task, applied in reverse order.
        const snapshots = Array.isArray(data?.previous) ? data.previous : [];
        for (const snap of snapshots) {
          if (snap?.id) {
            useTaskStore.getState().updateTask(snap.id, snap);
            revertedCount++;
          }
        }
      } else if (tr.toolName === 'update_task_field') {
        // Field edits are undone per sub-action, because each one leaves the
        // board in a different shape and needs a different inverse.
        const restore = data?.previous;

        if (restore?.kind === 'rename' && restore.columnId) {
          useTaskStore.getState().updateColumnName(restore.columnId, restore.previousName);
          revertedCount++;
        } else if (restore?.kind === 'visibility' && restore.columnId) {
          const isHidden = (useTaskStore.getState().hiddenColumns || []).includes(restore.columnId);
          if (isHidden !== restore.wasHidden) {
            useTaskStore.getState().toggleColumnVisibility(restore.columnId);
            revertedCount++;
          }
        } else if (restore?.kind === 'order' && Array.isArray(restore.previousOrder)) {
          useTaskStore.setState({ columnOrder: restore.previousOrder });
          revertedCount++;
        } else if (restore?.kind === 'delete' && restore.column) {
          useTaskStore.setState((state) => {
            const columns = [...(state.columns || []), restore.column];
            const order =
              Array.isArray(restore.previousOrder) && restore.previousOrder.length > 0
                ? restore.previousOrder
                : [...(state.columnOrder || []), restore.column.id];
            const hidden = (state.hiddenColumns || []).filter((id: string) => id !== restore.column.id);
            const names = { ...(state.columnNames || {}), ...(restore.previousNames || {}) };
            return { columns, columnOrder: order, hiddenColumns: hidden, columnNames: names };
          });
          // The values stripped from each task by removeColumnSchema.
          for (const tv of restore.taskValues || []) {
            if (tv?.id) useTaskStore.getState().updateTask(tv.id, tv.values);
          }
          revertedCount++;
        }
      } else if (tr.toolName === 'update_task_status_config') {
        const previous = data?.previous;
        const statusId = data?.statusId;
        if (statusId && previous) {
          useTaskStore.getState().updateStatusConfig(statusId, previous);
          revertedCount++;
        }
      } else if (tr.toolName === 'sort_task_board') {
        useTaskStore.setState({ sortBy: data?.previousSortBy ?? null });
        revertedCount++;
      } else if (tr.toolName === 'add_task_comment') {
        // No store action removes a single comment, so the comment list is
        // rewritten without the one that was just appended.
        const taskId = data?.taskId;
        const comment = data?.comment;
        if (taskId && comment) {
          const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
          if (task?.comments?.length) {
            const trimmed = task.comments.slice(0, -1);
            useTaskStore.getState().updateTask(taskId, { comments: trimmed });
            revertedCount++;
          }
        }
      }

      // ---------- Moodboard: rewind through the canvas history ----------
      else if (
        tr.toolName === 'add_moodboard_items' ||
        tr.toolName === 'update_moodboard_item' ||
        tr.toolName === 'set_moodboard_item_categories' ||
        tr.toolName === 'toggle_lock_moodboard_items' ||
        tr.toolName === 'arrange_moodboard_items' ||
        tr.toolName === 'align_moodboard_items' ||
        tr.toolName === 'distribute_moodboard_items' ||
        tr.toolName === 'duplicate_moodboard_items' ||
        tr.toolName === 'crop_moodboard_item' ||
        tr.toolName === 'create_moodboard_section' ||
        tr.toolName === 'clear_moodboard' ||
        tr.toolName === 'delete_moodboard_item'
      ) {
        if (tr.toolName === 'add_moodboard_items') {
          // Newly added items are not always on the history stack, so remove by id.
          const itemIds = new Set(results.map((i: any) => i?.id).filter(Boolean));
          if (itemIds.size > 0) {
            useMoodboardStore.getState().setItems((prev: any[]) =>
              Array.isArray(prev) ? prev.filter((item: any) => !itemIds.has(item.id)) : []
            );
            revertedCount += itemIds.size;
          }
        } else {
          useMoodboardStore.getState().undo();
          revertedCount++;
        }
      }

      // ---------- Notes ----------
      else if (tr.toolName === 'create_project_note') {
        const noteId = data?.id;
        const noteKey = `notes-list-${projectId || 'default'}`;
        const existing = localStorage.getItem(noteKey);
        if (existing && noteId) {
          try {
            const parsed = JSON.parse(existing);
            const filtered = parsed.filter((n: any) => n.id !== noteId);
            localStorage.setItem(noteKey, JSON.stringify(filtered));
            setAvailableNotesCount(filtered.length);
            revertedCount++;
          } catch {}
        }
      }

      // ---------- Lead scraper ----------
      else if (tr.toolName === 'update_scraper_config') {
        const platform = data?.platform;
        const previous = data?.previous;
        if (platform && previous && SCRAPER_CONFIG_SETTERS[platform]) {
          SCRAPER_CONFIG_SETTERS[platform](previous);
          revertedCount++;
        }
      } else if (tr.toolName === 'set_scraper_filters') {
        if (data?.previous) {
          useScraperStore.getState().setMustHaveFilters(data.previous);
          revertedCount++;
        }
      } else if (tr.toolName === 'set_scraper_tab') {
        if (data?.previous?.activeTab) {
          useScraperStore.getState().setActiveTab(data.previous.activeTab);
          revertedCount++;
        }
      } else if (tr.toolName === 'remove_scraped_lead') {
        const removed = results.filter((l: any) => l?.id);
        if (removed.length > 0) {
          useScraperStore.getState().addScrapedLeads(removed);
          revertedCount += removed.length;
        }
      } else if (tr.toolName === 'clear_scraped_leads') {
        if (Array.isArray(data) && data.length > 0) {
          useScraperStore.getState().setScrapedLeads(data);
          revertedCount += data.length;
        }
      } else if (tr.toolName === 'add_scraped_leads') {
        const addedIds = new Set(results.map((l: any) => l?.id).filter(Boolean));
        if (addedIds.size > 0) {
          for (const id of addedIds) useScraperStore.getState().removeScrapedLead(String(id));
          revertedCount += addedIds.size;
        }
      }

      // ---------- Notifications ----------
      // The only write in the read-only intelligence set, and the only one whose
      // inverse is "set the flag back".
      else if (tr.toolName === 'mark_notifications_read') {
        const ids: (number | string)[] = Array.isArray(data?.previousUnreadIds) ? data.previousUnreadIds : [];
        if (ids.length > 0) {
          useNotificationStore.setState((state) => ({
            notifications: (state.notifications || []).map((n) =>
              ids.includes(n.id) ? { ...n, unread: true } : n
            )
          }));
          revertedCount += ids.length;
        }
      }

      // ---------- Team ----------
      // Legacy aliases (`add_team_member`, `create_project`, `add_project_event`)
      // are still accepted here on purpose. Nothing current can emit them — no
      // schema declares them and the handlers no longer branch on them — but this
      // executor reads toolResults persisted in chat history, which can predate
      // the current schema. Accepting a stale name costs one comparison; dropping
      // it would silently no-op the Undo button on an old message.
      else if (tr.toolName === 'create_team_member' || tr.toolName === 'add_team_member') {
        if (data?.id) {
          useTeamStore.getState().deleteMember(data.id);
          revertedCount++;
        }
      } else if (tr.toolName === 'delete_team_member') {
        if (upsertById(
          useTeamStore.getState().members,
          data,
          (id, values) => useTeamStore.getState().updateMember(id, values),
          (next) => useTeamStore.setState({ members: next })
        )) {
          revertedCount++;
        }
      } else if (tr.toolName === 'update_team_member') {
        if (data?.id && data?.previous) {
          useTeamStore.getState().updateMember(data.id, data.previous);
          revertedCount++;
        }
      }

      // ---------- Clients / Leads ----------
      // Field edits are reversible; re-insertion after a delete is not, because
      // those stores mint a new id in their add actions. The recycle bin is the
      // recovery path for a deleted record.
      else if (tr.toolName === 'create_client') {
        if (data?.id) {
          useClientStore.getState().deleteClient(data.id);
          revertedCount++;
        }
      } else if (tr.toolName === 'update_client') {
        if (data?.id && data?.previous) {
          useClientStore.getState().updateClient(data.id, data.previous);
          revertedCount++;
        }
      } else if (tr.toolName === 'create_lead') {
        if (data?.id) {
          useLeadStore.getState().deleteLead(data.id);
          revertedCount++;
        }
      } else if (tr.toolName === 'update_lead') {
        if (data?.id && data?.previous) {
          useLeadStore.getState().updateLead(data.id, data.previous);
          revertedCount++;
        }
      } else if (tr.toolName === 'bulk_update_leads') {
        for (const snap of Array.isArray(data?.previous) ? data.previous : []) {
          if (snap?.id) {
            useLeadStore.getState().updateLead(snap.id, snap);
            revertedCount++;
          }
        }
      } else if (tr.toolName === 'bulk_delete_leads') {
        // Unlike clients, leads CAN be restored faithfully: the deleted records
        // are re-inserted through setState so their ids survive. Going through
        // addLead would mint a new id and orphan every reference to the lead.
        const deleted = results.filter((l: any) => l?.id);
        if (deleted.length > 0) {
          const existing = useLeadStore.getState().leads || [];
          const missing = deleted.filter((l: any) => !existing.some((e) => e.id === l.id));
          if (missing.length > 0) {
            useLeadStore.setState({ leads: [...existing, ...missing] });
            revertedCount += missing.length;
          }
        }
      } else if (tr.toolName === 'log_lead_activity') {
        if (data?.id && data?.previous?.timeline) {
          useLeadStore.getState().updateLead(data.id, { timeline: data.previous.timeline });
          revertedCount++;
        }
      } else if (tr.toolName === 'reorder_lead' || tr.toolName === 'reorder_lead_columns') {
        const order: string[] = Array.isArray(data?.previousOrder) ? data.previousOrder : [];
        if (order.length > 0) {
          if (tr.toolName === 'reorder_lead') {
            const leads = useLeadStore.getState().leads || [];
            const byId = new Map(leads.map((l) => [l.id, l]));
            const rebuilt = order.map((id) => byId.get(id)).filter(Boolean);
            if (rebuilt.length === leads.length) {
              useLeadStore.setState({ leads: rebuilt as any });
              revertedCount++;
            }
          } else {
            const columns = useLeadStore.getState().columns || [];
            const byId = new Map(columns.map((c) => [c.id, c]));
            const rebuilt = order.map((id) => byId.get(id)).filter(Boolean);
            if (rebuilt.length === columns.length) {
              useLeadStore.setState({ columns: rebuilt as any });
              revertedCount++;
            }
          }
        }
      } else if (tr.toolName === 'update_lead_column') {
        const previous = data?.previous;
        if (previous?.field && previous.previousLabel !== undefined) {
          // Base field label rename.
          useLeadStore.getState().updateColumnLabel(previous.field, previous.previousLabel);
          revertedCount++;
        } else if (data?.id && previous) {
          useLeadStore.getState().updateColumn(data.id, previous);
          revertedCount++;
        }
      } else if (tr.toolName === 'delete_lead_column') {
        const column = data?.column;
        if (column?.id) {
          const columns = useLeadStore.getState().columns || [];
          if (!columns.some((c) => c.id === column.id)) {
            useLeadStore.setState({ columns: [...columns, column] as any });
            revertedCount++;
          }
        }
      }

      // ---------- Billing ----------
      else if (tr.toolName === 'create_invoice') {
        if (data?.id) {
          useBillingStore.getState().deleteInvoice(data.id);
          revertedCount++;
        }
      } else if (tr.toolName === 'update_invoice_status') {
        if (data?.id && data?.previous) {
          useBillingStore.getState().updateInvoiceStatus(data.id, data.previous.status);
          revertedCount++;
        }
      }

      // ---------- Projects ----------
      else if (tr.toolName === 'create_new_project' || tr.toolName === 'create_project') {
        if (data?.id) {
          useProjectStore.getState().deleteProject(data.id);
          revertedCount++;
        }
      } else if (tr.toolName === 'delete_project') {
        if (data?.id) {
          useProjectStore.getState().addProject(data);
          revertedCount++;
        }
      } else if (tr.toolName === 'update_project') {
        if (data?.id && data?.previous) {
          useProjectStore.getState().updateProject(data.id, data.previous);
          revertedCount++;
        }
      }

      // ---------- Calendar ----------
      else if (tr.toolName === 'schedule_event' || tr.toolName === 'add_project_event') {
        if (data?.id) {
          useEventStore.getState().deleteEvent(data.id);
          revertedCount++;
        }
      }

      // ---------- Time ----------
      else if (tr.toolName === 'start_timer') {
        useTimeStore.getState().stopTimer();
        revertedCount++;
      } else if (tr.toolName === 'add_time_entry') {
        if (data?.id) {
          useTimeStore.getState().deleteEntry(data.id);
          revertedCount++;
        }
      }
    } catch (err) {
      console.warn('[AI Undo] Failed to revert tool result:', tr.toolName, err);
    }
  }

  return revertedCount;
};
