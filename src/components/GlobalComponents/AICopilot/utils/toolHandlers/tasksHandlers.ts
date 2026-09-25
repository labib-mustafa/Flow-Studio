import { AgentToolCall, AgentToolResult } from '../../types';
import { toast } from '../../../../../stores/toastStore';
import { useTaskStore } from '../../../../../stores/taskStore';
import { useTeamStore } from '../../../../../stores/teamStore';

/**
 * Task board operations that the UI exposes but no tool reached: assignee
 * assignment, bulk edits, start/due date pairing, task type, custom field
 * values, column (field) management, status name/colour configuration, and
 * sorting. `create_tasks` / `update_task` / `delete_tasks` / `add_task_comment`
 * stay in projectTaskHandlers.
 *
 * Tasks are addressed by title or id, columns by their visible name or id.
 */

const BUILT_IN_ASSIGNEES = [
  { id: 'user_1', name: 'Me' },
  { id: 'agent_1', name: 'Onboarding Assistant' }
];

const tasksInScope = (activeProjId: string) => {
  const all = useTaskStore.getState().tasks || [];
  const scoped = activeProjId && activeProjId !== 'default'
    ? all.filter((t) => t.projectId === activeProjId)
    : all;
  return scoped.length > 0 ? scoped : all;
};

/** Prefer an exact id match, then an exact title, then a substring title. */
const findTask = (ref: string, activeProjId: string) => {
  const query = String(ref || '').trim().toLowerCase();
  if (!query) return undefined;
  const pool = tasksInScope(activeProjId);
  return (
    pool.find((t) => t.id.toLowerCase() === query) ||
    pool.find((t) => (t.title || '').toLowerCase() === query) ||
    pool.find((t) => (t.title || '').toLowerCase().includes(query))
  );
};

/** Resolve a column by visible name, then by id. Covers renamed base columns. */
const findColumnId = (ref: string): string | undefined => {
  const state = useTaskStore.getState();
  const query = String(ref || '').trim().toLowerCase();
  if (!query) return undefined;
  const names = state.columnNames || {};
  const order = state.columnOrder || [];

  const byId = order.find((id) => id.toLowerCase() === query);
  if (byId) return byId;

  const byDisplayName = order.find((id) => (names[id] || id).toLowerCase() === query);
  if (byDisplayName) return byDisplayName;

  const custom = (state.columns || []).find((c) => c.name.toLowerCase() === query || c.id.toLowerCase() === query);
  return custom?.id;
};

const findAssigneeId = (ref: string): string | undefined => {
  const query = String(ref || '').trim().toLowerCase();
  if (!query) return undefined;
  const members = useTeamStore.getState().members || [];
  return (
    members.find((m) => m.id.toLowerCase() === query)?.id ||
    members.find((m) => m.name.toLowerCase() === query)?.id ||
    members.find((m) => m.name.toLowerCase().includes(query))?.id ||
    BUILT_IN_ASSIGNEES.find((u) => u.id.toLowerCase() === query)?.id ||
    BUILT_IN_ASSIGNEES.find((u) => u.name.toLowerCase() === query)?.id
  );
};

/** Parse YYYY-MM-DD into a local Date so timezone offsets cannot shift the day. */
const parseLocalDate = (value: unknown): Date | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

export function handleTasksTools(call: AgentToolCall, ctx: { activeProjId: string }): AgentToolResult | null {
  const { activeProjId } = ctx;
  const args = call.args || {};

  // 1. Read the board schema — makes field and column ids discoverable
  if (call.name === 'list_task_board_schema') {
    const state = useTaskStore.getState();
    const names = state.columnNames || {};
    const columns = (state.columnOrder || []).map((id) => ({
      id,
      label: names[id] || id,
      hidden: (state.hiddenColumns || []).includes(id),
      type: (state.columns || []).find((c) => c.id === id)?.type || 'base'
    }));
    return {
      toolName: 'list_task_board_schema',
      description: `Board has ${columns.length} columns: ${columns.map((c) => c.label).join(', ')}`,
      data: {
        columns,
        statusConfigs: state.statusConfigs || {},
        sortBy: state.sortBy || null
      }
    };
  }

  // 2. Assign / unassign people (set semantics, not toggle)
  if (call.name === 'set_task_assignees') {
    const task = findTask(args.task, activeProjId);
    if (!task) return null;

    const requested = Array.isArray(args.assignees) ? args.assignees.map((a: any) => String(a)) : [];
    const resolvedIds: string[] = [];
    const unresolved: string[] = [];
    for (const ref of requested) {
      const id = findAssigneeId(ref);
      if (id) resolvedIds.push(id);
      else unresolved.push(ref);
    }

    if (resolvedIds.length === 0 && unresolved.length === 0) {
      return {
        toolName: 'set_task_assignees',
        description: 'No assignees supplied.',
        data: { id: task.id }
      };
    }

    const currentIds = (task.assignees || []).map((a) => a.id);
    const store = useTaskStore.getState();

    // Remove first, then add, so each toggle sees up-to-date state.
    for (const id of currentIds) {
      if (!resolvedIds.includes(id)) store.toggleTaskAssignee(task.id, id);
    }
    for (const id of resolvedIds) {
      if (!currentIds.includes(id)) useTaskStore.getState().toggleTaskAssignee(task.id, id);
    }

    const updated = useTaskStore.getState().tasks.find((t) => t.id === task.id);
    const finalNames = (updated?.assignees || []).map((a) => a.name);
    toast.success(`Updated assignees on "${task.title}"`);

    const warning = unresolved.length > 0 ? ` Could not match: ${unresolved.join(', ')}.` : '';
    return {
      toolName: 'set_task_assignees',
      description: `Set assignees on "${task.title}" to ${finalNames.join(', ') || 'nobody'}.${warning}`,
      data: { id: task.id, assignees: finalNames, unresolved, previous: { assignees: task.assignees || [] } }
    };
  }

  // 3. Bulk edit across many tasks
  if (call.name === 'bulk_update_tasks') {
    const refs = Array.isArray(args.tasks) ? args.tasks.map((t: any) => String(t)) : [];
    if (refs.length === 0) return null;

    const matched = refs.map((r) => findTask(r, activeProjId)).filter(Boolean) as { id: string; title: string }[];
    const missed = refs.filter((r) => !findTask(r, activeProjId));

    if (matched.length === 0) {
      return {
        toolName: 'bulk_update_tasks',
        description: `None of the requested tasks were found on this board: ${refs.join(', ')}`,
        data: { requested: refs }
      };
    }

    const updates: Record<string, any> = {};
    if (args.phase && ['todo', 'inprogress', 'review', 'done'].includes(args.phase)) updates.phase = args.phase;
    // 'none' is the schema's stand-in for clearing a priority — an empty string
    // in the enum is rejected outright by Gemini. The store still receives '',
    // so behaviour is unchanged on both providers.
    if (args.priority !== undefined) {
      if (args.priority === 'none') updates.priority = '';
      else if (['urgent', 'high', 'medium', 'low'].includes(args.priority)) updates.priority = args.priority;
    }
    if (args.status && ['Complete', 'Incomplete'].includes(args.status)) updates.status = args.status;

    if (Object.keys(updates).length === 0) {
      return {
        toolName: 'bulk_update_tasks',
        description: 'No valid fields supplied for the bulk update.',
        data: { requested: refs }
      };
    }

    useTaskStore.getState().updateTasks(matched.map((t) => t.id), updates);
    toast.success(`Updated ${matched.length} task(s)`);

    const warning = missed.length > 0 ? ` Not found: ${missed.join(', ')}.` : '';
    // One prior-state snapshot per task, so undo can restore each individually.
    const previous = matched.map((t) => {
      const snapshot: any = { id: t.id };
      for (const key of Object.keys(updates)) snapshot[key] = (t as any)[key];
      return snapshot;
    });
    return {
      toolName: 'bulk_update_tasks',
      description: `Updated ${matched.length} task(s) (${Object.keys(updates).join(', ')}).${warning}`,
      data: { ids: matched.map((t) => t.id), updates, missed, previous }
    };
  }

  // 4. Start + due date pairing
  if (call.name === 'set_task_dates') {
    const task = findTask(args.task, activeProjId);
    if (!task) return null;

    const hasStart = args.startDate !== undefined;
    const hasDue = args.dueDate !== undefined;
    if (!hasStart && !hasDue) {
      return {
        toolName: 'set_task_dates',
        description: 'Provide startDate and/or dueDate (YYYY-MM-DD).',
        data: { id: task.id }
      };
    }

    const start = hasStart ? parseLocalDate(args.startDate) : parseLocalDate(task.startDate);
    const due = hasDue ? parseLocalDate(args.dueDate) : parseLocalDate(task.dueDate);
    useTaskStore.getState().updateTaskDates(task.id, start, due);

    const updated = useTaskStore.getState().tasks.find((t) => t.id === task.id);
    toast.success(`Updated dates on "${task.title}"`);
    return {
      toolName: 'set_task_dates',
      description: `Set "${task.title}" to ${updated?.startDate || 'no start'} -> ${updated?.dueDate || 'no due date'}`,
      data: {
        id: task.id,
        startDate: updated?.startDate,
        dueDate: updated?.dueDate,
        previous: { startDate: task.startDate, dueDate: task.dueDate }
      }
    };
  }

  // 5. Task type
  if (call.name === 'set_task_type') {
    const task = findTask(args.task, activeProjId);
    if (!task) return null;
    const valid = ['task', 'milestone', 'form', 'meeting'];
    if (!valid.includes(args.taskType)) {
      return {
        toolName: 'set_task_type',
        description: `taskType must be one of: ${valid.join(', ')}.`,
        data: { id: task.id }
      };
    }
    useTaskStore.getState().updateTaskType(task.id, args.taskType);
    toast.success(`Set "${task.title}" to ${args.taskType}`);
    return {
      toolName: 'set_task_type',
      description: `Set "${task.title}" type to ${args.taskType}`,
      data: { id: task.id, taskType: args.taskType, previous: { taskType: task.taskType } }
    };
  }

  // 6. Write a custom field value
  if (call.name === 'write_task_field_value') {
    const task = findTask(args.task, activeProjId);
    if (!task) return null;
    const columnId = findColumnId(args.field);
    if (!columnId) {
      return {
        toolName: 'write_task_field_value',
        description: `No column named "${args.field}". Use list_task_board_schema to see available columns.`,
        data: { id: task.id, field: args.field }
      };
    }
    const column = (useTaskStore.getState().columns || []).find((c) => c.id === columnId);
    let value: any = args.value;
    if (column?.type === 'number') value = Number(value);
    if (column?.type === 'checkbox') value = value === true || value === 'true';

    useTaskStore.getState().updateTask(task.id, { [columnId]: value } as any);
    toast.success(`Set ${args.field} on "${task.title}"`);
    return {
      toolName: 'write_task_field_value',
      description: `Set "${args.field}" to "${value}" on "${task.title}"`,
      data: { id: task.id, columnId, value, previous: { [columnId]: (task as any)[columnId] } }
    };
  }

  // 7. Create a custom field
  if (call.name === 'create_task_field') {
    const valid = ['text', 'number', 'date', 'dropdown', 'checkbox'];
    if (!args.name || !valid.includes(args.type)) {
      return {
        toolName: 'create_task_field',
        description: `Provide a field name and a type from: ${valid.join(', ')}.`,
        data: {}
      };
    }
    const options = Array.isArray(args.options) ? args.options.map((o: any) => String(o)) : undefined;
    useTaskStore.getState().addColumnSchema(String(args.name), args.type, options);
    toast.success(`Created field "${args.name}"`);
    return {
      toolName: 'create_task_field',
      description: `Created ${args.type} field "${args.name}"${options ? ` with options [${options.join(', ')}]` : ''}`,
      data: { name: args.name, type: args.type, options }
    };
  }

  // 8. Rename / hide / show / move / delete a field
  if (call.name === 'update_task_field') {
    const columnId = findColumnId(args.field);
    if (!columnId) {
      return {
        toolName: 'update_task_field',
        description: `No column named "${args.field}". Use list_task_board_schema to see available columns.`,
        data: { field: args.field }
      };
    }
    const store = useTaskStore.getState();
    const action = args.action;

    if (action === 'rename') {
      // The column WAS found, so a bare null here would surface as
      // "Target item not found" — misleading. Report the real problem.
      if (!args.newName) {
        return {
          toolName: 'update_task_field',
          description: 'The rename action needs a newName.',
          data: { columnId }
        };
      }
      const previousName = (store.columnNames || {})[columnId];
      store.updateColumnName(columnId, String(args.newName));
      toast.success(`Renamed column to "${args.newName}"`);
      return {
        toolName: 'update_task_field',
        description: `Renamed column "${args.field}" to "${args.newName}"`,
        data: { columnId, newName: args.newName, previous: { kind: 'rename', columnId, previousName } }
      };
    }

    if (action === 'hide' || action === 'show') {
      const isHidden = (store.hiddenColumns || []).includes(columnId);
      const shouldHide = action === 'hide';
      if (isHidden === shouldHide) {
        return {
          toolName: 'update_task_field',
          description: `Column "${args.field}" is already ${shouldHide ? 'hidden' : 'visible'}.`,
          data: { columnId }
        };
      }
      if (columnId === 'title') {
        return {
          toolName: 'update_task_field',
          description: 'The title column cannot be hidden.',
          data: { columnId }
        };
      }
      store.toggleColumnVisibility(columnId);
      toast.success(`${shouldHide ? 'Hid' : 'Showed'} column "${args.field}"`);
      return {
        toolName: 'update_task_field',
        description: `${shouldHide ? 'Hid' : 'Showed'} column "${args.field}"`,
        data: { columnId, previous: { kind: 'visibility', columnId, wasHidden: isHidden } }
      };
    }

    if (action === 'moveLeft' || action === 'moveRight') {
      const previousOrder = [...(store.columnOrder || [])];
      store.moveColumn(columnId, action === 'moveLeft' ? 'left' : 'right');
      toast.success(`Moved column "${args.field}"`);
      return {
        toolName: 'update_task_field',
        description: `Moved column "${args.field}" ${action === 'moveLeft' ? 'left' : 'right'}`,
        data: { columnId, previous: { kind: 'order', columnId, previousOrder } }
      };
    }

    if (action === 'delete') {
      if (columnId === 'title') {
        return {
          toolName: 'update_task_field',
          description: 'The title column cannot be deleted.',
          data: { columnId }
        };
      }
      // Deleting a column is the most destructive agent action on the board:
      // removeColumnSchema also strips that value from every task. Capture the
      // definition, the position, and each task's value so undo is faithful.
      const previousOrder = [...(store.columnOrder || [])];
      const column = (store.columns || []).find((c) => c.id === columnId);
      const taskValues = (store.tasks || [])
        .filter((t) => (t as any)[columnId] !== undefined)
        .map((t) => ({ id: t.id, values: { [columnId]: (t as any)[columnId] } }));

      store.removeColumnSchema(columnId);
      toast.success(`Deleted field "${args.field}"`);
      return {
        toolName: 'update_task_field',
        description: `Deleted field "${args.field}" and cleared it from ${taskValues.length} task(s)`,
        data: {
          columnId,
          previous: {
            kind: 'delete',
            columnId,
            column,
            previousOrder,
            previousNames: { [columnId]: (store.columnNames || {})[columnId] },
            taskValues
          }
        }
      };
    }

    return null;
  }

  // 9. Status name + colour
  if (call.name === 'update_task_status_config') {
    const statusId = String(args.status || '').toLowerCase();
    if (!statusId) return null;
    const updates: { name?: string; color?: string } = {};
    if (args.name) updates.name = String(args.name);
    if (args.color) updates.color = String(args.color);
    if (Object.keys(updates).length === 0) {
      return {
        toolName: 'update_task_status_config',
        description: 'Provide a name and/or a hex colour.',
        data: { statusId }
      };
    }
    const previousConfig = useTaskStore.getState().statusConfigs?.[statusId];
    useTaskStore.getState().updateStatusConfig(statusId, updates);
    toast.success(`Updated ${statusId} status`);
    const config = useTaskStore.getState().statusConfigs?.[statusId];
    return {
      toolName: 'update_task_status_config',
      description: `Status "${statusId}" is now "${config?.name || statusId}" (${config?.color || 'unchanged'})`,
      data: { statusId, ...updates, previous: previousConfig || {} }
    };
  }

  // 10. Sorting
  if (call.name === 'sort_task_board') {
    const store = useTaskStore.getState();
    if (!args.column || args.column === 'none') {
      // Cleared directly: toggleSort only cycles a column's direction and has
      // no "no sort" entry point of its own.
      useTaskStore.setState({ sortBy: null });
      return {
        toolName: 'sort_task_board',
        description: 'Cleared sorting on the board',
        data: { previousSortBy: store.sortBy }
      };
    }
    const columnId = findColumnId(args.column);
    if (!columnId) {
      return {
        toolName: 'sort_task_board',
        description: `No column named "${args.column}". Use list_task_board_schema to see available columns.`,
        data: { column: args.column }
      };
    }
    if (args.direction === 'asc' || args.direction === 'desc') {
      store.setSortDirection(columnId, args.direction);
      toast.success(`Sorted by ${args.column} (${args.direction})`);
      return {
        toolName: 'sort_task_board',
        description: `Sorted the board by "${args.column}" ${args.direction}`,
        data: { columnId, direction: args.direction, previousSortBy: store.sortBy }
      };
    }
    store.toggleSort(columnId);
    const next = useTaskStore.getState().sortBy;
    return {
      toolName: 'sort_task_board',
      description: next
        ? `Sorted the board by "${args.column}" ${next.direction}`
        : `Cleared sorting on the board`,
      data: { columnId, sortBy: next, previousSortBy: store.sortBy }
    };
  }

  return null;
}
