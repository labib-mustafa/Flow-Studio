import React, { useState } from 'react';
import { useMailStore } from '../../stores/mailStore';
import { useLeadStore } from '../../stores/leadStore';
import { ArrowLeft, Mail, Search, Clock } from 'lucide-react';

interface SentEmailsPageProps {
  onBack: () => void;
}

export const SentEmailsPage: React.FC<SentEmailsPageProps> = ({ onBack }) => {
  const { sentEmails } = useMailStore();
  const { leads } = useLeadStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Sort by newest first
  const sortedEmails = [...sentEmails].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  const filteredEmails = sortedEmails.filter(email => {
    if (!searchQuery) return true;
    const lead = leads.find(l => l.id === email.leadId);
    const leadName = lead?.name.toLowerCase() || '';
    const leadEmail = lead?.email.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return email.subject.toLowerCase().includes(q) || 
           email.body.toLowerCase().includes(q) || 
           leadName.includes(q) || 
           leadEmail.includes(q);
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fcfdfd] overflow-hidden relative">
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between gap-4 shrink-0 relative z-30 shadow-sm">
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
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sent Emails Log</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
            <input
              type="text"
              placeholder="Search sent emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-slate-700 text-slate-400"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
        <div className="p-6 md:p-8 max-w-5xl mx-auto flex flex-col gap-4 pb-32">
          {filteredEmails.length === 0 ? (
            <div className="p-16 text-center bg-white border border-slate-200 border-dashed rounded-2xl mt-4">
              <Mail className="mx-auto h-8 w-8 text-slate-300 mb-3" />
              <p className="text-[15px] font-medium tracking-tight text-slate-500">No sent emails found.</p>
              {searchQuery && <p className="text-sm text-slate-400 mt-1">Try adjusting your search query.</p>}
            </div>
          ) : (
            filteredEmails.map(email => {
              const lead = leads.find(l => l.id === email.leadId);
              return (
                <div key={email.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-accent/5 flex items-center justify-center text-accent font-bold text-sm shrink-0 border border-accent/20">
                        {lead?.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 text-sm tracking-tight truncate">{lead?.name || 'Unknown Lead'}</span>
                        <span className="text-xs text-slate-500 font-medium truncate">{lead?.email || 'No email'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 shrink-0">
                      <Clock className="size-3.5" />
                      <span className="text-xs font-semibold">
                        {new Date(email.sentAt).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-bold text-slate-800 text-base tracking-tight">{email.subject}</h3>
                    <div 
                      className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed mt-2 font-medium max-w-3xl"
                      dangerouslySetInnerHTML={{ __html: email.body }}
                    />
                    {email.attachments && email.attachments.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {email.attachments.map((file: any, i: number) => (
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
