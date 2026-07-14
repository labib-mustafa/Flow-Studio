import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage } from '../lib/fileStorage';
import { useTrashStore } from './trashStore';
import { useMailStore } from './mailStore';


export type TeamRole = string;

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  phone: string;
  bio: string;
  department: string;
  profilePic?: string;
  banner?: string;
  status: 'active' | 'inactive';
  joinDate: string;
  assignedProjects: string[];
  activeFocus?: string;
  skills?: string[];
  certificates?: string[];
}

export interface TeamInvite {
  id: string;
  email: string;
  role: TeamRole;
  sentDate: string;
}

interface TeamState {
  members: TeamMember[];
  invites: TeamInvite[];
  customRoles: string[];
  addMember: (member: Omit<TeamMember, 'id' | 'joinDate'>) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteMember: (id: string) => void;
  inviteMember: (email: string, role: TeamRole) => Promise<void>;
  revokeInvite: (id: string) => void;
  resendInvite: (id: string) => Promise<void>;
  addCustomRole: (role: string) => void;
  removeCustomRole: (role: string) => void;
}

const initialMembers: TeamMember[] = [];
const initialInvites: TeamInvite[] = [];

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      members: initialMembers,
      invites: initialInvites,
      customRoles: [],

      addMember: (memberData) => set((state) => {
        const newId = `m_${Date.now()}`;
        const newMember: TeamMember = {
          ...memberData,
          id: newId,
          joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        return { members: [newMember, ...state.members] };
      }),

      updateMember: (id, updates) => set((state) => ({
        members: state.members.map((m) => (m.id === id ? { ...m, ...updates } : m))
      })),

      deleteMember: (id) => set((state) => {
        const memberToDelete = state.members.find((m) => m.id === id);
        if (memberToDelete) {
          useTrashStore.getState().moveToTrash('team-member', memberToDelete.id, memberToDelete.name, memberToDelete);
        }
        return {
          members: state.members.filter((m) => m.id !== id)
        };
      }),

      inviteMember: async (email, role) => {
        const settings = useMailStore.getState().followUpSettings;
        if (settings.emailUser && settings.emailPass) {
          try {
            await fetch('/api/mail/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                host: settings.smtpHost,
                port: settings.smtpPort,
                secure: settings.smtpSecure,
                user: settings.emailUser,
                pass: settings.emailPass,
                to: email,
                subject: `You have been invited to join Flow Studio as a ${role}`,
                html: `Hi there,<br/><br/>You have been invited to join the Flow Studio team as a <b>${role}</b>.<br/><br/>Please click the link below to accept the invitation and set up your account.<br/><br/>Best,<br/>Flow Studio Team`
              })
            });
          } catch (e) {
            console.error('Failed to send invite email:', e);
          }
        } else {
          console.warn('SMTP settings not configured. Skipping email send.');
        }

        set((state) => {
          const newInvite: TeamInvite = {
            id: `inv_${Date.now()}`,
            email,
            role,
            sentDate: 'Just now'
          };
          return { invites: [newInvite, ...state.invites] };
        });
      },

      revokeInvite: (id) => set((state) => ({
        invites: state.invites.filter((inv) => inv.id !== id)
      })),

      resendInvite: async (id) => {
        const state = get();
        const invite = state.invites.find((inv) => inv.id === id);
        
        if (invite) {
          const settings = useMailStore.getState().followUpSettings;
          if (settings.emailUser && settings.emailPass) {
            try {
              await fetch('/api/mail/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  host: settings.smtpHost,
                  port: settings.smtpPort,
                  secure: settings.smtpSecure,
                  user: settings.emailUser,
                  pass: settings.emailPass,
                  to: invite.email,
                  subject: `Reminder: You have been invited to join Flow Studio as a ${invite.role}`,
                  html: `Hi there,<br/><br/>Just a friendly reminder that you have a pending invitation to join the Flow Studio team as a <b>${invite.role}</b>.<br/><br/>Please click the link below to accept the invitation and set up your account.<br/><br/>Best,<br/>Flow Studio Team`
                })
              });
            } catch (e) {
              console.error('Failed to resend invite email:', e);
            }
          }
        }

        set((state) => ({
          invites: state.invites.map((inv) => (inv.id === id ? { ...inv, sentDate: 'Just now' } : inv))
        }));
      },

      addCustomRole: (role) => set((state) => {
        if (state.customRoles.includes(role)) return {};
        return { customRoles: [...state.customRoles, role] };
      }),
      removeCustomRole: (role) => set((state) => ({
        customRoles: state.customRoles.filter((r) => r !== role)
      }))
    }),
    {
      name: 'team-storage-v3',
      storage: createFileStorage('team'),
      merge: (persistedState: any, currentState) => {
        const merged = { ...currentState, ...persistedState };
        if (merged.members && Array.isArray(merged.members)) {
          merged.members = merged.members.map((m: any) => ({
            assignedProjects: [],
            department: 'General',
            activeFocus: '🎯 Collaborating on core project initiatives',
            skills: m.role === 'Designer' ? ['UI/UX Design', 'Prototyping', 'Figma'] : m.role === 'Developer' ? ['React', 'TypeScript', 'Tailwind CSS'] : ['Project Management', 'Collaboration'],
            ...m
          }));
        } else {
          merged.members = currentState.members;
        }
        if (merged.invites && Array.isArray(merged.invites)) {
          merged.invites = merged.invites;
        } else {
          merged.invites = currentState.invites;
        }
        if (!merged.customRoles || !Array.isArray(merged.customRoles)) {
          merged.customRoles = [];
        }
        return merged;
      }
    }
  )
);
