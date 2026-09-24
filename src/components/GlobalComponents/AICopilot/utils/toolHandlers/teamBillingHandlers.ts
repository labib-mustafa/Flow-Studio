import { AgentToolCall, AgentToolResult } from '../../types';
import { toast } from '../../../../../stores/toastStore';
import { useTeamStore, TeamMember } from '../../../../../stores/teamStore';
import { useBillingStore } from '../../../../../stores/billingStore';

/**
 * Team administration and billing profile operations.
 *
 * Two security decisions are baked in here rather than left to the prompt:
 *
 * 1. **Card numbers are never written or read back.** `SavedCardInfo.cardNumber`
 *    is a PAN. A tool that accepted it would route a card number through the
 *    model and into conversation history, and returning it would leak it into
 *    the transcript. `update_saved_card` therefore accepts holder and brand
 *    only, and `list_billing_summary` returns the number masked to its last
 *    four digits. Entering a card stays a UI action.
 *
 * 2. **Invites send real email.** `inviteMember` / `resendInvite` post to the
 *    configured SMTP server, so their descriptions require confirmation first.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const maskCard = (cardNumber: string): string => {
  const digits = String(cardNumber || '').replace(/\D/g, '');
  if (!digits) return 'none on file';
  return `•••• ${digits.slice(-4)}`;
};

const findMember = (ref: string): TeamMember | undefined => {
  const query = String(ref || '').trim().toLowerCase();
  if (!query) return undefined;
  const members = useTeamStore.getState().members || [];
  return (
    members.find((m) => m.id.toLowerCase() === query) ||
    members.find((m) => m.name.toLowerCase() === query) ||
    members.find((m) => m.email.toLowerCase() === query) ||
    members.find((m) => m.name.toLowerCase().includes(query))
  );
};

export function handleTeamBillingTools(call: AgentToolCall): AgentToolResult | null {
  const args = call.args || {};

  // ---------- Team (read) ----------
  if (call.name === 'list_team') {
    const state = useTeamStore.getState();
    const members = (state.members || []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      department: m.department,
      status: m.status,
      skills: m.skills || [],
      assignedProjects: m.assignedProjects?.length || 0
    }));
    const invites = (state.invites || []).map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      sentDate: i.sentDate
    }));
    return {
      toolName: 'list_team',
      description: `${members.length} member(s), ${invites.length} pending invitation(s)`,
      data: { members, invites, customRoles: state.customRoles || [] }
    };
  }

  // ---------- Team (write) ----------
  if (call.name === 'invite_team_member') {
    const email = String(args.email || '').trim();
    const role = String(args.role || '').trim();
    if (!EMAIL_RE.test(email)) {
      return {
        toolName: 'invite_team_member',
        description: `"${args.email}" is not a valid email address.`,
        data: {}
      };
    }
    if (!role) {
      return {
        toolName: 'invite_team_member',
        description: 'Provide the role to invite them as.',
        data: { email }
      };
    }

    useTeamStore.getState().inviteMember(email, role).catch(() => toast.error('Invite email could not be sent'));
    toast.success(`Invited ${email} as ${role}`);

    const invites = useTeamStore.getState().invites || [];
    return {
      toolName: 'invite_team_member',
      description: `Sent an invitation to ${email} as ${role}`,
      data: invites.find((i) => i.email === email) || { email, role }
    };
  }

  if (call.name === 'resend_team_invite' || call.name === 'revoke_team_invite') {
    const query = String(args.invite || '').trim().toLowerCase();
    const invites = useTeamStore.getState().invites || [];
    const target =
      invites.find((i) => i.id.toLowerCase() === query) ||
      invites.find((i) => i.email.toLowerCase() === query);

    if (!target) {
      return {
        toolName: call.name,
        description: `No pending invitation matching "${args.invite}"${invites.length ? `. Pending: ${invites.map((i) => i.email).join(', ')}` : ' — there are no pending invitations.'}`,
        data: { invite: args.invite }
      };
    }

    if (call.name === 'resend_team_invite') {
      useTeamStore.getState().resendInvite(target.id).catch(() => toast.error('Could not resend the invitation'));
      toast.success(`Re-sent the invitation to ${target.email}`);
      return {
        toolName: 'resend_team_invite',
        description: `Re-sent the invitation to ${target.email}`,
        data: target
      };
    }

    useTeamStore.getState().revokeInvite(target.id);
    toast.success(`Revoked the invitation for ${target.email}`);
    return {
      toolName: 'revoke_team_invite',
      description: `Revoked the invitation for ${target.email}`,
      data: target
    };
  }

  if (call.name === 'manage_team_role') {
    const role = String(args.role || '').trim();
    if (!role) return null;
    const roles = useTeamStore.getState().customRoles || [];

    if (args.action === 'add') {
      if (roles.includes(role)) {
        return {
          toolName: 'manage_team_role',
          description: `"${role}" is already a role.`,
          data: { role, customRoles: roles }
        };
      }
      useTeamStore.getState().addCustomRole(role);
      toast.success(`Added role "${role}"`);
      return {
        toolName: 'manage_team_role',
        description: `Added the role "${role}"`,
        data: { role, action: 'add' }
      };
    }

    if (args.action === 'remove') {
      if (!roles.includes(role)) {
        return {
          toolName: 'manage_team_role',
          description: `"${role}" is not a custom role.`,
          data: { role, customRoles: roles }
        };
      }
      // Report who still holds it: removing the role definition does not
      // reassign anyone, and leaving colleagues on a deleted role silently
      // is worth surfacing.
      const holders = (useTeamStore.getState().members || [])
        .filter((m) => m.role === role)
        .map((m) => m.name);
      useTeamStore.getState().removeCustomRole(role);
      toast.success(`Removed role "${role}"`);
      const warning = holders.length ? ` ${holders.length} member(s) still have it: ${holders.join(', ')}.` : '';
      return {
        toolName: 'manage_team_role',
        description: `Removed the role "${role}".${warning}`,
        data: { role, action: 'remove', holders }
      };
    }
    return null;
  }

  // ---------- Billing (read) ----------
  if (call.name === 'list_billing_summary') {
    const state = useBillingStore.getState();
    const invoices = state.paymentHistory || [];
    const outstanding = invoices.filter((i) => i.status === 'Pending' || i.status === 'Overdue');
    const outstandingTotal = outstanding.reduce((sum, i) => sum + (i.amount || 0), 0);

    return {
      toolName: 'list_billing_summary',
      description: `${invoices.length} invoice(s); ${outstanding.length} outstanding worth ${outstandingTotal.toLocaleString()}`,
      data: {
        balance: state.balance,
        nextPaymentAmount: state.nextPaymentAmount,
        nextPaymentDate: state.nextPaymentDate,
        // Masked deliberately — see the module header.
        card: {
          brand: state.savedCard?.brand || '',
          holder: state.savedCard?.cardHolder || '',
          validThru: state.savedCard?.validThru || '',
          number: maskCard(state.savedCard?.cardNumber || '')
        },
        billingAddress: state.billingAddress,
        invoices: invoices.slice(0, 25).map((i) => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          recipientName: i.recipientName,
          amount: i.amount,
          status: i.status,
          dueDate: i.dueDate
        })),
        outstandingTotal
      }
    };
  }

  // ---------- Billing (write) ----------
  if (call.name === 'update_billing_address') {
    const updates: any = {};
    if (args.name) updates.name = String(args.name);
    if (args.addressLine1) updates.addressLine1 = String(args.addressLine1);
    if (args.addressLine2) updates.addressLine2 = String(args.addressLine2);
    if (Object.keys(updates).length === 0) {
      return {
        toolName: 'update_billing_address',
        description: 'Provide at least one of name, addressLine1 or addressLine2.',
        data: {}
      };
    }
    const previous = { ...useBillingStore.getState().billingAddress };
    useBillingStore.getState().updateBillingAddress(updates);
    toast.success('Updated billing address');
    return {
      toolName: 'update_billing_address',
      description: `Updated the billing address (${Object.keys(updates).join(', ')})`,
      data: { ...updates, previous }
    };
  }

  if (call.name === 'update_saved_card') {
    // Card number is intentionally not accepted. If the model passes one,
    // ignore it and say so rather than silently dropping it.
    if (args.cardNumber) {
      return {
        toolName: 'update_saved_card',
        description:
          'Card numbers cannot be set through the agent for security reasons. Update it in Billing settings; only the holder name, brand and expiry can be changed here.',
        data: { rejected: 'cardNumber' }
      };
    }

    const updates: any = {};
    if (args.cardHolder) updates.cardHolder = String(args.cardHolder);
    if (args.brand) updates.brand = String(args.brand);
    if (args.validThru) updates.validThru = String(args.validThru);
    if (Object.keys(updates).length === 0) {
      return {
        toolName: 'update_saved_card',
        description: 'Provide cardHolder, brand or validThru. The card number must be changed in Billing settings.',
        data: {}
      };
    }
    const previous = { ...useBillingStore.getState().savedCard };
    delete (previous as any).cardNumber;
    useBillingStore.getState().updateSavedCard(updates);
    toast.success('Updated card details');
    return {
      toolName: 'update_saved_card',
      description: `Updated card details (${Object.keys(updates).join(', ')})`,
      data: { ...updates, previous }
    };
  }

  return null;
}
