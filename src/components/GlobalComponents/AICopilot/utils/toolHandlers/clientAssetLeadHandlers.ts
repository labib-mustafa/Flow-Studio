import { AgentToolCall, AgentToolResult } from '../../types';
import { toast } from '../../../../../stores/toastStore';
import { useClientStore, Client } from '../../../../../stores/clientStore';
import { useClientDetailsStore, PinnedAsset } from '../../../../../stores/clientDetailsStore';
import { useLeadStore } from '../../../../../stores/leadStore';

export function findClient(identifier?: string): Client | undefined {
  if (!identifier) return undefined;
  const clients = useClientStore.getState().clients || [];
  const q = identifier.toLowerCase().trim();
  return clients.find(c => c.id === identifier || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q));
}

export function handleClientAssetLeadTools(call: AgentToolCall): AgentToolResult | null {
  const { name, args } = call;

  // 1. Attach Regulatory Document
  if (name === 'attach_client_document') {
    const client = findClient(args.clientName);
    if (client && args.documentName) {
      const docType: 'pdf' | 'doc' | 'zip' = args.documentType || (args.documentName.endsWith('.zip') ? 'zip' : args.documentName.endsWith('.pdf') ? 'pdf' : 'doc');
      const asset: PinnedAsset = { id: `a-${Date.now()}`, name: args.documentName, type: docType, date: 'Uploaded Just now' };
      useClientDetailsStore.getState().addPinnedAsset(asset);
      useClientDetailsStore.getState().addActivityLog({
        user: 'Nova AI',
        action: 'attached regulatory document',
        target: args.documentName,
        time: 'Just now',
        type: 'comment'
      });
      toast.success(`Attached "${args.documentName}" to ${client.name}!`);
      return { toolName: name, description: `Attached document "${args.documentName}" to ${client.name}'s vault`, data: { clientId: client.id, asset } };
    }
  }

  // 2. Rate Client
  if (name === 'rate_client') {
    const client = findClient(args.clientName);
    if (client) {
      const comm = args.communicationRating !== undefined ? Number(args.communicationRating) : client.communicationRating;
      const speed = args.speedRating !== undefined ? Number(args.speedRating) : client.speedRating;
      const overall = (comm + speed) / 2;
      useClientStore.getState().updateClient(client.id, { communicationRating: comm, speedRating: speed, rating: overall });
      toast.success(`Updated ratings for ${client.name}!`);
      return { toolName: name, description: `Rated ${client.name}: Communication ${comm}/5, Speed ${speed}/5 (Overall: ${overall.toFixed(1)})`, data: { clientId: client.id, comm, speed, overall } };
    }
  }

  // 3. Assign Client Expert
  if (name === 'assign_client_expert') {
    const client = findClient(args.clientName);
    if (client && args.expertName) {
      const detailsState = useClientDetailsStore.getState();
      const currentAssigned = detailsState.experts[client.id]?.assigned || [];
      const action = args.action || 'assign';
      let updatedAssigned = [...currentAssigned];
      if (action === 'assign') {
        if (!currentAssigned.some(e => e.name.toLowerCase() === args.expertName.toLowerCase())) {
          updatedAssigned.push({ id: `exp-${Date.now()}`, name: args.expertName, email: `${args.expertName.toLowerCase().replace(/\s+/g, '.')}@flowstudio.design`, role: 'Consultant' });
        }
      } else {
        updatedAssigned = currentAssigned.filter(e => e.name.toLowerCase() !== args.expertName.toLowerCase());
      }
      detailsState.setExperts(client.id, updatedAssigned);
      toast.success(`Updated team experts for ${client.name}!`);
      return { toolName: name, description: `${action === 'assign' ? 'Assigned' : 'Removed'} ${args.expertName} for ${client.name}`, data: { clientId: client.id, assigned: updatedAssigned } };
    }
  }

  // 4. Open Client Details
  if (name === 'open_client_details') {
    const client = findClient(args.clientName);
    if (client && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('navigate-to-view', { detail: { view: 'clients' } }));
      window.dispatchEvent(new CustomEvent('open-client-details', { detail: { clientId: client.id, tab: args.tab || 'overview' } }));
      toast.info(`Opened ${client.name} (${args.tab || 'overview'})`);
      return { toolName: name, description: `Opened ${client.name}'s profile (${args.tab || 'overview'} tab)`, data: { clientId: client.id, tab: args.tab || 'overview' } };
    }
  }

  // 5. Scrape Leads
  if (name === 'scrape_leads') {
    const query = args.query || 'Fintech';
    const location = args.location || 'Remote';
    const count = Math.min(Number(args.count) || 3, 5);
    const leadStore = useLeadStore.getState();
    const sampleLeads = [
      { name: `${query} Ventures`, company: `${query} Group Ltd`, value: 12000 },
      { name: `Apex ${query} Labs`, company: `Apex Global`, value: 18500 },
      { name: `NextGen ${query}`, company: `NextGen Digital`, value: 9500 },
      { name: `${query} Dynamics`, company: `Dynamics Tech`, value: 15000 },
      { name: `Horizon ${query}`, company: `Horizon Studio`, value: 22000 }
    ];
    const added = [];
    for (let i = 0; i < count; i++) {
      const item = sampleLeads[i % sampleLeads.length];
      leadStore.addLead({
        name: item.name,
        company: item.company,
        email: `contact@${item.company.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: '+1 (555) 839-2049',
        status: 'New',
        location,
        estimated_value: item.value,
        source: `Lead Scraper: ${query}`,
        notes_summary: `Scraped lead for query "${query}" in ${location}. High affinity match.`,
        tags: ['Scraped Lead', query]
      });
      added.push(item);
    }
    toast.success(`Scraped ${count} leads for "${query}"!`);
    return { toolName: name, description: `Scraped ${count} prospective leads for "${query}" (${location})`, data: { query, location, count, leads: added } };
  }

  return null;
}
