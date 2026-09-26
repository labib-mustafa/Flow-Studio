import React, { useState } from 'react';

export interface ClientBarItem {
  label: string;
  count: number;
  subtitle: string;
}

export interface RevenueMonthItem {
  month: string;
  year: number;
  revenue: number;
  isCurrent: boolean;
}

export interface PipelineStageItem {
  label: string;
  name: string;
  count: number;
}

export interface ProjectPhaseItem {
  name: string;
  count: number;
}

/* ─── Client Activity / Workload Mini Chart ─────────────────────── */
export const ClientActivityChart: React.FC<{ bars: ClientBarItem[] }> = ({ bars }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxCount = Math.max(...bars.map(b => b.count), 1);

  const activeSubtitle = hoveredIdx !== null && bars[hoveredIdx]
    ? bars[hoveredIdx].subtitle
    : 'Weekly Activity';

  return (
    <div className="w-full mt-2" onMouseLeave={() => setHoveredIdx(null)}>
      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-slate-800/70 mb-1.5">
        <span>Load / Touchpoints</span>
        <span className="text-slate-900 font-extrabold truncate max-w-[130px] text-right">{activeSubtitle}</span>
      </div>
      <div className="flex items-end gap-1.5 h-8 w-full">
        {bars.map((bar, idx) => {
          const heightPct = bar.count > 0 ? Math.max(Math.round((bar.count / maxCount) * 100), 22) : 12;
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
            >
              <div
                className={`w-full rounded-t-sm transition-all duration-200 ${isHovered ? 'bg-black scale-y-105 shadow-sm' : bar.count > 0 ? 'bg-black/75 group-hover:bg-black' : 'bg-black/20 group-hover:bg-black/35'
                  }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── 6-Month Historical Revenue Mini Chart ─────────────────────── */
export const RevenueTrendChart: React.FC<{ months: RevenueMonthItem[] }> = ({ months }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxRev = Math.max(...months.map(m => m.revenue), 1);

  const activeSubtitle = hoveredIdx !== null && months[hoveredIdx]
    ? `${months[hoveredIdx].month} '${String(months[hoveredIdx].year).slice(2)}: $${months[hoveredIdx].revenue.toLocaleString()}`
    : '6-Month Trend';

  return (
    <div className="w-full mt-2" onMouseLeave={() => setHoveredIdx(null)}>
      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-blue-800/80 mb-1.5">
        <span>Monthly Performance</span>
        <span className="text-blue-950 font-extrabold truncate max-w-[130px] text-right">{activeSubtitle}</span>
      </div>
      <div className="flex items-end gap-2 h-9 w-full">
        {months.map((m, idx) => {
          const heightPct = m.revenue > 0 ? Math.max(Math.round((m.revenue / maxRev) * 100), 22) : 12;
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
            >
              <div
                className={`w-full rounded-t-sm transition-all duration-200 ${isHovered
                  ? 'bg-blue-700 scale-y-105 shadow-sm'
                  : m.isCurrent
                    ? 'bg-blue-600'
                    : m.revenue > 0
                      ? 'bg-blue-500/80 group-hover:bg-blue-600'
                      : 'bg-blue-900/15 group-hover:bg-blue-900/25'
                  }`}
                style={{ height: `${heightPct}%` }}
              />
              <span className={`text-[8px] font-bold mt-1 tracking-tight ${m.isCurrent ? 'text-blue-900 font-extrabold' : 'text-blue-800/80'}`}>
                {m.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Pipeline Stage Distribution Mini Chart ─────────────────────── */
export const PipelineFunnelChart: React.FC<{ stages: PipelineStageItem[] }> = ({ stages }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  const activeSubtitle = hoveredIdx !== null && stages[hoveredIdx]
    ? `${stages[hoveredIdx].name}: ${stages[hoveredIdx].count}`
    : 'Funnel Stages';

  const stageColors = [
    'bg-emerald-400 group-hover:bg-emerald-500',
    'bg-emerald-500 group-hover:bg-emerald-600',
    'bg-emerald-600 group-hover:bg-emerald-700',
    'bg-emerald-700 group-hover:bg-emerald-800'
  ];

  return (
    <div className="w-full mt-2" onMouseLeave={() => setHoveredIdx(null)}>
      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-emerald-800/80 mb-1.5">
        <span className="text-emerald-950 font-extrabold truncate max-w-[130px] text-right">{activeSubtitle}</span>
      </div>
    </div>
  );
};

/* ─── Project Delivery Milestone Mini Indicators ─────────────────── */
export const ProjectMilestoneTrack: React.FC<{ phases: ProjectPhaseItem[] }> = ({ phases }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const activeSubtitle = hoveredIdx !== null && phases[hoveredIdx]
    ? `${phases[hoveredIdx].name}: ${phases[hoveredIdx].count}`
    : 'Phase Status';

  return (
    <div className="w-full mt-2" onMouseLeave={() => setHoveredIdx(null)}>
      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-white/60 mb-1.5">
        <span>Phases</span>
        <span className="text-white font-extrabold truncate max-w-[130px] text-right">{activeSubtitle}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {phases.map((phase, idx) => {
          const isHovered = hoveredIdx === idx;
          const hasProjects = phase.count > 0;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              className={`py-1 rounded text-center cursor-pointer transition-all duration-200 ${isHovered
                ? 'bg-white text-slate-900 font-extrabold scale-105'
                : hasProjects
                  ? 'bg-white/20 text-white font-bold hover:bg-white/30'
                  : 'bg-white/10 text-white/40'
                }`}
            >
              <span className="text-[8px] block uppercase truncate px-1">
                {phase.name.slice(0, 4)}: {phase.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
