import React from 'react';
import { TrashItem } from '../../../stores/trashStore';
import { RotateCcw, Trash2, Eye } from 'lucide-react';
import { TeamMember } from '../../../stores/teamStore';

interface TrashTeamGridProps {
  items: TrashItem[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (item: TrashItem) => void;
}

export const TrashTeamGrid: React.FC<TrashTeamGridProps> = ({ items, onRestore, onDelete, onView }) => {
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Owner': return 'bg-blue-50 text-blue-500 border-blue-200';
      case 'Admin': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Manager': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Designer': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'Developer': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
      {items.map(item => {
        const member = item.data as TeamMember;
        return (
          <div key={item.id} className="relative group bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            {/* Underlying Card Data */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="relative">
                  {member.profilePic ? (
                    <img
                      src={member.profilePic}
                      alt={member.name}
                      className="w-14 h-14 rounded-full object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 text-slate-900 font-bold text-lg flex items-center justify-center">
                      {member.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-slate-300 rounded-full border-2 border-white" title="Deleted" />
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getRoleBadgeStyle(member.role)}`}>
                  {member.role}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                {member.name}
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">{member.email}</p>
              <p className="text-[11px] font-medium text-slate-600 mt-2 inline-block px-2 py-0.5 bg-slate-100 rounded-md">
                {member.department}
              </p>

              <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                {member.bio || 'No professional bio added yet.'}
              </p>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">folder</span>
                  {member.assignedProjects?.length || 0} projects
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {member.department}
                </span>
              </div>
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
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                Restore
              </button>
              <div className="w-[1px] h-4 bg-slate-700/50 mx-0.5" />
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors cursor-pointer"
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
