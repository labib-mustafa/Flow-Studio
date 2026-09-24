import React, { useState, useRef, useEffect } from 'react';
import { Folder, ChevronDown, Search, X, Check, Globe } from 'lucide-react';
import { useProjectStore } from '../../../../stores/projectStore';

interface ProjectSelectorProps {
  isCompact?: boolean;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ isCompact = false }) => {
  const { currentProject, projects, setCurrentProject } = useProjectStore();
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };
    if (isProjectDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProjectDropdownOpen]);

  const filteredProjects = projects.filter(p => {
    const title = (p.title || p.name || '').toLowerCase();
    const client = (p.client || '').toLowerCase();
    const query = projectSearchQuery.toLowerCase().trim();
    return title.includes(query) || client.includes(query);
  });

  const activeDisplayName = currentProject ? (currentProject.title || currentProject.name) : 'Flow-Studio';

  return (
    <div className={`relative inline-flex items-center select-none ${isProjectDropdownOpen ? 'z-50' : ''}`} ref={projectDropdownRef}>
      <button
        type="button"
        onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer select-none group focus:outline-none"
        title={currentProject ? `Active Project: ${activeDisplayName}` : 'Flow-Studio (Universal Studio Scope)'}
      >
        <Folder className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0 stroke-[1.75]" />
        <span className="truncate max-w-[160px] sm:max-w-[220px] font-normal text-zinc-400 group-hover:text-zinc-200 transition-colors">
          {activeDisplayName}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-transform duration-150 shrink-0 ${isProjectDropdownOpen ? 'rotate-180 text-zinc-300' : ''
            }`}
        />
      </button>

      {/* Upward Popover */}
      {isProjectDropdownOpen && (
        <div className="absolute left-0 bottom-full mb-2 z-[350] w-[calc(100vw-36px)] max-w-[280px] sm:w-72 rounded-xl bg-[#141416] border border-zinc-800 shadow-2xl p-1.5 flex flex-col gap-1 text-left animate-in fade-in-0 zoom-in-95 duration-100 font-sans">
          {projects.length > 3 && (
            <div className="p-1 pb-1.5 border-b border-zinc-800 mb-0.5">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-[#101012] rounded-lg border border-zinc-800">
                <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <input
                  type="text"
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  placeholder="Filter projects..."
                  className="w-full text-[11px] bg-transparent outline-none text-zinc-200 placeholder:text-zinc-500"
                  autoFocus
                />
                {projectSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setProjectSearchQuery('')}
                    className="p-0.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
            {/* Flow-Studio (Universal Mode) Option */}
            <button
              type="button"
              onClick={() => {
                setCurrentProject(null);
                setIsProjectDropdownOpen(false);
                setProjectSearchQuery('');
              }}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer border mb-1 ${!currentProject
                ? 'bg-zinc-800 text-white border-zinc-700 shadow-2xs font-medium'
                : 'hover:bg-zinc-800/60 border-dashed border-zinc-800 text-zinc-300'
                }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <Globe className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-medium truncate ${!currentProject ? 'text-white' : 'text-zinc-200'}`}>
                    Flow-Studio (Universal)
                  </span>
                  <span className={`text-[10px] truncate ${!currentProject ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    Studio-wide AI • All projects & teams
                  </span>
                </div>
              </div>
              {!currentProject && <Check className="w-3.5 h-3.5 text-zinc-200 shrink-0" />}
            </button>

            {filteredProjects.map((p) => {
              const isSelected = p.id === currentProject?.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setCurrentProject(p);
                    setIsProjectDropdownOpen(false);
                    setProjectSearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${isSelected
                    ? 'bg-zinc-800 text-white font-medium shadow-2xs'
                    : 'hover:bg-zinc-800/60 text-zinc-300'
                    }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className={`text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                      {p.title || p.name}
                    </span>
                    <span className={`text-[10px] truncate ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Client: {p.client || 'Direct Client'}
                    </span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-zinc-200 shrink-0" />}
                </button>
              );
            })}

            {filteredProjects.length === 0 && (
              <div className="p-3 text-center text-xs text-zinc-500">
                No matching projects found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
