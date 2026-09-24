import { AgentToolCall, AgentToolResult } from '../../types';
import { toast } from '../../../../../stores/toastStore';
import { useClientStore } from '../../../../../stores/clientStore';
import { useClientDetailsStore } from '../../../../../stores/clientDetailsStore';
import { useEventStore } from '../../../../../stores/eventStore';
import { findClient, handleClientAssetLeadTools } from './clientAssetLeadHandlers';

export function handleClientDetailsTools(call: AgentToolCall): AgentToolResult | null {
  const { name, args } = call;

  // 1. Book Client Appointment
  if (name === 'book_client_appointment') {
    const client = findClient(args.clientName);
    if (client) {
      const expert = args.expertName || 'Leslie Alexander';
      const topic = args.topic || 'Project Consultation';
      const time = args.time || '11:00';
      const date = args.date || new Date().toISOString().slice(0, 10);

      useClientDetailsStore.getState().addActivityLog({
        user: expert,
        action: `scheduled appointment (${topic}) for`,
        target: `${date} at ${time}`,
        time: 'Just now',
        type: 'comment'
      });

      useClientStore.getState().addNote({
        clientId: client.id,
        clientInitials: client.initials,
        type: 'Meeting',
        content: `Scheduled meeting with ${expert} for ${date} at ${time}. Topic: ${topic}`,
        authorInitials: 'NOVA',
        tags: ['Meeting', 'Appointment']
      });

      useEventStore.getState().addEvent({
        title: `Appointment: ${client.name} (${topic})`,
        date,
        time,
        type: 'Call' as any
      });

      toast.success(`Booked appointment for ${client.name}!`);
      return {
        toolName: name,
        description: `Scheduled "${topic}" appointment with ${client.name} on ${date} at ${time}`,
        data: { clientId: client.id, expert, topic, date, time }
      };
    }
  }

  // 2. Manage Client Tags
  if (name === 'manage_client_tags') {
    const client = findClient(args.clientName);
    if (client) {
      const action = args.action || 'add';
      const inputTags = Array.isArray(args.tags) ? args.tags : [String(args.tags || '')];
      const existingTags = client.tags || [];
      let updatedTags = [...existingTags];

      if (action === 'add') {
        const toAdd = inputTags.filter(t => !existingTags.includes(t));
        updatedTags = [...existingTags, ...toAdd];
      } else if (action === 'remove') {
        updatedTags = existingTags.filter(t => !inputTags.includes(t));
      } else {
        updatedTags = inputTags;
      }

      useClientStore.getState().updateClient(client.id, { tags: updatedTags });
      useClientDetailsStore.getState().addActivityLog({
        user: 'Nova AI',
        action: action === 'remove' ? 'removed branding tag(s):' : 'updated branding categorization tags to:',
        target: updatedTags.join(', ') || 'No tags',
        time: 'Just now',
        type: 'comment'
      });

      toast.success(`Updated tags for ${client.name}!`);
      return {
        toolName: name,
        description: `Updated branding tags for ${client.name}: [${updatedTags.join(', ')}]`,
        data: { clientId: client.id, tags: updatedTags }
      };
    }
  }

  // 3. Create Client Note
  if (name === 'create_client_note') {
    const client = findClient(args.clientName);
    if (client && args.content) {
      const type = (['Meeting', 'Idea', 'Feedback', 'Urgent'].includes(args.type) ? args.type : 'Meeting') as any;
      const tags = Array.isArray(args.tags) ? args.tags : (args.tags ? [args.tags] : [type]);

      useClientStore.getState().addNote({
        clientId: client.id,
        clientInitials: client.initials,
        type,
        content: args.content,
        authorInitials: 'NOVA',
        tags
      });

      useClientDetailsStore.getState().addActivityLog({
        user: 'Nova AI',
        action: `added a ${type.toLowerCase()} log note to`,
        target: client.name,
        time: 'Just now',
        type: 'note'
      });

      toast.success(`Logged note for ${client.name}!`);
      return {
        toolName: name,
        description: `Added ${type} note for ${client.name}`,
        data: { clientId: client.id, type, content: args.content }
      };
    }
  }

  // 4. Log Client Invoice
  if (name === 'log_client_invoice') {
    const client = findClient(args.clientName);
    if (client && args.amount) {
      const amountNum = Number(args.amount) || 0;
      const dueDays = Number(args.dueDays) || 14;

      useClientStore.getState().createInvoice(client.id, amountNum, dueDays);
      useClientStore.getState().addNote({
        clientId: client.id,
        clientInitials: client.initials,
        type: 'Urgent',
        content: `Logged billing invoice for $${amountNum.toLocaleString()} with ${dueDays}-day maturity.`,
        authorInitials: 'SYS',
        tags: ['Financials', 'Invoice']
      });

      useClientDetailsStore.getState().addActivityLog({
        user: 'Nova AI',
        action: `issued invoice of $${amountNum.toLocaleString()} to`,
        target: client.company,
        time: 'Just now',
        type: 'note'
      });

      toast.success(`Logged $${amountNum} invoice for ${client.name}!`);
      return {
        toolName: name,
        description: `Issued invoice of $${amountNum.toLocaleString()} (${dueDays}d maturity) to ${client.name}`,
        data: { clientId: client.id, amount: amountNum, dueDays }
      };
    }
  }

  // 5. Create Client Task
  if (name === 'create_client_task') {
    const client = findClient(args.clientName);
    if (client && args.title) {
      const newTask = {
        id: `task-${Date.now()}`,
        title: args.title,
        phase: args.phase || 'Development',
        statusType: 'ongoing' as const,
        desc: args.phase || 'Assignment',
        dueText: args.dueText || 'Due in 7 days'
      };
      const history = [newTask, ...(client.projectHistory || [])];
      useClientStore.getState().updateClient(client.id, { projectHistory: history });

      useClientDetailsStore.getState().addActivityLog({
        user: 'Nova AI',
        action: 'scheduled assignment',
        target: args.title,
        time: 'Just now',
        type: 'task'
      });

      toast.success(`Scheduled task for ${client.name}!`);
      return {
        toolName: name,
        description: `Created assignment "${args.title}" for ${client.name}`,
        data: { clientId: client.id, task: newTask }
      };
    }
  }

  // Delegate assets, ratings, experts, lead scraping to clientAssetLeadHandlers
  return handleClientAssetLeadTools(call);
}
