import React from 'react';
import { useTimeStore } from '../../stores/timeStore';
import { Clock, CheckCircle2, MoreVertical } from 'lucide-react';

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatTimeOfDay = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const TimeLedger: React.FC = () => {
  const { entries } = useTimeStore();

  return (
    <div className="flex-1 overflow-y-auto px-8 py-10 relative">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Today's Ledger</h2>
            <p className="text-sm font-medium text-slate-500">Tracked hours and completed tasks</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer">
            <Clock className="size-3.5" />
            Add Manual Entry
          </button>
        </div>

        {/* Timeline */}
        {entries.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="size-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">No entries yet</h3>
            <p className="text-xs text-slate-500">Your logged time will appear here like a continuous receipt.</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-10 before:content-[''] before:absolute before:top-0 before:-left-[9px] before:w-4 before:h-4 before:rounded-full before:bg-white before:border-4 before:border-slate-300">
            {entries.map((entry, idx) => (
              <div key={entry.id} className="relative group">
                {/* Timeline node */}
                <div className="absolute top-1.5 -left-[33px] w-3 h-3 rounded-full bg-white border-2 border-slate-300 group-hover:border-emerald-500 transition-colors z-10" />
                
                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-semibold tracking-tight text-slate-400 mb-1">
                        {formatTimeOfDay(entry.startTime)} — {entry.endTime ? formatTimeOfDay(entry.endTime) : 'Running'}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">{entry.taskTitle}</h4>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono text-lg font-bold text-slate-800 tracking-tighter">
                        {formatDuration(entry.durationSeconds)}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
                        <CheckCircle2 className="size-3" />
                        Logged
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span className="text-xs font-medium text-slate-600">{entry.projectTitle}</span>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <MoreVertical className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
};
