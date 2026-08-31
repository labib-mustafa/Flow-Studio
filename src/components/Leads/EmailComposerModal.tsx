import React, { useState, useEffect, useRef } from 'react';
import { useMailTemplateStore, useMailStore } from '../../stores/mailStore';
import { useLeadStore } from '../../stores/leadStore';
import { useAuthStore } from '../../stores/authStore';
import { useTeamStore } from '../../stores/teamStore';
import { useSettings } from '../../hooks/useSettings';
import { ChevronRight, Plus, X } from 'lucide-react';

interface EmailComposerModalProps {
  onClose: () => void;
  onSuccess: () => void;
  leadIds: string[];
}

export const EmailComposerModal: React.FC<EmailComposerModalProps> = ({ onClose, onSuccess, leadIds }) => {
  const { templates } = useMailTemplateStore();
  const { sendBulkMail, createBatch } = useMailStore();
  const { leads, updateLead } = useLeadStore();
  const { members } = useTeamStore();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showCampaignSettings, setShowCampaignSettings] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [steps, setSteps] = useState<any[]>([
    { delayDays: 3, subjectTemplate: 'Re: {{subject}}', bodyTemplate: 'Hi {{name}},\n\nJust following up on my previous note. Let me know if you had some time to review it.\n\nBest regards,' }
  ]);
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [senderType, setSenderType] = useState<'personal' | 'team'>('personal');
  const [showCcDropdown, setShowCcDropdown] = useState(false);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const templatesDropdownRef = useRef<HTMLDivElement>(null);
  const ccDropdownRef = useRef<HTMLDivElement>(null);

  const { followUpSettings } = useMailStore.getState();
  const { user } = useAuthStore();
  const { settings } = useSettings();

  const showSenderToggle = followUpSettings.useTeamEmail && followUpSettings.emailUser;
  const personalEmail = user?.email || 'mia@untitled.com';
  const teamEmail = followUpSettings.emailUser || 'team@untitled.com';
  const selectedEmail = senderType === 'personal' ? personalEmail : teamEmail;

  const personalAvatar = (settings.profileImage && (settings.profileImage.startsWith('data:') || !settings.profileImage.includes('aida-public'))
    ? settings.profileImage
    : (user?.photoURL || settings.profileImage || '')) || `https://api.dicebear.com/7.x/notionists/svg?seed=${personalEmail}`;

  const teamMember = members.find(m => m.email === teamEmail);
  const teamAvatar = teamMember?.profilePic || `https://api.dicebear.com/7.x/notionists/svg?seed=${teamEmail}`;

  const selectedAvatar = senderType === 'personal' ? personalAvatar : teamAvatar;

  const [currentLeadIds, setCurrentLeadIds] = useState<string[]>(leadIds);
  const selectedLeads = leads.filter(l => currentLeadIds.includes(l.id));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templatesDropdownRef.current && !templatesDropdownRef.current.contains(event.target as Node)) {
        setShowTemplatesDropdown(false);
      }
    };
    if (showTemplatesDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTemplatesDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ccDropdownRef.current && !ccDropdownRef.current.contains(event.target as Node)) {
        setShowCcDropdown(false);
      }
    };
    if (showCcDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCcDropdown]);

  useEffect(() => {
    if (selectedTemplateId) {
      const tpl = templates.find(t => t.id === selectedTemplateId);
      if (tpl) {
        setSubject(tpl.subject);
        const htmlBody = tpl.body.replace(/\n/g, '<br>');
        bodyRef.current = htmlBody;
        if (editorRef.current) editorRef.current.innerHTML = htmlBody;
      }
    } else {
      setSubject('');
      bodyRef.current = '';
      if (editorRef.current) editorRef.current.innerHTML = '';
    }
  }, [selectedTemplateId, templates]);

  const handleSend = async () => {
    if (!subject || !bodyRef.current) return;

    setIsSending(true);
    setSendError(null);

    const stepsWithIndex = steps.map((s, idx) => ({
      stepIndex: idx + 1,
      delayDays: s.delayDays,
      subjectTemplate: s.subjectTemplate.replace('{{subject}}', subject),
      bodyTemplate: s.bodyTemplate
    }));

    const leadIdsToSend = selectedLeads.map(l => l.id);
    
    let result;
    if (leadIdsToSend.length > 1 || batchName || steps.length > 0) {
      const finalBatchName = batchName || `Batch Outreach - ${new Date().toLocaleDateString()}`;
      result = await createBatch(
        finalBatchName,
        leadIdsToSend,
        subject,
        bodyRef.current,
        stepsWithIndex,
        senderType,
        cc,
        selectedTemplateId || undefined
      );
    } else {
      result = await sendBulkMail(
        leadIdsToSend,
        subject,
        bodyRef.current,
        selectedTemplateId || undefined,
        senderType,
        cc,
        attachments.length > 0 ? attachments : undefined
      );
    }

    if (result && !result.success) {
      setSendError(result.errors?.join('\n') || 'An unknown error occurred while sending.');
      setIsSending(false);
      return;
    }

    // Auto-update lead status to "Contacted" if they were "New"
    selectedLeads.forEach(lead => {
      if (lead && lead.status === 'New') {
        updateLead(lead.id, { status: 'Contacted' });
      }
    });

    setIsSending(false);
    onSuccess();
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      bodyRef.current = editorRef.current.innerHTML;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    // reset input
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4 animate-in fade-in duration-200 font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[20px] w-full max-w-[660px] shadow-2xl shadow-slate-900/10 flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">Send Email</h2>
          <div className="flex items-center gap-1">
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors rounded">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* TO Field */}
        <div className="flex items-start border-b border-slate-100 px-6 py-2.5 min-h-[48px] gap-4">
          <span className="text-[10px] font-bold text-slate-800 mt-2 w-6 shrink-0">TO</span>
          <div className="flex-1 flex flex-wrap gap-2 items-center min-h-[30px]">
            {selectedLeads.length < 3 ? (
              selectedLeads.map(lead => (
                <div key={lead.id} className="flex items-center gap-1.5 border border-slate-200 rounded-full px-1.5 py-1 bg-white shadow-sm shadow-slate-100/50">
                  <div className="size-[18px] rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    <span className="text-[9px] font-bold text-slate-500">{getInitials(lead.name || lead.email)}</span>
                  </div>
                  <span className="text-[12px] text-slate-700 font-medium tracking-tight truncate max-w-[120px]">{lead.email}</span>
                  <button 
                    onClick={() => setCurrentLeadIds(prev => prev.filter(id => id !== lead.id))}
                    className="text-slate-400 hover:text-slate-600 ml-0.5 mt-0.5 shrink-0 flex"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-1.5 border border-slate-200 rounded-md px-2.5 py-1 bg-slate-50 text-[11px] text-slate-600 font-semibold shadow-sm shadow-slate-100/50">
                {selectedLeads.length} Leads
              </div>
            )}
          </div>
        </div>

        {/* CC Field */}
        <div className="flex items-center border-b border-slate-100 px-6 py-2.5 min-h-[48px] gap-4 relative" ref={ccDropdownRef}>
          <span className="text-[10px] font-bold text-slate-800 w-6 shrink-0">CC</span>
          <input
            type="text"
            value={cc}
            onChange={e => setCc(e.target.value)}
            className="flex-1 outline-none border-none text-[13px] text-slate-700 placeholder-slate-300 bg-transparent font-medium"
            placeholder=""
          />
          <button
            onClick={() => setShowCcDropdown(!showCcDropdown)}
            className={`text-slate-400 hover:text-slate-600 shrink-0 transition-transform ${showCcDropdown ? 'rotate-180' : ''}`}
          >
            <span className="material-symbols-outlined text-[20px]">expand_more</span>
          </button>

          {/* CC Dropdown Menu */}
          {showCcDropdown && (
            <div className="absolute right-6 top-10 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
              {members.length > 0 ? (
                members.map(member => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setCc(prev => prev ? `${prev}, ${member.email}` : member.email);
                      setShowCcDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-slate-500">{getInitials(member.name || member.email)}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-bold text-slate-700 truncate">{member.name}</span>
                      <span className="text-[10px] font-medium text-slate-500 truncate">{member.email}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-xs font-medium text-slate-500">
                  No team members found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Campaign Settings Section */}
        <div className="border-b border-slate-100 px-6 py-2.5 bg-slate-50/50">
          <button
            onClick={() => setShowCampaignSettings(!showCampaignSettings)}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors w-full text-left"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${showCampaignSettings ? 'rotate-90' : ''}`} />
            CAMPAIGN & FOLLOW-UP SEQUENCE {selectedLeads.length > 1 && <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold">BATCH ACTIVE</span>}
          </button>
          
          {showCampaignSettings && (
            <div className="mt-3 space-y-4 pb-3">
              {/* Batch Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Batch/Campaign Name</label>
                <input
                  type="text"
                  value={batchName}
                  onChange={e => setBatchName(e.target.value)}
                  placeholder="e.g. Cold Outreach - Q3 Enterprise Leads"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/20 bg-white"
                />
              </div>

              {/* Follow-up Steps List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Automated Follow-up Sequence</label>
                  <button
                    onClick={() => {
                      setSteps([...steps, { delayDays: 3, subjectTemplate: 'Re: {{subject}}', bodyTemplate: 'Hi {{name}},\n\nJust checking in on this. Hope you are having a great week!\n\nBest,\nFlow Team' }]);
                    }}
                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    + Add Step
                  </button>
                </div>

                {steps.map((step, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 relative">
                    <button
                      onClick={() => setSteps(steps.filter((_, i) => i !== idx))}
                      className="absolute right-2 top-2 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove Step"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <span>Step {idx + 1}</span>
                      <span className="text-slate-400 font-normal">Send after</span>
                      <input
                        type="number"
                        value={step.delayDays}
                        onChange={e => {
                          const newSteps = [...steps];
                          newSteps[idx].delayDays = parseInt(e.target.value) || 1;
                          setSteps(newSteps);
                        }}
                        className="w-12 px-1 py-0.5 border border-slate-200 rounded text-center"
                        min="1"
                      />
                      <span className="text-slate-400 font-normal">days of inactivity</span>
                    </div>

                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={step.subjectTemplate}
                        onChange={e => {
                          const newSteps = [...steps];
                          newSteps[idx].subjectTemplate = e.target.value;
                          setSteps(newSteps);
                        }}
                        placeholder="Subject Template (e.g. Re: {{subject}})"
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-none"
                      />
                      <textarea
                        value={step.bodyTemplate}
                        onChange={e => {
                          const newSteps = [...steps];
                          newSteps[idx].bodyTemplate = e.target.value;
                          setSteps(newSteps);
                        }}
                        rows={2}
                        placeholder="Body Template (supports {{name}} and {{company}})"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none font-sans"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {sendError && (
          <div className="px-6 mb-2">
            <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-xs font-medium whitespace-pre-wrap">{sendError}</p>
            </div>
          </div>
        )}

        {/* Body + Vertical Toolbar */}
        <div className="flex min-h-[220px]">
          {/* Left Formatting Toolbar */}
          <div className="flex flex-col justify-end gap-0.5 py-3 px-2 border-r border-slate-100">
            <button onMouseDown={e => { e.preventDefault(); handleFormat('bold'); }} className="text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md p-1.5 outline-none flex items-center justify-center transition-colors" title="Bold">
              <span className="material-symbols-outlined text-[17px]">format_bold</span>
            </button>
            <button onMouseDown={e => { e.preventDefault(); handleFormat('italic'); }} className="text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md p-1.5 outline-none flex items-center justify-center transition-colors" title="Italic">
              <span className="material-symbols-outlined text-[17px]">format_italic</span>
            </button>
            <button onMouseDown={e => { e.preventDefault(); handleFormat('underline'); }} className="text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md p-1.5 outline-none flex items-center justify-center transition-colors" title="Underline">
              <span className="material-symbols-outlined text-[17px]">format_underlined</span>
            </button>
            <div className="h-[1px] w-5 bg-slate-200 my-1" />
            <button onMouseDown={e => { e.preventDefault(); handleFormat('justifyLeft'); }} className="text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md p-1.5 outline-none flex items-center justify-center transition-colors" title="Align left">
              <span className="material-symbols-outlined text-[17px]">format_align_left</span>
            </button>
            <button onMouseDown={e => { e.preventDefault(); handleFormat('justifyCenter'); }} className="text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md p-1.5 outline-none flex items-center justify-center transition-colors" title="Align center">
              <span className="material-symbols-outlined text-[17px]">format_align_center</span>
            </button>
            <button onMouseDown={e => { e.preventDefault(); handleFormat('justifyRight'); }} className="text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md p-1.5 outline-none flex items-center justify-center transition-colors" title="Align right">
              <span className="material-symbols-outlined text-[17px]">format_align_right</span>
            </button>
            <div className="h-[1px] w-5 bg-slate-200 my-1" />
            <button onMouseDown={e => {
              e.preventDefault();
              const url = prompt('Enter link URL:');
              if (url) handleFormat('createLink', url);
            }} className="text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md p-1.5 outline-none flex items-center justify-center transition-colors" title="Insert link">
              <span className="material-symbols-outlined text-[17px]">link</span>
            </button>
          </div>

          {/* Editor Area */}
          <div className="flex-1 px-5 pb-2 flex flex-col">

            {/* Subject & Drafts Header */}
            <div className="py-4 flex items-center gap-4">
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="flex-1 outline-none border-none text-[15px] font-bold text-slate-800 placeholder-slate-300 bg-transparent"
                placeholder="Subject..."
              />
              <div className="relative shrink-0" ref={templatesDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
                  className="pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-colors flex items-center gap-1 min-w-[90px] relative text-left"
                >
                  <span className="truncate max-w-[100px]">
                    {selectedTemplateId ? templates.find(t => t.id === selectedTemplateId)?.name : 'Drafts...'}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                </button>

                {showTemplatesDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId('');
                        setShowTemplatesDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                      Clear / Blank
                    </button>
                    <div className="h-[1px] bg-slate-100 my-1" />
                    {templates.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId(t.id);
                          setShowTemplatesDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${selectedTemplateId === t.id ? 'text-primary bg-primary/5 hover:bg-primary/10' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                      >
                        <span className="material-symbols-outlined text-[14px] text-slate-400">description</span>
                        <span className="truncate flex-1">{t.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Editing Area */}
            <div
              ref={editorRef}
              contentEditable
              onInput={() => { if (editorRef.current) bodyRef.current = editorRef.current.innerHTML; }}
              className="w-full outline-none border-none text-[14px] leading-relaxed text-slate-700 bg-transparent flex-1 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 custom-scrollbar overflow-y-auto max-h-[400px] pt-3"
              data-placeholder="Write your message here..."
              suppressContentEditableWarning
            />

            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                {attachments.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 shadow-sm max-w-[200px]">
                    <span className="material-symbols-outlined text-[14px] text-slate-400 shrink-0">
                      {file.type.startsWith('image/') ? 'image' : 'draft'}
                    </span>
                    <span className="text-[11px] font-medium text-slate-700 truncate">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(i)}
                      className="text-slate-400 hover:text-red-500 shrink-0 flex outline-none"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hidden File Inputs */}
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
        <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" className="hidden" multiple />

        {/* Bottom Bar */}
        <div className="px-5 py-4 bg-white flex items-center justify-between rounded-b-[20px]">
          {/* Sender Selector */}
          <div className="relative group cursor-pointer">
            {showSenderToggle ? (
              <div
                className="flex items-center gap-2 hover:bg-slate-50 py-1.5 px-2 -ml-2 rounded-lg transition-colors"
                onClick={() => setSenderType(prev => prev === 'personal' ? 'team' : 'personal')}
              >
                <div className="size-[22px] rounded-full overflow-hidden bg-slate-200 shrink-0">
                  <img src={selectedAvatar} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  {selectedEmail}
                </span>
                <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-1.5 px-2 -ml-2 rounded-lg">
                <div className="size-[22px] rounded-full overflow-hidden bg-slate-200 shrink-0">
                  <img src={selectedAvatar} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  {selectedEmail}
                </span>
              </div>
            )}
          </div>

          {/* Actions & Send Buttons */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-400 mr-2">
              <button
                onClick={() => { bodyRef.current = ''; if (editorRef.current) editorRef.current.innerHTML = ''; }}
                className="hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-50 outline-none"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
              <button
                onClick={() => imageInputRef.current?.click()}
                className="hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-50 outline-none"
              >
                <span className="material-symbols-outlined text-[18px]">image</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-50 outline-none"
              >
                <span className="material-symbols-outlined text-[18px]">attach_file</span>
              </button>
              <button className="hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-50 outline-none">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className={`flex items-stretch bg-slate-900 rounded-xl overflow-hidden transition-all ${(!subject || isSending || selectedLeads.length === 0) ? 'opacity-50 pointer-events-none' : ''}`}>
                <button
                  onClick={handleSend}
                  disabled={!subject || isSending || selectedLeads.length === 0}
                  className="px-5 py-2 text-[13px] font-bold text-white hover:bg-slate-800 transition-colors flex items-center gap-2 outline-none"
                >
                  {isSending ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  Send
                </button>
                <div className="w-[1px] bg-white/20 my-2" />
                <button
                  disabled={!subject || isSending || selectedLeads.length === 0}
                  className="px-2.5 hover:bg-slate-800 transition-colors flex items-center justify-center outline-none text-white"
                  title="Schedule send"
                >
                  <span className="material-symbols-outlined text-[18px] leading-none">arrow_drop_down</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
