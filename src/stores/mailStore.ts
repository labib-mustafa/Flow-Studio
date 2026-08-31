import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage, onStoreExternalUpdate } from '../lib/fileStorage';
import { useLeadStore } from './leadStore';
import { useAuthStore } from './authStore';
import { useActivityStore } from './activityStore';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface SentEmail {
  id: string;
  leadId: string;
  templateId?: string;
  subject: string;
  body: string;
  attachments?: Attachment[];
  sentAt: string; // ISO string
  sentBy?: string;
  sentToEmail?: string;
  leadName?: string;
}

export interface EmailReply {
  id: string;
  sentEmailId?: string;
  leadId?: string;
  fromEmail?: string;
  fromName?: string;
  subject: string;
  body: string;
  attachments?: Attachment[];
  receivedAt: string; // ISO string
}

export interface FollowUpStep {
  stepIndex: number;
  delayDays: number;
  subjectTemplate: string;
  bodyTemplate: string;
}

export interface EmailBatch {
  id: string;
  name: string;
  leadIds: string[];
  createdAt: string;
  senderType: 'personal' | 'team';
  steps: FollowUpStep[];
  status: 'active' | 'paused' | 'completed';
}

export interface QueueItem {
  id: string;
  batchId: string;
  leadId: string;
  stepIndex: number;
  scheduledAt: string;
  subject: string;
  body: string;
  status: 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'paused' | 'replied_stopped';
}

export interface FollowUpSettings {
  maxAttempts: number;
  followUpDelays: number[];
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  imapHost?: string;
  imapPort?: number;
  imapTls?: boolean;
  emailUser?: string;
  emailPass?: string;
  useTeamEmail?: boolean;
  syncAllEmails?: boolean;
  displayName?: string;
}
interface MailState {
  sentEmails: SentEmail[];
  replies: EmailReply[];
  followUpSettings: FollowUpSettings;
  sendBulkMail: (leadIds: string[], subject: string, body: string, templateId?: string, senderType?: 'personal' | 'team', cc?: string, attachments?: File[]) => Promise<{ success: boolean; errors?: string[] }>;
  updateFollowUpSettings: (settings: Partial<FollowUpSettings>) => void;
  syncReplies: (isAuto?: boolean) => Promise<void>;
  addSimulatedReply: (leadId: string, sentEmailId: string) => void;
  seedDummyData: () => void;
  batches: EmailBatch[];
  queue: QueueItem[];
  createBatch: (name: string, leadIds: string[], subject: string, body: string, steps: FollowUpStep[], senderType?: 'personal' | 'team', cc?: string, templateId?: string) => Promise<{ success: boolean; errors?: string[] }>;
  updateQueueItem: (id: string, updates: Partial<QueueItem>) => void;
  pauseBatch: (id: string) => void;
  resumeBatch: (id: string) => void;
  cancelQueueItem: (id: string) => void;
  sendQueueItemNow: (id: string) => Promise<{ success: boolean; error?: string }>;
  processQueue: () => Promise<void>;
  deleteBatch: (id: string) => void;
}

interface MailTemplateState {
  templates: EmailTemplate[];
  addTemplate: (template: Omit<EmailTemplate, 'id'>) => void;
  updateTemplate: (id: string, updates: Partial<EmailTemplate>) => void;
  deleteTemplate: (id: string) => void;
  seedDummyTemplates: () => void;
  fetchRemoteDrafts: (settings: FollowUpSettings, isAuto?: boolean) => Promise<void>;
}

export const useMailStore = create<MailState>()(
  persist(
    (set, get) => ({
      sentEmails: [],
      replies: [],
      batches: [],
      queue: [],
      followUpSettings: { maxAttempts: 3, followUpDelays: [3, 4, 5] },
      
      seedDummyData: () => {
        set({
          sentEmails: [
            {
              id: 'mail_dummy_1',
              leadId: 'lead_1', // Alice Freeman
              subject: 'Partnership Opportunity with Flow Studio',
              body: 'Hi Alice,\n\nI was really impressed with your latest project at TechVision. I think our new design system at Flow Studio could drastically cut down your UI development time.\n\nWould you be open to a brief 10-minute chat next week to discuss this?\n\nBest,\nFlow Team',
              sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'mail_dummy_2',
              leadId: 'lead_1',
              subject: 'Re: Partnership Opportunity with Flow Studio',
              body: 'Hi Alice,\n\nJust following up on my previous email. Let me know if you had time to review it.\n\nBest,\nFlow Team',
              sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'mail_dummy_3',
              leadId: 'lead_2', // Michael Chen
              subject: 'Checking in - Flow Studio UI Assets',
              body: 'Hi Michael,\n\nWe just released a new set of premium UI assets that I thought would fit perfectly with your current e-commerce initiative.\n\nLet me know if you want access to the beta.\n\nThanks!',
              sentAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            }
          ],
          replies: [
            {
              id: 'reply_dummy_1',
              sentEmailId: 'mail_dummy_2',
              leadId: 'lead_1',
              subject: 'Re: Partnership Opportunity with Flow Studio',
              body: 'Hi Flow Team,\n\nThanks for following up! Yes, I did take a look and it seems very interesting. I am available next Tuesday at 2 PM PST.\n\nAlice',
              receivedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'reply_dummy_2',
              sentEmailId: 'mail_dummy_3',
              leadId: 'lead_2',
              subject: 'Re: Checking in - Flow Studio UI Assets',
              body: 'Hey there,\n\nActually, this is perfect timing. We are looking to revamp our product pages next month. Can you send over a link to the beta assets so I can review them with my design lead?\n\nBest,\nMichael',
              receivedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'reply_dummy_3',
              sentEmailId: 'mail_dummy_2',
              leadId: 'lead_1',
              subject: 'Re: Partnership Opportunity with Flow Studio',
              body: 'Actually, just realized Tuesday won\'t work. Can we do Wednesday at 10 AM instead?\n\n- Alice',
              receivedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
            }
          ]
        });
      },
      
      sendBulkMail: async (leadIds, subject, body, templateId, senderType = 'personal', cc, attachments) => {
        const result: { success: boolean; errors: string[] } = { success: false, errors: [] };
        const settings = get().followUpSettings;
        const authState = useAuthStore.getState();
        
        const isTeam = senderType === 'team' && settings.useTeamEmail;
        const emailUser = (isTeam ? settings.emailUser : authState.user?.email) || settings.emailUser;
        const accessToken = isTeam ? null : authState.accessToken;
        const emailPass = settings.emailPass;
        const fromName = (isTeam ? null : authState.user?.displayName) || settings.displayName || "Flow Studio";

        if (!emailUser || (!emailPass && !accessToken)) {
          result.errors.push("Email credentials or Google Login not configured. Please set them up first.");
          return result;
        }

        const { leads } = useLeadStore.getState();
        const now = new Date().toISOString();
        const newEmails: SentEmail[] = [];

        const parsedAttachments = attachments?.map(file => ({
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type,
          size: file.size
        })) || [];

        for (const leadId of leadIds) {
          const lead = leads.find(l => l.id === leadId);
          if (!lead || !lead.email) continue;

          // Replace dynamic variables
          let parsedBody = body;
          parsedBody = parsedBody.replace(/{{name}}/g, lead.name.split(' ')[0] || 'there');
          parsedBody = parsedBody.replace(/{{company}}/g, lead.company || 'your company');

          let parsedSubject = subject;
          parsedSubject = parsedSubject.replace(/{{name}}/g, lead.name.split(' ')[0] || 'there');
          parsedSubject = parsedSubject.replace(/{{company}}/g, lead.company || 'your company');

          try {
            const res = await fetch('/api/mail/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                host: settings.smtpHost,
                port: settings.smtpPort,
                secure: settings.smtpSecure,
                user: emailUser,
                pass: emailPass,
                accessToken: accessToken,
                fromName: fromName,
                to: lead.email,
                cc: cc || undefined,
                subject: parsedSubject,
                text: parsedBody,
                html: parsedBody.replace(/\n/g, '<br/>')
              })
            });
            const data = await res.json();
            if (data.success) {
              newEmails.push({
                id: data.messageId || `mail_${Math.random().toString(36).substring(2, 9)}`,
                leadId,
                templateId,
                subject: parsedSubject,
                body: parsedBody,
                attachments: parsedAttachments,
                sentAt: now,
                sentBy: emailUser,
                sentToEmail: lead.email,
                leadName: lead.name
              });
              // Log activity
              useActivityStore.getState().logActivity(
                'email', 
                `Sent email to ${lead.name}`,
                { 
                  category: 'email_sent', 
                  actorName: fromName || emailUser, 
                  targetId: leadId, 
                  targetName: lead.name,
                  metadata: { subject: parsedSubject, sentToEmail: lead.email }
                }
              );
              // Automatically update lead status
              useLeadStore.getState().updateLead(leadId, { status: 'Proposal Sent' });
            } else {
              console.error('Failed to send to', '[REDACTED]', data.error);
              result.errors.push(`Failed to send to ${lead.email}: ${data.error}`);
            }
          } catch (e: any) {
            console.error('Failed to send email to', '[REDACTED]', e);
            result.errors.push(`Failed to send to ${lead.email}: ${e.message || 'Network error'}`);
          }
        }
        
        if (newEmails.length > 0) {
          set((state) => ({
            sentEmails: [...state.sentEmails, ...newEmails]
          }));
        }
        
        result.success = result.errors.length === 0;
        return result;
      },
      
      updateFollowUpSettings: (settings) => {
        set((state) => ({
          followUpSettings: { ...state.followUpSettings, ...settings }
        }));
      },

      createBatch: async (name, leadIds, subject, body, steps, senderType = 'personal', cc, templateId) => {
        const state = get();
        
        const result = await state.sendBulkMail(leadIds, subject, body, templateId, senderType, cc);
        if (!result.success) {
          return { success: false, errors: result.errors };
        }

        const batchId = `batch_${Math.random().toString(36).substring(2, 9)}`;
        const newBatch: EmailBatch = {
          id: batchId,
          name: name || `Batch Outreach - ${new Date().toLocaleDateString()}`,
          leadIds,
          createdAt: new Date().toISOString(),
          senderType,
          steps,
          status: 'active'
        };

        const initialStep = steps.find(s => s.stepIndex === 1);
        const newQueueItems: QueueItem[] = [];

        if (initialStep) {
          const delayMs = initialStep.delayDays * 24 * 60 * 60 * 1000;
          const scheduledDate = new Date(Date.now() + delayMs);

          leadIds.forEach(leadId => {
            newQueueItems.push({
              id: `q_${Math.random().toString(36).substring(2, 9)}`,
              batchId,
              leadId,
              stepIndex: 1,
              scheduledAt: scheduledDate.toISOString(),
              subject: initialStep.subjectTemplate || `Re: ${subject}`,
              body: initialStep.bodyTemplate,
              status: 'scheduled'
            });
          });
        }

        set(state => ({
          batches: [...state.batches, newBatch],
          queue: [...state.queue, ...newQueueItems]
        }));

        return { success: true };
      },

      updateQueueItem: (id, updates) => {
        set(state => ({
          queue: state.queue.map(q => q.id === id ? { ...q, ...updates } : q)
        }));
      },

      pauseBatch: (id) => {
        set(state => ({
          batches: state.batches.map(b => b.id === id ? { ...b, status: 'paused' } : b),
          queue: state.queue.map(q => q.batchId === id && q.status === 'scheduled' ? { ...q, status: 'paused' } : q)
        }));
      },

      resumeBatch: (id) => {
        set(state => ({
          batches: state.batches.map(b => b.id === id ? { ...b, status: 'active' } : b),
          queue: state.queue.map(q => q.batchId === id && q.status === 'paused' ? { ...q, status: 'scheduled' } : q)
        }));
      },

      cancelQueueItem: (id) => {
        set(state => ({
          queue: state.queue.map(q => q.id === id ? { ...q, status: 'cancelled' } : q)
        }));
      },

      deleteBatch: (id) => {
        set(state => ({
          batches: state.batches.filter(b => b.id !== id),
          queue: state.queue.filter(q => q.batchId !== id)
        }));
      },

      sendQueueItemNow: async (id) => {
        const state = get();
        const item = state.queue.find(q => q.id === id);
        if (!item || (item.status !== 'scheduled' && item.status !== 'paused')) {
          return { success: false, error: 'Queue item not found or not in sendable status.' };
        }

        const authState = useAuthStore.getState();
        const settings = state.followUpSettings;

        const { leads } = useLeadStore.getState();
        const lead = leads.find(l => l.id === item.leadId);
        if (!lead || !lead.email) {
          return { success: false, error: 'Lead not found or email address missing.' };
        }

        const batch = state.batches.find(b => b.id === item.batchId);
        if (!batch) {
          return { success: false, error: 'Batch not found.' };
        }

        let parsedBody = item.body;
        parsedBody = parsedBody.replace(/{{name}}/g, lead.name.split(' ')[0] || 'there');
        parsedBody = parsedBody.replace(/{{company}}/g, lead.company || 'your company');

        let parsedSubject = item.subject;
        parsedSubject = parsedSubject.replace(/{{name}}/g, lead.name.split(' ')[0] || 'there');
        parsedSubject = parsedSubject.replace(/{{company}}/g, lead.company || 'your company');

        const isTeam = batch.senderType === 'team' && settings.useTeamEmail;
        const emailUser = (isTeam ? settings.emailUser : authState.user?.email) || settings.emailUser;
        const accessToken = isTeam ? null : authState.accessToken;
        const emailPass = settings.emailPass;
        const fromName = (isTeam ? null : authState.user?.displayName) || settings.displayName || "Flow Studio";

        if (!emailUser || (!emailPass && !accessToken)) {
          return { success: false, error: 'Email credentials not configured.' };
        }

        try {
          const res = await fetch('/api/mail/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              host: settings.smtpHost,
              port: settings.smtpPort,
              secure: settings.smtpSecure,
              user: emailUser,
              pass: emailPass,
              accessToken: accessToken,
              fromName: fromName,
              to: lead.email,
              subject: parsedSubject,
              text: parsedBody,
              html: parsedBody.replace(/\n/g, '<br/>')
            })
          });
          const data = await res.json();
          if (data.success) {
            const updatedQueue = state.queue.map(q => 
              q.id === id ? { ...q, status: 'sent' as const } : q
            );

            const newEmail: SentEmail = {
              id: data.messageId || `mail_${Math.random().toString(36).substring(2, 9)}`,
              leadId: lead.id,
              subject: parsedSubject,
              body: parsedBody,
              sentAt: new Date().toISOString(),
              sentBy: emailUser,
              sentToEmail: lead.email,
              leadName: lead.name
            };

            useActivityStore.getState().logActivity(
              'email', 
              `Sent follow-up email to ${lead.name}`,
              { 
                category: 'email_sent', 
                actorName: fromName || emailUser, 
                targetId: lead.id, 
                targetName: lead.name,
                metadata: { subject: parsedSubject, sentToEmail: lead.email, step: item.stepIndex }
              }
            );

            const nextStep = batch.steps.find(s => s.stepIndex === item.stepIndex + 1);
            if (nextStep) {
              const scheduledDate = new Date(Date.now() + nextStep.delayDays * 24 * 60 * 60 * 1000);
              
              updatedQueue.push({
                id: `q_${Math.random().toString(36).substring(2, 9)}`,
                batchId: batch.id,
                leadId: lead.id,
                stepIndex: nextStep.stepIndex,
                scheduledAt: scheduledDate.toISOString(),
                subject: nextStep.subjectTemplate || `Re: ${parsedSubject}`,
                body: nextStep.bodyTemplate,
                status: 'scheduled'
              });
            }

            set({
              queue: updatedQueue,
              sentEmails: [...state.sentEmails, newEmail]
            });

            return { success: true };
          } else {
            return { success: false, error: data.error || 'Failed to send.' };
          }
        } catch (e: any) {
          return { success: false, error: e.message || 'Network error.' };
        }
      },

      processQueue: async () => {
        const state = get();
        const now = new Date();
        const dueItems = state.queue.filter(item => 
          item.status === 'scheduled' && 
          new Date(item.scheduledAt) <= now
        );

        if (dueItems.length === 0) return;

        const authState = useAuthStore.getState();
        const settings = state.followUpSettings;

        const { leads } = useLeadStore.getState();
        const updatedQueue = [...state.queue];
        const newEmails: SentEmail[] = [];

        for (const item of dueItems) {
          const lead = leads.find(l => l.id === item.leadId);
          if (!lead || !lead.email) {
            const idx = updatedQueue.findIndex(q => q.id === item.id);
            if (idx !== -1) updatedQueue[idx] = { ...item, status: 'cancelled' };
            continue;
          }

          const batch = state.batches.find(b => b.id === item.batchId);
          if (!batch || batch.status === 'paused') {
            continue;
          }

          const leadReplies = state.replies.filter(r => r.leadId === lead.id && new Date(r.receivedAt) > new Date(batch.createdAt));
          if (leadReplies.length > 0) {
            const idx = updatedQueue.findIndex(q => q.id === item.id);
            if (idx !== -1) updatedQueue[idx] = { ...item, status: 'replied_stopped' };
            continue;
          }

          let parsedBody = item.body;
          parsedBody = parsedBody.replace(/{{name}}/g, lead.name.split(' ')[0] || 'there');
          parsedBody = parsedBody.replace(/{{company}}/g, lead.company || 'your company');

          let parsedSubject = item.subject;
          parsedSubject = parsedSubject.replace(/{{name}}/g, lead.name.split(' ')[0] || 'there');
          parsedSubject = parsedSubject.replace(/{{company}}/g, lead.company || 'your company');

          const isTeam = batch.senderType === 'team' && settings.useTeamEmail;
          const emailUser = (isTeam ? settings.emailUser : authState.user?.email) || settings.emailUser;
          const accessToken = isTeam ? null : authState.accessToken;
          const emailPass = settings.emailPass;
          const fromName = (isTeam ? null : authState.user?.displayName) || settings.displayName || "Flow Studio";

          if (!emailUser || (!emailPass && !accessToken)) {
            continue;
          }

          try {
            const res = await fetch('/api/mail/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                host: settings.smtpHost,
                port: settings.smtpPort,
                secure: settings.smtpSecure,
                user: emailUser,
                pass: emailPass,
                accessToken: accessToken,
                fromName: fromName,
                to: lead.email,
                subject: parsedSubject,
                text: parsedBody,
                html: parsedBody.replace(/\n/g, '<br/>')
              })
            });
            const data = await res.json();
            if (data.success) {
              const qIdx = updatedQueue.findIndex(q => q.id === item.id);
              if (qIdx !== -1) {
                updatedQueue[qIdx] = { ...item, status: 'sent' };
              }

              newEmails.push({
                id: data.messageId || `mail_${Math.random().toString(36).substring(2, 9)}`,
                leadId: lead.id,
                subject: parsedSubject,
                body: parsedBody,
                sentAt: new Date().toISOString(),
                sentBy: emailUser,
                sentToEmail: lead.email,
                leadName: lead.name
              });

              useActivityStore.getState().logActivity(
                'email', 
                `Sent follow-up email to ${lead.name}`,
                { 
                  category: 'email_sent', 
                  actorName: fromName || emailUser, 
                  targetId: lead.id, 
                  targetName: lead.name,
                  metadata: { subject: parsedSubject, sentToEmail: lead.email, step: item.stepIndex }
                }
              );

              const nextStep = batch.steps.find(s => s.stepIndex === item.stepIndex + 1);
              if (nextStep) {
                const scheduledDate = new Date(Date.now() + nextStep.delayDays * 24 * 60 * 60 * 1000);
                
                updatedQueue.push({
                  id: `q_${Math.random().toString(36).substring(2, 9)}`,
                  batchId: batch.id,
                  leadId: lead.id,
                  stepIndex: nextStep.stepIndex,
                  scheduledAt: scheduledDate.toISOString(),
                  subject: nextStep.subjectTemplate || `Re: ${parsedSubject}`,
                  body: nextStep.bodyTemplate,
                  status: 'scheduled'
                });
              }
            }
          } catch (e) {
            console.error('Failed to send email in queue', e);
          }
        }

        set({
          queue: updatedQueue,
          sentEmails: [...state.sentEmails, ...newEmails]
        });
      },

      syncReplies: async (isAuto = false) => {
        const state = get();
        const settings = state.followUpSettings;
        const authState = useAuthStore.getState();
        
        const emailUser = (settings.useTeamEmail ? null : authState.user?.email) || settings.emailUser;
        const accessToken = settings.useTeamEmail ? null : authState.accessToken;
        const emailPass = settings.emailPass;

        if (!emailUser || (!emailPass && !accessToken)) return;

        try {
          const res = await fetch('/api/mail/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              host: settings.imapHost,
              port: settings.imapPort,
              tls: settings.imapTls,
              user: emailUser,
              pass: emailPass,
              accessToken: accessToken
            })
          });
          const data = await res.json();
          if (data.success && data.messages.length > 0) {
            const { leads } = useLeadStore.getState();
            const newReplies: EmailReply[] = [];
            
            data.messages.forEach((msg: any) => {
              const lead = leads.find(l => l.email === msg.from);
              if (lead) {
                // Find latest sent email to this lead
                const sentEmail = state.sentEmails.filter(e => e.leadId === lead.id).pop();
                if (sentEmail || settings.syncAllEmails) {
                  newReplies.push({
                    id: msg.uid || `reply_${Math.random().toString(36).substring(2, 9)}`,
                    sentEmailId: sentEmail?.id,
                    leadId: lead.id,
                    fromEmail: msg.from,
                    subject: msg.subject,
                    body: msg.body,
                    receivedAt: msg.date || new Date().toISOString()
                  });
                  // Automatically update lead status to Contacted when they reply
                  useLeadStore.getState().updateLead(lead.id, { status: 'Contacted' });
                }
              } else if (settings.syncAllEmails) {
                // Unassigned email from an unknown sender
                newReplies.push({
                  id: msg.uid || `reply_${Math.random().toString(36).substring(2, 9)}`,
                  fromEmail: msg.from,
                  subject: msg.subject,
                  body: msg.body,
                  receivedAt: msg.date || new Date().toISOString()
                });
              }
            });

            if (newReplies.length > 0) {
              set((state) => ({
                replies: [...state.replies, ...newReplies]
              }));
              if (!isAuto) alert(`Synced ${newReplies.length} new replies.`);
            } else {
              if (!isAuto) alert('Inbox synced. No new replies from known leads.');
            }
          } else {
            if (!isAuto) alert('Inbox synced. No new unread messages.');
          }
        } catch (e) {
          console.error('Failed to sync replies', e);
          if (!isAuto) alert('Failed to sync replies. Check console for details.');
        }
      },
      
      addSimulatedReply: (leadId, sentEmailId) => {
        const now = new Date().toISOString();
        const newReply: EmailReply = {
          id: `reply_${Math.random().toString(36).substring(2, 9)}`,
          sentEmailId,
          leadId,
          subject: 'Re: Following up',
          body: 'Thanks for reaching out! Let us schedule a quick call to discuss.',
          receivedAt: now
        };
        
        // Automatically update lead status to Contacted when they reply
        useLeadStore.getState().updateLead(leadId, { status: 'Contacted' });

        set((state) => ({
          replies: [...state.replies, newReply]
        }));
      }
    }),
    {
      name: 'flowstudio-mail-storage',
      storage: createFileStorage('mail'),
      partialize: (state) => ({
        ...state,
        followUpSettings: {
          ...state.followUpSettings,
          emailPass: undefined,
        },
      }),
      merge: (persistedState: any, currentState) => {
        return {
          ...currentState,
          ...persistedState,
          batches: persistedState.batches || [],
          queue: persistedState.queue || [],
          followUpSettings: persistedState.followUpSettings || { maxAttempts: 3, followUpDelays: [3, 4, 5], syncAllEmails: false }
        };
      }
    }
  )
);

export const useMailTemplateStore = create<MailTemplateState>()(
  persist(
    (set, get) => ({
      templates: [],
      
      seedDummyTemplates: () => {
        set({
          templates: [
            {
              id: 'tpl_dummy_1',
              name: 'Cold Outreach (Standard)',
              subject: 'Streamlining UI for {{company}}',
              body: 'Hi {{name}},\n\nI noticed the amazing work you are doing over at {{company}}.\n\nAt Flow Studio, we help product teams move 3x faster by providing premium, plug-and-play UI systems. I thought it might be highly relevant to your current roadmap.\n\nAre you open to a quick 5-minute chat this week to see if there is a mutual fit?\n\nBest regards,\nFlow Team'
            },
            {
              id: 'tpl_dummy_2',
              name: 'Gentle Follow-Up',
              subject: 'Re: Streamlining UI for {{company}}',
              body: 'Hi {{name}},\n\nJust floating this to the top of your inbox. I know things get busy!\n\nLet me know if you had a moment to review my previous note.\n\nThanks,'
            }
          ]
        });
      },
      
      addTemplate: (templateData) => {
        const newTemplate: EmailTemplate = {
          id: `tpl_${Math.random().toString(36).substring(2, 9)}`,
          ...templateData
        };
        set((state) => ({ templates: [...state.templates, newTemplate] }));
      },
      
      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
      },
      
      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter(t => t.id !== id)
        }));
      },
      
      fetchRemoteDrafts: async (settings, isAuto = false) => {
        const authState = useAuthStore.getState();
        const emailUser = (settings.useTeamEmail ? null : authState.user?.email) || settings.emailUser;
        const accessToken = settings.useTeamEmail ? null : authState.accessToken;
        const emailPass = settings.emailPass;

        if (!emailUser || (!emailPass && !accessToken)) {
          if (!isAuto) alert('Email credentials or Google Login not configured.');
          return;
        }

        try {
          const res = await fetch('/api/mail/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              host: settings.imapHost,
              port: settings.imapPort,
              tls: settings.imapTls,
              user: emailUser,
              pass: emailPass,
              accessToken: accessToken
            })
          });
          const data = await res.json();
          if (data.success && data.drafts) {
            const newTemplates: EmailTemplate[] = data.drafts.map((d: any) => ({
              id: d.uid || `gmail_draft_${Math.random().toString(36).substring(2, 9)}`,
              name: `Gmail Draft: ${d.subject || 'Untitled'}`,
              subject: d.subject || 'No Subject',
              body: d.body || ''
            }));
            
            if (newTemplates.length > 0) {
              set((state) => {
                // simple deduplication based on subject/body
                const existing = new Set(state.templates.map(t => t.subject + t.body));
                const uniqueNew = newTemplates.filter(t => !existing.has(t.subject + t.body));
                return { templates: [...uniqueNew, ...state.templates] };
              });
              if (!isAuto) alert(`Successfully synced ${newTemplates.length} drafts from Gmail.`);
            } else {
              if (!isAuto) alert('No drafts found in Gmail.');
            }
          } else {
            if (!isAuto) alert('Failed to fetch drafts: ' + data.error);
          }
        } catch (e) {
          console.error('Error fetching remote drafts:', e);
          if (!isAuto) alert('Error fetching drafts from server.');
        }
      }
    }),
    {
      name: 'flowstudio-mail-template-storage',
      storage: createFileStorage('mailTemplates'),
      merge: (persistedState: any, currentState) => {
        return {
          ...currentState,
          ...persistedState
        };
      }
    }
  )
);


onStoreExternalUpdate('mail', () => {
  useMailStore.persist.rehydrate();
});
