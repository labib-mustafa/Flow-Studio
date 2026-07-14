import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage } from '../lib/fileStorage';
import { useClientStore } from './clientStore';
import { useTrashStore } from './trashStore';
import { useActivityStore } from './activityStore';


export interface LeadTimelineEvent {
  date: string;
  event: string;
}

export type LeadStatus = 'New' | 'Contacted' | 'Proposal Sent' | 'Archived';

export interface Lead {
  id: string;
  name: string;
  type?: string;
  company: string;
  contactPerson?: string;
  email: string | null;
  phone?: string;
  status: LeadStatus;
  socials?: string;
  location?: string;
  estimated_value: number;
  source: string;
  notes_summary: string;
  tags: string[];
  last_updated_at: string; // ISO
  timeline: LeadTimelineEvent[];
}

export interface ColumnLabels {
  name: string;
  type: string;
  email: string;
  phone: string;
  status: string;
  socials: string;
  location: string;
  company: string;
  estimated_value: string;
  source: string;
  tags: string;
}

export interface ColumnDefinition {
  id: string;
  title: string;
  width: number;
}

export interface LeadState {
  leads: Lead[];
  columns: ColumnDefinition[];
  columnLabels: ColumnLabels;
  searchQuery: string;
  statusFilter: string;
  selectedLeadIds: string[];
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  setSelectedLeadIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  toggleSelectLead: (id: string, multiSelectIds?: string[]) => void;
  selectAllLeads: (ids: string[]) => void;
  deselectAllLeads: () => void;
  addLead: (lead: Omit<Lead, 'id' | 'last_updated_at' | 'timeline'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  bulkUpdateLeads: (ids: string[], updates: Partial<Lead>) => void;
  bulkDeleteLeads: (ids: string[]) => void;
  bulkPromoteLeads: (ids: string[]) => void;
  reorderLeads: (activeId: string, overId: string) => void;
  importLeadsFromCSV: (csvData: string) => void;
  promoteLeadToClient: (id: string) => void;
  updateColumn: (id: string, updates: Partial<ColumnDefinition>) => void;
  updateColumnLabel: (field: keyof ColumnLabels, newLabel: string) => void;
  addColumn: (id: string, title: string, width?: number) => void;
  deleteColumn: (id: string) => void;
  reorderColumns: (activeId: string, overId: string) => void;
}

const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { id: 'name', title: 'Name', width: 240 },
  { id: 'type', title: 'Type', width: 140 },
  { id: 'email', title: 'Email', width: 180 },
  { id: 'phone', title: 'Phone', width: 150 },
  { id: 'status', title: 'Pipeline Stage', width: 130 },
  { id: 'socials', title: 'Socials', width: 150 },
  { id: 'location', title: 'Location', width: 160 },
  { id: 'actions', title: 'Actions', width: 180 },
];

const DEFAULT_COLUMN_LABELS: ColumnLabels = {
  name: 'Name',
  type: 'Type',
  email: 'Email',
  phone: 'Phone',
  status: 'Status',
  socials: 'Socials',
  location: 'Location',
  company: 'Company',
  estimated_value: 'Forecast Value',
  source: 'Origin Source',
  tags: 'Classification Tags'
};

const DUMMY_LEADS: Lead[] = [];

export const useLeadStore = create<LeadState>()(
  persist(
    (set, get) => ({
      leads: DUMMY_LEADS,
      columns: DEFAULT_COLUMNS,
      columnLabels: DEFAULT_COLUMN_LABELS,
      searchQuery: '',
      statusFilter: 'All',
      selectedLeadIds: [],
      setSearchQuery: (query) => set({ searchQuery: query }),
      setStatusFilter: (filter) => set({ statusFilter: filter }),
      setSelectedLeadIds: (ids) =>
        set((state) => ({
          selectedLeadIds: typeof ids === 'function' ? ids(state.selectedLeadIds || []) : ids,
        })),
      toggleSelectLead: (id, multiSelectIds) =>
        set((state) => {
          const prev = state.selectedLeadIds || [];
          if (multiSelectIds && multiSelectIds.length > 0) {
            const setIds = new Set([...prev, ...multiSelectIds]);
            return { selectedLeadIds: Array.from(setIds) };
          }
          if (prev.includes(id)) {
            return { selectedLeadIds: prev.filter((item) => item !== id) };
          } else {
            return { selectedLeadIds: [...prev, id] };
          }
        }),
      selectAllLeads: (ids) => set({ selectedLeadIds: ids }),
      deselectAllLeads: () => set({ selectedLeadIds: [] }),
      addLead: (leadData) => {
        const newLead: Lead = {
          id: `lead_${Math.random().toString(36).substring(2, 9)}`,
          ...leadData,
          last_updated_at: new Date().toISOString(),
          timeline: [{ date: new Date().toISOString(), event: 'Lead Created' }],
        };
        set((state) => ({ leads: [...(state.leads || []), newLead] }));
        useActivityStore.getState().logActivity('lead', `Added new lead: ${newLead.name}`, { category: 'lead_added', targetId: newLead.id, targetName: newLead.name });
      },
      updateLead: (id, updates) => {
        const oldLead = get().leads?.find((l) => l.id === id);
        set((state) => ({
          leads: (state.leads || []).map((l) =>
            l.id === id ? { ...l, ...updates, last_updated_at: new Date().toISOString() } : l
          ),
        }));
        if (oldLead && updates.status && oldLead.status !== updates.status) {
          useActivityStore.getState().logActivity('lead', `Updated lead status for ${oldLead.name} to ${updates.status}`, { category: 'lead_status_changed', targetId: id, targetName: oldLead.name, metadata: { oldStatus: oldLead.status, newStatus: updates.status } });
        }
      },
      deleteLead: (id) => {
        const state = get();
        const leadToDelete = (state.leads || []).find((l) => l.id === id);
        if (leadToDelete) {
          useTrashStore.getState().moveToTrash('lead', leadToDelete.id, leadToDelete.name, leadToDelete);
        }
        set((state) => ({
          leads: (state.leads || []).filter((l) => l.id !== id),
          selectedLeadIds: (state.selectedLeadIds || []).filter((item) => item !== id),
        }));
      },
      bulkUpdateLeads: (ids, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          leads: (state.leads || []).map((l) =>
            ids.includes(l.id) ? { ...l, ...updates, last_updated_at: now } : l
          ),
        }));
      },
      bulkDeleteLeads: (ids) => {
        const state = get();
        const leadsToDelete = (state.leads || []).filter((l) => ids.includes(l.id));
        leadsToDelete.forEach(lead => {
          useTrashStore.getState().moveToTrash('lead', lead.id, lead.name, lead);
        });
        set((state) => ({
          leads: (state.leads || []).filter((l) => !ids.includes(l.id)),
          selectedLeadIds: (state.selectedLeadIds || []).filter((id) => !ids.includes(id)),
        }));
      },
      bulkPromoteLeads: (ids) => {
        const state = get();
        ids.forEach((id) => state.promoteLeadToClient(id));
        set({ selectedLeadIds: [] });
      },
      reorderLeads: (activeId, overId) => {
        if (activeId === overId) return;
        set((state) => {
          const currentLeads = [...(state.leads || [])];
          const oldIndex = currentLeads.findIndex((l) => l.id === activeId);
          const newIndex = currentLeads.findIndex((l) => l.id === overId);
          if (oldIndex === -1 || newIndex === -1) return state;

          const [movedItem] = currentLeads.splice(oldIndex, 1);
          currentLeads.splice(newIndex, 0, movedItem);
          return { leads: currentLeads };
        });
      },
      importLeadsFromCSV: (csvData: string) => {
        // very basic CSV parsing for standard format: Name, Email, Company, Status
        const lines = csvData.split('\n').map((l) => l.trim()).filter((l) => l);
        if (lines.length <= 1) return; // Only header or empty
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const nameIdx = headers.findIndex(h => h.includes('name'));
        const emailIdx = headers.findIndex(h => h.includes('email'));
        const companyIdx = headers.findIndex(h => h.includes('company'));
        const statusIdx = headers.findIndex(h => h.includes('status') || h.includes('stage'));
        const sourceIdx = headers.findIndex(h => h.includes('source'));
        const evIdx = headers.findIndex(h => h.includes('value'));

        const newLeads: Lead[] = lines.slice(1).map((line) => {
          const vals = line.split(',').map(v => v.trim());
          const name = nameIdx >= 0 ? vals[nameIdx] : 'Unknown Lead';
          const email = emailIdx >= 0 ? vals[emailIdx] : '';
          const company = companyIdx >= 0 ? vals[companyIdx] : '';
          // Ensure valid status
          let statusStr = statusIdx >= 0 ? vals[statusIdx] : 'New';
          const validStatuses = ['New', 'Contacted', 'Proposal Sent', 'Archived'];
          if (!validStatuses.includes(statusStr)) statusStr = 'New';
          const source = sourceIdx >= 0 ? vals[sourceIdx] : 'Import';
          const estVal = evIdx >= 0 ? parseFloat(vals[evIdx]) || 0 : 0;

          return {
            id: `lead_${Math.random().toString(36).substring(2, 9)}`,
            name,
            email,
            company,
            status: statusStr as LeadStatus,
            source,
            estimated_value: estVal,
            notes_summary: 'Imported from CSV.',
            tags: ['import'],
            last_updated_at: new Date().toISOString(),
            timeline: [{ date: new Date().toISOString(), event: 'Lead Imported' }],
          };
        });

        set((state) => ({ leads: [...(state.leads || []), ...newLeads] }));
      },
      promoteLeadToClient: (id) => {
        const lead = (get().leads || []).find((l) => l.id === id);
        if (!lead) return;

        // promote logic mapping lead -> client
        useClientStore.getState().addClient({
          name: lead.name || 'Unknown Client',
          role: lead.type || 'Primary Contact',
          email: lead.email || '',
          phone: lead.phone || '',
          company: lead.company || '',
          location: lead.location || '',
          brandColors: [],
          brandFonts: [],
          projectHistory: [],
          status: 'Active',
          projectsCount: 0,
          outstandingDueDays: 0,
          outstandingPending: false,
          outstandingAmount: 0,
          totalVolume: 0,
          communicationRating: 5,
          speedRating: 5,
          rating: null,
          tags: lead.tags || [],
          ...(lead.socials ? {
            socialProfiles: lead.socials.split(',').map(s => {
              const url = s.trim();
              let platform = 'Website';
              if (url.includes('linkedin.com')) platform = 'LinkedIn';
              else if (url.includes('twitter.com') || url.includes('x.com')) platform = 'Twitter';
              else if (url.includes('instagram.com')) platform = 'Instagram';
              else if (url.includes('facebook.com')) platform = 'Facebook';
              return { platform, url };
            })
          } : {})
        });

        // archive lead
        get().updateLead(id, { status: 'Archived', notes_summary: (lead.notes_summary || '') + '\nPromoted to Client.' });
        useActivityStore.getState().logActivity('lead', `Promoted lead ${lead.name || 'Unknown'} to client`, { category: 'lead_promoted', targetId: id, targetName: lead.name || 'Unknown' });
      },
      updateColumn: (id, updates) => {
        set((state) => ({
          columns: state.columns.map((col) =>
            col.id === id ? { ...col, ...updates } : col
          ),
        }));
      },
      updateColumnLabel: (field, newLabel) => {
        set((state) => ({
          columnLabels: {
            ...state.columnLabels,
            [field]: newLabel
          }
        }));
      },
      addColumn: (id, title, width = 150) => {
        set((state) => {
          if (state.columns.some(col => col.id === id)) return {};
          // Insert before actions column
          const actionsCol = state.columns.find(c => c.id === 'actions') || { id: 'actions', title: 'Actions', width: 180 };
          const otherCols = state.columns.filter(c => c.id !== 'actions');
          return {
            columns: [...otherCols, { id, title, width }, actionsCol]
          };
        });
      },
      deleteColumn: (id) => {
        set((state) => ({
          columns: state.columns.filter(col => col.id !== id)
        }));
      },
      reorderColumns: (activeId, overId) => {
        set((state) => {
          if (activeId === 'actions' || overId === 'actions') return {};
          const activeIndex = state.columns.findIndex(c => c.id === activeId);
          const overIndex = state.columns.findIndex(c => c.id === overId);
          if (activeIndex === -1 || overIndex === -1) return {};

          const newColumns = [...state.columns];
          const [removed] = newColumns.splice(activeIndex, 1);
          newColumns.splice(overIndex, 0, removed);
          return { columns: newColumns };
        });
      },
    }),
    {
      name: 'flowstudio-lead-storage',
      storage: createFileStorage('leads'),
      merge: (persistedState: any, currentState) => {
        return {
          ...currentState,
          ...persistedState,
          selectedLeadIds: [],
          leads: (persistedState.leads && persistedState.leads.length > 0) ? persistedState.leads : DUMMY_LEADS,
          columns: (persistedState.columns && Array.isArray(persistedState.columns)) 
            ? persistedState.columns 
            : DEFAULT_COLUMNS,
          columnLabels: persistedState.columnLabels || DEFAULT_COLUMN_LABELS,
        };
      },
    }
  )
);
