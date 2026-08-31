import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus, FolderOpen, Folder, Archive, Edit3, Pin, Copy, CheckCircle2, Trash2, RotateCw, ChevronRight, XCircle, Filter } from 'lucide-react';
import { ProjectsHeader } from './ProjectsHeader';
import { ProjectCard } from './ProjectCard';
import { useProjectStore } from '../../../stores/projectStore';
import { useTaskStore } from '../../../stores/taskStore';
import { PillTab } from '../../GlobalComponents/PillTab';
import { confirm } from '../../../stores/confirmStore';

interface ProjectsProps {
  onNewProject: () => void;
  onProjectClick: () => void;
  onEditProject: (project: any) => void;
}

export type SearchField = 'title' | 'client' | 'deadline' | 'category' | 'status';
export type ProjectTab = 'All' | 'Active' | 'On Hold' | 'Completed' | 'Archived';

export const Projects: React.FC<ProjectsProps> = ({ onNewProject, onProjectClick, onEditProject }) => {
  const { projects, setCurrentProject, deleteProject, togglePinProject, duplicateProject, updateProject } = useProjectStore();
  const { tasks } = useTaskStore();
  const [localSearch, setLocalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    project?: any;
    type: 'project' | 'background';
  } | null>(null);
  const [statusSubmenuOpen, setStatusSubmenuOpen] = useState(false);
  const [filterSubmenuOpen, setFilterSubmenuOpen] = useState(false);

  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null);
      setStatusSubmenuOpen(false);
      setFilterSubmenuOpen(false);
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('scroll', handleGlobalClick, true);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('scroll', handleGlobalClick, true);
    };
  }, []);

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'background'
    });
    setStatusSubmenuOpen(false);
    setFilterSubmenuOpen(false);
  };

  const handleProjectContextMenu = (e: React.MouseEvent, project: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      project,
      type: 'project'
    });
    setStatusSubmenuOpen(false);
    setFilterSubmenuOpen(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(localSearch);
    }, 150);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const [searchFields, setSearchFields] = useState<SearchField[]>(['title', 'client', 'deadline', 'category', 'status']);
  const [activeTab, setActiveTab] = useState<ProjectTab>('All');

  const getTabForStatus = (status: string): ProjectTab => {
    const s = status.toLowerCase();
    if (s.includes('archive')) return 'Archived';
    if (s.includes('hold') || s.includes('paused')) return 'On Hold';
    if (s.includes('complete') || s.includes('done')) return 'Completed';
    return 'Active';
  };

  const handleOpenFolder = async (project: any) => {
    const titleOrName = project.title || project.name || 'Untitled Project';

    // Desktop (Electron): use dedicated IPC call that calls shell.openPath directly
    if ((window as any).electronAPI?.projects?.openFolder) {
      try {
        const res = await (window as any).electronAPI.projects.openFolder(project.id, titleOrName);
        if (res?.success) return;
      } catch (e) {
        console.error('Failed to open folder via Electron IPC:', e);
      }
    }

    // Web / local server fallback: call backend which uses child_process exec
    try {
      const res = await fetch('/api/projects/open-explorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, projectName: titleOrName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) return;
      }
    } catch (e) {
      console.error('Failed to open folder via backend API:', e);
    }

    // Last resort: open project overview in-app
    setCurrentProject(project);
    onProjectClick();
  };

  const filteredProjects = useMemo(() => {
    let p = projects;

    // First apply tab filter
    if (activeTab !== 'All') {
      p = p.filter(p => getTabForStatus(p.status) === activeTab);
    }

    // Then apply search query
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      p = p.filter(project => {
        if (searchFields.length === 0) return false;
        return searchFields.some(field => {
          const val = project[field as keyof typeof project];
          return typeof val === 'string' && val.toLowerCase().includes(query);
        });
      });
    }

    return [...p].sort((a, b) => {
      const pinA = a.isPinned ? 1 : 0;
      const pinB = b.isPinned ? 1 : 0;

      if (pinA !== pinB) {
        return pinB - pinA; // Pinned (1) before unpinned (0)
      }

      if (a.isPinned) {
        const timeA = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
        const timeB = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
        return timeB - timeA; // Latest pinned project first
      } else {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA; // Latest created project first
      }
    });
  }, [debouncedSearch, searchFields, activeTab, projects]);

  // ResizeObserver for dynamic column count in grid
  const [containerWidth, setContainerWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return Math.max(320, window.innerWidth - 280);
    }
    return 800;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.getBoundingClientRect().width);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const cols = containerWidth < 640 ? 1 : containerWidth < 768 ? 2 : containerWidth < 1024 ? 3 : 4;

  const chunkedRows = useMemo(() => {
    const chunks: any[][] = [];
    for (let i = 0; i < filteredProjects.length; i += cols) {
      chunks.push(filteredProjects.slice(i, i + cols));
    }
    return chunks;
  }, [filteredProjects, cols]);

  const rowVirtualizer = useVirtualizer({
    count: chunkedRows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 420,
    overscan: 3,
  });

  const counts: Record<ProjectTab, number> = useMemo(() => {
    const c = { 'All': projects.length, 'Active': 0, 'On Hold': 0, 'Completed': 0, 'Archived': 0 };
    projects.forEach(p => {
      c[getTabForStatus(p.status)]++;
    });
    return c;
  }, [projects]);

  const getGridCols = (count: number) => {
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full';
  };

  const posX = contextMenu ? Math.min(contextMenu.x, window.innerWidth - 230) : 0;
  const posY = contextMenu ? Math.min(contextMenu.y, window.innerHeight - 300) : 0;

  return (
    <div 
      className="flex flex-col h-full overflow-hidden relative bg-[#f5f5f7] w-full"
      onContextMenu={handleBackgroundContextMenu}
    >
      <ProjectsHeader
        searchQuery={localSearch}
        onSearchChange={setLocalSearch}
        onNewProject={onNewProject}
      />
      <div 
        ref={containerRef}
        className="bg-white flex-1 overflow-y-auto px-8 py-6 relative custom-scrollbar flex flex-col "
      >
        <div className="mb-6 flex flex-wrap items-center gap-2 shrink-0">
          {(['All', 'Active', 'On Hold', 'Completed', 'Archived'] as const).map(tab => (
            <PillTab
              key={tab}
              label={tab}
              isActive={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              counter={counts[tab]}
            />
          ))}
        </div>

        {filteredProjects.length > 0 ? (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
              paddingBottom: '96px', // space at bottom
            }}
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const rowItems = chunkedRows[virtualRow.index] || [];
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size - 24}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gap: '24px'
                  }}
                >
                  {rowItems.map((project) => {
                    const projectTasks = (tasks || []).filter(t => t.projectId === project.id);
                    const totalTasks = projectTasks.length;
                    const doneTasks = projectTasks.filter(t => t.phase === 'done' || t.status === 'Complete').length;
                    const computedProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

                    return (
                      <ProjectCard
                        key={project.id}
                        {...project}
                        progress={computedProgress}
                        tasksCount={totalTasks}
                        doneTasks={doneTasks}
                        isPinned={project.isPinned}
                        onPinClick={(e) => {
                          e.stopPropagation();
                          togglePinProject(project.id);
                        }}
                        onContextMenu={(e) => handleProjectContextMenu(e, project)}
                        onClick={() => {
                          setCurrentProject(project);
                          onProjectClick();
                        }}
                        onEditClick={() => onEditProject(project)}
                        onDeleteClick={async (e) => {
                          e.stopPropagation();
                          const ok = await confirm.danger(
                            `Delete "${project.title || project.name}"?`,
                            'This project will be moved to the Trash directory.'
                          );
                          if (ok) {
                            deleteProject(project.id);
                          }
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <div id="projects-empty-state" className="flex-1 -mx-8 -mb-6 min-h-[450px] w-full flex flex-col items-center justify-center text-center py-12 px-6 relative overflow-hidden bg-[#f5f5f7]">
            {/* Fading Grid Background */}
            <div
              className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:36px_36px] bg-center pointer-events-none"
              style={{
                maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 75%)',
                WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 75%)'
              }}
            ></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                {/* Shadow behind folder */}
                <div className="absolute bottom-2 w-16 h-2.5 bg-black/10 rounded-full blur-[4px]"></div>

                <svg width="68" height="52" viewBox="0 0 68 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Folder Back Tab */}
                  <path
                    d="M2.5 10C2.5 6.68629 5.18629 4 8.5 4H22.0463C24.0886 4 26.0028 5.03964 27.1147 6.75338L30.6865 12.2599C31.2424 13.1167 32.1995 13.6364 33.2206 13.6364H59.5C62.8137 13.6364 65.5 16.3227 65.5 19.6364V42C65.5 45.3137 62.8137 48 59.5 48H8.5C5.18629 48 2.5 45.3137 2.5 42V10Z"
                    fill="#2A2F35"
                  />
                  {/* Paper sticking out slightly */}
                  <path
                    d="M10 6C10 4.89543 10.8954 4 12 4H56C57.1046 4 58 4.89543 58 6V20H10V6Z"
                    fill="#F1F5F9"
                    opacity="0.85"
                    className="transform -rotate-[1deg] translate-y-[-2px] origin-bottom-left"
                  />
                  {/* Folder Front Flap */}
                  <path
                    d="M1 18C1 14.6863 3.68629 12 7 12H61C64.3137 12 67 14.6863 67 18V44C67 47.3137 64.3137 50 61 50H7C3.68629 50 1 47.3137 1 44V18Z"
                    fill="url(#folderFrontGrad)"
                  />
                  <path
                    d="M1 18C1 14.6863 3.68629 12 7 12H61C64.3137 12 67 14.6863 67 18V21.5H1V18Z"
                    fill="url(#folderFrontHighlight)"
                    opacity="0.12"
                  />
                  <defs>
                    <linearGradient id="folderFrontGrad" x1="1" y1="12" x2="67" y2="50" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#4A515A" />
                      <stop offset="100%" stopColor="#30353B" />
                    </linearGradient>
                    <linearGradient id="folderFrontHighlight" x1="1" y1="12" x2="1" y2="21.5" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <h3 className="text-xl font-bold text-[#111827] mb-2">No projects found</h3>

              <p className="text-slate-500 text-[15px] max-w-sm mb-8 leading-relaxed font-medium">
                {localSearch ? (
                  <>Your search “<span className="font-semibold text-slate-800">{localSearch}</span>” did not match any projects. Please try again.</>
                ) : (
                  `No ${activeTab.toLowerCase()} projects found in your project ledger.`
                )}
              </p>

              <div className="flex items-center gap-3">
                {localSearch && (
                  <button
                    onClick={() => setLocalSearch('')}
                    className="px-6 py-2.5 bg-white text-slate-700 border border-slate-200 hover:bg-blue-400 hover:border-slate-300 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Clear search
                  </button>
                )}
                <button
                  onClick={onNewProject}
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm hover:shadow-indigo-500/10 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-base font-semibold leading-none">+</span> New project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right-Click Context Menu Overlay */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200/90 py-1.5 min-w-[210px] text-slate-700 font-display select-none animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: posY,
            left: posX,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'background' ? (
            <>
              <button
                onClick={() => {
                  setContextMenu(null);
                  onNewProject();
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-blue-500" />
                <span>+ New Project</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              {/* Filter Submenu */}
              <div className="relative">
                <button
                  onMouseEnter={() => setFilterSubmenuOpen(true)}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span>Filter View ({activeTab})</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {filterSubmenuOpen && (
                  <div
                    className="absolute left-full top-0 ml-1 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200/80 py-1.5 min-w-[150px] text-slate-700"
                    onMouseLeave={() => setFilterSubmenuOpen(false)}
                  >
                    {(['All', 'Active', 'On Hold', 'Completed'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          setActiveTab(tab);
                          setContextMenu(null);
                          setFilterSubmenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 text-xs font-medium hover:bg-slate-100 flex items-center gap-2 ${
                          activeTab === tab ? 'text-blue-600 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {activeTab === tab && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                        <span className={activeTab === tab ? '' : 'ml-3.5'}>{tab} Projects</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setContextMenu(null);
                  setLocalSearch('');
                  setActiveTab('All');
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <RotateCw className="w-4 h-4 text-slate-400" />
                <span>Reset View / Refresh</span>
              </button>

              {localSearch && (
                <button
                  onClick={() => {
                    setContextMenu(null);
                    setLocalSearch('');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span>Clear Search Filter</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Project Card Right-Click Options */}
              <div className="px-3.5 py-1.5 text-[11px] font-bold tracking-wider uppercase text-slate-400 border-b border-slate-100 truncate max-w-[210px]">
                {contextMenu.project?.title || contextMenu.project?.name || 'Project'}
              </div>

              <button
                onClick={() => {
                  const p = contextMenu.project;
                  setContextMenu(null);
                  setCurrentProject(p);
                  onProjectClick();
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-blue-500" />
                <span>Open Project Overview</span>
              </button>

              <button
                onClick={() => {
                  const p = contextMenu.project;
                  setContextMenu(null);
                  handleOpenFolder(p);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Folder className="w-4 h-4 text-amber-500" />
                <span>Open Folder in Explorer</span>
              </button>

              <button
                onClick={() => {
                  const p = contextMenu.project;
                  setContextMenu(null);
                  onEditProject(p);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-slate-400" />
                <span>Edit Details</span>
              </button>

              <button
                onClick={() => {
                  const p = contextMenu.project;
                  setContextMenu(null);
                  togglePinProject(p.id);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Pin className={`w-4 h-4 ${contextMenu.project?.isPinned ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                <span>{contextMenu.project?.isPinned ? 'Unpin Project' : 'Pin to Top'}</span>
              </button>

              <button
                onClick={() => {
                  const p = contextMenu.project;
                  setContextMenu(null);
                  duplicateProject(p.id);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Duplicate Project</span>
              </button>

              <button
                onClick={() => {
                  const p = contextMenu.project;
                  const isArchived = p.status === 'Archived';
                  updateProject(p.id, { status: isArchived ? 'In Progress' : 'Archived' });
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Archive className="w-4 h-4 text-slate-400" />
                <span>{contextMenu.project?.status === 'Archived' ? 'Unarchive Project' : 'Archive Project'}</span>
              </button>

              {/* Status Change Submenu */}
              <div className="relative">
                <button
                  onMouseEnter={() => setStatusSubmenuOpen(true)}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Change Status</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {statusSubmenuOpen && (
                  <div
                    className="absolute left-full top-0 ml-1 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200/80 py-1.5 min-w-[140px] text-slate-700"
                    onMouseLeave={() => setStatusSubmenuOpen(false)}
                  >
                    {['Planning', 'In Progress', 'Review', 'On Hold', 'Completed', 'Archived'].map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          updateProject(contextMenu.project.id, { status: st });
                          setContextMenu(null);
                          setStatusSubmenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 text-xs font-medium hover:bg-slate-100 flex items-center gap-2 ${
                          contextMenu.project?.status === st ? 'text-blue-600 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {contextMenu.project?.status === st && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                        <span className={contextMenu.project?.status === st ? '' : 'ml-3.5'}>{st}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={async () => {
                  const p = contextMenu.project;
                  setContextMenu(null);
                  const ok = await confirm.danger(
                    `Delete "${p.title || p.name}"?`,
                    'This project will be moved to the Trash directory.'
                  );
                  if (ok) {
                    deleteProject(p.id);
                  }
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Delete Project</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
