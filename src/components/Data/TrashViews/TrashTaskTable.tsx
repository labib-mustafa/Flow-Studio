import React from 'react';
import { TrashItem } from '../../../stores/trashStore';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Task } from '../../../stores/taskStore';

interface TrashTaskTableProps {
  items: TrashItem[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TrashTaskTable: React.FC<TrashTaskTableProps> = ({ items, onRestore, onDelete }) => {
  const getPriorityColor = (p: string) => {
    switch (p?.toLowerCase()) {
      case 'urgent': return 'text-[#f04f5e] bg-red-50';
      case 'high': return 'text-[#f5a133] bg-orange-50';
      case 'medium': return 'text-[#3ba2f7] bg-blue-50';
      case 'low': return 'text-slate-500 bg-slate-50';
      default: return 'text-slate-400 bg-slate-50';
    }
  };

  return (
    <div className="w-full overflow-x-auto border border-slate-200/80 rounded-2xl bg-white shadow-sm">
      <table className="w-max min-w-full text-left border-collapse table-fixed">
        <thead className="bg-slate-50/80 border-b border-slate-200/80">
          <tr className="h-11">
            <th className="w-10 px-4 text-center"></th>
            <th className="px-4 font-bold text-[11px] text-slate-500 tracking-wider uppercase w-[400px]">Task Name</th>
            <th className="px-4 font-bold text-[11px] text-slate-500 tracking-wider uppercase w-[160px]">Assignee</th>
            <th className="px-4 font-bold text-[11px] text-slate-500 tracking-wider uppercase w-[140px]">Due Date</th>
            <th className="px-4 font-bold text-[11px] text-slate-500 tracking-wider uppercase w-[140px]">Priority</th>
            <th className="px-4 font-bold text-[11px] text-slate-500 tracking-wider uppercase w-[140px]">Status</th>
            <th className="px-4 font-bold text-[11px] text-slate-500 tracking-wider uppercase w-[160px] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map(item => {
            const task = item.data as Task;
            return (
              <tr key={item.id} className="group relative h-12 hover:bg-slate-50/50 transition-all opacity-80 grayscale-[0.2]">
                <td className="w-10 px-4 text-center align-middle">
                  <span className="material-symbols-outlined text-[16px] text-slate-300">delete</span>
                </td>
                <td className="px-4 h-full align-middle">
                  <div className="flex items-center gap-2 h-full w-full">
                    <span className="truncate font-medium text-slate-800 text-sm">{task.title}</span>
                    {task.tags?.map((tag, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium border border-slate-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 align-middle">
                  <div className="flex items-center gap-1.5">
                    {task.assignee ? (
                      <>
                        <div className="size-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-700">
                          {task.assignee.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <span className="text-xs text-slate-700 font-medium">{task.assignee}</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Unassigned</span>
                    )}
                  </div>
                </td>
                <td className="px-4 align-middle">
                  <span className="text-xs font-medium text-slate-600">{task.dueDate || '-'}</span>
                </td>
                <td className="px-4 align-middle">
                  {task.priority && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-transparent ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  )}
                </td>
                <td className="px-4 align-middle">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {task.status || task.phase}
                  </span>
                </td>
                <td className="px-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRestore(item.id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-colors cursor-pointer"
                      title="Restore Task"
                    >
                      <RotateCcw className="size-3.5" />
                      Restore
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors cursor-pointer"
                      title="Delete Permanently"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
