import React from 'react';
import { Search, Plus, FolderBookmark } from 'lucide-react';

interface ProjectsHeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onNewProject?: () => void;
}

export const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({
  searchQuery = '',
  onSearchChange,
  onNewProject,
}) => {
  return (
    <header className="px-6 py-4 bg-white border-b border-slate-200/80 flex items-center justify-between gap-4 shrink-0 z-20 sticky top-0 relative">
      <div className="flex items-center gap-2 w-1/3">
        <FolderBookmark className="size-5 text-slate-900 shrink-0" />
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Project Board</h2>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="relative group w-full max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search Projects..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange?.('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center hover:text-slate-700 text-slate-400"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 w-1/3">
        <button
          onClick={onNewProject}
          className="bg-slate-950 hover:bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md flex items-center gap-2 outline-none border border-slate-950 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>New Project</span>
        </button>
      </div>
    </header>
  );
};
