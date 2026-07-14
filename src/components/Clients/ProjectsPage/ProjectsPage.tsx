import React, { useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { useProjectStore } from '../../../stores/projectStore';
import { ProjectCard } from '../../Projects/ProjectOverview/ProjectCard';
import { useTaskStore } from '../../../stores/taskStore';

interface ProjectsPageProps {
  clientName?: string;
  onNewProject?: (clientName: string) => void;
  onEditProject?: (project: any) => void;
  onProjectClick?: (project: any) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  clientName = '',
  onNewProject,
  onEditProject,
  onProjectClick
}) => {
  const { projects, deleteProject, setCurrentProject } = useProjectStore();
  const { tasks } = useTaskStore();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Completed' | 'Archived'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const clientProjects = React.useMemo(() => {
    return projects.filter(p => (p.client || '').toLowerCase() === clientName.toLowerCase());
  }, [projects, clientName]);

  const filteredProjects = React.useMemo(() => {
    let p = clientProjects;

    // Apply Active / Completed / Archived filter
    if (activeFilter === 'Active') {
      p = p.filter(proj => proj.status === 'In Progress' || proj.status === 'Planning' || proj.status === 'Review');
    } else if (activeFilter === 'Completed') {
      p = p.filter(proj => proj.status === 'Completed');
    } else if (activeFilter === 'Archived') {
      p = p.filter(proj => proj.status === 'Archived');
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      p = p.filter(proj => (proj.title || proj.name || '').toLowerCase().includes(q));
    }
    return p;
  }, [clientProjects, activeFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto w-full">

      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 font-display">
          {filteredProjects.map((project, index) => {
            const projectTasks = (tasks || []).filter(t => t.projectId === project.id);
            const totalTasks = projectTasks.length;
            const doneTasks = projectTasks.filter(t => t.phase === 'done' || t.status === 'Complete').length;
            const computedProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

            return (
              <ProjectCard
                key={project.id || index}
                {...project}
                title={project.title || project.name || 'Untitled Project'}
                progress={computedProgress}
                tasksCount={totalTasks}
                doneTasks={doneTasks}
                onClick={() => {
                  setCurrentProject(project);
                  onProjectClick?.(project);
                }}
                onEditClick={() => onEditProject?.(project)}
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
        <div id="client-projects-empty-state" className="flex-1 -mx-8 -mb-6 min-h-[450px] w-full flex flex-col items-center justify-center text-center py-12 px-6 relative overflow-hidden bg-transparent">
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
                'No projects associated with this client.'
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
                onClick={() => onNewProject?.(clientName)}
                className="px-5 py-2.5 bg-blue-500 hover:bg-[#693ec8] text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm hover:shadow-indigo-500/10 transition-all active:scale-95 cursor-pointer"
              >
                <span className="text-base font-semibold leading-none">+</span> New project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
