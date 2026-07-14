import React from 'react';
import { TrashItem } from '../../../stores/trashStore';
import { ProjectCard } from '../../Projects/ProjectOverview/ProjectCard';
import { RotateCcw, Trash2, Eye } from 'lucide-react';

interface TrashProjectGridProps {
  items: TrashItem[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (item: TrashItem) => void;
}

export const TrashProjectGrid: React.FC<TrashProjectGridProps> = ({ items, onRestore, onDelete, onView }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map(item => {
        const project = item.data;
        return (
          <div key={item.id} className="relative group">
            {/* The underlying native ProjectCard */}
            <div className="pointer-events-none">
              <ProjectCard
                image={project.image}
                category={project.category}
                status={project.status}
                statusColor={project.statusColor || 'bg-slate-100'}
                progress={project.progress || 0}
                client={project.client}
                title={project.title}
                deadline={project.deadline}
                tasksCount={project.tasksCount || 0}
                commentsCount={0}
              />
            </div>
            
            {/* The Action Pill */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300 flex items-center p-1.5 bg-black backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); onView(item); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Eye className="size-3.5 text-slate-300" />
                View
              </button>
              <div className="w-[1px] h-4 bg-slate-700/50 mx-0.5" />
              <button 
                onClick={(e) => { e.stopPropagation(); onRestore(item.id); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                Restore
              </button>
              <div className="w-[1px] h-4 bg-slate-700/50 mx-0.5" />
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
