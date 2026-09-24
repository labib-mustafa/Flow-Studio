import React from 'react';
import { Sparkles, MessageSquare, Wrench, GraduationCap, PanelRightClose, Maximize2, X } from 'lucide-react';
import { MainViewMode } from '../types';

interface CopilotHeaderProps {
  mainView: MainViewMode;
  setMainView: (view: MainViewMode) => void;
  isPinnedRightDrawer: boolean;
  togglePinSideDrawer: () => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onClose: () => void;
  isCompact: boolean;
  isUltraCompact: boolean;
  isMobileScreen: boolean;
  rulesCount: number;
  onDragStart: (e: React.MouseEvent) => void;
}

export const CopilotHeader: React.FC<CopilotHeaderProps> = ({
  mainView,
  setMainView,
  isPinnedRightDrawer,
  togglePinSideDrawer,
  isMaximized,
  onToggleMaximize,
  onClose,
  isCompact,
  isUltraCompact,
  isMobileScreen,
  rulesCount,
  onDragStart
}) => {
  return (
    <div
      onMouseDown={onDragStart}
      onDoubleClick={!isPinnedRightDrawer ? onToggleMaximize : undefined}
      className={`h-13 px-3 sm:px-4.5 bg-black border-b border-zinc-800/80 flex items-center justify-between shrink-0 select-none gap-2 ${isMobileScreen || isMaximized || isPinnedRightDrawer ? '' : 'cursor-grab active:cursor-grabbing'
        }`}
    >
      {/* Brand Pill */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-100 tracking-tight font-display flex items-center gap-1.5">
              Nova
            </span>
          </div>
        </div>
      </div>

      {/* Controls & View Switcher */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <div className="flex items-center bg-[#141416] border border-zinc-800/80 p-0.5 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setMainView('chat')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${mainView === 'chat' ? 'bg-zinc-800 text-white shadow-2xs border border-zinc-700/60' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            title="Chat with Personal Agent"
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            {!isCompact && <span>Chat</span>}
          </button>

          <button
            type="button"
            onClick={() => setMainView('tools')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${mainView === 'tools' ? 'bg-zinc-800 text-white shadow-2xs border border-zinc-700/60' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            title="Generator Tools (Tasks, Brief, Moodboard)"
          >
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            {!isCompact && <span>Tools</span>}
          </button>

          <button
            type="button"
            onClick={() => setMainView('train')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${mainView === 'train' ? 'bg-zinc-800 text-white shadow-2xs border border-zinc-700/60' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            title="Nova Training Studio (Custom Rules & Truths)"
          >
            <GraduationCap className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            {!isCompact && <span>Train</span>}
            <span className="text-[9px] bg-zinc-900 text-zinc-300 border border-zinc-700 px-1.5 py-0.2 rounded-full font-medium">
              {rulesCount}
            </span>
          </button>
        </div>

        {!isMobileScreen && (
          <button
            type="button"
            onClick={togglePinSideDrawer}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center shrink-0 cursor-pointer ${isPinnedRightDrawer
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-2xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            title={isPinnedRightDrawer ? 'Pinned as Right Side Drawer (Click to unpin)' : 'Pin as Right Side Drawer'}
          >
            <PanelRightClose className="w-3.5 h-3.5" />
          </button>
        )}

        {!isMobileScreen && !isUltraCompact && !isPinnedRightDrawer && (
          <button
            type="button"
            onClick={onToggleMaximize}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors shrink-0 cursor-pointer"
            title={isMaximized ? 'Restore window size' : 'Maximize window'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors ml-0.5 shrink-0 cursor-pointer"
          title="Close Co-Pilot"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
