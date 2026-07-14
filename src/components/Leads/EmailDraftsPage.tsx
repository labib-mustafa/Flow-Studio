import React, { useState } from 'react';
import { useMailTemplateStore, useMailStore } from '../../stores/mailStore';
import { useLeadStore } from '../../stores/leadStore';
import { Plus, Edit2, Trash2, Save, ArrowLeft, HelpCircle, Mail, Clock, Reply, Square, Star, CornerUpLeft, ChevronDown, Type, Paperclip, Link2, Smile, Image as ImageIcon, Lock, PenTool, MoreVertical, X, Wand2, Triangle, Maximize2, CloudDownload } from 'lucide-react';
import { PillTab } from '../GlobalComponents/PillTab';

interface EmailDraftsPageProps {
  onBack: () => void;
}

export const EmailDraftsPage: React.FC<EmailDraftsPageProps> = ({ onBack }) => {
  const { templates, addTemplate, updateTemplate, deleteTemplate, seedDummyTemplates, fetchRemoteDrafts } = useMailTemplateStore();
  const { followUpSettings, updateFollowUpSettings, sentEmails, replies, addSimulatedReply, sendBulkMail, syncReplies, seedDummyData } = useMailStore();
  const { leads, updateLead } = useLeadStore();

  const [activeTab, setActiveTab] = useState<'templates' | 'outbox' | 'settings'>('templates');
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

  React.useEffect(() => {
    if (templates.length === 0) {
      seedDummyTemplates();
    }
    if (sentEmails.length === 0) {
      seedDummyData();
    }
  }, [templates.length, sentEmails.length, seedDummyTemplates, seedDummyData]);

  // Auto-sync loop every 60 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      syncReplies(true);
      fetchRemoteDrafts(followUpSettings, true);
    }, 60000);
    return () => clearInterval(interval);
  }, [syncReplies, fetchRemoteDrafts, followUpSettings]);

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
    alert('Follow-up settings saved successfully.');
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

    alert(`Follow-up Engine Run Complete.\nSent ${followUpCount} follow-ups.\nMarked ${lostCount} leads as Lost/Archived.`);
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
              label="Outbox & Inbox" 
              isActive={activeTab === 'outbox'} 
              onClick={() => { setActiveTab('outbox'); setEditingTemplateId(null); }} 
            />
            <PillTab 
              label="Follow-up Engine & Settings" 
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
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (window.confirm('Delete this template?')) deleteTemplate(tpl.id); 
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

        {activeTab === 'settings' && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 pb-10">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Automated Follow-ups</h3>
              <p className="text-sm text-slate-500">Configure how the system automatically handles non-responsive leads.</p>
            </div>

            <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-900">Max Attempts Before "Lost"</label>
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
                  className="w-full max-w-[200px] px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-white transition-all font-bold text-slate-950"
                />
                <p className="text-xs text-slate-500 font-medium">If no reply after these emails, mark lead status as Archived/Lost.</p>
              </div>

              <div className="flex flex-col gap-4 mt-2 pt-5 border-t border-slate-200/80">
                {settingsForm.followUpDelays.map((delay, idx) => {
                  const prefix = idx === 0 ? '1st' : idx === 1 ? '2nd' : idx === 2 ? '3rd' : `${idx + 1}th`;
                  const previous = idx === 0 ? 'initial email' : idx === 1 ? '1st follow-up' : idx === 2 ? '2nd follow-up' : `${idx}th follow-up`;
                  
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm text-slate-700 font-bold min-w-[100px] text-right">
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
                        className="w-[80px] px-3 py-2 text-center border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-white transition-all font-bold text-slate-950"
                      />
                      <span className="text-sm text-slate-700 font-bold">days after {previous}.</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 grid grid-cols-2 gap-5">
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

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-6 flex items-center justify-between">
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

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
              <button 
                onClick={handleRunFollowUpEngine}
                className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all shadow-sm"
              >
                Run Engine Now
              </button>
              <button 
                onClick={handleSaveSettings}
                className="bg-slate-950 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-900 transition-all shadow-md"
              >
                <Save className="w-4 h-4" />
                Save Settings
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
