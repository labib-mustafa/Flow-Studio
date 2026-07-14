import React, { useEffect, useState } from 'react';
import { useTimeStore } from '../../stores/timeStore';
import { useProjectStore } from '../../stores/projectStore';
import { Play, Square, Pause, Plus, MoreHorizontal } from 'lucide-react';

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return { h, m, s };
};

export const ActiveTimer: React.FC = () => {
  const { activeTimer, startTimer, stopTimer } = useTimeStore();
  const { projects } = useProjectStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeTimer) {
      setElapsed(0);
      return;
    }

    const updateTimer = () => {
      setElapsed(Math.floor((Date.now() - activeTimer.startTime) / 1000));
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const { h, m, s } = formatTime(elapsed);

  // When no timer is active, show the "Start a Timer" interface
  if (!activeTimer) {
    return (
      <div className="flex flex-col h-full bg-[#111827] rounded-3xl p-8 lg:p-12 text-slate-300 relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50" />
        
        <div className="flex-1 flex flex-col justify-center max-w-sm">
          <div className="mb-6">
            <h2 className="text-3xl font-light tracking-tight text-white mb-2">Chronograph</h2>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Awaiting Input</p>
          </div>

          <div className="font-mono text-7xl font-light text-slate-800 opacity-50 mb-10 tracking-tighter">
            00:00<span className="text-4xl text-slate-700">:00</span>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => startTimer(projects[0]?.id || 'p1', projects[0]?.title || 'Internal', 'General Task')}
              className="w-full group relative flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="size-4" fill="currentColor" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white">Start New Timer</div>
                  <div className="text-xs text-slate-500">Pick a project to begin</div>
                </div>
              </div>
              <Plus className="size-5 text-slate-600 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Timer UI
  return (
    <div className="flex flex-col h-full bg-[#111827] rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800 group">
      {/* Decorative scanning line effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-20" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-80 shadow-[0_0_15px_rgba(249,115,22,0.8)]" />

      <div className="flex-1 flex flex-col justify-center relative z-10 max-w-lg">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="size-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
          <span className="text-xs font-bold text-orange-500 tracking-[0.2em] uppercase">Recording</span>
        </div>

        {/* The Massive Timer */}
        <div className="font-mono text-7xl sm:text-8xl lg:text-[7rem] font-light tracking-tighter leading-none mb-10 text-white drop-shadow-md">
          {h}:{m}<span className="text-4xl sm:text-5xl lg:text-7xl text-slate-400">:{s}</span>
        </div>

        {/* Current Task Details */}
        <div className="mb-12 border-l-2 border-orange-500/50 pl-5">
          <h3 className="text-2xl font-bold tracking-tight mb-1 truncate">{activeTimer.taskTitle}</h3>
          <p className="text-sm text-slate-400 font-medium tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" />
            {activeTimer.projectTitle}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => stopTimer()}
            className="flex-1 max-w-[200px] flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-slate-900 py-4 px-6 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Square className="size-4" fill="currentColor" />
            Stop Timer
          </button>
          
          <button className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer">
            <Pause className="size-5" fill="currentColor" />
          </button>
          
          <button className="w-14 h-14 flex items-center justify-center rounded-2xl bg-transparent hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer ml-auto">
            <MoreHorizontal className="size-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
