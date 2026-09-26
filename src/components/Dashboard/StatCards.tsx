import React from 'react';
import { useStatCardsData } from './statCardsHelpers';
import {
  RevenueTrendChart,
  PipelineFunnelChart,
  ProjectMilestoneTrack
} from './StatCardCharts';

interface StatCardsProps {
  onNavigate?: (view: string) => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ onNavigate }) => {
  const {
    projectsCount,
    activeProjects,
    avgCompletion,
    projectPhases,
    activeClients,
    prospectClients,
    activeRatio,
    formattedCollected,
    formattedBalance,
    collectionRate,
    revenueMonths,
    activeLeads,
    newLeadsCount,
    conversionRate,
    leadStages
  } = useStatCardsData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {/* ── 1. Active Projects Card ── */}
      <div
        onClick={() => onNavigate?.('projects')}
        className="bg-dash-card-black text-white rounded-[24px] p-6 relative overflow-hidden min-h-[220px] flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all duration-200 ease-out hover:-translate-y-1"
      >
        <div className="flex justify-between items-start z-10">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <span className="material-symbols-outlined text-white">folder_copy</span>
          </div>
          <span className="px-2.5 py-1 bg-white/20 rounded-md text-[10px] font-bold tracking-wide">{projectsCount} Total</span>
        </div>
        <div className="z-10 mt-3">
          <h2 className="text-4xl font-extrabold mb-0.5">{activeProjects.length}</h2>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Active Projects</p>
        </div>
        <div className="mt-3 z-10">
          <div className="flex justify-between text-[10px] text-white/70 font-semibold mb-1.5">
            <span>AVG COMPLETION</span>
            <span>{avgCompletion}%</span>
          </div>
          <div className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden">
            <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${avgCompletion}%` }} />
          </div>
        </div>
        <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] text-white/5 pointer-events-none group-hover:scale-110 transition-transform select-none">folder</span>
      </div>

      {/* ── 2. Active Clients Card ── */}
      <div
        onClick={() => onNavigate?.('clients')}
        className="bg-dash-card-yellow text-slate-900 rounded-[24px] p-6 relative overflow-hidden min-h-[220px] flex flex-col justify-between cursor-pointer hover:shadow-xl transition-all duration-200 ease-out hover:-translate-y-1 group"
      >
        <div className="flex justify-between items-start">
          <p className="font-bold text-sm tracking-tight">Active Clients</p>
          <div className="size-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
            <span className="material-symbols-outlined text-xl text-black/60">group</span>
          </div>
        </div>
        <div className="flex items-end gap-4 mt-1">
          <div>
            <h2 className="text-4xl font-extrabold">{activeClients.length}</h2>
            <p className="text-[10px] font-bold uppercase opacity-60 tracking-wider">Total Active</p>
          </div>
          <div className="pb-1 border-l border-black/10 pl-4">
            <h2 className="text-2xl font-extrabold">{prospectClients.length}</h2>
            <p className="text-[10px] font-bold uppercase opacity-60 tracking-wider">Prospects</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-bold uppercase opacity-60 tracking-wider mb-1.5">
            <span>Active Ratio</span>
            <span>{activeRatio}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-black/10">
            <div className="h-full bg-black/70 transition-all duration-500" style={{ width: `${activeRatio}%` }} />
            <div className="h-full bg-black/25 flex-1" />
          </div>
        </div>
      </div>

      {/* ── 3. Revenue Summary Card ── */}
      <div
        onClick={() => onNavigate?.('billing')}
        className="bg-[#d4e4ff] border border-blue-300/70 text-blue-950 rounded-[24px] p-6 relative overflow-hidden min-h-[220px] flex flex-col justify-between cursor-pointer hover:shadow-xl hover:border-blue-400 transition-all duration-200 ease-out hover:-translate-y-1 group"
      >
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-sm tracking-tight text-blue-900">Revenue Summary</p>
            <span className="material-symbols-outlined text-blue-700 text-xl group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">arrow_outward</span>
          </div>
          <div className="flex gap-5">
            <div>
              <h3 className="text-3xl font-extrabold text-blue-700">${formattedCollected}</h3>
              <p className="text-[10px] text-blue-800 uppercase font-bold tracking-wider mt-0.5">Collected</p>
            </div>
            <div className="border-l border-blue-300 pl-5">
              <h3 className="text-3xl font-extrabold text-blue-950">${formattedBalance}</h3>
              <p className="text-[10px] text-blue-800 uppercase font-bold tracking-wider mt-0.5">Balance</p>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-blue-900/70 font-semibold mb-1.5">
            <span>COLLECTION RATE</span>
            <span>{collectionRate}%</span>
          </div>
          <div className="w-full bg-blue-900/15 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-700 h-full rounded-full transition-all duration-500" style={{ width: `${collectionRate}%` }} />
          </div>
          <RevenueTrendChart months={revenueMonths} />
        </div>
      </div>

      {/* ── 4. Pipeline & Leads Card ── */}
      <div
        onClick={() => onNavigate?.('leads')}
        className="bg-[#c4e487] border border-lime-600/50 text-lime-950 rounded-[24px] p-6 relative overflow-hidden min-h-[220px] flex flex-col justify-between cursor-pointer hover:shadow-xl hover:border-lime-700/70 transition-all duration-200 ease-out hover:-translate-y-1 group"
      >
        <div className="flex justify-between items-start">
          <p className="font-bold text-sm tracking-tight text-lime-900">Pipeline & Leads</p>
          <span className="material-symbols-outlined text-lime-700 text-xl group-hover:translate-x-0.5 transition-transform">trending_up</span>
        </div>
        <div className="mt-1">
          <h2 className="text-4xl font-extrabold text-lime-950">{activeLeads.length}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold uppercase text-lime-800 tracking-wider">Active Leads</span>
            {newLeadsCount > 0 && (
              <span className="px-2 py-0.5 bg-lime-900/15 rounded-full text-[9px] font-bold text-lime-900">+{newLeadsCount} New</span>
            )}
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-lime-900/75 font-semibold mb-1.5">
            <span>CONVERSION RATE</span>
            <span>{conversionRate}%</span>
          </div>
          <div className="w-full bg-lime-900/15 h-1.5 rounded-full overflow-hidden">
            <div className="bg-lime-700 h-full rounded-full transition-all duration-500" style={{ width: `${conversionRate}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
