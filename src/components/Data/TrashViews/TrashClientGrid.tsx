import React from 'react';
import { TrashItem } from '../../../stores/trashStore';
import { RotateCcw, Trash2, Eye, Folder, Star, MoreHorizontal } from 'lucide-react';
import { Client } from '../../../stores/clientStore';

interface TrashClientGridProps {
  items: TrashItem[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (item: TrashItem) => void;
}

export const TrashClientGrid: React.FC<TrashClientGridProps> = ({ items, onRestore, onDelete, onView }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {items.map(item => {
        const client = item.data as Client;
        return (
          <div
            key={item.id}
            className="group rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between bg-white border-slate-200 hover:border-slate-400 hover:shadow-md relative overflow-hidden"
          >
            {/* The underlying card content */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="relative">
                  {client.avatarUrl ? (
                    <img 
                      alt={client.name} 
                      src={client.avatarUrl} 
                      className="size-12 rounded-2xl object-cover shadow-sm border border-slate-100"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`size-12 rounded-2xl flex items-center justify-center text-sm font-bold shadow-sm ${client.avatarBg || 'bg-slate-100 text-slate-600'}`}>
                      {client.initials}
                    </div>
                  )}
                  <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${
                    client.status === 'Active' ? 'bg-emerald-500' : client.status === 'Prospect' ? 'bg-blue-500' : 'bg-slate-400'
                  }`}></span>
                </div>
                <div className="relative">
                  <button className="p-1 rounded-lg text-slate-400 pointer-events-none">
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 mt-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                  {client.name}
                </h3>
                <p className="text-xs font-semibold text-slate-400 mb-3">{client.company}</p>
                
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                  client.status === 'Active' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : client.status === 'Prospect'
                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {client.status}
                </span>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold">
                <div className="flex items-center gap-1.5">
                  <Folder className="size-3.5" />
                  <span>{client.projectsCount} Project{client.projectsCount !== 1 ? 's' : ''}</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-slate-900">
                  <Star className={`size-3.5 ${client.rating !== null ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  <span>{client.rating !== null ? client.rating.toFixed(1) : '--'}</span>
                </div>
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
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                Restore
              </button>
              <div className="w-[1px] h-4 bg-slate-700/50 mx-0.5" />
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-slate-800 transition-colors cursor-pointer"
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
