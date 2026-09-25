import React, { useState, useMemo } from 'react';
import { CellPopover } from '../../../ui/CellPopover';
import { Task, useTaskStore } from '../../../../stores/taskStore';
import { formatLocalDate } from '../../../../lib/timezone';

interface DueDateDropdownProps {
  task?: Task;
  children: React.ReactNode;
  onUpdateDates?: (startDate: Date | null, dueDate: Date | null) => void;
}

const getDynamicShortcuts = () => {
  const now = new Date();
  const getDayLabel = (daysToAdd: number) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd);
    if (daysToAdd <= 2) {
      return d.toLocaleDateString(undefined, { weekday: 'short' });
    }
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  };

  return [
    { id: 'today', label: 'Today', dayStr: getDayLabel(0), daysAdded: 0 },
    { id: 'later', label: 'Later', dayStr: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), daysAdded: 0 },
    { id: 'tomorrow', label: 'Tomorrow', dayStr: getDayLabel(1), daysAdded: 1 },
    { id: 'this_weekend', label: 'This weekend', dayStr: getDayLabel(2), daysAdded: 2 },
    { id: 'next_week', label: 'Next week', dayStr: getDayLabel(7), daysAdded: 7 },
    { id: '2_weeks', label: '2 weeks', dayStr: getDayLabel(14), daysAdded: 14 },
    { id: '4_weeks', label: '4 weeks', dayStr: getDayLabel(28), daysAdded: 28 },
  ];
};

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Dynamic calendar generator
const generateCalendarDays = (year: number, month: number) => {
  const days = [];
  const firstDay = new Date(year, month, 1);
  const firstDayIndex = firstDay.getDay(); // Day of week for 1st day (0 is Sunday, etc.)

  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

  // Previous month padded days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    days.push({
      date: new Date(year, month - 1, dayNum),
      label: dayNum.toString(),
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      label: i.toString(),
      isCurrentMonth: true
    });
  }

  // Next month padded days to complete 42 cells (6 rows)
  const totalCells = 42;
  const remainingCells = totalCells - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      label: i.toString(),
      isCurrentMonth: false
    });
  }

  return days;
};

const EMPTY_DAYS: any[] = [];

export const DueDateDropdown: React.FC<DueDateDropdownProps> = React.memo(({ task, children, onUpdateDates }) => {
  const handleUpdateDates = (startDate: Date | null, dueDate: Date | null) => {
    if (onUpdateDates) {
      onUpdateDates(startDate, dueDate);
    } else {
      useTaskStore.getState().updateTaskDates(task?.id || '', startDate, dueDate);
    }
  };
  const [open, setOpen] = useState(false);
  const [activeInput, setActiveInput] = useState<'start' | 'due'>('due');
  const [startInput, setStartInput] = useState(task?.startDate ? new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
  const [dueInput, setDueInput] = useState(task?.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
  const [durationInput, setDurationInput] = useState('');
  const [isEditingDuration, setIsEditingDuration] = useState(false);

  // Keep track of the month/year currently displayed in the calendar
  const [viewDate, setViewDate] = useState<Date>(() => {
    const defaultDateStr = task?.dueDate || task?.startDate;
    if (defaultDateStr) {
      const d = new Date(defaultDateStr);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }
    return new Date();
  });

  const shortcuts = useMemo(() => getDynamicShortcuts(), [open]);

  const calendarDays = useMemo(() => {
    if (!open) return EMPTY_DAYS;
    return generateCalendarDays(viewDate.getFullYear(), viewDate.getMonth());
  }, [open, viewDate]);

  // Keep input fields in sync with store changes
  React.useEffect(() => {
    setStartInput(task?.startDate ? new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
  }, [task?.startDate]);

  React.useEffect(() => {
    setDueInput(task?.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
  }, [task?.dueDate]);

  // Calculate duration if both dates exist
  const durationInDays = useMemo(() => {
    if (task?.startDate && task?.dueDate) {
      const start = new Date(task.startDate);
      const due = new Date(task.dueDate);
      const diffTime = due.getTime() - start.getTime();
      if (diffTime >= 0) {
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }
    return null;
  }, [task?.startDate, task?.dueDate]);

  const selectedDateStr = activeInput === 'start' ? task?.startDate : task?.dueDate;
  
  const handleSelectShortcut = (shortcut: ReturnType<typeof getDynamicShortcuts>[0]) => {
    const today = new Date();
    today.setDate(today.getDate() + shortcut.daysAdded);
    if (activeInput === 'start') {
      handleUpdateDates(today, task?.dueDate ? new Date(task.dueDate) : null);
      setViewDate(today);
      setActiveInput('due');
    } else {
      handleUpdateDates(task?.startDate ? new Date(task.startDate) : null, today);
      setViewDate(today);
      setOpen(false);
    }
  };

  const handleSelectDate = (date: Date) => {
    if (activeInput === 'start') {
      handleUpdateDates(date, task?.dueDate ? new Date(task.dueDate) : null);
      setStartInput(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      setViewDate(date);
      setActiveInput('due');
    } else {
      handleUpdateDates(task?.startDate ? new Date(task.startDate) : null, date);
      setDueInput(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      setViewDate(date);
    }
  };

  const handleStartInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartInput(e.target.value);
    const parsed = new Date(e.target.value);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
      handleUpdateDates(parsed, task?.dueDate ? new Date(task.dueDate) : null);
      setViewDate(parsed);
    }
  };

  const handleDueInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDueInput(e.target.value);
    const parsed = new Date(e.target.value);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
      handleUpdateDates(task?.startDate ? new Date(task.startDate) : null, parsed);
      setViewDate(parsed);
    }
  };

  const handleClearStart = () => {
    setStartInput('');
    handleUpdateDates(null, task?.dueDate ? new Date(task.dueDate) : null);
  };

  const handleClearDue = () => {
    setDueInput('');
    handleUpdateDates(task?.startDate ? new Date(task.startDate) : null, null);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDurationInput(e.target.value);
  };

  const handleDurationSubmit = () => {
    setIsEditingDuration(false);
    const daysMatch = durationInput.match(/(\d+)/);
    if (daysMatch && task?.startDate) {
      const days = parseInt(daysMatch[1], 10);
      const start = new Date(task.startDate);
      start.setDate(start.getDate() + days);
      handleUpdateDates(new Date(task.startDate), start);
      setDueInput(start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      setViewDate(start);
    }
    setDurationInput('');
  };

  const handlePrevMonth = () => {
    setViewDate(prev => {
      // Set to first day of previous month to avoid month skipping on 29/30/31st of month
      return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
    });
  };

  const handleNextMonth = () => {
    setViewDate(prev => {
      // Set to first day of next month to avoid month skipping on 29/30/31st of month
      return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
    });
  };

  const handleGoToToday = () => {
    const mockToday = new Date(2026, 4, 28);
    setViewDate(new Date(2026, 4, 1));
    handleSelectDate(mockToday);
  };

  const activeBorderClass = "border-zinc-800 shadow-sm bg-white";
  const inactiveBorderClass = "border-transparent bg-slate-50 opacity-70 hover:opacity-100 hover:bg-slate-100 cursor-text";

  const content = open ? (
    <div className="flex flex-col w-[560px] font-sans overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center gap-2 p-2 border-b border-slate-100">
        <div 
          className={`flex-1 flex items-center border rounded-[4px] px-3 py-1.5 relative transition-colors ${activeInput === 'start' ? activeBorderClass : inactiveBorderClass}`}
          onClick={() => setActiveInput('start')}
        >
           <span className="material-symbols-outlined text-[16px] text-slate-500 mr-2">event</span>
           <input 
             type="text" 
             value={startInput}
             onChange={handleStartInputChange}
             placeholder="Start date"
             className={`text-[13px] outline-none w-full bg-transparent placeholder:text-slate-400 ${activeInput === 'start' ? 'text-slate-800 font-medium' : 'text-slate-600'}`}
           />
           {startInput && (
             <button onClick={(e) => { e.stopPropagation(); handleClearStart(); }} className="ml-1 text-slate-400 hover:text-slate-600 outline-none flex items-center">
               <span className="material-symbols-outlined text-[14px]">close</span>
             </button>
           )}
        </div>
        <div 
          className={`flex-1 flex items-center border rounded-[4px] px-3 py-1.5 relative transition-colors ${activeInput === 'due' ? activeBorderClass : inactiveBorderClass}`}
          onClick={() => setActiveInput('due')}
        >
           <span className="material-symbols-outlined text-[16px] text-slate-500 mr-2">event</span>
           <input 
             type="text" 
             value={dueInput}
             onChange={handleDueInputChange}
             placeholder="Due date"
             className={`text-[13px] outline-none w-full bg-transparent placeholder:text-slate-400 ${activeInput === 'due' ? 'text-slate-800 font-medium' : 'text-slate-600'}`}
           />
           {dueInput && (
             <button onClick={(e) => { e.stopPropagation(); handleClearDue(); }} className="ml-1 text-slate-400 hover:text-slate-600 outline-none flex items-center">
               <span className="material-symbols-outlined text-[14px]">close</span>
             </button>
           )}
        </div>
        
        {isEditingDuration ? (
           <div className="flex items-center bg-white border border-zinc-800 rounded-[4px] px-3 py-1.5 w-[90px] shadow-sm relative">
             <input 
               type="text"
               autoFocus
               value={durationInput}
               onChange={handleDurationChange}
               onKeyDown={(e) => e.key === 'Enter' && handleDurationSubmit()}
               onBlur={handleDurationSubmit}
               placeholder="e.g. 5d"
               className="text-[13px] text-slate-800 outline-none w-full bg-transparent font-medium"
             />
           </div>
        ) : (
          <button 
            onClick={() => setIsEditingDuration(true)}
            className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-[4px] hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">hourglass_empty</span>
            {durationInDays !== null ? (
              <span className="text-[13px] font-medium bg-slate-200 text-slate-700 px-1.5 rounded-[3px]">{durationInDays}d</span>
            ) : (
              <span className="text-[13px] font-medium">Duration</span>
            )}
          </button>
        )}
      </div>

      <div className="flex h-[320px]">
        {/* Left Sidebar */}
        <div className="w-[180px] border-r border-slate-100 flex flex-col py-2 overflow-y-auto">
          {shortcuts.map(sc => (
            <button 
              key={sc.id} 
              onClick={() => handleSelectShortcut(sc)}
              className="flex justify-between items-center px-4 py-2 hover:bg-gray-50 transition-colors w-full cursor-pointer"
            >
              <span className="text-[13px] text-slate-700 font-medium">{sc.label}</span>
              <span className="text-[12px] text-slate-400">{sc.dayStr}</span>
            </button>
          ))}
          <div className="mt-auto px-2 pt-2 border-t border-slate-100">
            <button className="flex justify-between items-center px-2 py-1.5 hover:bg-gray-50 transition-colors w-full rounded-md cursor-pointer">
               <span className="text-[13px] text-slate-700 font-medium">Set Recurring</span>
               <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Right Calendar */}
        <div className="flex-1 flex flex-col px-4 py-3">
          <div className="flex items-center justify-between mb-4">
             <span className="text-[14px] font-semibold text-slate-800">
               {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
             </span>
             <div className="flex items-center gap-1">
                <button 
                  onClick={handleGoToToday}
                  className="text-[13px] font-medium text-slate-500 hover:text-slate-800 mr-2 rounded hover:bg-slate-50 px-1.5 py-0.5 transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button 
                  onClick={handlePrevMonth}
                  className="text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 p-1 flex items-center justify-center transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <span className="material-symbols-outlined text-[18px]">expand_less</span>
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 p-1 flex items-center justify-center transition-colors cursor-pointer"
                  title="Next month"
                >
                  <span className="material-symbols-outlined text-[18px]">expand_more</span>
                </button>
             </div>
          </div>
          
          <div className="grid grid-cols-7 mb-2">
             {DAYS_OF_WEEK.map(day => (
               <div key={day} className="text-[12px] font-medium text-slate-400 text-center">{day}</div>
             ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
             {calendarDays.map((d, index) => {
               const cellDateStr = formatLocalDate(d.date);
               const isSelected = cellDateStr === selectedDateStr;
               const isToday = cellDateStr === formatLocalDate(new Date());
               return (
                 <button
                   key={index}
                   onClick={() => handleSelectDate(d.date)}
                   className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-[13px] transition-colors cursor-pointer
                     ${!d.isCurrentMonth 
                       ? 'text-slate-300' 
                       : isSelected 
                         ? 'bg-[#f25056] text-white font-semibold' 
                         : isToday 
                           ? 'text-[#f25056] font-bold border border-red-200' 
                           : 'text-slate-700 hover:bg-slate-100'}
                   `}
                 >
                   {d.label}
                 </button>
               );
             })}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <CellPopover
      open={open}
      onOpenChange={setOpen}
      content={content}
      align="start"
      side="bottom"
      triggerClassName="w-full h-full"
    >
      {React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: `${(children as React.ReactElement<{ className?: string }>).props.className || ''} ${open ? '!border-gray-300' : ''}`
      })}
    </CellPopover>
  );
});
