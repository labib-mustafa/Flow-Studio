import React, { useState, useMemo } from 'react';
import { ProjectsHeader } from './ProjectsHeader';
import { ProjectCard } from './ProjectCard';
import { useProjectStore } from '../../../stores/projectStore';
import { useTaskStore } from '../../../stores/taskStore';

interface ProjectsProps {
  onNewProject: () => void;
  onProjectClick: () => void;
  onEditProject: (project: any) => void;
}


export type SearchField = 'title' | 'client' | 'deadline' | 'category' | 'status';
export type ProjectTab = 'All' | 'Active' | 'On Hold' | 'Completed';

import { PillTab } from '../../GlobalComponents/PillTab';

export const Projects: React.FC<ProjectsProps> = ({ onNewProject, onProjectClick, onEditProject }) => {
  const { projects, setCurrentProject, deleteProject } = useProjectStore();
  const { tasks } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFields, setSearchFields] = useState<SearchField[]>(['title', 'client', 'deadline', 'category', 'status']);
  const [activeTab, setActiveTab] = useState<ProjectTab>('All');

  const getTabForStatus = (status: string): ProjectTab => {
    const s = status.toLowerCase();
    if (s.includes('hold') || s.includes('paused')) return 'On Hold';
    if (s.includes('complete') || s.includes('done')) return 'Completed';
    return 'Active';
  };

  const filteredProjects = useMemo(() => {
    let p = projects;

    // First apply tab filter
    if (activeTab !== 'All') {
      p = p.filter(p => getTabForStatus(p.status) === activeTab);
    }

    // Then apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      p = p.filter(project => {
        if (searchFields.length === 0) return false;
        return searchFields.some(field => {
          const val = project[field as keyof typeof project];
          return typeof val === 'string' && val.toLowerCase().includes(query);
        });
      });
    }

    return p;
  }, [searchQuery, searchFields, activeTab, projects]);

  const counts: Record<ProjectTab, number> = useMemo(() => {
    const c = { 'All': projects.length, 'Active': 0, 'On Hold': 0, 'Completed': 0 };
    projects.forEach(p => {
      c[getTabForStatus(p.status)]++;
    });
    return c;
  }, [projects]);

  const getGridCols = (count: number) => {
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-[#f5f5f7] w-full">
      <ProjectsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewProject={onNewProject}
      />
      <div className="flex-1 overflow-y-auto px-8 py-6 relative custom-scrollbar flex flex-col ">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {(['All', 'Active', 'On Hold', 'Completed'] as const).map(tab => (
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
          <div className={`grid ${getGridCols(filteredProjects.length)} gap-6 w-full pb-24`}>
            {filteredProjects.map((project, index) => {
              const projectTasks = (tasks || []).filter(t => t.projectId === project.id);
              const totalTasks = projectTasks.length;
              const doneTasks = projectTasks.filter(t => t.phase === 'done' || t.status === 'Complete').length;
              const computedProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

              return (
                <ProjectCard
                  key={index}
                  {...project}
                  progress={computedProgress}
                  tasksCount={totalTasks}
                  doneTasks={doneTasks}
                  onClick={() => {
                    setCurrentProject(project);
                    onProjectClick();
                  }}
                  onEditClick={() => onEditProject(project)}
                  onDeleteClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete "${project.title || project.name}"? It will be moved to the Trash.`)) {
                      deleteProject(project.id);
                    }
                  }}
                />
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
                {searchQuery ? (
                  <>Your search “<span className="font-semibold text-slate-800">{searchQuery}</span>” did not match any projects. Please try again.</>
                ) : (
                  `No ${activeTab.toLowerCase()} projects found in your project ledger.`
                )}
              </p>

              <div className="flex items-center gap-3">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-6 py-2.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Clear search
                  </button>
                )}
                <button
                  onClick={onNewProject}
                  className="px-5 py-2.5 bg-blue-500 hover:bg-[#693ec8] text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm hover:shadow-indigo-500/10 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-base font-semibold leading-none">+</span> New project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
