import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore, useWorkspaceRegistry } from '../../stores/workspaceStore';
import { useProjectStore } from '../../stores/projectStore';
import { ChevronDown, Settings, Plus, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';

interface WorkspacePillProps {
  isCollapsed: boolean;
  onOpenSettings: () => void;
}

export const WorkspacePill: React.FC<WorkspacePillProps> = ({ isCollapsed, onOpenSettings }) => {
  const workspace = useWorkspaceStore();
  const { workspaces, activeWorkspaceId, switchWorkspace } = useWorkspaceRegistry();
  const projectsCount = useProjectStore((state) => state.projects.length);

  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const studioName = workspace.name || 'Flow Studio';
  const hasCustomLogo = Boolean(workspace.logo);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Workspace Header Button */}
      {isCollapsed ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={`${studioName} — Flow Studio`}
          className="size-10 mx-auto rounded-xl bg-zinc-950 border border-zinc-800 p-1 flex items-center justify-center hover:border-zinc-700 transition-all cursor-pointer shadow-2xs group relative"
        >
          {hasCustomLogo ? (
            <img src={workspace.logo} alt={studioName} className="size-full object-cover rounded-lg" />
          ) : (
            <img src="/logo.png" alt="Flow Studio Logo" className="size-full object-contain p-1" />
          )}
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-white" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-slate-100/90 transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative size-9 rounded-md overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
              {hasCustomLogo ? (
                <img src={workspace.logo} alt={studioName} className="size-full object-cover" />
              ) : (
                <img src="/logo.png" alt="Flow Studio" className="size-full object-contain" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-bold text-slate-900 truncate tracking-tight leading-tight">
                {studioName}
              </h2>
              <p className="text-[10.5px] font-medium text-slate-400 flex items-center gap-1.5 mt-0.5 leading-none">
                <span className="text-slate-500">Flow Studio</span>
                <span className="size-1 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Active</span>
              </p>
            </div>
          </div>

          <ChevronDown
            size={14}
            className={`text-slate-400 group-hover:text-slate-700 transition-transform duration-200 shrink-0 mr-1 ${
              isOpen ? 'rotate-180 text-slate-800' : ''
            }`}
          />
        </button>
      )}

      {/* Popover Switcher Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isCollapsed ? 0 : 4, x: isCollapsed ? 6 : 0, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: isCollapsed ? 0 : 4, x: isCollapsed ? 6 : 0, scale: 0.98 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className={`absolute z-[999] bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden p-1.5 text-left ${
              isCollapsed
                ? 'top-0 left-full ml-3 w-64 shadow-2xl'
                : 'top-full left-0 right-0 mt-1.5 w-full'
            }`}
          >
            {/* Popover Header */}
            <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspaces</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                {workspaces.length} {workspaces.length === 1 ? 'Studio' : 'Studios'}
              </span>
            </div>

            {/* Workspaces List */}
            <div className="max-h-52 overflow-y-auto py-1 space-y-0.5 custom-scrollbar">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      if (!isActive) switchWorkspace(ws.id);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left group ${
                      isActive ? 'bg-slate-100/90 font-medium' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="size-7 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-zinc-950 border border-zinc-800 shadow-2xs">
                        {ws.logo ? (
                          <img src={ws.logo} alt={ws.name} className="size-full object-cover" />
                        ) : (
                          <img src="/logo.png" alt={ws.name} className="size-full object-contain p-0.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pr-1">
                        <p className={`text-xs truncate leading-tight ${isActive ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                          {ws.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                          {isActive ? `${projectsCount} Projects` : ws.tagline || 'Studio'}
                        </p>
                      </div>
                    </div>
                    {isActive && <Check className="size-3.5 text-emerald-600 shrink-0 ml-1.5" />}
                  </button>
                );
              })}
            </div>

            {/* Actions: Add Workspace & Settings */}
            <div className="pt-1 mt-1 border-t border-slate-100 space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsCreateOpen(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="size-3.5 text-slate-500" />
                <span>Create New Workspace</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer"
              >
                <Settings className="size-3.5 text-slate-500" />
                <span>Studio & Workspace Settings</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
};
