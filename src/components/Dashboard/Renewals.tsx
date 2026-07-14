import React, { useState } from 'react';
import { useBillingStore } from '../../stores/billingStore';
import { useProjectStore } from '../../stores/projectStore';

interface RenewalsProps {
  onNavigate?: (view: string) => void;
  onProjectClick?: (project: any) => void;
}

export const Renewals: React.FC<RenewalsProps> = ({ onNavigate, onProjectClick }) => {
  const [activeTab, setActiveTab] = useState<'renewals' | 'deadlines'>('deadlines');
  const { paymentHistory } = useBillingStore();
  const { projects } = useProjectStore();

  // Get pending or recent invoices for renewals list, or fallback subscription items
  const pendingInvoices = paymentHistory.filter(i => i.status === 'Pending' || i.status === 'Overdue');
  
  // Sort projects by deadline
  const upcomingDeadlines = projects
    .filter(p => p.deadline && p.status !== 'Completed' && p.status !== 'Archived')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  const getDeadlineStyle = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const today = new Date();
    deadline.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'bg-red-600 text-white border-transparent font-bold'; // Overdue: solid red bg
    } else if (diffDays === 0) {
      return 'bg-red-50 text-red-600 border-red-200 animate-pulse'; // Today: red pulse
    } else if (diffDays === 1) {
      return 'bg-red-50 text-red-600 border-red-200'; // 1 day left: red
    } else if (diffDays <= 3) {
      return 'bg-amber-50 text-amber-600 border-amber-100'; // 2-3 days: amber
    } else if (diffDays <= 7) {
      return 'bg-purple-50 text-purple-600 border-purple-100'; // 4-7 days: purple
    } else {
      return 'bg-emerald-50 text-emerald-600 border-emerald-100'; // > 7 days: emerald
    }
  };

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
          <button 
            onClick={() => setActiveTab('deadlines')}
            className={`text-sm font-bold pb-3 -mb-3 flex items-center transition-colors ${
              activeTab === 'deadlines' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] mr-1">schedule</span>
            Deadlines
          </button>
          <button 
            onClick={() => setActiveTab('renewals')}
            className={`text-sm font-bold pb-3 -mb-3 ml-4 flex items-center transition-colors ${
              activeTab === 'renewals' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] mr-1">notifications</span>
            Renewals
          </button>
          <span className="ml-auto bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {activeTab === 'renewals' ? (pendingInvoices.length > 0 ? pendingInvoices.length : 4) : upcomingDeadlines.length}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {activeTab === 'renewals' ? (
            pendingInvoices.length > 0 ? (
              pendingInvoices.slice(0, 4).map(inv => (
                <div 
                  key={inv.id}
                  onClick={() => onNavigate?.('billing')}
                  className="flex justify-between items-center group cursor-pointer p-2.5 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{inv.recipientName}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Inv #{inv.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                      inv.status === 'Overdue' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {inv.dueDate || inv.status}
                    </span>
                    <p className="text-xs font-bold text-slate-900 mt-1">${inv.amount}</p>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div onClick={() => onNavigate?.('billing')} className="flex justify-between items-center group cursor-pointer p-2.5 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Adobe Creative Cloud</p>
                    <p className="text-[10px] text-slate-500">Software Suite</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-rose-50 text-rose-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-wider">2 DAYS</span>
                    <p className="text-xs font-bold text-slate-900 mt-1">$54.99</p>
                  </div>
                </div>
                <div onClick={() => onNavigate?.('billing')} className="flex justify-between items-center group cursor-pointer p-2.5 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Figma Professional</p>
                    <p className="text-[10px] text-slate-500">Design Tool</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-amber-50 text-amber-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-wider">5 DAYS</span>
                    <p className="text-xs font-bold text-slate-900 mt-1">$45.00</p>
                  </div>
                </div>
                <div onClick={() => onNavigate?.('billing')} className="flex justify-between items-center group cursor-pointer p-2.5 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Slack Enterprise</p>
                    <p className="text-[10px] text-slate-500">Communication</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">12 DAYS</span>
                    <p className="text-xs font-bold text-slate-900 mt-1">$120.00</p>
                  </div>
                </div>
              </>
            )
          ) : (
            upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map(proj => (
                <div 
                  key={proj.id}
                  onClick={() => onProjectClick ? onProjectClick(proj) : onNavigate?.('projects')}
                  className="flex justify-between items-center group cursor-pointer p-2.5 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{proj.name || proj.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">{proj.client}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getDeadlineStyle(proj.deadline)}`}>
                      {proj.deadline}
                    </span>
                    <p className="text-[10px] font-bold text-slate-600 mt-1">{proj.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">No upcoming project deadlines</div>
            )
          )}
        </div>
      </div>

      <button 
        onClick={() => onNavigate?.(activeTab === 'renewals' ? 'billing' : 'projects')}
        className="w-full mt-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
      >
        View All {activeTab === 'renewals' ? 'Billing & Renewals' : 'Project Deadlines'}
      </button>
    </div>
  );
};
