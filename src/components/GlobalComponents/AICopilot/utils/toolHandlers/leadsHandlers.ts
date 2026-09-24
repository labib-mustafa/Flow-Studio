import { AgentToolCall, AgentToolResult } from '../../types';
import { toast } from '../../../../../stores/toastStore';
import { useLeadStore, Lead, LeadStatus, ColumnLabels } from '../../../../../stores/leadStore';

/**
 * Lead pipeline operations beyond the basic create/update/delete in
 * crmHandlers: bulk actions, row reordering, CSV import, column (field)
 * management, table selection, and timeline activity.
 *
 * Every action here is synchronous — `LeadState` contains no promise-returning
 * action — so unlike the moodboard palette and the mail sends, nothing needs
 * the fire-and-forget treatment.
 *
 * Leads are addressed by name, email or id; columns by their visible label
 * or id.
 */

const LEAD_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Proposal Sent', 'Archived'];

const BASE_LABEL_FIELDS: (keyof ColumnLabels)[] = [
  'name', 'type', 'email', 'phone', 'status', 'socials', 'location', 'company', 'estimated_value', 'source', 'tags'
];

const leadsStore = () => useLeadStore.getState();

const resolveLeads = (refs: unknown): { matched: Lead[]; missed: string[] } => {
  const leads = leadsStore().leads || [];
  const list = Array.isArray(refs) ? refs.map((r) => String(r).trim()).filter(Boolean) : [];
  const matched: Lead[] = [];
  const missed: string[] = [];

  for (const ref of list) {
    const q = ref.toLowerCase();
    const hit =
      leads.find((l) => l.id.toLowerCase() === q) ||
      leads.find((l) => (l.name || '').toLowerCase() === q) ||
      leads.find((l) => (l.email || '').toLowerCase() === q) ||
      leads.find((l) => (l.company || '').toLowerCase() === q) ||
      leads.find((l) => (l.name || '').toLowerCase().includes(q));
    if (hit && !matched.some((m) => m.id === hit.id)) matched.push(hit);
    else if (!hit) missed.push(ref);
  }
  return { matched, missed };
};

const resolveColumn = (ref: string) => {
  const state = leadsStore();
  const q = String(ref || '').trim().toLowerCase();
  if (!q) return undefined;
  const columns = state.columns || [];
  const byId = columns.find((c) => c.id.toLowerCase() === q);
  if (byId) return byId;
  return columns.find((c) => (c.title || '').toLowerCase() === q);
};

const findBaseLabelField = (ref: string): keyof ColumnLabels | undefined => {
  const q = String(ref || '').trim().toLowerCase();
  return BASE_LABEL_FIELDS.find((f) => String(f).toLowerCase() === q);
};

export function handleLeadsTools(call: AgentToolCall): AgentToolResult | null {
  const args = call.args || {};

  // ---------- Read ----------
  if (call.name === 'list_lead_columns') {
    const state = leadsStore();
    return {
      toolName: 'list_lead_columns',
      description: `${(state.columns || []).length} extra column(s); base fields: ${BASE_LABEL_FIELDS.join(', ')}`,
      data: {
        columns: (state.columns || []).map((c) => ({ id: c.id, title: c.title, width: c.width })),
        labels: state.columnLabels,
        baseFields: BASE_LABEL_FIELDS
      }
    };
  }

  if (call.name === 'list_leads') {
    const state = leadsStore();
    const statusFilter = args.status ? String(args.status).toLowerCase() : '';
    const query = args.query ? String(args.query).toLowerCase() : '';
    const leads = (state.leads || []).filter((l) => {
      if (statusFilter && l.status.toLowerCase() !== statusFilter) return false;
      if (!query) return true;
      return (
        (l.name || '').toLowerCase().includes(query) ||
        (l.company || '').toLowerCase().includes(query) ||
        (l.email || '').toLowerCase().includes(query)
      );
    });
    const totalValue = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
    return {
      toolName: 'list_leads',
      description: `${leads.length} lead(s)${statusFilter ? ` with status "${args.status}"` : ''}, combined value ${totalValue.toLocaleString()}`,
      data: leads.slice(0, 50).map((l) => ({
        id: l.id,
        name: l.name,
        company: l.company,
        status: l.status,
        estimated_value: l.estimated_value,
        email: l.email,
        tags: l.tags
      }))
    };
  }

  // ---------- Selection ----------
  if (call.name === 'select_leads') {
    const action = args.action;
    const state = leadsStore();

    if (action === 'none' || action === 'clear') {
      state.deselectAllLeads();
      return { toolName: 'select_leads', description: 'Cleared the lead selection', data: {} };
    }

    if (action === 'all') {
      const statusFilter = args.status ? String(args.status).toLowerCase() : '';
      const ids = (state.leads || [])
        .filter((l) => !statusFilter || l.status.toLowerCase() === statusFilter)
        .map((l) => l.id);
      state.selectAllLeads(ids);
      toast.info(`Selected ${ids.length} lead(s)`);
      return {
        toolName: 'select_leads',
        description: `Selected ${ids.length} lead(s)${statusFilter ? ` with status "${args.status}"` : ''}`,
        data: { ids }
      };
    }

    if (action === 'specific') {
      const { matched, missed } = resolveLeads(args.leads);
      if (matched.length === 0) {
        return {
          toolName: 'select_leads',
          description: `No matching leads${missed.length ? `: ${missed.join(', ')}` : ''}.`,
          data: { missed }
        };
      }
      state.selectAllLeads(matched.map((l) => l.id));
      const warning = missed.length ? ` Unmatched: ${missed.join(', ')}.` : '';
      return {
        toolName: 'select_leads',
        description: `Selected ${matched.length} lead(s): ${matched.map((l) => l.name).join(', ')}.${warning}`,
        data: { ids: matched.map((l) => l.id), missed }
      };
    }
    return null;
  }

  // ---------- Bulk status / fields ----------
  if (call.name === 'bulk_update_leads') {
    const { matched, missed } = resolveLeads(args.leads);
    if (matched.length === 0) {
      return {
        toolName: 'bulk_update_leads',
        description: `No matching leads${missed.length ? `: ${missed.join(', ')}` : ''}.`,
        data: { missed }
      };
    }

    const updates: Partial<Lead> = {};
    if (args.status !== undefined) {
      if (!LEAD_STATUSES.includes(args.status)) {
        return {
          toolName: 'bulk_update_leads',
          description: `status must be one of: ${LEAD_STATUSES.join(', ')}.`,
          data: { leads: matched.map((l) => l.name) }
        };
      }
      updates.status = args.status;
    }
    if (args.source) updates.source = String(args.source);
    if (args.location) updates.location = String(args.location);
    if (args.addTags && Array.isArray(args.addTags)) {
      // Applied per lead so existing tags are preserved and de-duplicated.
      const additions = args.addTags.map((t: any) => String(t));
      const snapshots = matched.map((l) => ({ id: l.id, tags: l.tags || [] }));
      for (const l of matched) {
        const merged = Array.from(new Set([...(l.tags || []), ...additions]));
        leadsStore().updateLead(l.id, { tags: merged });
      }
      toast.success(`Tagged ${matched.length} lead(s)`);
      const warning = missed.length ? ` Unmatched: ${missed.join(', ')}.` : '';
      return {
        toolName: 'bulk_update_leads',
        description: `Added tags [${additions.join(', ')}] to ${matched.length} lead(s).${warning}`,
        data: { ids: matched.map((l) => l.id), previous: snapshots }
      };
    }

    if (Object.keys(updates).length === 0) {
      return {
        toolName: 'bulk_update_leads',
        description: 'Provide status, source, location or addTags.',
        data: { leads: matched.map((l) => l.name) }
      };
    }

    const snapshots = matched.map((l) => {
      const snap: any = { id: l.id };
      for (const key of Object.keys(updates)) snap[key] = (l as any)[key];
      return snap;
    });
    leadsStore().bulkUpdateLeads(matched.map((l) => l.id), updates);
    toast.success(`Updated ${matched.length} lead(s)`);
    const warning = missed.length ? ` Unmatched: ${missed.join(', ')}.` : '';
    return {
      toolName: 'bulk_update_leads',
      description: `Updated ${matched.length} lead(s) (${Object.keys(updates).join(', ')}).${warning}`,
      data: { ids: matched.map((l) => l.id), updates, previous: snapshots, missed }
    };
  }

  if (call.name === 'bulk_delete_leads') {
    const { matched, missed } = resolveLeads(args.leads);
    if (matched.length === 0) return null;
    // Capture the full records: leads must be re-insertable by undo.
    const snapshot = matched.map((l) => ({ ...l }));
    leadsStore().bulkDeleteLeads(matched.map((l) => l.id));
    toast.success(`Deleted ${matched.length} lead(s)`);
    const warning = missed.length ? ` Unmatched: ${missed.join(', ')}.` : '';
    return {
      toolName: 'bulk_delete_leads',
      description: `Deleted ${matched.length} lead(s): ${matched.map((l) => l.name).join(', ')}.${warning}`,
      data: snapshot
    };
  }

  if (call.name === 'bulk_promote_leads') {
    const { matched, missed } = resolveLeads(args.leads);
    if (matched.length === 0) return null;
    leadsStore().bulkPromoteLeads(matched.map((l) => l.id));
    toast.success(`Promoted ${matched.length} lead(s) to clients`);
    const warning = missed.length ? ` Unmatched: ${missed.join(', ')}.` : '';
    return {
      toolName: 'bulk_promote_leads',
      description: `Promoted ${matched.length} lead(s) to clients: ${matched.map((l) => l.name).join(', ')}.${warning}`,
      data: { ids: matched.map((l) => l.id), names: matched.map((l) => l.name), missed }
    };
  }

  // ---------- Ordering ----------
  if (call.name === 'reorder_lead') {
    const target = resolveLeads([args.lead]).matched[0];
    const anchor = resolveLeads([args.before]).matched[0];
    if (!target || !anchor) {
      return {
        toolName: 'reorder_lead',
        description: 'Both the lead to move and the lead to place it before must exist.',
        data: { lead: args.lead, before: args.before }
      };
    }
    const previousOrder = (leadsStore().leads || []).map((l) => l.id);
    leadsStore().reorderLeads(target.id, anchor.id);
    toast.success(`Moved "${target.name}"`);
    return {
      toolName: 'reorder_lead',
      description: `Moved "${target.name}" to sit before "${anchor.name}"`,
      data: { moved: target.id, before: anchor.id, previousOrder }
    };
  }

  // ---------- CSV import ----------
  if (call.name === 'import_leads_csv') {
    const csv = args.csv !== undefined ? String(args.csv) : '';
    if (!csv.trim()) {
      return {
        toolName: 'import_leads_csv',
        description: 'Provide the CSV text to import.',
        data: {}
      };
    }
    const before = new Set((leadsStore().leads || []).map((l) => l.id));
    leadsStore().importLeadsFromCSV(csv);
    const after = leadsStore().leads || [];
    const added = after.filter((l) => !before.has(l.id));
    toast.success(`Imported ${added.length} lead(s)`);
    return {
      toolName: 'import_leads_csv',
      description: added.length
        ? `Imported ${added.length} lead(s): ${added.slice(0, 10).map((l) => l.name).join(', ')}${added.length > 10 ? ', ...' : ''}`
        : 'Nothing was imported — check that the CSV has a header row and at least one data row.',
      data: { addedCount: added.length, ids: added.map((l) => l.id) }
    };
  }

  // ---------- Column management ----------
  if (call.name === 'create_lead_column') {
    if (!args.title) return null;
    const id = `col_${Date.now().toString(36)}`;
    leadsStore().addColumn(id, String(args.title), args.width !== undefined ? Number(args.width) : undefined);
    toast.success(`Added column "${args.title}"`);
    return {
      toolName: 'create_lead_column',
      description: `Added the column "${args.title}"`,
      data: { id, title: args.title }
    };
  }

  if (call.name === 'update_lead_column') {
    const action = args.action;

    // Base fields are renamed through the label map, not the column list.
    if (action === 'renameLabel') {
      const field = findBaseLabelField(args.field);
      if (!field) {
        return {
          toolName: 'update_lead_column',
          description: `"${args.field}" is not a base field. Base fields: ${BASE_LABEL_FIELDS.join(', ')}.`,
          data: { field: args.field }
        };
      }
      if (!args.newLabel) return null;
      const previousLabel = leadsStore().columnLabels?.[field];
      leadsStore().updateColumnLabel(field, String(args.newLabel));
      toast.success(`Renamed "${field}" to "${args.newLabel}"`);
      return {
        toolName: 'update_lead_column',
        description: `Renamed the "${field}" column to "${args.newLabel}"`,
        data: { field, newLabel: args.newLabel, previous: { field, previousLabel } }
      };
    }

    const column = resolveColumn(args.column);
    if (!column) {
      return {
        toolName: 'update_lead_column',
        description: `No custom column matching "${args.column}". Use list_lead_columns to see them.`,
        data: { column: args.column }
      };
    }

    if (action === 'rename') {
      if (!args.newTitle) return null;
      leadsStore().updateColumn(column.id, { title: String(args.newTitle) });
      toast.success(`Renamed column to "${args.newTitle}"`);
      return {
        toolName: 'update_lead_column',
        description: `Renamed column "${column.title}" to "${args.newTitle}"`,
        data: { id: column.id, previous: { title: column.title } }
      };
    }
    if (action === 'resize') {
      if (args.width === undefined) return null;
      leadsStore().updateColumn(column.id, { width: Number(args.width) });
      return {
        toolName: 'update_lead_column',
        description: `Set column "${column.title}" width to ${args.width}px`,
        data: { id: column.id, width: Number(args.width), previous: { width: column.width } }
      };
    }
    return null;
  }

  if (call.name === 'delete_lead_column') {
    const column = resolveColumn(args.column);
    if (!column) return null;
    const positions = (leadsStore().columns || []).map((c) => c.id);
    leadsStore().deleteColumn(column.id);
    toast.success(`Deleted column "${column.title}"`);
    return {
      toolName: 'delete_lead_column',
      description: `Deleted the column "${column.title}"`,
      data: { column: { ...column }, previousOrder: positions }
    };
  }

  if (call.name === 'reorder_lead_columns') {
    const active = resolveColumn(args.column);
    const target = resolveColumn(args.before);
    if (!active || !target) {
      return {
        toolName: 'reorder_lead_columns',
        description: 'Both the column to move and the column to place it before must exist.',
        data: { column: args.column, before: args.before }
      };
    }
    const previousOrder = (leadsStore().columns || []).map((c) => c.id);
    leadsStore().reorderColumns(active.id, target.id);
    return {
      toolName: 'reorder_lead_columns',
      description: `Moved column "${active.title}" before "${target.title}"`,
      data: { previousOrder }
    };
  }

  // ---------- Timeline activity ----------
  if (call.name === 'log_lead_activity') {
    const lead = resolveLeads([args.lead]).matched[0];
    if (!lead) return null;
    const event = args.event ? String(args.event) : '';
    if (!event) {
      return {
        toolName: 'log_lead_activity',
        description: 'Provide the activity text to log.',
        data: { id: lead.id }
      };
    }
    const previousTimeline = lead.timeline || [];
    leadsStore().updateLead(lead.id, {
      timeline: [...previousTimeline, { date: new Date().toISOString(), event }]
    });
    toast.success(`Logged activity on "${lead.name}"`);
    return {
      toolName: 'log_lead_activity',
      description: `Logged "${event}" on "${lead.name}"`,
      data: { id: lead.id, previous: { timeline: previousTimeline } }
    };
  }

  return null;
}
