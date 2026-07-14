import React, { useState, useMemo } from 'react';
import { CellPopover } from '../../../ui/CellPopover';
import { Task, useTaskStore } from '../../../../stores/taskStore';
import { MessagesSquare, Flag, ClipboardType } from 'lucide-react';

interface StatusDropdownProps {
  task?: Task;
  children: React.ReactNode;
  triggerClassName?: string;
  onSelectOption?: (phase: string) => void;
  onSelectTypeOption?: (typeId: string) => void;
}

const DottedCircleIcon = ({ color }: { color: string }) => (
  <svg width="15" height="15" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
  </svg>
);

const CheckedCircleIcon = ({ color }: { color: string }) => (
  <svg width="15" height="15" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="6" fill={color} />
    <path d="M4.5 7.5L6 9L9.5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RadioCircleIcon = ({ color }: { color: string }) => (
  <svg width="15" height="15" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5.25" stroke={color} strokeWidth="1.5" />
    <circle cx="7" cy="7" r="2.5" fill={color} />
  </svg>
);

const TASK_TYPES = [
  { id: 'task', label: 'Task', icon: 'adjust', isDefault: true },
  { id: 'milestone', label: 'Milestone', icon: 'flag', isDefault: false },
  { id: 'form', label: 'Form Response', icon: 'clipboard-type', isDefault: false },
  { id: 'meeting', label: 'Meeting Note', icon: 'messages-square', isDefault: false },
];

export const StatusDropdown: React.FC<StatusDropdownProps> = ({ task, children, triggerClassName = "w-full h-full", onSelectOption, onSelectTypeOption }) => {
  const { updateTask, updateTaskType, statusConfigs } = useTaskStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'status' | 'type'>('status');

  const handleSelectStatus = (phase: string) => {
    if (onSelectOption) {
      onSelectOption(phase);
    } else if (task) {
      let statusId = phase;
      if (phase === 'fawawf') statusId = 'inprogress';
      const status = statusId === 'done' ? 'Complete' : 'Incomplete';
      updateTask(task.id, { phase: statusId as any, status: status as any });
    }
    setOpen(false);
  };

  const handleSelectType = (typeId: string) => {
    if (onSelectTypeOption) {
      onSelectTypeOption(typeId);
    } else if (task) {
      updateTaskType(task.id, typeId);
    }
    setOpen(false);
  };

  let currentPhaseValue = task?.phase;
  if (currentPhaseValue === 'in-progress' as any) currentPhaseValue = 'inprogress';
  const currentTypeValue = task?.taskType || 'task';

  const [showAiPlaceholder, setShowAiPlaceholder] = useState(false);

  const statusOptions = useMemo(() => {
    const options = [
      { 
        id: 'todo', 
        label: statusConfigs?.todo?.name || 'TO DO', 
        category: 'Not started', 
        icon: <DottedCircleIcon color={statusConfigs?.todo?.color || '#0084ff'} /> 
      },
      { 
        id: 'inprogress', 
        label: statusConfigs?.inprogress?.name || 'IN PROGRESS', 
        category: 'Active', 
        icon: <RadioCircleIcon color={statusConfigs?.inprogress?.color || '#984df3'} /> 
      },
      { 
        id: 'done', 
        label: statusConfigs?.done?.name || 'COMPLETE', 
        category: 'Closed', 
        icon: <RadioCircleIcon color={statusConfigs?.done?.color || '#00a854'} /> 
      },
    ];

    if (statusConfigs) {
      Object.keys(statusConfigs).forEach(key => {
        if (key !== 'todo' && key !== 'inprogress' && key !== 'done') {
          options.push({
            id: key,
            label: statusConfigs[key].name,
            category: 'Active',
            icon: <RadioCircleIcon color={statusConfigs[key].color || '#64748b'} />
          });
        }
      });
    }

    return options;
  }, [statusConfigs]);

  const filteredStatuses = useMemo(() => {
    return statusOptions.filter(opt => 
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, statusOptions]);

  const notStarted = filteredStatuses.filter(s => s.category === 'Not started');
  const active = filteredStatuses.filter(s => s.category === 'Active');
  const closed = filteredStatuses.filter(s => s.category === 'Closed');

  const content = (
    <div className="flex flex-col w-[260px] font-sans relative overflow-hidden">
      {showAiPlaceholder ? (
        <div className="flex flex-col p-4 w-full h-[250px] bg-slate-50 items-center justify-center text-center">
          <span className="material-symbols-outlined text-[32px] text-purple-500 mb-2">auto_awesome</span>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Fill with AI</h3>
          <p className="text-xs text-slate-500 mb-4 px-2">Choose a prompt schema to automatically generate this task's metadata.</p>
          <button 
            onClick={() => setShowAiPlaceholder(false)}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[13px] font-medium rounded hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <div className="flex p-1.5 gap-1">
            <div className="flex w-full bg-[#f4f5f7] rounded-md p-0.5">
              <button
                onClick={() => setActiveTab('status')}
                className={`flex-1 py-1 text-[13px] font-semibold rounded-[4px] transition-all ${
                  activeTab === 'status' ? 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-slate-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Status
              </button>
              <button
                onClick={() => setActiveTab('type')}
                className={`flex-1 py-1 text-[13px] font-semibold rounded-[4px] transition-all ${
                  activeTab === 'type' ? 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-slate-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Task Type
              </button>
            </div>
          </div>

      <div className="px-2 pb-2 mt-0.5 border-b border-slate-100">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2.5 py-1.5 text-[13px] text-slate-700 border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
        />
      </div>

      {activeTab === 'status' && (
        <div className="flex flex-col py-1 overflow-y-auto max-h-[300px]">
          {notStarted.length > 0 && (
            <div className="mb-2">
              <div className="px-3 py-1 flex items-center justify-between group cursor-default">
                 <span className="text-[12px] font-semibold text-[#87909e]">Not started</span>
                 <span className="material-symbols-outlined text-[14px] text-slate-300 opacity-0 group-hover:opacity-100 cursor-pointer">more_horiz</span>
              </div>
              {notStarted.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectStatus(opt.id)}
                  className={`flex items-center justify-between w-[calc(100%-8px)] mx-1 px-2.5 py-1.5 rounded-md transition-colors ${currentPhaseValue === opt.id ? 'bg-[#f4f5f7]' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2">
                    {opt.icon}
                    <span className="text-[13px] text-slate-700 font-medium tracking-wide">{opt.label}</span>
                  </div>
                  {currentPhaseValue === opt.id && <span className="material-symbols-outlined text-[16px] text-slate-800">check</span>}
                </button>
              ))}
            </div>
          )}

          {active.length > 0 && (
            <div className="mb-2">
              <div className="h-px w-full bg-slate-100 mb-2"></div>
              <div className="px-3 py-1 flex items-center justify-between group cursor-default">
                 <span className="text-[12px] font-semibold text-[#87909e]">Active</span>
                 <span className="material-symbols-outlined text-[14px] text-slate-300 opacity-0 group-hover:opacity-100 cursor-pointer">more_horiz</span>
              </div>
              {active.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectStatus(opt.id)}
                  className={`flex items-center justify-between w-[calc(100%-8px)] mx-1 px-2.5 py-1.5 rounded-md transition-colors ${currentPhaseValue === opt.id || (opt.id === 'fawawf' && currentPhaseValue === 'inprogress') ? 'bg-[#f4f5f7]' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2">
                    {opt.icon}
                    <span className="text-[13px] text-slate-700 font-medium tracking-wide">{opt.label}</span>
                  </div>
                  {(currentPhaseValue === opt.id || (opt.id === 'fawawf' && (currentPhaseValue as any) === 'fawawf-never-happens')) && <span className="material-symbols-outlined text-[16px] text-slate-800">check</span>}
                  {(opt.id === 'inprogress' && currentPhaseValue === 'inprogress') && <span className="material-symbols-outlined text-[16px] text-slate-800">check</span>}
                </button>
              ))}
            </div>
          )}

          {closed.length > 0 && (
            <div className="mb-1">
              <div className="h-px w-full bg-slate-100 mb-2"></div>
              <div className="px-3 py-1 flex items-center justify-between group cursor-default">
                 <span className="text-[12px] font-semibold text-[#87909e]">Closed</span>
                 <span className="material-symbols-outlined text-[14px] text-slate-300 opacity-0 group-hover:opacity-100 cursor-pointer">more_horiz</span>
              </div>
              {closed.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectStatus(opt.id)}
                  className={`flex items-center justify-between w-[calc(100%-8px)] mx-1 px-2.5 py-1.5 rounded-md transition-colors ${currentPhaseValue === opt.id ? 'bg-[#f4f5f7]' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2">
                    {opt.icon}
                    <span className="text-[13px] text-slate-700 font-medium tracking-wide">{opt.label}</span>
                  </div>
                  {currentPhaseValue === opt.id && <span className="material-symbols-outlined text-[16px] text-slate-800">check</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'type' && (
        <div className="flex flex-col pt-1.5 pb-0">
          <div className="flex items-center justify-between mb-2 px-3">
             <div className="flex items-center gap-1.5">
               <span className="text-[12px] font-semibold text-[#87909e]">Task Types</span>
               <span className="material-symbols-outlined text-[14px] text-slate-400 cursor-help hover:text-slate-600 transition-colors">help</span>
             </div>
             <span className="material-symbols-outlined text-[14px] text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">settings</span>
          </div>
          
          <div className="flex flex-col overflow-y-auto max-h-[300px] pb-1">
            {TASK_TYPES.map(type => (
              <button 
                key={type.id}
                onClick={() => handleSelectType(type.id)}
                className={`flex items-center justify-between w-[calc(100%-8px)] mx-1 px-2.5 py-1.5 rounded-md transition-colors ${currentTypeValue === type.id ? 'bg-[#f4f5f7]' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-2">
                  {type.icon === 'messages-square' ? (
                    <div className={currentTypeValue === type.id || type.id === 'task' ? 'text-slate-500' : 'text-slate-400'}>
                      <MessagesSquare size={16} className="flex-shrink-0" strokeWidth={2.2} />
                    </div>
                  ) : type.icon === 'flag' ? (
                    <div className={currentTypeValue === type.id || type.id === 'task' ? 'text-slate-500' : 'text-slate-400'}>
                      <Flag size={16} className="flex-shrink-0" strokeWidth={2.2} />
                    </div>
                  ) : type.icon === 'clipboard-type' ? (
                    <div className={currentTypeValue === type.id || type.id === 'task' ? 'text-slate-500' : 'text-slate-400'}>
                      <ClipboardType size={16} className="flex-shrink-0" strokeWidth={2.2} />
                    </div>
                  ) : (
                    <span className={`material-symbols-outlined text-[16px] ${currentTypeValue === type.id || type.id === 'task' ? 'text-slate-500' : 'text-slate-400'}`}>{type.icon}</span>
                  )}
                  <span className={`text-[13px] ${currentTypeValue === type.id || type.id === 'task' ? 'font-semibold text-slate-800' : 'text-slate-600 font-medium'}`}>{type.label}</span>
                  {type.isDefault && <span className="text-[12px] text-slate-400">(default)</span>}
                </div>
                {currentTypeValue === type.id && <span className="material-symbols-outlined text-[16px] text-slate-800">check</span>}
              </button>
            ))}
          </div>

          <div className="p-2 mt-1 border-t border-slate-100 sticky bottom-0 bg-white rounded-b-lg">
             <button 
               onClick={() => setShowAiPlaceholder(true)}
               className="flex items-center justify-center gap-2 px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-purple-200 rounded-md w-full transition-colors group"
             >
              <span className="material-symbols-outlined text-[16px] text-purple-600 group-hover:scale-110 transition-transform">
                temp_preferences_custom
              </span>
              Fill with AI
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );

  return (
    <CellPopover
      open={open}
      onOpenChange={setOpen}
      content={content}
      align="start"
      side="bottom"
      triggerClassName={triggerClassName}
    >
      {children}
    </CellPopover>
  );
};
