import { AgentToolCall, AgentToolResult } from '../../types';
import { toast } from '../../../../../stores/toastStore';
import { useClientStore } from '../../../../../stores/clientStore';
import { useLeadStore, LeadStatus } from '../../../../../stores/leadStore';

/**
 * Resolves a target reference from the several key names a caller may use for
 * the same thing. Tool schemas and handlers had drifted apart (schema sends
 * `clientName`, handler read `clientId`/`name`), which made the lookup resolve
 * to undefined and fail silently. Reading every known alias keeps a rename on
 * either side from dropping the argument again.
 */
const refString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return '';
};

const findClient = (ref: string) =>
  (useClientStore.getState().clients || []).find(
    (c) => c.id === ref || c.name.toLowerCase().includes(ref.toLowerCase())
  );

const findLead = (ref: string) =>
  (useLeadStore.getState().leads || []).find(
    (l) => l.id === ref || l.name.toLowerCase().includes(ref.toLowerCase())
  );

export function handleCrmTools(call: AgentToolCall): AgentToolResult | null {
  // 1. Create Client
  if (call.name === 'create_client') {
    const { name, company, email, phone, location, status, totalVolume } = call.args;
    if (name) {
      const clientStore = useClientStore.getState();
      const validStatus = ['Active', 'Prospect', 'Inactive'].includes(status) ? status : 'Active';
      const newClientId = clientStore.addClient({
        name,
        company: company || name,
        role: 'Client',
        status: validStatus,
        projectsCount: 0,
        rating: null,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: phone || '',
        location: location || '',
        totalVolume: Number(totalVolume) || 0,
        outstandingAmount: 0,
        outstandingPending: false,
        outstandingDueDays: 0,
        communicationRating: 5,
        speedRating: 5,
        brandColors: [],
        brandFonts: [],
        projectHistory: []
      });

      toast.success(`Created client "${name}"!`);
      return {
        toolName: 'create_client',
        description: `Created client "${name}" (${company || 'Direct'})`,
        data: { id: newClientId, name, company }
      };
    }
  }

  // 2. Update Client
  if (call.name === 'update_client') {
    const { status, email, phone, location } = call.args;
    const ref = refString(call.args.clientId, call.args.clientName, call.args.name);
    const target = ref ? findClient(ref) : undefined;

    if (target) {
      const clientStore = useClientStore.getState();
      const updates: any = {};
      if (status && ['Active', 'Prospect', 'Inactive'].includes(status)) updates.status = status;
      if (email) updates.email = email;
      if (phone) updates.phone = phone;
      if (location) updates.location = location;

      // Snapshot the keys being changed so the agent undo path can restore them.
      const previous: any = {};
      for (const key of Object.keys(updates)) previous[key] = (target as any)[key];

      if (Object.keys(updates).length > 0) clientStore.updateClient(target.id, updates);
      toast.success(`Updated client "${target.name}"`);
      return {
        toolName: 'update_client',
        description: `Updated client "${target.name}" (${Object.keys(updates).join(', ') || 'no fields supplied'})`,
        data: { id: target.id, ...updates, previous }
      };
    }
  }

  // 3. Delete Client
  if (call.name === 'delete_client') {
    const ref = refString(call.args.clientId, call.args.clientName, call.args.name);
    const target = ref ? findClient(ref) : undefined;

    if (target) {
      useClientStore.getState().deleteClient(target.id);
      toast.success(`Deleted client "${target.name}"`);
      return {
        toolName: 'delete_client',
        description: `Deleted client "${target.name}"`,
        data: target
      };
    }
  }

  // 4. Create Lead
  if (call.name === 'create_lead') {
    const { name, company, email, phone, status, estimated_value, notes_summary, location } = call.args;
    if (name) {
      const leadStore = useLeadStore.getState();
      const validStatus: LeadStatus = ['New', 'Contacted', 'Proposal Sent', 'Archived'].includes(status)
        ? (status as LeadStatus)
        : 'New';

      leadStore.addLead({
        name,
        company: company || 'Prospect Co',
        email: email || null,
        phone: phone || '',
        status: validStatus,
        location: location || '',
        estimated_value: typeof estimated_value === 'number' ? estimated_value : Number(estimated_value) || 0,
        source: 'Nova AI Agent',
        notes_summary: notes_summary || '',
        tags: ['AI Prospect']
      });

      const createdLead = useLeadStore.getState().leads[0];
      toast.success(`Added sales lead "${name}"!`);
      return {
        toolName: 'create_lead',
        description: `Added lead "${name}" ($${Number(estimated_value) || 0})`,
        data: createdLead || { name, company }
      };
    }
  }

  // 5. Update Lead
  if (call.name === 'update_lead') {
    const { status, estimated_value, notes_summary } = call.args;
    const ref = refString(call.args.leadId, call.args.leadName, call.args.name);
    const target = ref ? findLead(ref) : undefined;

    if (target) {
      const leadStore = useLeadStore.getState();
      const updates: any = {};
      if (status && ['New', 'Contacted', 'Proposal Sent', 'Archived'].includes(status)) updates.status = status;
      if (estimated_value !== undefined) updates.estimated_value = Number(estimated_value) || 0;
      if (notes_summary) updates.notes_summary = notes_summary;

      // Snapshot the keys being changed so the agent undo path can restore them.
      const previous: any = {};
      for (const key of Object.keys(updates)) previous[key] = (target as any)[key];

      if (Object.keys(updates).length > 0) leadStore.updateLead(target.id, updates);
      toast.success(`Updated lead "${target.name}"`);
      return {
        toolName: 'update_lead',
        description: `Updated lead "${target.name}" (${Object.keys(updates).join(', ') || 'no fields supplied'})`,
        data: { id: target.id, ...updates, previous }
      };
    }
  }

  // 6. Delete Lead
  if (call.name === 'delete_lead') {
    const ref = refString(call.args.leadId, call.args.leadName, call.args.name);
    const target = ref ? findLead(ref) : undefined;

    if (target) {
      useLeadStore.getState().deleteLead(target.id);
      toast.success(`Deleted lead "${target.name}"`);
      return {
        toolName: 'delete_lead',
        description: `Deleted lead "${target.name}"`,
        data: target
      };
    }
  }

  // 7. Promote Lead to Client
  if (call.name === 'promote_lead_to_client') {
    const ref = refString(call.args.leadId, call.args.leadName, call.args.name);
    const target = ref ? findLead(ref) : undefined;

    if (target) {
      useLeadStore.getState().promoteLeadToClient(target.id);
      toast.success(`Promoted lead "${target.name}" to Active Client!`);
      return {
        toolName: 'promote_lead_to_client',
        description: `Promoted "${target.name}" from Lead to Client`,
        data: target
      };
    }
  }

  return null;
}
