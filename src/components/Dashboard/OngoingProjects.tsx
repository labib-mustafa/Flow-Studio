import React from 'react';
import { useProjectStore, Project } from '../../stores/projectStore';

interface OngoingProjectsProps {
  onNavigate?: (view: string) => void;
  onProjectClick?: (project: any) => void;
  onNewProject?: () => void;
}

export const OngoingProjects: React.FC<OngoingProjectsProps> = ({
  onNavigate,
  onProjectClick,
  onNewProject
}) => {
  const { projects } = useProjectStore();
  const ongoing = projects.filter(p => p.status !== 'Completed' && p.status !== 'Archived').slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Progress':
        return <span className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold rounded uppercase tracking-wider">In Progress</span>;
      case 'Review':
        return <span className="px-2 py-1 bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-bold rounded uppercase tracking-wider">Review</span>;
      case 'Planning':
        return <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold rounded uppercase tracking-wider">Planning</span>;
      case 'Delayed':
      case 'At Risk':
        return <span className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold rounded uppercase tracking-wider">{status}</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold rounded uppercase tracking-wider">{status || 'Active'}</span>;
    }
  };

  const getIcon = (category?: string, index: number = 0) => {
    const icons = ['web', 'smartphone', 'palette', 'campaign', 'brand_family'];
    const colors = [
      'bg-blue-50 text-blue-600 border-blue-100',
      'bg-purple-50 text-purple-600 border-purple-100',
      'bg-emerald-50 text-emerald-600 border-emerald-100',
      'bg-orange-50 text-orange-600 border-orange-100',
      'bg-rose-50 text-rose-600 border-rose-100'
    ];
    const iconName = category && category.toLowerCase().includes('app') ? 'smartphone' :
                     category && category.toLowerCase().includes('brand') ? 'palette' :
                     icons[index % icons.length];
    const colorClass = colors[index % colors.length];

    return (
      <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 border ${colorClass}`}>
        <span className="material-symbols-outlined text-[20px]">{iconName}</span>
      </div>
    );
  };

  return (
    <div className="xl:col-span-2 bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-base tracking-tight">Ongoing Projects</h3>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">{ongoing.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onNewProject}
              className="text-xs font-bold bg-black text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              New Project
            </button>
            <button 
              onClick={() => onNavigate?.('projects')}
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors text-slate-700"
            >
              View All
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {ongoing.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">folder_open</span>
              <p className="text-sm font-semibold text-slate-600">No active ongoing projects</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Start a new project to track progress here</p>
              <button 
                onClick={onNewProject}
                className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl shadow hover:bg-slate-800 transition-colors"
              >
                Create First Project
              </button>
            </div>
          ) : (
            ongoing.map((proj, idx) => {
              const progress = proj.completion || proj.progress || 0;
              return (
                <div 
                  key={proj.id}
                  onClick={() => onProjectClick ? onProjectClick(proj) : onNavigate?.('projects')}
                  className="flex items-center gap-4 p-3.5 border border-slate-100/80 rounded-2xl hover:border-slate-200 hover:shadow-md hover:bg-slate-50/50 transition-all cursor-pointer group"
                >
                  {getIcon(proj.category, idx)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {proj.name || proj.title || 'Untitled Project'}
                    </h4>
                    <p className="text-xs text-slate-500 truncate font-medium mt-0.5">
                      {proj.client || proj.category || 'Flow Client'}
                    </p>
                  </div>
                  <div className="w-36 hidden md:block mt-1">
                    <div className="flex justify-between text-[10px] mb-1.5 font-extrabold uppercase tracking-widest">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-slate-700">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress < 30 ? 'bg-amber-500' : progress < 70 ? 'bg-blue-600' : 'bg-emerald-500'
                        }`} 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-24 shrink-0 flex justify-start">
                    {getStatusBadge(proj.status)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
