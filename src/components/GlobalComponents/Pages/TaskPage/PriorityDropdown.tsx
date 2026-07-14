import React from 'react';
import { CellPopover } from '../../../ui/CellPopover';
import { Task, useTaskStore } from '../../../../stores/taskStore';

interface PriorityDropdownProps {
  task?: Task;
  children: React.ReactNode;
  onSelectPriority?: (priority: string) => void;
}

export const PriorityDropdown: React.FC<PriorityDropdownProps> = ({ task, children, onSelectPriority }) => {
  const { updateTask } = useTaskStore();
  const [open, setOpen] = React.useState(false);

  const priorities = [
    { value: 'urgent', label: 'Urgent', color: 'text-[#f04f5e]' },
    { value: 'high', label: 'High', color: 'text-[#f5a133]' },
    { value: 'medium', label: 'Normal', color: 'text-[#3ba2f7]' },
    { value: 'low', label: 'Low', color: 'text-slate-400' },
  ];

  const handleSelect = (value: string) => {
    if (onSelectPriority) {
      onSelectPriority(value);
    } else if (task) {
      updateTask(task.id, { priority: value as any });
    }
    setOpen(false);
  };

  const handleClear = () => {
    if (onSelectPriority) {
      onSelectPriority('');
    } else if (task) {
      updateTask(task.id, { priority: '' });
    }
    setOpen(false);
  };

  const content = (
    <div className="flex flex-col w-[240px] font-sans">
      <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Priority
      </div>
      
      {priorities.map((p) => (
        <button
          key={p.value}
          onClick={() => handleSelect(p.value)}
          className="flex items-center gap-3 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors w-full text-left"
        >
          <svg className={`w-[14px] h-[14px] ${p.color}`} fill="currentColor" stroke="none" viewBox="0 0 24 24">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {p.label}
        </button>
      ))}

      <button
        onClick={handleClear}
        className="flex items-center gap-3 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors w-full text-left mt-1"
      >
        <span className="material-symbols-outlined text-[16px] text-slate-400">
          block
        </span>
        Clear
      </button>

    </div>
  );

  return (
    <CellPopover
      open={open}
      onOpenChange={setOpen}
      content={content}
      align="start"
      side="bottom"
      triggerClassName="w-full h-full"
    >
      {children}
    </CellPopover>
  );
};
