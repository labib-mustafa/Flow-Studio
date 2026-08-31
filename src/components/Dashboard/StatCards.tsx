import React from 'react';
import { motion } from 'motion/react';
import { useProjectStore } from '../../stores/projectStore';
import { useClientStore } from '../../stores/clientStore';
import { useBillingStore } from '../../stores/billingStore';
import { useLeadStore } from '../../stores/leadStore';

interface StatCardsProps {
  onNavigate?: (view: string) => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ onNavigate }) => {
  const { projects } = useProjectStore();
  const { clients } = useClientStore();
  const { balance, paymentHistory } = useBillingStore();
  const { leads } = useLeadStore();

  // Calculations memoized to avoid expensive filtering on every render
  const { activeProjects, avgCompletion, activeClients, prospectClients, collected, formattedCollected, formattedBalance, activeLeads, newLeadsCount } = React.useMemo(() => {
    const activeProjs = projects.filter(p => p.status !== 'Completed' && p.status !== 'Archived');
    const avgComp = activeProjs.length > 0
      ? Math.round(activeProjs.reduce((acc, p) => acc + (p.completion || p.progress || 0), 0) / activeProjs.length)
      : 0;

    const activeCls = clients.filter(c => c.status === 'Active');
    const prospectCls = clients.filter(c => c.status === 'Prospect');

    const col = paymentHistory
      .filter(p => p.status === 'Completed')
      .reduce((acc, p) => acc + p.amount, 0);

    return {
      activeProjects: activeProjs,
      avgCompletion: avgComp,
      activeClients: activeCls,
      prospectClients: prospectCls,
      collected: col,
      formattedCollected: col >= 1000 ? `${(col / 1000).toFixed(1)}k` : `${col}`,
      formattedBalance: balance >= 1000 ? `${(balance / 1000).toFixed(1)}k` : `${balance}`,
      activeLeads: leads.filter(l => l.status !== 'Archived'),
      newLeadsCount: leads.filter(l => l.status === 'New').length
    };
  }, [projects, clients, paymentHistory, balance, leads]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {/* Active Projects Card */}
      <div
        onClick={() => onNavigate?.('projects')}
        className="bg-dash-card-black text-white rounded-[24px] p-6 relative overflow-hidden min-h-[180px] flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all duration-200 ease-out hover:-translate-y-1"
      >
        <div className="flex justify-between items-start z-10">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <span className="material-symbols-outlined text-white">folder_copy</span>
          </div>
          <span className="px-2.5 py-1 bg-white/20 rounded-md text-[10px] font-bold tracking-wide">{projects.length} Total</span>
        </div>
        <div className="z-10 mt-4">
          <h2 className="text-4xl font-extrabold mb-1">{activeProjects.length}</h2>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Active Projects</p>
        </div>
        <div className="mt-4 z-10">
          <div className="flex justify-between text-[10px] text-white/70 font-semibold mb-1.5">
            <span>AVG COMPLETION</span>
            <span>{avgCompletion}%</span>
          </div>
          <div className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden">
            <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${avgCompletion}%` }}></div>
          </div>
        </div>
        <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] text-white/5 pointer-events-none group-hover:scale-110 transition-transform select-none">folder</span>
      </div>

      {/* Active Clients Card */}
      <div
        onClick={() => onNavigate?.('clients')}
        className="bg-dash-card-yellow text-slate-900 rounded-[24px] p-6 relative overflow-hidden min-h-[180px] flex flex-col justify-between cursor-pointer hover:shadow-xl transition-all duration-200 ease-out hover:-translate-y-1 group"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-sm tracking-tight">Active Clients</p>
          </div>
          <div className="size-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
            <span className="material-symbols-outlined text-xl text-black/60">group</span>
          </div>
        </div>
        <div className="flex items-end gap-4 mt-2">
          <div>
            <h2 className="text-4xl font-extrabold">{activeClients.length}</h2>
            <p className="text-[10px] font-bold uppercase opacity-60 tracking-wider">Total Active</p>
          </div>
          <div className="pb-1 border-l border-black/10 pl-4">
            <h2 className="text-2xl font-extrabold">{prospectClients.length}</h2>
            <p className="text-[10px] font-bold uppercase opacity-60 tracking-wider">Prospects</p>
          </div>
        </div>
        <div className="flex items-end gap-2 h-10 mt-4">
          <div className="w-2.5 h-4 bg-black/20 rounded-t-sm"></div>
          <div className="w-2.5 h-6 bg-black/20 rounded-t-sm"></div>
          <div className="w-2.5 h-3 bg-black/20 rounded-t-sm"></div>
          <div className="w-2.5 h-5 bg-black/20 rounded-t-sm"></div>
          <div className="w-2.5 h-8 bg-black rounded-t-sm"></div>
          <div className="w-2.5 h-4 bg-black/20 rounded-t-sm"></div>
          <div className="w-2.5 h-7 bg-black/40 rounded-t-sm"></div>
        </div>
      </div>

      {/* Revenue Summary Card */}
      <div
        onClick={() => onNavigate?.('billing')}
        className="bg-blue-100 border border-blue-300/70 text-blue-950 rounded-[24px] p-6 relative overflow-hidden min-h-[180px] flex flex-col justify-between cursor-pointer hover:shadow-xl hover:border-blue-400 transition-all duration-200 ease-out hover:-translate-y-1 group"
      >
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="font-bold text-sm tracking-tight text-blue-900">Revenue Summary</p>
            <span className="material-symbols-outlined text-blue-500 text-xl group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">arrow_outward</span>
          </div>
          <div className="flex gap-5">
            <div>
              <h3 className="text-3xl font-extrabold text-blue-600">${formattedCollected}</h3>
              <p className="text-[10px] text-blue-600 uppercase font-bold tracking-wider mt-0.5">Collected</p>
            </div>
            <div className="border-l border-blue-200/60 pl-5">
              <h3 className="text-3xl font-extrabold text-slate-900">${formattedBalance}</h3>
              <p className="text-[10px] text-blue-600 uppercase font-bold tracking-wider mt-0.5">Balance</p>
            </div>
          </div>
        </div>
        <div className="relative h-14 w-full mt-3 flex items-end">
          {/* Historical bar chart would go here once data is available */}
        </div>
      </div>

      {/* Pipeline Card */}
      <div
        onClick={() => onNavigate?.('leads')}
        className="bg-emerald-100 border border-emerald-300/70 text-emerald-950 rounded-[24px] p-6 relative overflow-hidden min-h-[180px] flex flex-col justify-between cursor-pointer hover:shadow-xl hover:border-emerald-400 transition-all duration-200 ease-out hover:-translate-y-1 group"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-sm tracking-tight text-emerald-900">Pipeline & Leads</p>
          </div>
          <span className="material-symbols-outlined text-emerald-600 text-xl group-hover:translate-x-0.5 transition-transform">trending_up</span>
        </div>
        <div className="mt-3">
          <h2 className="text-4xl font-extrabold text-emerald-900">{activeLeads.length}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">Active Leads</span>
            {newLeadsCount > 0 && (
              <span className="px-2 py-0.5 bg-emerald-200/80 rounded-full text-[9px] font-bold text-emerald-900">+{newLeadsCount} New</span>
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-end text-[10px] font-bold uppercase text-emerald-700 mb-1">
            <span>Conversion Activity</span>
            <span>Active</span>
          </div>
          <div className="w-full h-1.5 bg-emerald-200/60 rounded-full">
            <div className="h-full bg-emerald-600 rounded-full w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
