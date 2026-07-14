import React, { useState, useEffect, useRef } from 'react';
import { Task, useTaskStore } from '../../../../stores/taskStore';
import { PriorityDropdown } from './PriorityDropdown';
import { StatusDropdown } from './StatusDropdown';
import { AssigneeDropdown } from './AssigneeDropdown';
import { DueDateDropdown } from './DueDateDropdown';
import { TaskCommentsPopover } from './TaskCommentsPopover';
import { CellPopover } from '../../../ui/CellPopover';
import { StatusConfigPopover } from './StatusConfigPopover';
import { MessagesSquare, Flag, ClipboardType, Plus } from 'lucide-react';

interface TaskListProps {
  onAddTask: (phase?: string) => void;
  onTaskClick: (task: Task) => void;
  tasks: Task[];
}

import { TaskGroupOptionsMenu } from './TaskGroupOptionsMenu';
import { FloatingBulkActionToolbar } from './FloatingBulkActionToolbar';

const DottedCircle = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
  </svg>
);

const RadioCircle = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="7" cy="7" r="2.5" fill="currentColor" />
  </svg>
);

const EmptyBox = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-all">
    <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const CheckedBox = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-all">
    <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" fill="currentColor" />
    <path d="M5 8.2L6.5 9.7L11 5.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const getPriorityIconColor = (p: string) => {
  switch (p?.toLowerCase()) {
    case 'urgent': return 'text-[#f04f5e]';
    case 'high': return 'text-[#f5a133]';
    case 'medium': return 'text-[#3ba2f7]';
    case 'low': return 'text-slate-400';
    default: return 'text-slate-300';
  }
};

const getGroupColor = (name: string, config?: { color?: string }) => {
  if (config?.color) {
    return { backgroundColor: config.color, color: '#fff' };
  }
  switch (name.toUpperCase()) {
    case 'TO DO': return { backgroundColor: '#0084ff', color: '#fff' };
    case 'IN PROGRESS': return { backgroundColor: '#984df3', color: '#fff' };
    case 'DONE': return { backgroundColor: '#00a854', color: '#fff' };
    default: return { backgroundColor: '#e2e8f0', color: '#334155' };
  }
};

const getGroupTextColor = (name: string, config?: { color?: string }) => {
  if (config?.color) {
    return { color: config.color };
  }
  switch (name.toUpperCase()) {
    case 'TO DO': return { color: '#0084ff' };
    case 'IN PROGRESS': return { color: '#984df3' };
    case 'DONE': return { color: '#00a854' };
    default: return { color: '#64748b' };
  }
};

interface ColumnWidths {
  title: number;
  assignee: number;
  dueDate: number;
  priority: number;
  status: number;
  comments: number;
  customField: number;
  pics: number;
  [key: string]: number;
}

import { ColumnHeaderMenu } from './ColumnHeaderMenu';

const CustomCellRenderer = ({ task, column }: { task: Task; column: any }) => {
  const updateTask = useTaskStore(state => state.updateTask);
  const value = task[column.id] || '';
  const [isOpen, setIsOpen] = useState(false);

  if (column.type === 'number') {
    return (
      <div className="py-1.5 px-3 w-full h-full flex items-center">
        <input
          type="number"
          className="w-full bg-transparent outline-none text-slate-700 hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -ml-1 transition-all"
          value={value}
          onChange={e => updateTask(task.id, { [column.id]: e.target.value })}
          placeholder="Empty"
        />
      </div>
    );
  }
  if (column.type === 'text') {
    return (
      <div className="py-1.5 px-3 w-full h-full flex items-center">
        <input
          type="text"
          className="w-full bg-transparent outline-none text-slate-700 hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -ml-1 transition-all truncate"
          value={value}
          onChange={e => updateTask(task.id, { [column.id]: e.target.value })}
          placeholder=""
        />
      </div>
    );
  }
  if (column.type === 'checkbox') {
    return (
      <div className="py-1.5 px-3 w-full h-full flex items-center justify-center">
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => updateTask(task.id, { [column.id]: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 text-[#7b68ee] focus:ring-[#7b68ee]"
        />
      </div>
    );
  }
  if (column.type === 'date') {
    return (
      <div className="py-1.5 px-3 w-full h-full flex items-center">
        <input
          type="date"
          className="w-full bg-transparent outline-none text-slate-700 hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -ml-1 transition-all"
          value={value}
          onChange={e => updateTask(task.id, { [column.id]: e.target.value })}
        />
      </div>
    );
  }
  if (column.type === 'dropdown') {
    const options = column.options && column.options.length > 0
      ? column.options
      : ['Option 1', 'Option 2', 'Option 3', 'Approved', 'Pending', 'Rejected'];

    const popoverContent = (
      <div className="flex flex-col w-[180px] font-sans gap-0.5">
        <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Select Option
        </div>
        {options.map((opt: string) => {
          const colorStyles: Record<string, string> = {
            'Option 1': 'text-blue-600 hover:bg-blue-50 bg-blue-50/30',
            'Option 2': 'text-pink-600 hover:bg-pink-50 bg-pink-50/30',
            'Option 3': 'text-purple-600 hover:bg-purple-50 bg-purple-50/30',
            'Approved': 'text-emerald-600 hover:bg-emerald-50 bg-emerald-50/30',
            'Pending': 'text-amber-600 hover:bg-amber-50 bg-amber-50/30',
            'Rejected': 'text-red-600 hover:bg-red-50 bg-red-50/30',
          };
          const cls = colorStyles[opt] || 'text-slate-700 hover:bg-slate-50';
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                updateTask(task.id, { [column.id]: opt });
                setIsOpen(false);
              }}
              className={`flex items-center text-left text-[12px] font-medium px-2.5 py-1.5 rounded-md transition-colors ${cls}`}
            >
              {opt}
            </button>
          );
        })}
        <div className="h-px bg-slate-100 my-0.5" />
        <button
          type="button"
          onClick={() => {
            updateTask(task.id, { [column.id]: '' });
            setIsOpen(false);
          }}
          className="flex items-center text-left text-[12px] text-slate-500 font-medium px-2.5 py-1 rounded-md hover:bg-slate-50 transition-colors"
        >
          Clear Option
        </button>
      </div>
    );

    const badgeColors: Record<string, string> = {
      'Option 1': 'bg-blue-50 text-blue-600 border border-blue-100',
      'Option 2': 'bg-pink-50 text-pink-600 border border-pink-100',
      'Option 3': 'bg-purple-50 text-purple-600 border border-purple-100',
      'Approved': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      'Pending': 'bg-amber-50 text-amber-600 border border-amber-100',
      'Rejected': 'bg-red-50 text-red-600 border border-red-100',
    };
    const currentBadgeCls = badgeColors[value] || 'bg-slate-50 text-slate-600 border border-slate-100';

    return (
      <div className="w-full h-full flex items-center">
        <CellPopover
          open={isOpen}
          onOpenChange={setIsOpen}
          content={popoverContent}
          align="start"
          side="bottom"
          triggerClassName="w-full h-full"
        >
          <div className="py-1.5 px-3 w-full h-full flex items-center min-w-0 cursor-pointer">
            {value ? (
              <div className={`flex items-center justify-between px-2.5 py-1 rounded w-full transition-colors ${currentBadgeCls}`}>
                <span className="text-[12px] font-semibold tracking-wide leading-none">{value}</span>
                <span className="material-symbols-outlined text-[12px] opacity-70">expand_more</span>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-end select-none opacity-0 group-hover/cell:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-[16px] text-slate-300 hover:text-slate-500">add</span>
              </div>
            )}
          </div>
        </CellPopover>
      </div>
    );
  }
  return <div className="py-1.5 px-3 w-full text-slate-600 truncate text-[13px]">{value || ''}</div>;
};

const TableHeaderCell = ({
  title,
  columnId,
  width,
  colKey,
  onResizeStart,
  sortBy,
  onSort,
  paddingLeft = 'pl-3',
  onContextMenu,
}: {
  key?: any;
  title: string;
  columnId: string;
  width: number;
  colKey: string;
  onResizeStart: (colKey: string, e: React.MouseEvent) => void;
  sortBy: { column: string; direction: 'asc' | 'desc' } | null;
  onSort: (columnId: string) => void;
  paddingLeft?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
}) => {
  const isSorted = sortBy?.column === columnId;
  const showAsc = isSorted && sortBy.direction === 'asc';
  const showDesc = isSorted && sortBy.direction === 'desc';

  const columnNames = useTaskStore(state => state.columnNames) || {};
  const currentTitle = columnNames[colKey] || title;

  const { reorderColumns } = useTaskStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const wasDraggingRef = React.useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only process left click

    // Ignore down clicks if they target the resizer
    const target = e.target as HTMLElement;
    if (target.closest('.group\\/resizer')) {
      return;
    }

    const startX = e.clientX;
    wasDraggingRef.current = false;
    let dragInitiated = false;

    const holdTimer = setTimeout(() => {
      dragInitiated = true;
      wasDraggingRef.current = true;
      setIsDragging(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        setDragOffset(moveEvent.clientX - startX);
      };

      const handleMouseUpDrag = (upEvent: MouseEvent) => {
        cleanup();
        setIsDragging(false);
        setDragOffset(0);

        // reset wasDragging on next tick so click can be blocked
        setTimeout(() => {
          wasDraggingRef.current = false;
        }, 0);

        const elementsUnderCursor = document.elementsFromPoint(upEvent.clientX, upEvent.clientY);
        const targetCell = elementsUnderCursor.find(
          el => el.classList.contains('table-header-cell') && el.getAttribute('data-col-id') !== columnId
        );

        if (targetCell) {
          const targetColId = targetCell.getAttribute('data-col-id');
          if (targetColId) {
            reorderColumns(columnId, targetColId);
          }
        }
      };

      const cleanup = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUpDrag);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUpDrag);
    }, 250);

    const cancelHold = () => {
      clearTimeout(holdTimer);
      window.removeEventListener('mouseup', cancelHold);
    };

    window.addEventListener('mouseup', cancelHold);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (wasDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <ColumnHeaderMenu
      columnId={columnId}
      colKey={colKey}
      trigger={
        <div
          onMouseDown={handleMouseDown}
          onClickCapture={handleClickCapture}
          onContextMenu={onContextMenu}
          className={`table-header-cell flex items-center relative group/col py-[6px] ${paddingLeft} pr-2 border-y border-transparent select-none bg-white ${isDragging ? 'cursor-grabbing scale-[0.98] opacity-70 z-[100] shadow-md' : 'hover:bg-slate-100/70 cursor-pointer hover:z-20'}`}
          style={{
            width,
            minWidth: width,
            maxWidth: width,
            transform: isDragging ? `translateX(${dragOffset}px)` : 'none'
          }}
          data-col-id={columnId}
        >
          <span className="pointer-events-none">{currentTitle}</span>

          {/* Sort Icons */}
          <div
            className={`absolute right-1 top-0 bottom-0 flex items-center pl-6 pr-1 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none transition-opacity duration-200 ${isSorted ? 'opacity-100' : 'opacity-0 group-hover/col:opacity-100'
              }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSort(columnId);
              }}
              title={!isSorted ? 'Sort' : showAsc ? 'Sorted Asc (Click for Desc)' : 'Sorted Desc (Click to clear)'}
              className={`size-5 rounded flex items-center justify-center shrink-0 transition-all cursor-pointer pointer-events-auto ${isSorted
                ? 'bg-slate-900 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200/70'
                }`}
            >
              <span className="material-symbols-outlined text-[13px]">
                {isSorted
                  ? showAsc ? 'arrow_upward' : 'arrow_downward'
                  : 'swap_vert'}
              </span>
            </button>
          </div>

          {/* Resizer */}
          <div
            className="absolute -right-[8px] top-0 bottom-0 w-4 cursor-col-resize opacity-0 group-hover/col:opacity-100 transition-opacity z-20 flex justify-center items-center rounded-full"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onResizeStart(colKey, e);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-[3px] h-5 bg-black rounded-full transition-colors pointer-events-none" />
          </div>
        </div>
      }
    />
  );
};

const TaskRow: React.FC<{
  task: Task;
  onEdit: () => void;
  phaseName: string;
  index: number;
  colWidths: ColumnWidths;
  isResizing: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  draggedOverTaskId: string | null;
  draggedTaskId: string | null;
  isSelected: boolean;
  onToggleSelect: (id: string, isShift?: boolean) => void;
  onContextMenu?: (e: React.MouseEvent, columnId: string, value: any) => void;
}> = ({
  task,
  onEdit,
  phaseName,
  index,
  colWidths,
  isResizing,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  draggedOverTaskId,
  draggedTaskId,
  isSelected,
  onToggleSelect,
  onContextMenu
}) => {
    const { updateTask } = useTaskStore();
    const { priority, dueDate, assignees, phase, status, id, details } = task;
    const title = task.title || (task as any).name || "Untitled Task";
    const completed = phase === 'done' || status === 'Complete';

    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [tempDetails, setTempDetails] = useState(details || '');

    const [isEditingTitle, setIsEditingTitle] = useState(title === 'New Task' && !completed);
    const [tempTitle, setTempTitle] = useState(title);
    const [isDraggable, setIsDraggable] = useState(false);
    const [isDraggingThis, setIsDraggingThis] = useState(false);
    const [customFieldOpen, setCustomFieldOpen] = useState(false);

    let phaseValue = phase;
    if (phaseValue === 'in-progress' as any) phaseValue = 'inprogress';
    if (!phaseValue) phaseValue = 'todo';
    const phaseConfig = (useTaskStore(state => state.statusConfigs) || {})[phaseValue];
    const displayPhaseName = phaseConfig?.name || phaseName;

    useEffect(() => {
      const currentTitle = task.title || (task as any).name || "Untitled Task";
      if (currentTitle === 'New Task' && !completed) {
        setIsEditingTitle(true);
      } else {
        setIsEditingTitle(false);
      }
    }, [task.id, completed]);

    useEffect(() => {
      const currentTitle = task.title || (task as any).name || "Untitled Task";
      setTempTitle(currentTitle);
    }, [task.title, (task as any).name]);

    useEffect(() => {
      setTempDetails(task.details || '');
    }, [task.details]);

    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleSelect(id, e.shiftKey);
    };

    const handleDetailsSubmit = () => {
      updateTask(id, { details: tempDetails });
      setIsEditingDetails(false);
    };

    const handleTitleSubmit = () => {
      if (tempTitle.trim() && tempTitle.trim() !== title) {
        updateTask(id, { title: tempTitle.trim() });
      } else {
        setTempTitle(title);
      }
      setIsEditingTitle(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleTitleSubmit();
      } else if (e.key === 'Escape') {
        setTempTitle(title);
        setIsEditingTitle(false);
      }
    };

    const handleCyclePriority = (e: React.MouseEvent) => {
      e.stopPropagation();
      const priorities: Task['priority'][] = ['low', 'medium', 'high', 'urgent'];
      const currentIndex = priorities.indexOf(priority);
      const nextPriority = priorities[(currentIndex + 1) % priorities.length];
      updateTask(id, { priority: nextPriority });
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      updateTask(id, { dueDate: e.target.value });
    };

    const handleStatusChange = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Simple toggle for now, or just flip between 2 common phases if in a list
      const newPhase = phase === 'todo' ? 'inprogress' : phase === 'inprogress' ? 'done' : 'todo';
      updateTask(id, { phase: newPhase });
    };

    const isDraggedOver = draggedOverTaskId === id;
    const isBeingDragged = draggedTaskId === id;

    const storeColumnOrder = useTaskStore(state => state.columnOrder) || ['title', 'assignee', 'dueDate', 'priority', 'status', 'comments', 'customField', 'pics'];
    const columnOrder = storeColumnOrder.includes('title') ? storeColumnOrder : ['title', ...storeColumnOrder.filter(id => id !== 'title')];
    const hiddenColumns = (useTaskStore(state => state.hiddenColumns || [])).filter(id => id !== 'title' && id !== 'dueDate');

    const gridTemplateColumns = columnOrder
      .filter(id => !hiddenColumns.includes(id))
      .map(id => `${colWidths[id] || 100}px`)
      .join(' ') + ' 50px';

    return (
      <>
        <div
          className={`group/row grid items-stretch border-t border-slate-100 hover:bg-[#f6f7f9] text-[13px] transition-all duration-150 ${completed ? 'opacity-50' : ''} ${isDraggedOver ? 'border-t-2 border-t-[#7b68ee] bg-[#7b68ee]/5' : ''} ${isBeingDragged ? 'opacity-30 bg-slate-50' : ''} ${isSelected ? 'bg-blue-50/40' : ''}`}
          draggable={isDraggable}
          onDragStart={(e) => {
            setIsDraggingThis(true);
            onDragStart(e, id);
          }}
          onDragEnd={(e) => {
            setIsDraggingThis(false);
            setIsDraggable(false);
            onDragEnd(e);
          }}
          onDragOver={(e) => {
            onDragOver(e, id);
          }}
          onDrop={(e) => {
            e.stopPropagation();
            onDrop(e, id);
          }}
          style={{ gridTemplateColumns }}
        >
          {columnOrder.map((columnId) => {
            if (hiddenColumns.includes(columnId)) return null;

            if (columnId === 'title') {
              return (
                <div
                  key={columnId}
                  onContextMenu={(e) => onContextMenu?.(e, columnId, title)}
                  className="border border-transparent hover:border-gray-300 rounded-md transition-colors flex items-center h-[34px] pl-2 relative z-[10]"
                  style={{ width: colWidths.title, minWidth: colWidths.title, maxWidth: colWidths.title }}
                >
                  <div className="flex items-center w-[76px] pr-2 flex-shrink-0">
                    <div className={`flex items-center justify-between w-full transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'}`}>
                      <span
                        className="material-symbols-outlined text-[14px] text-slate-300 cursor-grab px-0.5 active:cursor-grabbing hover:text-[#7b68ee] flex-shrink-0"
                        onMouseEnter={() => setIsDraggable(true)}
                        onMouseLeave={() => {
                          if (!isDraggingThis) setIsDraggable(false);
                        }}
                      >
                        drag_indicator
                      </span>
                      <button
                        onClick={handleToggle}
                        className={`my-[4px] flex items-center justify-center outline-none w-5 h-5 rounded hover:bg-slate-200/50 active:scale-90 transition-all cursor-pointer flex-shrink-0 ${isSelected ? 'text-[#00a854]' : 'text-slate-300 hover:text-slate-400'}`}
                        style={{ minWidth: "20px", minHeight: "20px", marginTop: "4px", marginBottom: "4px" }}
                      >
                        {isSelected ? <CheckedBox /> : <EmptyBox />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExpanded(!isExpanded);
                        }}
                        className="flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/55 rounded p-[2px] transition-all duration-150 outline-none select-none cursor-pointer flex-shrink-0"
                        style={{ minWidth: "18px", minHeight: "18px" }}
                        title={isExpanded ? "Collapse description" : "Expand description"}
                      >
                        <span
                          className={`material-symbols-outlined text-[16px] leading-none transition-transform duration-200 ${isExpanded ? "rotate-90 text-[#7b68ee]" : "text-slate-300"}`}
                        >
                          arrow_right
                        </span>
                      </button>
                    </div>
                  </div>
                  <StatusDropdown task={task} triggerClassName="flex-shrink-0 flex items-center justify-center">
                    <div
                      className="mr-2 w-[18px] h-[18px] flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity flex-shrink-0"
                      style={getGroupTextColor(phaseName, phaseConfig)}
                    >
                      {task.taskType === 'milestone' && <Flag size={15} className="flex-shrink-0" strokeWidth={2.2} />}
                      {task.taskType === 'form' && <ClipboardType size={15} className="flex-shrink-0" strokeWidth={2.2} />}
                      {task.taskType === 'meeting' && (
                        <MessagesSquare size={15} className="flex-shrink-0" strokeWidth={2.2} />
                      )}
                      {(!task.taskType || task.taskType === 'task') && (
                        phaseValue === 'todo' ? <DottedCircle size={14} /> : <RadioCircle size={14} />
                      )}
                    </div>
                  </StatusDropdown>

                  {isEditingTitle ? (
                    <input
                      autoFocus
                      type="text"
                      className="flex-1 font-medium text-slate-800 bg-white border border-blue-400 rounded px-2 py-0.5 outline-none shadow-[0_0_0_2px_rgba(0,132,255,0.2)] mr-[90px]"
                      value={tempTitle}
                      onChange={e => setTempTitle(e.target.value)}
                      onBlur={handleTitleSubmit}
                      onKeyDown={handleKeyDown}
                    />
                  ) : (
                    <div
                      className="relative flex-1 min-w-0 flex items-center h-full group/title cursor-default"
                    >
                      <span
                        className={`block font-medium truncate ${completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}
                      >
                        {title}
                      </span>

                      {/* Custom Tooltip */}
                      <div className="absolute top-full lg:bottom-full lg:top-auto lg:mb-[6px] mt-[6px] lg:mt-0 left-0 lg:left-[24px] opacity-0 group-hover/title:opacity-100 transition-opacity delay-100 pointer-events-none z-[100] flex flex-col items-center drop-shadow-md">
                        <div className="bg-[#2a2a2a] text-white text-[12px] font-semibold px-[14px] py-[6px] rounded-[6px] max-w-[280px] whitespace-normal break-words text-center leading-[1.4]" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {title}
                        </div>
                        <div className="w-[10px] h-[10px] bg-[#2a2a2a] rotate-45 -mt-[5px] hidden lg:block"></div>
                        <div className="w-[10px] h-[10px] bg-[#2a2a2a] rotate-45 absolute -top-[5px] left-4 lg:hidden"></div>
                      </div>
                    </div>
                  )}

                  {/* Hover Actions in Name Col */}
                  {!isEditingTitle && !isResizing && (
                    <div className="opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center gap-[6px] bg-gradient-to-r from-[rgba(246,247,249,0)] via-[#f6f7f9] to-[#f6f7f9] pl-10 pr-2 h-full z-[80] absolute right-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="flex items-center justify-center size-[26px] rounded-[5px] border border-[#e2e4e9] bg-white text-[#87909e] hover:bg-slate-50 transition-colors shadow-sm outline-none"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingTitle(true);
                          onEdit();
                        }}
                        className="flex items-center justify-center size-[26px] rounded-[5px] border border-[#e2e4e9] bg-white text-[#87909e] hover:bg-slate-50 transition-colors shadow-sm outline-none"
                      >
                        <span className="material-symbols-outlined text-[13px]">edit</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            if (columnId === 'assignee') {
              return (
                <div
                  key={columnId}
                  onContextMenu={(e) => onContextMenu?.(e, columnId, assignees)}
                  className="border border-transparent hover:border-gray-300 rounded-md transition-colors flex items-center h-[34px] group/cell has-[[data-state=open]]:!border-gray-300 z-[10]"
                  style={{ width: colWidths.assignee, minWidth: colWidths.assignee, maxWidth: colWidths.assignee }}
                >
                  <AssigneeDropdown task={task}>
                    <div className="py-1.5 px-3 w-full h-full flex items-center">
                      {assignees && assignees.length > 0 ? (
                        <div className="flex -space-x-1 cursor-pointer">
                          {assignees.map((a, idx) => (
                            a.avatar && a.avatar.length > 2 ? (
                              <img key={idx} alt={a.name} title={a.name} className="size-[22px] rounded-full border-2 border-white object-cover" src={a.avatar} />
                            ) : (
                              <div key={idx} title={a.name} className="size-[22px] rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                                {a.avatar}
                              </div>
                            )
                          ))}
                        </div>
                      ) : (
                        <button className="text-slate-400 outline-none flex items-center justify-center hover:opacity-80">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </AssigneeDropdown>
                </div>
              );
            }

            if (columnId === 'dueDate') {
              return (
                <div
                  key={columnId}
                  onContextMenu={(e) => onContextMenu?.(e, columnId, dueDate)}
                  className="border border-transparent hover:border-gray-300 rounded-md transition-colors flex items-center h-[34px] group/cell has-[[data-state=open]]:!border-gray-300 z-[10]"
                  style={{ width: colWidths.dueDate, minWidth: colWidths.dueDate, maxWidth: colWidths.dueDate }}
                >
                  <DueDateDropdown task={task}>
                    <div className="py-1.5 px-3 w-full h-full flex items-center group/date cursor-pointer">
                      {dueDate ? (
                        <span className="text-[12px] text-slate-500 hover:text-slate-800 pointer-events-none">
                          {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px] text-slate-300 group-hover/date:text-slate-400 pointer-events-none">calendar_add_on</span>
                      )}
                    </div>
                  </DueDateDropdown>
                </div>
              );
            }

            if (columnId === 'priority') {
              return (
                <div
                  key={columnId}
                  onContextMenu={(e) => onContextMenu?.(e, columnId, priority)}
                  className="border border-transparent hover:border-gray-300 rounded-md transition-colors flex items-center h-[34px] group/cell has-[[data-state=open]]:!border-gray-300 z-[10]"
                  style={{ width: colWidths.priority, minWidth: colWidths.priority, maxWidth: colWidths.priority }}
                >
                  <PriorityDropdown task={task}>
                    <div className="py-1.5 px-3 w-full h-full flex items-center justify-center cursor-pointer">
                      {priority ? (
                        <button
                          className={`outline-none transition-transform hover:scale-110 ${getPriorityIconColor(priority)}`}
                          title={`Priority: ${priority}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          className="outline-none transition-opacity duration-200 opacity-0 group-hover/cell:opacity-100 flex items-center justify-center text-slate-300 hover:text-slate-400"
                          title="Set Priority"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </PriorityDropdown>
                </div>
              );
            }

            if (columnId === 'status') {
              return (
                <div
                  key={columnId}
                  onContextMenu={(e) => onContextMenu?.(e, columnId, phase)}
                  className="border border-transparent hover:border-gray-300 rounded-md transition-colors flex items-center h-[34px] group/cell has-[[data-state=open]]:!border-gray-300 z-[10]"
                  style={{ width: colWidths.status, minWidth: colWidths.status, maxWidth: colWidths.status }}
                >
                  <StatusDropdown task={task}>
                    <div className="py-1.5 px-3 w-full h-full flex items-center">
                      <button
                        className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex items-center justify-center gap-1.5 outline-none hover:opacity-80 transition-opacity"
                        style={getGroupColor(phaseName, phaseConfig)}
                      >
                        <DottedCircle />
                        <span>{displayPhaseName}</span>
                      </button>
                    </div>
                  </StatusDropdown>
                </div>
              );
            }

            if (columnId === 'comments') {
              const numComments = task.comments?.length || 0;
              return (
                <div
                  key={columnId}
                  onContextMenu={(e) => onContextMenu?.(e, columnId, numComments)}
                  className="border border-transparent hover:border-gray-300 rounded-md transition-colors flex items-center h-[34px] group/cell has-[[data-state=open]]:!border-gray-300 z-[10]"
                  style={{ width: colWidths.comments, minWidth: colWidths.comments, maxWidth: colWidths.comments }}
                >
                  <TaskCommentsPopover task={task}>
                    <div className="py-1.5 px-3 w-full h-full flex items-center relative group/comments-trigger select-none">
                      <div className="flex items-center text-slate-300 hover:text-slate-500 transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        {numComments > 0 && (
                          <span className="ml-[6px] text-[11px] font-medium text-slate-400">{numComments}</span>
                        )}
                      </div>
                      {/* Custom Premium Hovering View Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[6px] opacity-0 group-hover/comments-trigger:opacity-100 transition-opacity delay-200 pointer-events-none z-[100] flex flex-col items-center drop-shadow-md">
                        <div className="bg-[#2a2a2a] text-white text-[11px] font-semibold px-2.5 py-1 rounded-[4px] whitespace-nowrap text-center leading-tight font-sans">
                          {numComments === 0 ? "Comments" : `${numComments} Comment${numComments !== 1 ? "s" : ""}`}
                        </div>
                        <div className="w-1.5 h-1.5 bg-[#2a2a2a] rotate-45 -mt-[3px]"></div>
                      </div>
                    </div>
                  </TaskCommentsPopover>
                </div>
              );
            }

            if (columnId === 'customField') {
              const val = (task as any).customFieldVal !== undefined
                ? (task as any).customFieldVal
                : (index === 0 ? "awd" : index === 1 ? "Option 2" : "");

              const customFieldContent = (
                <div className="flex flex-col w-[180px] font-sans gap-1">
                  <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Option
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateTask(task.id, { customFieldVal: 'awd' } as any);
                      setCustomFieldOpen(false);
                    }}
                    className="flex items-center text-left text-[12px] text-blue-600 font-medium px-2.5 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    awd
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateTask(task.id, { customFieldVal: 'Option 2' } as any);
                      setCustomFieldOpen(false);
                    }}
                    className="flex items-center text-left text-[12px] text-pink-600 font-medium px-2.5 py-1.5 rounded-md hover:bg-pink-50 transition-colors"
                  >
                    Option 2
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateTask(task.id, { customFieldVal: 'Approved' } as any);
                      setCustomFieldOpen(false);
                    }}
                    className="flex items-center text-left text-[12px] text-emerald-600 font-medium px-2.5 py-1.5 rounded-md hover:bg-emerald-50 transition-colors"
                  >
                    Approved
                  </button>
                  <div className="h-px bg-slate-100 my-0.5" />
                  <button
                    type="button"
                    onClick={() => {
                      updateTask(task.id, { customFieldVal: '' } as any);
                      setCustomFieldOpen(false);
                    }}
                    className="flex items-center text-left text-[12px] text-slate-500 font-medium px-2.5 py-1 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    Clear Option
                  </button>
                </div>
              );

              return (
                <div
                  key={columnId}
                  onContextMenu={(e) => onContextMenu?.(e, columnId, val)}
                  className="border border-transparent hover:border-gray-300 rounded-md transition-colors flex items-center h-[34px] group/cell has-[[data-state=open]]:!border-gray-300 z-[10]"
                  style={{ width: colWidths.customField, minWidth: colWidths.customField, maxWidth: colWidths.customField }}
                >
                  <CellPopover
                    open={customFieldOpen}
                    onOpenChange={setCustomFieldOpen}
                    content={customFieldContent}
                    align="start"
                    side="bottom"
                    triggerClassName="w-full h-full"
                  >
                    <div className="py-1.5 px-3 w-full h-full flex items-center min-w-0">
                      {val === 'awd' ? (
                        <div className="flex items-center justify-between bg-blue-100 text-blue-600 px-2.5 py-1 rounded w-full border border-transparent hover:border-blue-200 transition-colors">
                          <span className="text-[12px] font-medium leading-none">awd</span>
                          <span className="material-symbols-outlined text-[12px] opacity-70">expand_more</span>
                        </div>
                      ) : val === 'Option 2' ? (
                        <div className="flex items-center justify-between bg-pink-100 text-pink-600 px-2.5 py-1 rounded w-full border border-transparent hover:border-pink-200 transition-colors">
                          <span className="text-[12px] font-medium leading-none">Option 2</span>
                          <span className="material-symbols-outlined text-[12px] opacity-70">expand_more</span>
                        </div>
                      ) : val === 'Approved' ? (
                        <div className="flex items-center justify-between bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded w-full border border-transparent hover:border-emerald-200 transition-colors">
                          <span className="text-[12px] font-medium leading-none">Approved</span>
                          <span className="material-symbols-outlined text-[12px] opacity-70">expand_more</span>
                        </div>
                      ) : (
                        <div className="w-full flex justify-end group-hover/row:opacity-100 opacity-0 transition-opacity">
                          <span className="material-symbols-outlined text-[16px] text-slate-300 hover:text-slate-500 cursor-pointer p-0.5">add</span>
                        </div>
                      )}
                    </div>
                  </CellPopover>
                </div>
              );
            }

            if (columnId === 'pics') {
              return (
                <div
                  key={columnId}
                  onContextMenu={(e) => onContextMenu?.(e, columnId, '')}
                  className="border border-transparent hover:border-gray-300 rounded-md transition-colors flex items-center h-[34px] group/cell z-[10]"
                  style={{ width: colWidths.pics, minWidth: colWidths.pics, maxWidth: colWidths.pics }}
                >
                  <TaskCommentsPopover task={task}>
                    <div className="py-1.5 px-3 w-full h-full flex items-center cursor-pointer">
                      <span className="material-symbols-outlined text-[16px] text-slate-400 hover:text-slate-600 pointer-events-none">attachment</span>
                    </div>
                  </TaskCommentsPopover>
                </div>
              );
            }

            const dynamicCol = useTaskStore.getState().columns.find(c => c.id === columnId);
            if (dynamicCol) {
              return (
                <div
                  key={columnId}
                  onContextMenu={(e) => onContextMenu?.(e, columnId, task[columnId as keyof typeof task])}
                  className="border border-transparent hover:border-gray-300 rounded-md transition-colors flex items-center h-[34px] group/cell z-[10]"
                  style={{ width: colWidths[columnId] || dynamicCol.width || 140, minWidth: colWidths[columnId] || dynamicCol.width || 140, maxWidth: colWidths[columnId] || dynamicCol.width || 140 }}
                >
                  <CustomCellRenderer task={task} column={dynamicCol} />
                </div>
              );
            }

            return null;
          })}

          {/* End Actions */}
          <div
            className="py-1.5 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            style={{ width: 50, minWidth: 50, maxWidth: 50 }}
          />
        </div>
        {isExpanded && (
          <div className="border-t border-slate-100 bg-white pl-[110px] pr-8 py-3 flex flex-col gap-2 transition-all duration-150">
            {isEditingDetails ? (
              <div className="flex flex-col gap-2">
                <textarea
                  autoFocus
                  className="w-full text-[13px] text-slate-800 bg-white border border-slate-200 hover:border-slate-300 focus:border-[#7b68ee] focus:ring-1 focus:ring-[#7b68ee] rounded-md p-2.5 outline-none font-sans leading-relaxed resize-y min-h-[85px] shadow-sm"
                  placeholder="Add details / description for this task..."
                  value={tempDetails}
                  onChange={(e) => setTempDetails(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDetailsSubmit}
                    className="px-3 py-1.5 bg-[#7b68ee] text-white hover:bg-[#6c5bc7] rounded-md text-[12px] font-semibold transition-colors cursor-pointer shadow-sm outline-[#7b68ee]"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempDetails(details || '');
                      setIsEditingDetails(false);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-md text-[12px] font-semibold transition-colors cursor-pointer outline-none"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setTempDetails(details || '');
                  setIsEditingDetails(true);
                }}
                className="group/desc cursor-pointer min-h-[32px] py-1.5 px-2 -ml-2 rounded-md hover:bg-slate-100/50 transition-colors duration-150"
              >
                {details ? (
                  <p className="text-slate-700 text-[13px] leading-relaxed whitespace-pre-wrap font-sans">
                    {details}
                  </p>
                ) : (
                  <p className="text-slate-400 text-[13px] italic leading-relaxed font-sans flex items-center gap-1 group-hover/desc:text-slate-600 select-none">
                    Click to add description...
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </>
    );
  };

const TaskGroup: React.FC<{
  phaseId: string;
  name: string;
  tasks: Task[];
  onAddTask: (phase?: string) => void;
  onTaskClick: (task: Task) => void;
  colWidths: ColumnWidths;
  isResizing: boolean;
  onResizeStart: (colKey: string, e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onGroupDrop: (e: React.DragEvent, phase: string) => void;
  draggedOverTaskId: string | null;
  draggedTaskId: string | null;
  sortBy: { column: string; direction: 'asc' | 'desc' } | null;
  toggleSort: (columnId: string) => void;
  selectedTaskIds: string[];
  onToggleSelect: (id: string, isShift?: boolean) => void;
  onSelectAll?: () => void;
  onCollapseAll?: () => void;
}> = ({
  phaseId,
  name,
  tasks,
  onAddTask,
  onTaskClick,
  colWidths,
  isResizing,
  onResizeStart,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onGroupDrop,
  draggedOverTaskId,
  draggedTaskId,
  sortBy,
  toggleSort,
  selectedTaskIds,
  onToggleSelect,
  onSelectAll,
  onCollapseAll,
  onHeaderContextMenu,
  onCellContextMenu
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
      const handleCollapseAll = () => setIsExpanded(false);
      window.addEventListener('collapseAllGroups', handleCollapseAll);
      return () => window.removeEventListener('collapseAllGroups', handleCollapseAll);
    }, []);
    const storeColumnOrder = useTaskStore(state => state.columnOrder) || ['title', 'assignee', 'dueDate', 'priority', 'status', 'comments', 'customField', 'pics'];
    const columnOrder = storeColumnOrder.includes('title') ? storeColumnOrder : ['title', ...storeColumnOrder.filter(id => id !== 'title')];
    const hiddenColumns = (useTaskStore(state => state.hiddenColumns || [])).filter(id => id !== 'title' && id !== 'dueDate');
    const statusConfigs = useTaskStore(state => state.statusConfigs);
    const setFieldsSidebarOpen = useTaskStore(state => state.setFieldsSidebarOpen);

    const phaseValue = phaseId;
    const displayPhaseName = statusConfigs?.[phaseValue]?.name || name;
    const phaseConfig = statusConfigs?.[phaseValue];

    return (
      <div
        className="mb-[30px]"
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          onGroupDrop(e, phaseValue);
        }}
      >
        <div className="flex items-center gap-3 mb-2 group">
          <span
            className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform cursor-pointer ${isExpanded ? '' : '-rotate-90'}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            arrow_drop_down
          </span>
          <div>
            <StatusConfigPopover
              statusId={phaseValue}
              defaultName={name}
              defaultColor={phaseConfig?.color || (name.toUpperCase() === 'TO DO' ? '#0084ff' : name.toUpperCase() === 'IN PROGRESS' ? '#984df3' : name.toUpperCase() === 'DONE' ? '#00a854' : '#64748b')}
            >
              <div className="px-2 py-0.5 rounded flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wide transition-colors cursor-pointer hover:opacity-80" style={getGroupColor(name, phaseConfig)}>
                <DottedCircle />
                <span>{displayPhaseName}</span>
              </div>
            </StatusConfigPopover>
          </div>
          <span className="text-[11px] text-slate-400 ml-1">{tasks.length}</span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
            <span className="material-symbols-outlined text-[16px] text-slate-400 hover:text-slate-600 px-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); onAddTask(phaseValue); }}>add</span>
          </div>
        </div>

        {isExpanded && (
          <div className="bg-white">
            {/* Table Header */}
            <div
              className="grid items-stretch text-[12px] text-[#7c828d] font-normal border-b border-transparent animate-fade-in"
              style={{
                gridTemplateColumns: columnOrder
                  .filter(id => !hiddenColumns.includes(id))
                  .map(id => `${colWidths[id] || 100}px`)
                  .join(' ') + ' 50px'
              }}
            >
              {columnOrder.map((columnId) => {
                if (hiddenColumns.includes(columnId)) return null;

                if (columnId === 'title') {
                  return (
                    <TableHeaderCell
                      key={columnId}
                      title="Name"
                      columnId="title"
                      width={colWidths.title}
                      colKey="title"
                      onResizeStart={onResizeStart}
                      sortBy={sortBy}
                      onSort={toggleSort}
                      paddingLeft="pl-[76px]"
                    />
                  );
                }

                if (columnId === 'assignee') {
                  return (
                    <TableHeaderCell
                      key={columnId}
                      title="Assignee"
                      columnId="assignee"
                      width={colWidths.assignee}
                      colKey="assignee"
                      onResizeStart={onResizeStart}
                      sortBy={sortBy}
                      onSort={toggleSort}
                    />
                  );
                }

                if (columnId === 'dueDate') {
                  return (
                    <TableHeaderCell
                      key={columnId}
                      title="Due date"
                      columnId="dueDate"
                      width={colWidths.dueDate}
                      colKey="dueDate"
                      onResizeStart={onResizeStart}
                      sortBy={sortBy}
                      onSort={toggleSort}
                    />
                  );
                }

                if (columnId === 'priority') {
                  return (
                    <TableHeaderCell
                      key={columnId}
                      title="Priority"
                      columnId="priority"
                      width={colWidths.priority}
                      colKey="priority"
                      onResizeStart={onResizeStart}
                      sortBy={sortBy}
                      onSort={toggleSort}
                    />
                  );
                }

                if (columnId === 'status') {
                  return (
                    <TableHeaderCell
                      key={columnId}
                      title="Status"
                      columnId="phase"
                      width={colWidths.status}
                      colKey="status"
                      onResizeStart={onResizeStart}
                      sortBy={sortBy}
                      onSort={toggleSort}
                    />
                  );
                }

                if (columnId === 'comments') {
                  return (
                    <TableHeaderCell
                      key={columnId}
                      title="Comments"
                      columnId="comments"
                      width={colWidths.comments}
                      colKey="comments"
                      onResizeStart={onResizeStart}
                      sortBy={sortBy}
                      onSort={toggleSort}
                    />
                  );
                }

                if (columnId === 'customField') {
                  return (
                    <TableHeaderCell
                      key={columnId}
                      title="Custom Field"
                      columnId="customField"
                      width={colWidths.customField}
                      colKey="customField"
                      onResizeStart={onResizeStart}
                      sortBy={sortBy}
                      onSort={toggleSort}
                    />
                  );
                }

                if (columnId === 'pics') {
                  return (
                    <TableHeaderCell
                      key={columnId}
                      title="Pics"
                      columnId="pics"
                      width={colWidths.pics}
                      colKey="pics"
                      onResizeStart={onResizeStart}
                      sortBy={sortBy}
                      onSort={toggleSort}
                    />
                  );
                }

                const dynamicColumn = useTaskStore.getState().columns.find(c => c.id === columnId);
                if (dynamicColumn) {
                  return (
                    <TableHeaderCell
                      key={columnId}
                      title={dynamicColumn.name}
                      columnId={columnId}
                      width={colWidths[columnId] || dynamicColumn.width || 140}
                      colKey={columnId}
                      onResizeStart={onResizeStart}
                      sortBy={sortBy}
                      onSort={toggleSort}
                    />
                  );
                }

                return null;
              })}

              <div
                className="flex items-center justify-center py-[6px]"
                style={{ width: 50, minWidth: 50, maxWidth: 50 }}
              >
                <span
                  onClick={() => setFieldsSidebarOpen?.(true)}
                  className="material-symbols-outlined text-[16px] text-[#7c828d] hover:text-[#2a2e34] hover:bg-slate-100 rounded-[4px] cursor-pointer p-0.5 transition-colors"
                >
                  add_circle
                </span>
              </div>
            </div>

            {/* Task Rows */}
            <div className="flex flex-col border-b border-slate-100">
              {tasks.map((task, idx) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onEdit={() => onTaskClick(task)}
                  phaseName={name}
                  index={idx}
                  colWidths={colWidths}
                  isResizing={isResizing}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDragEnd={onDragEnd}
                  onDrop={onDrop}
                  draggedOverTaskId={draggedOverTaskId}
                  draggedTaskId={draggedTaskId}
                  isSelected={selectedTaskIds.includes(task.id)}
                  onToggleSelect={onToggleSelect}
                  onContextMenu={(e, colId, val) => onCellContextMenu?.(e, task.id, colId, val)}
                />
              ))}

              <div className="flex items-center border-t border-slate-100 py-2 pl-[84px] text-[13px] text-slate-400">
                <div
                  className="flex items-center cursor-pointer hover:text-slate-600 transition-colors group/add-btn w-max"
                  onClick={() => onAddTask(phaseValue)}
                >
                  <div className="mr-2 w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
                    <Plus size={12} className="group-hover/add-btn:text-slate-500" strokeWidth={2.5} />
                  </div>
                  <span>Add Task</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

export const TaskList: React.FC<TaskListProps> = ({ onAddTask, onTaskClick, tasks }) => {
  const { setTasks, sortBy, toggleSort } = useTaskStore();

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const [lastSelectedTaskId, setLastSelectedTaskId] = useState<string | null>(null);
  const handleSelectAllGroup = (groupTasks: Task[]) => {
    const groupTaskIds = groupTasks.map(t => t.id);
    setSelectedTaskIds(prev => {
      const newSelections = new Set([...prev, ...groupTaskIds]);
      return Array.from(newSelections);
    });
  };

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    type?: 'header' | 'cell';
    columnId?: string;
    taskId?: string;
    value?: any;
  }>({ isOpen: false, x: 0, y: 0 });

  const handleCellContextMenu = (e: React.MouseEvent, taskId: string, columnId: string, value: any) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'cell',
      taskId,
      columnId,
      value
    });
  };

  const handleHeaderContextMenu = (e: React.MouseEvent, columnId: string, value: string) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'header',
      columnId,
      value
    });
  };

  const columns = useTaskStore(state => state.columns) || [];
  const columnNames = useTaskStore(state => state.columnNames) || {};
  const hiddenColumns = useTaskStore(state => state.hiddenColumns || []);
  const toggleColumnVisibility = useTaskStore(state => state.toggleColumnVisibility);

  const getColumnDisplayName = (key: string) => {
    if (columnNames[key]) {
      return columnNames[key];
    }
    const dynamicCol = columns.find(c => c.id === key);
    if (dynamicCol) {
      return dynamicCol.name;
    }
    switch (key) {
      case 'title': return 'Name';
      case 'assignee': return 'Assignee';
      case 'dueDate': return 'Due date';
      case 'priority': return 'Priority';
      case 'status': return 'Status';
      case 'comments': return 'Comments';
      case 'customField': return 'Custom Field';
      case 'pics': return 'Pics';
      default: return key;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!contextMenu.isOpen) return;

    const handleGlobalClick = () => {
      setContextMenu(prev => ({ ...prev, isOpen: false }));
    };

    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('contextmenu', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('contextmenu', handleGlobalClick);
    };
  }, [contextMenu.isOpen]);

  const getSortedTasks = (taskList: Task[]) => {
    if (!sortBy) return taskList;
    return [...taskList].sort((a, b) => {
      let valA: any = a[sortBy.column as keyof Task] || '';
      let valB: any = b[sortBy.column as keyof Task] || '';

      // Handle priority weights
      if (sortBy.column === 'priority') {
        const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
        valA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
        valB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
      }

      // Assignee sort by first assignee name
      if (sortBy.column === 'assignee') {
        valA = a.assignees && a.assignees.length > 0 ? a.assignees[0].name : '';
        valB = b.assignees && b.assignees.length > 0 ? b.assignees[0].name : '';
      }

      if (valA < valB) return sortBy.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortBy.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const [addingStatusId, setAddingStatusId] = useState<string | null>(null);
  const statusConfigs = useTaskStore(state => state.statusConfigs) || {};

  const getPhaseTasks = (phaseId: string) => {
    if (phaseId === 'todo') {
      return getSortedTasks(tasks.filter(t => t.phase === 'todo'));
    }
    if (phaseId === 'inprogress') {
      return getSortedTasks(tasks.filter(t => t.phase === 'inprogress' || t.phase === 'in-progress'));
    }
    if (phaseId === 'done') {
      return getSortedTasks(tasks.filter(t => t.phase === 'done' || t.status === 'Complete'));
    }
    return getSortedTasks(tasks.filter(t => t.phase === phaseId));
  };

  const defaultStatuses = ['todo', 'inprogress', 'done'];
  const customStatuses = Object.keys(statusConfigs).filter(key => !defaultStatuses.includes(key));
  const tasksCustomPhases = tasks.map(t => {
    let p = t.phase;
    if (p === 'in-progress' as any) p = 'inprogress';
    return p || 'todo';
  }).filter(p => !defaultStatuses.includes(p) && !customStatuses.includes(p));

  const allStatusIds = Array.from(new Set([
    ...defaultStatuses,
    ...customStatuses,
    ...tasksCustomPhases
  ]));

  const shouldRenderPhase = (phaseId: string) => {
    const phaseTasks = getPhaseTasks(phaseId);
    if (phaseTasks.length > 0) return true;
    if (statusConfigs && statusConfigs[phaseId]) return true;
    if (phaseId === 'todo' && tasks.length === 0) return true;
    return false;
  };

  const getFlatVisualTasks = () => {
    const flat: Task[] = [];
    allStatusIds.forEach(phaseId => {
      if (shouldRenderPhase(phaseId)) {
        flat.push(...getPhaseTasks(phaseId));
      }
    });
    return flat;
  };

  const toggleTaskSelection = (id: string, isShift?: boolean) => {
    if (isShift && lastSelectedTaskId) {
      const flatTasks = getFlatVisualTasks();
      const idxLast = flatTasks.findIndex(t => t.id === lastSelectedTaskId);
      const idxCurrent = flatTasks.findIndex(t => t.id === id);
      if (idxLast !== -1 && idxCurrent !== -1) {
        const start = Math.min(idxLast, idxCurrent);
        const end = Math.max(idxLast, idxCurrent);
        const rangeIds = flatTasks.slice(start, end + 1).map(t => t.id);

        const isLastSelected = selectedTaskIds.includes(lastSelectedTaskId);
        setSelectedTaskIds(prev => {
          if (isLastSelected) {
            return Array.from(new Set([...prev, ...rangeIds]));
          } else {
            return prev.filter(taskId => !rangeIds.includes(taskId));
          }
        });
        setLastSelectedTaskId(id);
        return;
      }
    }

    setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]);
    setLastSelectedTaskId(id);
  };

  // Kept for backward compatibility references or specific helpers if needed
  const todoTasks = getPhaseTasks('todo');

  const [colWidths, setColWidths] = useState<ColumnWidths>({
    title: 300,
    assignee: 100,
    dueDate: 110,
    priority: 90,
    status: 140,
    comments: 90,
    customField: 140,
    pics: 70
  });

  const [isResizing, setIsResizing] = useState(false);
  const activeResizerRef = useRef<{
    colKey: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedOverTaskId, setDraggedOverTaskId] = useState<string | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const active = activeResizerRef.current;
      if (!active) return;

      const deltaX = e.clientX - active.startX;
      const newWidth = Math.max(50, active.startWidth + deltaX);
      setColWidths(prev => ({
        ...prev,
        [active.colKey]: newWidth
      }));
    };

    const handleMouseUp = () => {
      if (activeResizerRef.current) {
        activeResizerRef.current = null;
        setIsResizing(false);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleResizeStart = (colKey: string, e: React.MouseEvent) => {
    activeResizerRef.current = {
      colKey,
      startX: e.clientX,
      startWidth: colWidths[colKey]
    };
    setIsResizing(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedOverTaskId !== id) {
      setDraggedOverTaskId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDraggedOverTaskId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetId) {
      handleDragEnd();
      return;
    }

    const sourceIndex = tasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = tasks.findIndex(t => t.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      handleDragEnd();
      return;
    }

    const updatedTasks = [...tasks];
    const [draggedTask] = updatedTasks.splice(sourceIndex, 1);

    const targetTask = tasks[targetIndex];
    let newPhase = targetTask.phase;
    if (newPhase === 'in-progress' as any) newPhase = 'inprogress';
    const newStatus = newPhase === 'done' ? ('Complete' as const) : ('Incomplete' as const);

    const updatedTask = {
      ...draggedTask,
      phase: newPhase,
      status: newStatus
    };

    const actualTargetIndex = updatedTasks.findIndex(t => t.id === targetId);
    updatedTasks.splice(actualTargetIndex, 0, updatedTask);

    setTasks(updatedTasks);
    handleDragEnd();
  };

  const handleGroupDrop = (e: React.DragEvent, targetPhase: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const sourceIndex = tasks.findIndex(t => t.id === draggedTaskId);
    if (sourceIndex === -1) {
      handleDragEnd();
      return;
    }

    const draggedTask = tasks[sourceIndex];
    const targetP = targetPhase as any;

    if (draggedTask.phase !== targetP) {
      const updatedTasks = [...tasks];
      const [removed] = updatedTasks.splice(sourceIndex, 1);

      const newStatus = targetP === 'done' ? ('Complete' as const) : ('Incomplete' as const);
      const updatedTask = {
        ...removed,
        phase: targetP,
        status: newStatus
      };

      updatedTasks.push(updatedTask);
      setTasks(updatedTasks);
    }
    handleDragEnd();
  };

  return (
    <div id="task-list-container" className="flex-1 pb-20 w-full min-w-max" onContextMenu={handleContextMenu}>
      {allStatusIds.map(phaseId => {
        if (!shouldRenderPhase(phaseId)) return null;

        let defaultName = '';
        if (phaseId === 'todo') defaultName = 'TO DO';
        else if (phaseId === 'inprogress') defaultName = 'IN PROGRESS';
        else if (phaseId === 'done') defaultName = 'DONE';
        else defaultName = statusConfigs?.[phaseId]?.name || phaseId.toUpperCase();

        const phaseTasks = getPhaseTasks(phaseId);

        return (
          <TaskGroup
            key={phaseId}
            phaseId={phaseId}
            name={defaultName}
            tasks={phaseTasks}
            onAddTask={onAddTask}
            onTaskClick={onTaskClick}
            colWidths={colWidths}
            isResizing={isResizing}
            onResizeStart={handleResizeStart}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onGroupDrop={handleGroupDrop}
            draggedOverTaskId={draggedOverTaskId}
            draggedTaskId={draggedTaskId}
            sortBy={sortBy}
            toggleSort={toggleSort}
            selectedTaskIds={selectedTaskIds}
            onToggleSelect={toggleTaskSelection}
            onSelectAll={() => handleSelectAllGroup(phaseTasks)}
            onCollapseAll={() => window.dispatchEvent(new Event('collapseAllGroups'))}
            onHeaderContextMenu={handleHeaderContextMenu}
            onCellContextMenu={handleCellContextMenu}
          />
        );
      })}

      {addingStatusId && (
        <div className="mt-8 ml-3 flex items-center gap-3">
          <StatusConfigPopover
            statusId={addingStatusId}
            defaultName=""
            defaultColor="#64748b"
            initialIsEditing={true}
            onSave={(name) => {
              setAddingStatusId(null);
            }}
            onCancel={() => {
              setAddingStatusId(null);
            }}
          >
            <div className="px-2 py-0.5 rounded flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wide transition-colors cursor-pointer hover:opacity-80" style={{ backgroundColor: '#64748b', color: '#fff' }}>
              <DottedCircle />
              <span>New status</span>
            </div>
          </StatusConfigPopover>
        </div>
      )}

      <div
        onClick={() => setAddingStatusId(`status_${Date.now()}`)}
        className="mt-8 flex items-center gap-2 text-[13px] text-slate-400 hover:text-slate-600 cursor-pointer font-medium transition-colors w-max ml-3"
      >
        <span className="text-[14px]">+</span>
        New status
      </div>

      {contextMenu.isOpen && (
        <div
          className="fixed z-[9999] w-[220px] bg-white rounded-lg shadow-xl border border-slate-200 font-sans p-1.5 text-[13px] text-slate-700 flex flex-col"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none flex items-center justify-between">
            <span>Unhide Columns</span>
            <span className="material-symbols-outlined text-[14px]">tune</span>
          </div>
          <div className="h-[1px] bg-slate-100 my-1 mx-2" />
          {hiddenColumns.length === 0 ? (
            <div className="px-3 py-2 text-slate-400 italic text-[12px] select-none text-center">
              All columns visible
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 max-h-[240px] overflow-y-auto">
              {hiddenColumns.map((colId) => (
                <button
                  key={colId}
                  type="button"
                  onClick={() => {
                    toggleColumnVisibility(colId);
                    setContextMenu(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="flex items-center text-left text-[13px] text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-2.5 py-1.5 rounded transition-colors cursor-pointer w-full group/item"
                >
                  <span className="material-symbols-outlined text-[16px] text-slate-400 mr-2 group-hover/item:text-slate-600">visibility</span>
                  <span className="truncate flex-1 font-medium">{getColumnDisplayName(colId)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <FloatingBulkActionToolbar
        selectedTaskIds={selectedTaskIds}
        onClose={() => setSelectedTaskIds([])}
        onCustomFieldsClick={() => {
          useTaskStore.getState().setFieldsSidebarOpen(true);
        }}
        onTagsClick={() => {
          const newTags = window.prompt("Enter tags separated by commas (e.g. Design, Frontend):");
          if (newTags) {
            const tagsList = newTags.split(',').map(t => t.trim()).filter(Boolean);
            if (tagsList.length > 0) {
              const { updateTask } = useTaskStore.getState();
              selectedTaskIds.forEach(id => {
                const task = tasks.find(t => t.id === id);
                const currentTags = task?.tags || [];
                const updatedTags = Array.from(new Set([...currentTags, ...tagsList]));
                updateTask(id, { tags: updatedTags });
              });
              showToast(`Added tags to ${selectedTaskIds.length} tasks.`);
            }
          }
        }}
        onCopyClick={() => {
          const copiedText = tasks
            .filter((t) => selectedTaskIds.includes(t.id))
            .map((t) => `- [ ] ${t.title} (Due: ${t.dueDate || 'No date'}, Priority: ${t.priority || 'None'})`)
            .join('\n');
          navigator.clipboard.writeText(copiedText);
          showToast(`Copied ${selectedTaskIds.length} tasks to clipboard.`);
        }}
        onDuplicateClick={() => {
          const { addTask } = useTaskStore.getState();
          tasks
            .filter((t) => selectedTaskIds.includes(t.id))
            .forEach((t) => {
              const { id, comments, ...duplicatedTask } = t;
              addTask({
                ...duplicatedTask,
                title: `${duplicatedTask.title} (Copy)`,
              });
            });
          setSelectedTaskIds([]);
          showToast(`Duplicated ${selectedTaskIds.length} tasks.`);
        }}
        onArchiveClick={() => {
          const { deleteTask } = useTaskStore.getState();
          selectedTaskIds.forEach(id => deleteTask(id));
          setSelectedTaskIds([]);
          showToast(`Archived ${selectedTaskIds.length} tasks (moved to trash).`);
        }}
        onDeleteClick={() => {
          if (window.confirm(`Are you sure you want to delete ${selectedTaskIds.length} tasks?`)) {
            const { deleteTask } = useTaskStore.getState();
            selectedTaskIds.forEach(id => deleteTask(id));
            setSelectedTaskIds([]);
            showToast(`Deleted ${selectedTaskIds.length} tasks successfully.`);
          }
        }}
        onMoreClick={() => {
          const action = window.prompt("Choose bulk action: \n1 - Mark all as Complete\n2 - Mark all as Incomplete");
          if (action === '1') {
            const { updateTask } = useTaskStore.getState();
            selectedTaskIds.forEach(id => updateTask(id, { status: 'Complete' }));
            setSelectedTaskIds([]);
            showToast(`Marked ${selectedTaskIds.length} tasks as Complete.`);
          } else if (action === '2') {
            const { updateTask } = useTaskStore.getState();
            selectedTaskIds.forEach(id => updateTask(id, { status: 'Incomplete' }));
            setSelectedTaskIds([]);
            showToast(`Marked ${selectedTaskIds.length} tasks as Incomplete.`);
          }
        }}
      />
      {toast.visible && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-950 text-white border border-zinc-800 text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl z-[1000] animate-fade-in select-none">
          {toast.message}
        </div>
      )}

      {/* Context Menu Popup */}
      {contextMenu.isOpen && (
        <div
          className="fixed bg-white border border-slate-200 shadow-xl rounded-lg py-1.5 z-[9999] min-w-[200px] flex flex-col font-sans animate-fade-in"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'cell' && (
            <>
              <button
                type="button"
                className="flex items-center text-[13px] text-slate-700 hover:bg-slate-50 hover:text-blue-600 px-3 py-1.5 transition-colors cursor-pointer w-full text-left"
                onClick={() => {
                  navigator.clipboard.writeText(String(contextMenu.value || ''));
                  showToast('Copied to clipboard');
                  setContextMenu(prev => ({ ...prev, isOpen: false }));
                }}
              >
                <span className="material-symbols-outlined text-[16px] mr-2 opacity-60">content_copy</span>
                Copy
              </button>
              <button
                type="button"
                className="flex items-center text-[13px] text-slate-700 hover:bg-slate-50 hover:text-amber-600 px-3 py-1.5 transition-colors cursor-pointer w-full text-left"
                onClick={() => {
                  if (contextMenu.taskId && contextMenu.columnId) {
                    useTaskStore.getState().updateTask(contextMenu.taskId, { [contextMenu.columnId]: '' });
                  }
                  setContextMenu(prev => ({ ...prev, isOpen: false }));
                }}
              >
                <span className="material-symbols-outlined text-[16px] mr-2 opacity-60">backspace</span>
                Clear
              </button>
              <div className="h-px bg-slate-100 my-1 mx-2" />
              <button
                type="button"
                className="flex items-center text-[13px] text-slate-700 hover:bg-slate-50 px-3 py-1.5 transition-colors cursor-pointer w-full text-left"
                onClick={() => {
                  if (contextMenu.taskId) {
                    const t = tasks.find(tsk => tsk.id === contextMenu.taskId);
                    if (t) {
                      const { id, comments, ...duplicatedTask } = t;
                      useTaskStore.getState().addTask({
                        ...duplicatedTask,
                        title: `${duplicatedTask.title} (Copy)`
                      });
                      showToast('Task duplicated');
                    }
                  }
                  setContextMenu(prev => ({ ...prev, isOpen: false }));
                }}
              >
                <span className="material-symbols-outlined text-[16px] mr-2 opacity-60">content_copy</span>
                Duplicate Task
              </button>
              <button
                type="button"
                className="flex items-center text-[13px] text-red-600 hover:bg-red-50 hover:text-red-700 px-3 py-1.5 transition-colors cursor-pointer w-full text-left"
                onClick={() => {
                  if (contextMenu.taskId) {
                    useTaskStore.getState().deleteTask(contextMenu.taskId);
                    showToast('Task deleted');
                  }
                  setContextMenu(prev => ({ ...prev, isOpen: false }));
                }}
              >
                <span className="material-symbols-outlined text-[16px] mr-2 opacity-60">delete</span>
                Delete Task
              </button>
            </>
          )}

          {contextMenu.type === 'header' && (
            <>
              <button
                type="button"
                className="flex items-center text-[13px] text-slate-700 hover:bg-slate-50 px-3 py-1.5 transition-colors cursor-pointer w-full text-left"
                onClick={() => {
                  if (contextMenu.columnId) {
                    const newName = window.prompt("Enter new column name:", getColumnDisplayName(contextMenu.columnId));
                    if (newName) {
                      useTaskStore.getState().updateColumnName(contextMenu.columnId, newName.trim());
                    }
                  }
                  setContextMenu(prev => ({ ...prev, isOpen: false }));
                }}
              >
                <span className="material-symbols-outlined text-[16px] mr-2 opacity-60">edit</span>
                Rename Column
              </button>
              <button
                type="button"
                className="flex items-center text-[13px] text-slate-700 hover:bg-slate-50 px-3 py-1.5 transition-colors cursor-pointer w-full text-left"
                onClick={() => {
                  if (contextMenu.columnId) {
                    useTaskStore.getState().toggleColumnVisibility(contextMenu.columnId);
                  }
                  setContextMenu(prev => ({ ...prev, isOpen: false }));
                }}
              >
                <span className="material-symbols-outlined text-[16px] mr-2 opacity-60">visibility_off</span>
                Hide Column
              </button>
              {contextMenu.columnId !== 'title' && contextMenu.columnId !== 'dueDate' && contextMenu.columnId !== 'priority' && contextMenu.columnId !== 'status' && contextMenu.columnId !== 'assignee' && contextMenu.columnId !== 'comments' && (
                <>
                  <div className="h-px bg-slate-100 my-1 mx-2" />
                  <button
                    type="button"
                    className="flex items-center text-[13px] text-red-600 hover:bg-red-50 hover:text-red-700 px-3 py-1.5 transition-colors cursor-pointer w-full text-left"
                    onClick={() => {
                      if (contextMenu.columnId && window.confirm("Are you sure you want to delete this column?")) {
                        useTaskStore.getState().removeColumnSchema(contextMenu.columnId);
                      }
                      setContextMenu(prev => ({ ...prev, isOpen: false }));
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px] mr-2 opacity-60">delete</span>
                    Delete Column
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};


