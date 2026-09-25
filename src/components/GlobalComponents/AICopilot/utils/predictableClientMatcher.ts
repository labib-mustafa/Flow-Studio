import { ChatMessage, AgentToolResult } from '../types';
import { toast } from '../../../../stores/toastStore';
import { useClientStore } from '../../../../stores/clientStore';
import { useClientDetailsStore } from '../../../../stores/clientDetailsStore';
import { useEventStore } from '../../../../stores/eventStore';
import { findClient } from './toolHandlers/clientAssetLeadHandlers';
import { parseNaturalDate } from './dateParser';

const emitClientSuccess = (
  text: string,
  content: string,
  toolResult: AgentToolResult,
  onSuccessChat: (userMsg: ChatMessage, agentMsg: ChatMessage) => void,
  toastMessage?: string
) => {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const userMsg: ChatMessage = { id: `msg-${Date.now()}-u`, role: 'user', content: text, timestamp: time };
  const agentMsg: ChatMessage = { id: `msg-${Date.now()}-a`, role: 'assistant', content, timestamp: time, toolResults: [toolResult] };
  onSuccessChat(userMsg, agentMsg);
  if (toastMessage) toast.success(toastMessage);
};

export const matchPredictableClientAction = (
  rawText: string,
  onSuccessChat: (userMsg: ChatMessage, agentMsg: ChatMessage) => void
): boolean => {
  const text = rawText.trim();

  // 1. Book Appointment with Client: "book appointment with Acme on 2026-10-15 at 14:00"
  const apptMatch = text.match(/^(?:book|schedule)\s+(?:an?\s+)?appointment\s+(?:with\s+)?(?:client\s+)?([a-zA-Z0-9\s]+?)\s+(?:on|for)\s+([a-zA-Z0-9\s,-]+?)(?:\s+at\s+([0-9:apmAPM\s]+))?$/i);
  if (apptMatch) {
    const client = findClient(apptMatch[1].trim());
    if (client) {
      const date = parseNaturalDate(apptMatch[2].trim());
      const time = apptMatch[3]?.trim() || '11:00';
      const expert = 'Leslie Alexander';
      useClientDetailsStore.getState().addActivityLog({
        user: expert,
        action: 'scheduled appointment (Consultation) for',
        target: `${date} at ${time}`,
        time: 'Just now',
        type: 'comment'
      });
      useClientStore.getState().addNote({
        clientId: client.id,
        clientInitials: client.initials,
        type: 'Meeting',
        content: `Scheduled consultation with ${expert} for ${date} at ${time}.`,
        authorInitials: 'NOVA',
        tags: ['Appointment', 'Meeting']
      });
      useEventStore.getState().addEvent({
        title: `Appointment: ${client.name}`,
        description: '',
        date,
        time,
        type: 'Call',
        participants: ''
      });
      emitClientSuccess(
        text,
        `⚡ **Instant Action**: Scheduled consultation appointment with **${client.name}** on **${date}** at **${time}**.`,
        { toolName: 'book_client_appointment', description: `Booked appointment for ${client.name}`, data: { clientId: client.id, date, time } },
        onSuccessChat,
        `Booked appointment with ${client.name}!`
      );
      return true;
    }
  }

  // 2. Attach Document: "attach Mutual NDA to client Alexander Hamilton"
  const attachMatch = text.match(/^(?:attach|add)\s+(?:the\s+)?([a-zA-Z0-9\s().-]+?)\s+to\s+(?:client\s+)?([a-zA-Z0-9\s]+)$/i);
  if (attachMatch) {
    const docName = attachMatch[1].trim();
    const client = findClient(attachMatch[2].trim());
    if (client && !docName.toLowerCase().startsWith('task') && !docName.toLowerCase().startsWith('note')) {
      const fullDoc = docName.endsWith('.pdf') || docName.endsWith('.doc') ? docName : `${docName}.pdf`;
      useClientDetailsStore.getState().addPinnedAsset({
        id: `a-${Date.now()}`,
        name: fullDoc,
        type: fullDoc.endsWith('.doc') ? 'doc' : 'pdf',
        date: 'Uploaded Just now'
      });
      useClientDetailsStore.getState().addActivityLog({
        user: 'Nova AI',
        action: 'attached regulatory document',
        target: fullDoc,
        time: 'Just now',
        type: 'comment'
      });
      emitClientSuccess(
        text,
        `⚡ **Instant Action**: Attached **"${fullDoc}"** to **${client.name}**'s asset vault.`,
        { toolName: 'attach_client_document', description: `Attached ${fullDoc}`, data: { clientId: client.id, docName: fullDoc } },
        onSuccessChat,
        `Attached ${fullDoc} to ${client.name}!`
      );
      return true;
    }
  }

  // 3. Tag Client: "tag client Acme with FINTECH, STRATEGIC"
  const tagMatch = text.match(/^(?:tag|categorize)\s+(?:client\s+)?([a-zA-Z0-9\s]+?)\s+(?:as|with)\s+([a-zA-Z0-9\s,]+)$/i);
  if (tagMatch) {
    const client = findClient(tagMatch[1].trim());
    if (client) {
      const newTags = tagMatch[2].split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
      const combined = Array.from(new Set([...(client.tags || []), ...newTags]));
      useClientStore.getState().updateClient(client.id, { tags: combined });
      useClientDetailsStore.getState().addActivityLog({
        user: 'Nova AI',
        action: 'updated branding categorization tags to:',
        target: combined.join(', '),
        time: 'Just now',
        type: 'comment'
      });
      emitClientSuccess(
        text,
        `⚡ **Instant Action**: Updated brand tags for **${client.name}** to **[${combined.join(', ')}]**.`,
        { toolName: 'manage_client_tags', description: `Updated tags for ${client.name}`, data: { clientId: client.id, tags: combined } },
        onSuccessChat,
        `Updated tags for ${client.name}!`
      );
      return true;
    }
  }

  // 4. Log Invoice: "log invoice of $4500 for client Acme"
  const invoiceMatch = text.match(/^(?:log|create|issue)\s+(?:an?\s+)?(?:new\s+)?invoice\s+(?:of\s+)?\$?([0-9]+)\s+(?:for|to)\s+(?:client\s+)?([a-zA-Z0-9\s]+)$/i);
  if (invoiceMatch) {
    const amount = parseInt(invoiceMatch[1], 10);
    const client = findClient(invoiceMatch[2].trim());
    if (client && amount > 0) {
      useClientStore.getState().createInvoice(client.id, amount, 14);
      useClientStore.getState().addNote({
        clientId: client.id,
        clientInitials: client.initials,
        type: 'Urgent',
        content: `Logged billing invoice for $${amount.toLocaleString()} with 14-day maturity.`,
        authorInitials: 'SYS',
        tags: ['Financials', 'Invoice']
      });
      useClientDetailsStore.getState().addActivityLog({
        user: 'Nova AI',
        action: `issued invoice of $${amount.toLocaleString()} to`,
        target: client.company,
        time: 'Just now',
        type: 'note'
      });
      emitClientSuccess(
        text,
        `⚡ **Instant Action**: Issued billing invoice of **$${amount.toLocaleString()}** (14-day maturity) to **${client.name}**.`,
        { toolName: 'log_client_invoice', description: `Issued $${amount} invoice`, data: { clientId: client.id, amount } },
        onSuccessChat,
        `Logged $${amount} invoice for ${client.name}!`
      );
      return true;
    }
  }

  return false;
};
