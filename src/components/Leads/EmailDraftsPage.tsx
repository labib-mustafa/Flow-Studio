import React, { useState } from 'react';
import { useMailTemplateStore, useMailStore } from '../../stores/mailStore';
import { confirm } from '../../stores/confirmStore';
import { toast } from '../../stores/toastStore';
import { useLeadStore } from '../../stores/leadStore';
import { Plus, Edit2, Trash2, Save, ArrowLeft, HelpCircle, Mail, Clock, Reply, Square, Star, CornerUpLeft, ChevronDown, Type, Paperclip, Link2, Smile, Image as ImageIcon, Lock, PenTool, MoreVertical, X, Wand2, Triangle, Maximize2, CloudDownload, Settings } from 'lucide-react';
import { PillTab } from '../GlobalComponents/PillTab';

interface EmailDraftsPageProps {
  onBack: () => void;
}

export const EmailDraftsPage: React.FC<EmailDraftsPageProps> = ({ onBack }) => {
  const { templates, addTemplate, updateTemplate, deleteTemplate, fetchRemoteDrafts } = useMailTemplateStore();
  const { 
    followUpSettings, 
    updateFollowUpSettings, 
    sentEmails, 
    replies, 
    addSimulatedReply, 
    sendBulkMail, 
    syncReplies, 
    batches,
    queue,
    updateQueueItem,
    pauseBatch,
    resumeBatch,
    cancelQueueItem,
    sendQueueItemNow,
    processQueue,
    deleteBatch
  } = useMailStore();
  const { leads, updateLead } = useLeadStore();

  const [activeTab, setActiveTab] = useState<'templates' | 'outbox' | 'batches' | 'queue' | 'settings'>('templates');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedThreadLeadId, setSelectedThreadLeadId] = useState<string | null>(null);
  const [outboxView, setOutboxView] = useState<'list' | 'reading'>('list');
  
  const [formData, setFormData] = useState({ name: '', subject: '', body: '' });

  const [settingsForm, setSettingsForm] = useState({
    maxAttempts: followUpSettings.maxAttempts || 3,
    followUpDelays: followUpSettings.followUpDelays || [3, 4, 5],
    smtpHost: followUpSettings.smtpHost || 'smtp.gmail.com',
    smtpPort: followUpSettings.smtpPort || 465,
    smtpSecure: followUpSettings.smtpSecure !== undefined ? followUpSettings.smtpSecure : true,
    imapHost: followUpSettings.imapHost || 'imap.gmail.com',
    imapPort: followUpSettings.imapPort || 993,
    imapTls: followUpSettings.imapTls !== undefined ? followUpSettings.imapTls : true,
    emailUser: followUpSettings.emailUser || '',
    emailPass: followUpSettings.emailPass || '',
    useTeamEmail: followUpSettings.useTeamEmail || false,
    syncAllEmails: followUpSettings.syncAllEmails || false
  });

  const [editingQueueItem, setEditingQueueItem] = useState<any | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [showConnectionSettings, setShowConnectionSettings] = useState(false);



  // Auto-sync loop every 60 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      syncReplies(true);
      fetchRemoteDrafts(followUpSettings, true);
      processQueue();
    }, 60000);
    return () => clearInterval(interval);
  }, [syncReplies, fetchRemoteDrafts, followUpSettings, processQueue]);

  const handleEdit = (template: any) => {
    setEditingTemplateId(template.id);
    setFormData({ name: template.name, subject: template.subject, body: template.body });
  };

  const handleCreateNew = () => {
    setEditingTemplateId('new');
    setFormData({ name: 'New Template', subject: '', body: '' });
  };

  const handleSave = () => {
    if (editingTemplateId === 'new') {
      addTemplate(formData);
    } else if (editingTemplateId) {
      updateTemplate(editingTemplateId, formData);
    }
    setEditingTemplateId(null);
  };

  const handleSaveSettings = () => {
    updateFollowUpSettings(settingsForm);
    toast.success('Settings Saved', 'Follow-up engine settings saved successfully.');
  };

  const handleSaveQueueItemEdit = () => {
    if (editingQueueItem) {
      updateQueueItem(editingQueueItem.id, { subject: editSubject, body: editBody });
      setEditingQueueItem(null);
    }
  };

  const handleRunFollowUpEngine = () => {
    let followUpCount = 0;
    let lostCount = 0;

    const leadsEmailed = Array.from(new Set(sentEmails.map(e => e.leadId)));

    leadsEmailed.forEach(leadId => {
      const leadEmails = sentEmails.filter(e => e.leadId === leadId).sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
      const leadReplies = replies.filter(r => r.leadId === leadId);

      if (leadReplies.length === 0) {
        if (leadEmails.length >= followUpSettings.maxAttempts) {
          updateLead(leadId, { status: 'Archived', notes_summary: 'Automated follow-up: Marked as lost (no reply)' });
          lostCount++;
        } else {
          const attemptIndex = leadEmails.length - 1;
          const delayDays = followUpSettings.followUpDelays[attemptIndex] || 3;
          const lastEmailDate = new Date(leadEmails[leadEmails.length - 1].sentAt);
          const daysSinceLastEmail = (new Date().getTime() - lastEmailDate.getTime()) / (1000 * 3600 * 24);

          if (daysSinceLastEmail >= delayDays) {
            sendBulkMail([leadId], `Re: ${leadEmails[0].subject}`, `Just following up on my previous email. Let me know if you had time to review it.`, undefined);
            followUpCount++;
          }
        }
      }
    });

    toast.info('Engine Complete', `Sent ${followUpCount} automated follow-ups. Marked ${lostCount} leads as Lost.`);
  };

  const threads = React.useMemo(() => {
    const threadMap = new Map<string, { lead: any, emails: any[], replies: any[], latestActivity: number }>();
    sentEmails.forEach(email => {
      if (!email.leadId) return;
      if (!threadMap.has(email.leadId)) {
        const lead = leads.find(l => l.id === email.leadId);
        threadMap.set(email.leadId, { lead, emails: [], replies: [], latestActivity: 0 });
      }
      threadMap.get(email.leadId)!.emails.push(email);
    });
    
    replies.forEach(reply => {
      const threadKey = reply.leadId || reply.fromEmail;
      if (!threadKey) return;

      if (!threadMap.has(threadKey)) {
        const lead = leads.find(l => l.id === reply.leadId) || { id: threadKey, name: reply.fromName || reply.fromEmail || 'Unknown Sender', email: reply.fromEmail || 'unknown@domain.com' };
        threadMap.set(threadKey, { lead, emails: [], replies: [], latestActivity: 0 });
      }
      threadMap.get(threadKey)!.replies.push(reply);
    });

    Array.from(threadMap.values()).forEach(thread => {
       const latestEmail = thread.emails.length > 0 ? Math.max(...thread.emails.map(e => new Date(e.sentAt).getTime())) : 0;
       const latestReply = thread.replies.length > 0 ? Math.max(...thread.replies.map(r => new Date(r.receivedAt).getTime())) : 0;
       thread.latestActivity = Math.max(latestEmail, latestReply);
    });

    return Array.from(threadMap.values()).sort((a, b) => b.latestActivity - a.latestActivity);
  }, [sentEmails, replies, leads]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f5f5f7] overflow-hidden relative">
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between gap-4 shrink-0 relative z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center justify-center size-8 rounded-[11px] bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm hover:shadow active:scale-95 transition-all group shrink-0 cursor-pointer"
            title="Back to Leads"
          >
            <svg 
              viewBox="416.66 432.14 158.84 158.84" 
              className="size-8"
            >
              <polyline 
                fill="none"
                stroke="#fff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="12"
                points="507.33 540.98 478.51 512.16 507.33 483.34"
                className="group-hover:-translate-x-[6px] transition-transform duration-200"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Email System</h2>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative bg-white">
        <div className={`flex-1 flex flex-col ${activeTab === 'outbox' ? 'p-0 overflow-hidden' : 'px-8 py-6 overflow-y-auto custom-scrollbar h-full'}`}>
          
          <div className={`mb-6 flex flex-wrap items-center gap-2 shrink-0 ${activeTab === 'outbox' ? 'px-8 py-6 pb-0' : ''}`}>
            <PillTab 
              label="Email Templates" 
              isActive={activeTab === 'templates'} 
              onClick={() => { setActiveTab('templates'); setEditingTemplateId(null); }} 
            />
            <PillTab 
              label="Inbox & Threads" 
              isActive={activeTab === 'outbox'} 
              onClick={() => { setActiveTab('outbox'); setEditingTemplateId(null); }} 
            />
            <PillTab 
              label="Active Campaigns" 
              isActive={activeTab === 'batches'} 
              onClick={() => { setActiveTab('batches'); setEditingTemplateId(null); }} 
            />
            <PillTab 
              label="Scheduled Outbox" 
              isActive={activeTab === 'queue'} 
              onClick={() => { setActiveTab('queue'); setEditingTemplateId(null); }} 
            />
            <PillTab 
              label="Follow-up & Settings" 
              isActive={activeTab === 'settings'} 
              onClick={() => { setActiveTab('settings'); setEditingTemplateId(null); }} 
            />
          </div>

          <div className={`flex-1 flex flex-col relative ${activeTab === 'outbox' ? 'overflow-hidden w-full' : 'h-fit max-w-4xl'}`}>
        {activeTab === 'templates' && (
          <>
            {editingTemplateId ? (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{editingTemplateId === 'new' ? 'Create Template' : 'Edit Template'}</h3>
                  <button 
                    onClick={() => setEditingTemplateId(null)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Template Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium"
                    placeholder="e.g. Initial Outreach"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Subject Line</label>
                  <input 
                    type="text" 
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium"
                    placeholder="e.g. Discussing {{company}}"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Use {'{{name}}'}, {'{{company}}'} for dynamic variables.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Email Body</label>
                  <textarea 
                    value={formData.body}
                    onChange={e => setFormData({ ...formData, body: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium custom-scrollbar resize-y"
                    placeholder="Hi {{name}}, ..."
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={handleSave}
                    disabled={!formData.name || !formData.subject || !formData.body}
                    className="bg-slate-950 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Template
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Your Drafts ({templates.length})</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => fetchRemoteDrafts(followUpSettings)}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <CloudDownload className="size-3.5" />
                      Sync Gmail Drafts
                    </button>
                    <button 
                      onClick={handleCreateNew}
                      className="bg-[#1069ff] hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      New Draft
                    </button>
                  </div>
                </div>

                {templates.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
                    <p className="text-sm text-slate-500 font-medium">No templates found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {templates.map(tpl => (
                      <div key={tpl.id} className="group relative bg-white border border-slate-200 rounded-3xl p-6 hover:border-slate-300 hover:shadow-lg transition-all flex flex-col h-[220px] overflow-hidden cursor-pointer" onClick={() => handleEdit(tpl)}>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 z-10 bg-white/95 backdrop-blur-sm px-2 py-1.5 rounded-xl shadow-sm border border-slate-100">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(tpl); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors outline-none"
                            title="Edit Template"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button 
                            onClick={async (e) => { 
                              e.stopPropagation(); 
                              const ok = await confirm.danger('Delete Template?', 'Are you sure you want to delete this email template?');
                              if (ok) deleteTemplate(tpl.id); 
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors outline-none"
                            title="Delete Template"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>

                        <div className="flex flex-col gap-1.5 min-w-0 pr-16 shrink-0">
                          <h4 className="text-base font-black text-slate-900 tracking-tight truncate">{tpl.name}</h4>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">Subj</span>
                            <span className="text-xs font-bold truncate">{tpl.subject}</span>
                          </div>
                        </div>

                        <div className="mt-5 pt-5 border-t border-slate-100/80 flex-1 relative">
                          <p className="text-xs text-slate-600  whitespace-pre-wrap font-medium leading-relaxed">{tpl.body}</p>
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'outbox' && (
          <div className="flex-1 flex flex-col h-full bg-white border-t border-slate-200 overflow-hidden relative">
            <div className="flex items-center justify-between px-8 py-3 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center gap-4">
                {outboxView === 'reading' && (
                  <button 
                    onClick={() => setOutboxView('list')}
                    className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                  >
                    <ArrowLeft className="size-5" />
                  </button>
                )}
                <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                  <Mail className="size-4 text-slate-500" />
                  Inbox & Outbox
                </h3>
              </div>
              <button 
                onClick={() => syncReplies()}
                className="hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-2 transition-all border border-slate-200 shadow-sm"
              >
                <Clock className="size-4 text-slate-500" />
                Sync
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {outboxView === 'list' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fdfdfd]">
                  {threads.length === 0 ? (
                    <div className="p-16 text-center text-slate-400">
                      <p className="text-[15px] font-medium tracking-tight">Your inbox is empty.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {threads.map((thread, idx) => {
                        const latestMessage = thread.replies.length > 0 ? thread.replies[thread.replies.length-1].body : thread.emails[thread.emails.length-1].body;
                        const snippet = latestMessage.replace(/\n/g, ' ').substring(0, 120);
                        const isUnread = false;
                        
                        return (
                          <div 
                            key={thread.lead?.id || idx}
                            onClick={() => {
                              setSelectedThreadLeadId(thread.lead?.id);
                              setOutboxView('reading');
                            }}
                            className={`flex items-center gap-6 px-8 py-3.5 border-b border-slate-100/60 cursor-pointer transition-colors group ${isUnread ? 'bg-white' : 'bg-transparent hover:bg-slate-50/50'}`}
                          >
                            <div className="flex items-center gap-4 shrink-0 text-slate-200 group-hover:text-slate-300 transition-colors">
                              <Square className="size-[18px] hover:text-slate-400" />
                              <Star className="size-[18px] hover:text-slate-400" />
                            </div>
                            <div className={`w-56 shrink-0 truncate text-[15px] tracking-tight ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                              {thread.lead?.name || 'Unknown Lead'}
                            </div>
                            <div className="flex-1 min-w-0 flex items-center text-[15px] truncate">
                              <span className={`${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-900'} tracking-tight`}>
                                {thread.emails[0]?.subject}
                              </span>
                              <span className="text-slate-500 font-normal ml-2 truncate tracking-tight">
                                - {snippet}
                              </span>
                            </div>
                            <div className={`shrink-0 text-xs tracking-tight text-right w-24 ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
                              {new Date(thread.latestActivity).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                  {(() => {
                    const thread = threads.find(t => t.lead?.id === selectedThreadLeadId);
                    if (!thread) return null;
                    
                    const allMessages = [
                      ...thread.emails.map(e => ({ ...e, type: 'sent', date: new Date(e.sentAt).getTime() })),
                      ...thread.replies.map(r => ({ ...r, type: 'received', date: new Date(r.receivedAt).getTime() }))
                    ].sort((a, b) => a.date - b.date);

                    return (
                      <div className="p-10 max-w-4xl mx-auto flex flex-col gap-10 pb-32">
                        <h2 className="text-2xl font-normal text-slate-900 tracking-tight leading-snug ml-[60px]">
                          {thread.emails[0]?.subject}
                        </h2>
                        
                        <div className="flex flex-col gap-12">
                          {allMessages.map(msg => (
                            <div key={msg.id} className="flex items-start gap-5 group">
                              <div className={`shrink-0 size-10 rounded-full flex items-center justify-center font-bold text-[15px] shadow-sm ${msg.type === 'sent' ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white'}`}>
                                {msg.type === 'sent' ? 'Me' : thread.lead?.name.charAt(0)}
                              </div>
                              <div className="flex-1 flex flex-col min-w-0 pt-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-bold text-slate-900 text-[15px] tracking-tight">
                                    {msg.type === 'sent' ? 'Me' : thread.lead?.name}
                                  </span>
                                  <span className="text-[13px] text-slate-500 font-medium tracking-tight">
                                    {msg.type === 'sent' ? '<me@flowstudio.com>' : `<${thread.lead?.email}>`}
                                  </span>
                                  <span className="text-[13px] font-medium text-slate-400 ml-2 tracking-tight group-hover:text-slate-500 transition-colors">
                                    {new Date(msg.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div 
                                  className="text-[15px] text-slate-800 whitespace-pre-wrap leading-[1.6] font-normal max-w-3xl"
                                  dangerouslySetInnerHTML={{ __html: msg.body }}
                                />
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {msg.attachments.map((file: any, i: number) => (
                                      <a key={i} href={file.url} download={file.name} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors rounded-lg px-3 py-1.5 shadow-sm max-w-[200px] cursor-pointer outline-none">
                                        <span className="material-symbols-outlined text-[16px] text-slate-500 shrink-0">
                                          {file.type?.startsWith('image/') ? 'image' : 'draft'}
                                        </span>
                                        <span className="text-[12px] font-medium text-slate-700 truncate">{file.name}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* ChatGPT-style Exact Match Reply Box */}
                        <div className="flex items-start gap-5 mt-4">
                          <div className="shrink-0 size-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                            {/* Dummy Avatar */}
                            <div className="size-6 bg-yellow-400 rounded-sm flex items-center justify-center">
                              <div className="size-3 bg-white rounded-full" />
                            </div>
                          </div>
                          
                          <div className="flex-1 border border-slate-200/80 rounded-[20px] shadow-[0_2px_6px_rgba(0,0,0,0.02)] focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.06)] focus-within:border-slate-300 transition-all bg-white flex flex-col pt-3 pb-3">
                                                        
                            {/* Text Area */}
                            <textarea 
                              className="w-full px-5 py-2 min-h-[160px] resize-none outline-none text-[15px] text-slate-800 placeholder-slate-400 leading-relaxed"
                              placeholder="Press / for Help me write"
                            />
                            
                            
                            {/* Bottom Toolbar */}
                            <div className="px-5 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center shadow-sm rounded-full">
                                  <button 
                                    className="bg-[#1069ff] hover:bg-blue-700 text-white text-[13px] font-semibold px-4 py-2 rounded-l-full transition-colors h-[34px] flex items-center tracking-wide"
                                  >
                                    Send
                                  </button>
                                  <div className="w-[1px] h-[34px] bg-blue-700/50" />
                                  <button className="bg-[#1069ff] hover:bg-blue-700 text-white px-2 rounded-r-full transition-colors h-[34px] flex items-center justify-center">
                                    <ChevronDown className="size-3.5" />
                                  </button>
                                </div>
                                
                                <div className="flex items-center gap-2.5 text-slate-500">
                                  <Type className="size-[17px] hover:text-slate-800 cursor-pointer stroke-[1.5]" />
                                  <Paperclip className="size-[17px] hover:text-slate-800 cursor-pointer stroke-[1.5]" />
                                  <Link2 className="size-[17px] hover:text-slate-800 cursor-pointer stroke-[1.5]" />
                                  <Smile className="size-[17px] hover:text-slate-800 cursor-pointer stroke-[1.5]" />
                                  <ImageIcon className="size-[17px] hover:text-slate-800 cursor-pointer stroke-[1.5]" />
                                </div>
                              </div>
                              
                              <button 
                                className="text-slate-400 hover:text-slate-700 transition-colors"
                                title="Discard draft"
                              >
                                <Trash2 className="size-[18px] stroke-[1.5]" />
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'batches' && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 pb-20">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Active Outreach Campaigns</h3>
              <p className="text-sm text-slate-500">Monitor batch cohorts, lead reply rates, and pause or resume outreach sequences.</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Campaign Cohorts ({batches.length})</h4>
              
              {batches.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs font-semibold text-slate-400">
                  No active outreach batches. Send emails to 1 or more leads to create a batch!
                </div>
              ) : (
                <div className="space-y-4">
                  {batches.map(batch => {
                    const isPaused = batch.status === 'paused';
                    const batchQueue = queue.filter(q => q.batchId === batch.id);
                    const repliesCount = batchQueue.filter(q => q.status === 'replied_stopped').length;
                    const sentCount = batchQueue.filter(q => q.status === 'sent').length;
                    const isExpanded = expandedBatchId === batch.id;

                    return (
                      <div key={batch.id} className="border border-slate-200 rounded-xl overflow-hidden bg-[#fcfdfd]">
                        <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer" onClick={() => setExpandedBatchId(isExpanded ? null : batch.id)}>
                          <div className="flex items-center gap-3">
                            <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-green-500 animate-pulse'}`} />
                            <div>
                              <h5 className="text-sm font-bold text-slate-800">{batch.name}</h5>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Created on {new Date(batch.createdAt).toLocaleDateString()} • {batch.leadIds.length} Leads</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold text-slate-700">Follow-up status: {sentCount} sent, {repliesCount} replied</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => isPaused ? resumeBatch(batch.id) : pauseBatch(batch.id)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                                  isPaused 
                                    ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                                    : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                }`}
                              >
                                {isPaused ? 'Resume' : 'Pause'}
                              </button>
                              <button
                                onClick={async () => {
                                  const ok = await confirm.danger('Delete Batch?', 'Are you sure you want to delete this batch and cancel all scheduled follow-ups?');
                                  if (ok) {
                                    deleteBatch(batch.id);
                                  }
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-lg transition-all"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-100 p-4 bg-white space-y-3 animate-in fade-in duration-200">
                            <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Sequences in this Batch</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {batch.leadIds.map(leadId => {
                                const lead = leads.find(l => l.id === leadId);
                                const leadItems = batchQueue.filter(q => q.leadId === leadId).sort((a, b) => a.stepIndex - b.stepIndex);
                                if (!lead) return null;

                                return (
                                  <div key={leadId} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-800">{lead.name}</span>
                                      <span className="text-[10px] font-semibold text-slate-500">{lead.email}</span>
                                    </div>
                                    <div className="space-y-1">
                                      {leadItems.length === 0 ? (
                                        <p className="text-[10px] text-slate-400 font-bold">No follow-up sequence configured</p>
                                      ) : (
                                        leadItems.map(item => (
                                          <div key={item.id} className="flex items-center justify-between text-[11px]">
                                            <span className="text-slate-500">Step {item.stepIndex} Follow-up:</span>
                                            <span className={`font-bold uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded-full ${
                                              item.status === 'sent' ? 'bg-green-100 text-green-800' :
                                              item.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                              item.status === 'paused' ? 'bg-amber-100 text-amber-800' :
                                              item.status === 'replied_stopped' ? 'bg-purple-100 text-purple-800' :
                                              'bg-slate-100 text-slate-800'
                                            }`}>
                                              {item.status.replace('_', ' ')}
                                            </span>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 pb-20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Scheduled Outbox Queue</h3>
                <p className="text-sm text-slate-500">Manage individual scheduled email follow-ups and customize drafts before they go out.</p>
              </div>
              <button
                onClick={async () => {
                  await processQueue();
                  toast.success('Queue Processed', 'Due scheduled emails processed successfully.');
                }}
                className="bg-[#1069ff] hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                Process Due Emails Now
              </button>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Upcoming Scheduled Queue ({queue.filter(q => q.status === 'scheduled' || q.status === 'paused').length} pending)</h4>
              
              {queue.filter(q => q.status === 'scheduled' || q.status === 'paused').length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs font-semibold text-slate-400">
                  No upcoming follow-ups scheduled.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 pb-2">Lead</th>
                        <th className="py-2.5 pb-2">Step</th>
                        <th className="py-2.5 pb-2">Scheduled Send</th>
                        <th className="py-2.5 pb-2">Subject / Message preview</th>
                        <th className="py-2.5 pb-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {queue
                        .filter(q => q.status === 'scheduled' || q.status === 'paused')
                        .map(item => {
                          const lead = leads.find(l => l.id === item.leadId);
                          const isPaused = item.status === 'paused';
                          if (!lead) return null;

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="py-3 font-semibold text-slate-800">
                                <div>{lead.name}</div>
                                <div className="text-[10px] text-slate-400 font-medium">{lead.email}</div>
                              </td>
                              <td className="py-3">
                                <span className="font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Step {item.stepIndex}
                                </span>
                              </td>
                              <td className="py-3 text-slate-500 font-medium">
                                {new Date(item.scheduledAt).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="py-3 max-w-[220px] truncate text-slate-600 font-medium">
                                <span className="font-bold text-slate-800 block truncate">{item.subject}</span>
                                <span className="text-slate-400 block truncate">{item.body}</span>
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={async () => {
                                      const res = await sendQueueItemNow(item.id);
                                      if (res.success) {
                                        toast.success('Email Sent', 'Email sent successfully!');
                                      } else {
                                        toast.error('Send Failed', `Failed to send: ${res.error}`);
                                      }
                                    }}
                                    className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-all"
                                  >
                                    Send Now
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingQueueItem(item);
                                      setEditSubject(item.subject);
                                      setEditBody(item.body);
                                    }}
                                    className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-all"
                                  >
                                    Edit Draft
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const ok = await confirm.warning('Cancel Follow-up?', 'Are you sure you want to cancel this follow-up email?');
                                      if (ok) {
                                        cancelQueueItem(item.id);
                                      }
                                    }}
                                    className="px-2 py-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Email Edit overlay modal */}
            {editingQueueItem && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4">
                <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl p-6 space-y-4 border border-slate-100 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h5 className="text-sm font-bold text-slate-800">Customize Scheduled Draft</h5>
                    <button
                      onClick={() => setEditingQueueItem(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Subject</label>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={e => setEditSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-accent/20 bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Body Draft</label>
                      <textarea
                        value={editBody}
                        onChange={e => setEditBody(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-accent/20 bg-white font-sans"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingQueueItem(null)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveQueueItemEdit}
                      className="px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 pb-20">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Follow-up & Settings</h3>
              <p className="text-sm text-slate-500">Configure default automated follow-up sequences, delays, and SMTP/IMAP credentials.</p>
            </div>

            {/* Automated Follow-ups Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Default Follow-up Sequence Settings</h4>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Max Attempts Before "Lost"</label>
                <input 
                  type="number" 
                  min={1} max={10}
                  value={settingsForm.maxAttempts}
                  onChange={e => {
                    const num = parseInt(e.target.value) || 1;
                    const newDelays = [...settingsForm.followUpDelays];
                    while (newDelays.length < num) newDelays.push(3);
                    setSettingsForm({ ...settingsForm, maxAttempts: num, followUpDelays: newDelays.slice(0, num) });
                  }}
                  className="w-full max-w-[200px] px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-accent/20 bg-white transition-all font-bold text-slate-950"
                />
                <p className="text-[11px] text-slate-400 font-medium">If no reply after these emails, mark lead status as Archived/Lost.</p>
              </div>

              <div className="flex flex-col gap-4 mt-2 pt-5 border-t border-slate-100">
                {settingsForm.followUpDelays.map((delay, idx) => {
                  const prefix = idx === 0 ? '1st' : idx === 1 ? '2nd' : idx === 2 ? '3rd' : `${idx + 1}th`;
                  const previous = idx === 0 ? 'initial email' : idx === 1 ? '1st follow-up' : idx === 2 ? '2nd follow-up' : `${idx}th follow-up`;
                  
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-xs text-slate-700 font-bold min-w-[100px] text-right">
                        {prefix} follow up
                      </span>
                      <input 
                        type="number" 
                        min={1} 
                        value={delay}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 1;
                          const newDelays = [...settingsForm.followUpDelays];
                          newDelays[idx] = val;
                          setSettingsForm({ ...settingsForm, followUpDelays: newDelays });
                        }}
                        className="w-[80px] px-3 py-1.5 text-center border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-accent/20 bg-white transition-all font-bold text-slate-950"
                      />
                      <span className="text-xs text-slate-700 font-bold">days after {previous}.</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider mb-1">Mail Server Settings</h3>
              <p className="text-xs text-slate-500">Configure connection details for sending and receiving emails.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 grid grid-cols-2 gap-5 bg-white">
              <div className="col-span-2 flex items-center justify-between border-b border-slate-200 pb-5 mb-1">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold text-slate-900">Use Shared Team Email</label>
                  <p className="text-xs text-slate-500 font-medium">If enabled, the app will ignore your personal Google Login and send all emails from the App Password credentials below.</p>
                </div>
                <button 
                  onClick={() => setSettingsForm({ ...settingsForm, useTeamEmail: !settingsForm.useTeamEmail })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${settingsForm.useTeamEmail ? 'bg-[#1069ff]' : 'bg-slate-200'}`}
                  role="switch"
                  aria-checked={settingsForm.useTeamEmail}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settingsForm.useTeamEmail ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex flex-col gap-2 col-span-2">
                <label className="text-sm font-bold text-slate-700">Team Email Address</label>
                <input 
                  type="email" 
                  value={settingsForm.emailUser}
                  onChange={e => setSettingsForm({ ...settingsForm, emailUser: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium bg-white"
                  placeholder="you@gmail.com"
                />
              </div>
              
              <div className="flex flex-col gap-2 col-span-2 relative">
                <div className="flex items-center gap-2 relative">
                  <label className="text-sm font-bold text-slate-700">App Password</label>
                  <button 
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-slate-400 hover:text-slate-900 transition-colors p-0.5 rounded-full hover:bg-slate-200 outline-none"
                    title="What is an App Password?"
                  >
                    <HelpCircle className="size-4" />
                  </button>

                  {showGuide && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowGuide(false)} />
                      <div className="absolute left-24 bottom-6 w-[420px] bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl z-50 animate-in fade-in zoom-in-95 origin-bottom-left text-slate-300 text-sm">
                        <button 
                          onClick={() => setShowGuide(false)}
                          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors outline-none"
                        >
                          <X className="size-4" />
                        </button>
                        
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                          <HelpCircle className="w-5 h-5 text-blue-400" />
                          <h3 className="text-base font-bold text-white tracking-tight">Connection Guide</h3>
                        </div>

                        <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                          <div>
                            <strong className="font-bold text-white block mb-1">What is an App Password?</strong>
                            <p className="leading-relaxed">A randomly generated 16-digit code that gives this CRM permission to send and receive emails safely, without knowing your real password.</p>
                          </div>
                          <div>
                            <strong className="font-bold text-white block mb-1">How to get a Gmail App Password:</strong>
                            <ul className="list-decimal pl-5 space-y-1">
                              <li>Go to your Google Account Settings.</li>
                              <li>Search for "App Passwords".</li>
                              <li>Create a new password named "Flow Studio".</li>
                              <li>Paste the 16-character code below.</li>
                            </ul>
                          </div>
                          <div>
                            <strong className="font-bold text-white block mb-1">What are SMTP and IMAP?</strong>
                            <p className="leading-relaxed">SMTP <strong>sends</strong> emails. IMAP <strong>reads</strong> replies. The Gmail defaults below are already correct!</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <input 
                  type="password" 
                  value={settingsForm.emailPass}
                  onChange={e => setSettingsForm({ ...settingsForm, emailPass: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium bg-white pr-10"
                  placeholder="abcd efgh ijkl mnop"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">SMTP Host (Sending)</label>
                <input 
                  type="text" 
                  value={settingsForm.smtpHost}
                  onChange={e => setSettingsForm({ ...settingsForm, smtpHost: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium bg-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">IMAP Host (Receiving)</label>
                <input 
                  type="text" 
                  value={settingsForm.imapHost}
                  onChange={e => setSettingsForm({ ...settingsForm, imapHost: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium bg-white"
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center justify-between bg-white">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-slate-900">Sync All Unread Emails (Global Inbox)</label>
                <p className="text-xs text-slate-500 font-medium">If enabled, ALL unread emails from your Gmail account will appear in the Inbox, even if they aren't from known leads.</p>
              </div>
              <button 
                onClick={() => setSettingsForm({ ...settingsForm, syncAllEmails: !settingsForm.syncAllEmails })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${settingsForm.syncAllEmails ? 'bg-[#1069ff]' : 'bg-slate-200'}`}
                role="switch"
                aria-checked={settingsForm.syncAllEmails}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settingsForm.syncAllEmails ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button 
                onClick={handleSaveSettings}
                className="bg-slate-950 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-900 transition-all shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Server Settings
              </button>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};
