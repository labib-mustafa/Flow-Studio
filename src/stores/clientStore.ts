import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage, onStoreExternalUpdate } from '../lib/fileStorage';
import { useTrashStore } from './trashStore';


export interface BrandColor {
  name: string;
  hex: string;
}

export interface BrandFont {
  style: string;
  fontName: string;
}

export interface ProjectHistoryItem {
  id: string;
  title: string;
  phase: string;
  statusType: 'ongoing' | 'upcoming' | 'completed';
  desc: string;
  dueText: string;
}

export interface ClientNote {
  id: string;
  clientId?: string;
  clientInitials?: string;
  type: 'Meeting' | 'Idea' | 'Feedback' | 'Urgent';
  content: string;
  authorInitials: string;
  timeText: string;
  date: string;
  tags: string[];
}

export interface Client {
  id: string;
  initials: string;
  name: string;
  company: string;
  role: string;
  status: 'Active' | 'Prospect' | 'Inactive';
  projectsCount: number;
  rating: number | null;
  email: string;
  billingEmail?: string;
  phone: string;
  location: string;
  socialProfiles?: { platform: string; url: string; }[];
  websites?: string[];
  stylePreferences?: { description: string; imageUrls: string[]; };
  totalVolume: number; // e.g., 124500
  outstandingAmount: number; // e.g., 2450
  outstandingPending: boolean;
  outstandingDueDays: number;
  communicationRating: number;
  speedRating: number;
  brandColors: BrandColor[];
  brandFonts: BrandFont[];
  projectHistory: ProjectHistoryItem[];
  avatarBg?: string; // e.g., 'primary', 'orange', 'purple', 'indigo', 'pink', 'cyan'
  avatarUrl?: string;
  tags?: string[];
}

interface ClientState {
  _hasHydrated: boolean;
  clients: Client[];
  notes: ClientNote[];
  selectedClientId: string;
  searchQuery: string;
  statusFilter: 'All' | 'Active' | 'Prospect' | 'Inactive';
  
  // Actions
  addClient: (client: Omit<Client, 'id' | 'initials'>) => string;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  selectClient: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: 'All' | 'Active' | 'Prospect' | 'Inactive') => void;
  
  // Note actions
  addNote: (note: Omit<ClientNote, 'id' | 'timeText' | 'date'>) => void;
  deleteNote: (id: string) => void;

  // Mock Invoice Action
  createInvoice: (clientId: string, amount: number, dueDays: number) => void;
}

const initialClients: Client[] = [];
const initialNotes: ClientNote[] = [];

export const useClientStore = create<ClientState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      clients: initialClients,
      notes: initialNotes,
      selectedClientId: '',
      searchQuery: '',
      statusFilter: 'All',

      addClient: (clientData) => {
        const nameStr = clientData.name || 'Unknown Client';
        const id = nameStr.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36);
        const initials = nameStr
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2);

        const newClient: Client = {
          ...clientData,
          id,
          initials,
          avatarBg: clientData.avatarBg || 'bg-slate-100 text-slate-700'
        };

        set((state) => ({
          clients: [...state.clients, newClient],
          selectedClientId: id // Automatically select the newly created client
        }));

        return id;
      },

      updateClient: (id, updates) => set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c))
      })),

      deleteClient: (id) => {
        const state = get();
        const clientToDelete = state.clients.find((c) => c.id === id);
        if (clientToDelete) {
          useTrashStore.getState().moveToTrash('client', clientToDelete.id, clientToDelete.name, clientToDelete);
        }
        
        set((state) => {
          const remaining = state.clients.filter((c) => c.id !== id);
          const nextSelected = remaining.length > 0 ? remaining[0].id : '';
          return {
            clients: remaining,
            selectedClientId: nextSelected
          };
        });
      },

      selectClient: (id) => set({ selectedClientId: id }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setStatusFilter: (filter) => set({ statusFilter: filter }),

      addNote: (noteData) => set((state) => {
        const id = `n-${Date.now()}`;
        const timestamp = 'Just now';
        const formattedDate = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        
        const newNote: ClientNote = {
          ...noteData,
          id,
          timeText: timestamp,
          date: formattedDate
        };

        return {
          notes: [newNote, ...state.notes]
        };
      }),

      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter((n) => n.id !== id)
      })),

      createInvoice: (clientId, amount, dueDays) => set((state) => ({
        clients: state.clients.map((c) => {
          if (c.id === clientId) {
            return {
              ...c,
              totalVolume: c.totalVolume + amount,
              outstandingAmount: c.outstandingAmount + amount,
              outstandingPending: true,
              outstandingDueDays: dueDays
            };
          }
          return c;
        })
      }))
    }),
    {
      name: 'client-storage-v1',
      storage: createFileStorage('clients'),
      onRehydrateStorage: () => () => { useClientStore.setState({ _hasHydrated: true }); },
      merge: (persistedState: any, currentState) => {
        const merged = { ...currentState, ...persistedState };
        if (merged.clients && Array.isArray(merged.clients)) {
          merged.clients = merged.clients.map((c: any) => ({
            brandColors: [],
            brandFonts: [],
            projectHistory: [],
            tags: [],
            ...c
          }));
        } else {
          merged.clients = currentState.clients;
        }
        if (merged.notes && Array.isArray(merged.notes)) {
          merged.notes = merged.notes.map((n: any) => ({
            tags: [],
            ...n
          }));
        } else {
          merged.notes = currentState.notes;
        }
        return merged;
      }
    }
  )
);


onStoreExternalUpdate('clients', () => {
  useClientStore.persist.rehydrate();
});
