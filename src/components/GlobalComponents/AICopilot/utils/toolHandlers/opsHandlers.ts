import { AgentToolCall, AgentToolResult } from '../../types';
import { toast } from '../../../../../stores/toastStore';
import { useTeamStore } from '../../../../../stores/teamStore';
import { useBillingStore, PaymentHistoryItem } from '../../../../../stores/billingStore';
import { useProjectStore } from '../../../../../stores/projectStore';

interface OpsContext {
  activeProjId: string;
}

/**
 * See crmHandlers.refString — schemas and handlers had drifted, so the invoice
 * tools read `invoiceNumber`/`invoiceId` while the schema sends
 * `invoiceIdentifier`, making the lookup resolve to undefined and fail silently.
 */
const refString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return '';
};

const findInvoice = (ref: string) =>
  (useBillingStore.getState().paymentHistory || []).find(
    (inv) => inv.id === ref || inv.invoiceNumber.toLowerCase() === ref.toLowerCase()
  );

export function handleOpsTools(call: AgentToolCall, ctx: OpsContext): AgentToolResult | null {
  const { activeProjId } = ctx;

  // 1. Create Team Member
  if (call.name === 'create_team_member') {
    const { name, role, email, department, phone, bio, skills, status } = call.args;
    if (name) {
      const memberId = `m_${Date.now()}`;
      const newMember = {
        id: memberId,
        name,
        role: role || 'Product Designer',
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@flowstudio.design`,
        department: department || 'Design',
        phone: phone || '+1 (555) 234-5678',
        bio: bio || `Specializes in creative systems and studio workflows.`,
        status: (status === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
        joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        assignedProjects: activeProjId && activeProjId !== 'default' && activeProjId !== 'universal' ? [activeProjId] : [],
        skills: Array.isArray(skills) && skills.length > 0 ? skills : ['Design', 'Prototyping']
      };
      useTeamStore.getState().addMember(newMember);
      toast.success(`Added ${name} to Team!`);
      return {
        toolName: 'create_team_member',
        description: `Added team member "${name}" (${newMember.role})`,
        data: newMember
      };
    }
  }

  // 2. Update Team Member
  if (call.name === 'update_team_member') {
    const { role, department, status, bio, skills } = call.args;
    const ref = refString(call.args.memberId, call.args.name);
    const target = ref
      ? (useTeamStore.getState().members || []).find(
          (m) => m.id === ref || m.name.toLowerCase().includes(ref.toLowerCase())
        )
      : undefined;

    if (target) {
      const teamStore = useTeamStore.getState();
      const updates: any = {};
      if (role) updates.role = role;
      if (department) updates.department = department;
      if (status && ['active', 'inactive'].includes(status)) updates.status = status;
      if (bio) updates.bio = bio;
      if (Array.isArray(skills)) updates.skills = skills;
      if (call.args.email) updates.email = String(call.args.email);
      if (call.args.phone) updates.phone = String(call.args.phone);
      if (call.args.activeFocus) updates.activeFocus = String(call.args.activeFocus);
      if (Array.isArray(call.args.certificates)) {
        updates.certificates = call.args.certificates.map((c: any) => String(c));
      }

      // Project assignments are stored as ids, so names must be resolved first.
      const unresolvedProjects: string[] = [];
      if (Array.isArray(call.args.assignedProjects)) {
        const projects = useProjectStore.getState().projects || [];
        const resolved: string[] = [];
        for (const ref of call.args.assignedProjects.map((p: any) => String(p))) {
          const q = ref.trim().toLowerCase();
          const hit =
            projects.find((p: any) => p.id?.toLowerCase() === q) ||
            projects.find((p: any) => (p.name || '').toLowerCase() === q || (p.title || '').toLowerCase() === q) ||
            projects.find((p: any) => (p.name || p.title || '').toLowerCase().includes(q));
          if (hit?.id) resolved.push(hit.id);
          else unresolvedProjects.push(ref);
        }
        updates.assignedProjects = resolved;
      }

      // Snapshot the keys being changed so the agent undo path can restore them.
      const previous: any = {};
      for (const key of Object.keys(updates)) previous[key] = (target as any)[key];

      if (Object.keys(updates).length > 0) teamStore.updateMember(target.id, updates);
      toast.success(`Updated team member "${target.name}"`);
      const warning = unresolvedProjects.length
        ? ` Unmatched projects: ${unresolvedProjects.join(', ')}.`
        : '';
      return {
        toolName: 'update_team_member',
        description: `Updated team member "${target.name}" (${Object.keys(updates).join(', ') || 'no fields supplied'}).${warning}`,
        data: { id: target.id, ...updates, previous, unresolvedProjects }
      };
    }
  }

  // 3. Delete Team Member
  if (call.name === 'delete_team_member') {
    const ref = refString(call.args.memberId, call.args.name);
    const target = ref
      ? (useTeamStore.getState().members || []).find(
          (m) => m.id === ref || m.name.toLowerCase().includes(ref.toLowerCase())
        )
      : undefined;

    if (target) {
      useTeamStore.getState().deleteMember(target.id);
      toast.success(`Removed team member "${target.name}"`);
      return {
        toolName: 'delete_team_member',
        description: `Removed team member "${target.name}"`,
        data: target
      };
    }
  }

  // 4. Create Invoice
  if (call.name === 'create_invoice') {
    const { invoiceNumber, recipientName, amount, dueDate, status, lineItems, notes } = call.args;
    if (recipientName && amount !== undefined) {
      const billingStore = useBillingStore.getState();
      const num = invoiceNumber || `INV-${Date.now().toString().slice(-5)}`;
      const validStatus = ['Pending', 'Completed', 'Draft', 'Overdue'].includes(status) ? status : 'Draft';
      const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
      const todayStr = new Date().toISOString().split('T')[0];

      const newInvoice: Omit<PaymentHistoryItem, 'id'> = {
        invoiceNumber: num,
        recipientName,
        recipientAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(recipientName)}`,
        recipientEmail: `${recipientName.toLowerCase().replace(/\s+/g, '.')}@client.com`,
        amount: numAmount,
        dueDate: dueDate || todayStr,
        date: todayStr,
        status: validStatus,
        method: 'Bank Transfer',
        lineItems: Array.isArray(lineItems) && lineItems.length > 0 ? lineItems : [
          { id: 'item-1', description: 'Professional Design & Consulting', quantity: 1, rate: numAmount }
        ],
        notes: notes || 'Thank you for your business!'
      };

      billingStore.addInvoice(newInvoice);
      const created = useBillingStore.getState().paymentHistory[0];
      toast.success(`Created invoice #${num} for ${recipientName}!`);
      return {
        toolName: 'create_invoice',
        description: `Created invoice #${num} ($${numAmount.toLocaleString()}) for ${recipientName}`,
        data: created || { invoiceNumber: num, ...newInvoice }
      };
    }
  }

  // 5. Update Invoice Status
  if (call.name === 'update_invoice_status') {
    const { status } = call.args;
    const ref = refString(call.args.invoiceId, call.args.invoiceNumber, call.args.invoiceIdentifier);
    const target = ref ? findInvoice(ref) : undefined;

    if (target && ['Pending', 'Completed', 'Draft', 'Overdue'].includes(status)) {
      const previousStatus = target.status;
      useBillingStore.getState().updateInvoiceStatus(target.id, status);
      toast.success(`Updated invoice #${target.invoiceNumber} status to ${status}`);
      return {
        toolName: 'update_invoice_status',
        description: `Updated invoice #${target.invoiceNumber} to ${status}`,
        data: { id: target.id, status, previous: { status: previousStatus } }
      };
    }
  }

  // 6. Delete Invoice
  if (call.name === 'delete_invoice') {
    const ref = refString(call.args.invoiceId, call.args.invoiceNumber, call.args.invoiceIdentifier);
    const target = ref ? findInvoice(ref) : undefined;

    if (target) {
      useBillingStore.getState().deleteInvoice(target.id);
      toast.success(`Deleted invoice #${target.invoiceNumber}`);
      return {
        toolName: 'delete_invoice',
        description: `Deleted invoice #${target.invoiceNumber}`,
        data: target
      };
    }
  }

  return null;
}
