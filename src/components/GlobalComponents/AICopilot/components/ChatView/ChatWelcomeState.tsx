import React from 'react';
import { Sparkles, Zap, ArrowRight } from 'lucide-react';

interface ChatWelcomeStateProps {
  lastSavedPrompt: string;
  onQuickPrompt: (prompt: string) => void;
  onNavigateToTrain: () => void;
}

export const ChatWelcomeState: React.FC<ChatWelcomeStateProps> = ({
  lastSavedPrompt,
  onQuickPrompt,
  onNavigateToTrain
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto select-none">
      <div className="w-12 h-12 rounded-2xl bg-[#141416] border border-zinc-800 text-zinc-200 flex items-center justify-center shadow-lg mb-3">
        <Sparkles className="w-5 h-5 text-zinc-300" />
      </div>
      <h4 className="text-sm font-semibold text-zinc-100 mb-1 font-display flex items-center gap-2">
        Meet Nova — Flow Studio Agent
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800">
          Fast-Path
        </span>
      </h4>
      <p className="text-xs text-zinc-400 max-w-sm mb-5">
        Zero-latency autonomous actions (schedule tasks, create projects, set meetings, run timers) plus creative design assistance.
      </p>

      {/* Suggestion Chips */}
      <div className="flex flex-col gap-2 w-full max-w-md">
        {lastSavedPrompt && (
          <button
            type="button"
            onClick={() => onQuickPrompt(lastSavedPrompt)}
            className="p-2.5 rounded-xl border border-zinc-800 bg-[#141416] hover:bg-[#18181b] hover:border-zinc-700 text-left text-xs text-zinc-200 flex items-center justify-between transition-all cursor-pointer group shadow-2xs mb-1"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium truncate">Repeat Last Prompt: "{lastSavedPrompt}"</span>
            </div>
            <span className="text-[10px] text-zinc-300 font-medium bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded shrink-0">Click to run</span>
          </button>
        )}

        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 text-left flex items-center gap-1">
          <Zap className="w-3 h-3 text-zinc-400" /> Commands (Instant Execution):
        </span>
        <button
          type="button"
          onClick={() => onQuickPrompt('schedule task Homepage Redesign for Friday')}
          className="p-2.5 rounded-xl border border-zinc-800 bg-[#121214] hover:bg-[#18181b] hover:border-zinc-700 text-left text-xs text-zinc-300 flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
        >
          <span className="font-medium">📋 "schedule task Homepage Redesign for Friday"</span>
          <span className="text-[10px] text-zinc-400 font-medium bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded">instant</span>
        </button>

        <button
          type="button"
          onClick={() => onQuickPrompt('schedule meeting Client Kickoff on Monday at 2pm')}
          className="p-2.5 rounded-xl border border-zinc-800 bg-[#121214] hover:bg-[#18181b] hover:border-zinc-700 text-left text-xs text-zinc-300 flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
        >
          <span className="font-medium">📅 "schedule meeting Client Kickoff on Monday at 2pm"</span>
          <span className="text-[10px] text-zinc-400 font-medium bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded">instant</span>
        </button>

        <button
          type="button"
          onClick={() => onQuickPrompt('create project named Nova Mobile App for client Acme')}
          className="p-2.5 rounded-xl border border-zinc-800 bg-[#121214] hover:bg-[#18181b] hover:border-zinc-700 text-left text-xs text-zinc-300 flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
        >
          <span className="font-medium">📁 "create project named Nova Mobile App for client Acme"</span>
          <span className="text-[10px] text-zinc-400 font-medium bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded">instant</span>
        </button>

        <button
          type="button"
          onClick={() => onQuickPrompt('start timer for Brand Identity Review')}
          className="p-2.5 rounded-xl border border-zinc-800 bg-[#121214] hover:bg-[#18181b] hover:border-zinc-700 text-left text-xs text-zinc-300 flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
        >
          <span className="font-medium">⏱ "start timer for Brand Identity Review"</span>
          <span className="text-[10px] text-zinc-400 font-medium bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded">instant</span>
        </button>

        <button
          type="button"
          onClick={() => onQuickPrompt('drop a Scandinavian limestone color palette on the moodboard')}
          className="p-2.5 rounded-xl border border-zinc-800 bg-[#121214] hover:bg-[#18181b] hover:border-zinc-700 text-left text-xs text-zinc-300 flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
        >
          <span className="font-medium">🎨 "drop a Scandinavian limestone color palette on the moodboard"</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          type="button"
          onClick={onNavigateToTrain}
          className="p-2.5 rounded-xl border border-zinc-800 bg-[#121214] hover:bg-[#18181b] hover:border-zinc-700 text-left text-xs text-zinc-300 flex items-center justify-between transition-all cursor-pointer group shadow-2xs"
        >
          <span className="font-medium">🎓 Teach Nova: "/train survey meeting -&gt; schedule meeting..."</span>
          <span className="text-[10px] text-zinc-300 font-medium bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded">Training Studio</span>
        </button>
      </div>
    </div>
  );
};
