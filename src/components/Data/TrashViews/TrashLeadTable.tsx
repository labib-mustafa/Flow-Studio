import React from 'react';
import { TrashItem } from '../../../stores/trashStore';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Lead } from '../../../stores/leadStore';

interface TrashLeadTableProps {
  items: TrashItem[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TrashLeadTable: React.FC<TrashLeadTableProps> = ({ items, onRestore, onDelete }) => {
  return (
    <div className="w-full overflow-x-auto border border-slate-200/80 rounded-2xl bg-white shadow-sm">
      <table className="w-max min-w-full text-left border-collapse table-fixed">
        <thead className="bg-slate-50/80 border-b border-slate-200/80">
          <tr className="h-11">
            <th className="w-10 px-4 text-center"></th>
            <th className="px-4 font-bold text-[11px] text-slate-500 tracking-wider uppercase w-[220px]">Name / Company</th>
            <th className="px-4 font-bold text-[11px] text-slate-500 tracking-wider uppercase w-[140px]">Type</th>
            <th className="px-4 font-bold text-[11px] text-slate-500 tracking-wider uppercase w-[200px]">Email</th>
            <th className="px-4 font-bold text-[11px] text-slate-500 tracking-wider uppercase w-[160px]">Phone</th>
            <th className="px-4 font-bold text-[11px] text-slate-500 tracking-wider uppercase w-[160px]">Status</th>
            <th className="px-4 font-bold text-[11px] text-slate-500 tracking-wider uppercase w-[160px]">Location</th>
            <th className="px-4 font-bold text-[11px] text-slate-500 tracking-wider uppercase w-[160px] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map(item => {
            const data = item.data as Lead;
            return (
              <tr key={item.id} className="group relative h-12 hover:bg-slate-50/50 transition-all opacity-80 grayscale-[0.2]">
                <td className="px-4 h-full align-middle">
                  <div className="flex items-center gap-2 h-full w-full">
                    <div className="size-6 rounded-full bg-slate-900 border border-slate-200 text-white flex items-center justify-center font-bold text-[10px] shrink-0 select-none">
                      {data.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'NA'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="truncate font-medium text-slate-800 text-sm block w-full">{data.name}</span>
                      <span className="truncate font-normal text-slate-500 text-[10px] block w-full uppercase">{data.company}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 align-middle">
                  <span className="truncate text-xs text-slate-500 font-medium block w-full">{data.type || 'Unspecified'}</span>
                </td>
                <td className="px-4 align-middle">
                  <span className="truncate text-xs font-mono text-slate-600 block w-full">{data.email || 'No email'}</span>
                </td>
                <td className="px-4 align-middle">
                  <span className="truncate text-xs font-mono text-slate-600 block w-full">{data.phone || 'No phone'}</span>
                </td>
                <td className="px-4 align-middle">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
                    {data.status}
                  </span>
                </td>
                <td className="px-4 align-middle">
                  <span className="truncate text-xs text-slate-500 block w-full">{data.location || 'Unknown'}</span>
                </td>
                <td className="px-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRestore(item.id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-colors cursor-pointer"
                      title="Restore Lead"
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
