import React, { useState, useMemo, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';

interface DatePickerInputProps {
  value?: string; // YYYY-MM-DD
  defaultValue?: string; // YYYY-MM-DD
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS_LIST = Array.from({ length: 31 }, (_, i) => CURRENT_YEAR - 10 + i);

const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseISODate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y > 1900 && y < 2100) {
      return new Date(y, m, d);
    }
  }
  return null;
};

const formatDisplayDate = (dateStr?: string): string => {
  const date = parseISODate(dateStr);
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const generateCalendarDays = (year: number, month: number) => {
  const days = [];
  const firstDay = new Date(year, month, 1);
  const firstDayIndex = firstDay.getDay();

  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    days.push({
      date: new Date(year, month - 1, dayNum),
      label: dayNum.toString(),
      isCurrentMonth: false
    });
  }

  for (let i = 1; i <= daysInCurrentMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      label: i.toString(),
      isCurrentMonth: true
    });
  }

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

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  defaultValue,
  onChange,
  name,
  placeholder = 'Select date...',
  className = '',
  required = false
}) => {
  const [internalValue, setInternalValue] = useState<string>(value || defaultValue || '');
  const [open, setOpen] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const [viewDate, setViewDate] = useState<Date>(() => {
    const parsed = parseISODate(internalValue);
    return parsed || new Date();
  });

  useEffect(() => {
    if (open) {
      const parsed = parseISODate(internalValue);
      if (parsed) setViewDate(parsed);
      setShowMonthDropdown(false);
      setShowYearDropdown(false);
    }
  }, [open, internalValue]);

  const calendarDays = useMemo(() => {
    return generateCalendarDays(viewDate.getFullYear(), viewDate.getMonth());
  }, [viewDate]);

  const handleSelectDate = (d: Date) => {
    const iso = formatDateToISO(d);
    setInternalValue(iso);
    onChange?.(iso);
    setViewDate(d);
    setOpen(false);
    setShowMonthDropdown(false);
    setShowYearDropdown(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalValue('');
    onChange?.('');
  };

  const handleShortcut = (daysToAdd: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysToAdd);
    handleSelectDate(target);
  };

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const todayStr = formatDateToISO(new Date());
  const formattedDate = formatDisplayDate(internalValue);

  return (
    <div className="relative w-full">
      {name && <input type="hidden" name={name} value={internalValue} required={required} />}
      
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={`flex items-center justify-between w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold transition-all text-left outline-none ${
              open ? 'ring-2 ring-zinc-900/10 border-zinc-900 bg-white shadow-sm' : 'hover:border-slate-300 hover:bg-slate-100/50'
            } ${className}`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <CalendarIcon className={`size-4 shrink-0 transition-colors ${open ? 'text-zinc-900' : 'text-slate-400'}`} />
              <span className={internalValue ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}>
                {formattedDate || placeholder}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {internalValue && !required && (
                <span
                  onClick={handleClear}
                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                  title="Clear date"
                >
                  <X className="size-3.5" />
                </span>
              )}
              <ChevronDown className={`size-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-zinc-900' : ''}`} />
            </div>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            side="bottom"
            sideOffset={6}
            className="z-[99999] w-[260px] rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xl font-sans animate-in fade-in-0 zoom-in-95 duration-150 outline-none relative"
          >
            {(showMonthDropdown || showYearDropdown) && (
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMonthDropdown(false);
                  setShowYearDropdown(false);
                }}
              />
            )}

            {/* Header with Custom Month & Year Dropdowns */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 relative">
              <div className="flex items-center gap-1">
                {/* Custom Month Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMonthDropdown(!showMonthDropdown);
                      setShowYearDropdown(false);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-extrabold transition-colors cursor-pointer ${
                      showMonthDropdown ? 'bg-zinc-950 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200/80 text-slate-800'
                    }`}
                  >
                    <span>{MONTH_NAMES[viewDate.getMonth()].slice(0, 3)}</span>
                    <ChevronDown className={`size-3 transition-transform duration-200 ${showMonthDropdown ? 'rotate-180 text-emerald-400' : 'text-slate-500'}`} />
                  </button>

                  <AnimatePresence>
                    {showMonthDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-8 left-0 z-50 w-32 max-h-48 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-2xl p-1 space-y-0.5"
                      >
                        {MONTH_NAMES.map((monthName, idx) => {
                          const isSelected = idx === viewDate.getMonth();
                          return (
                            <button
                              key={monthName}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewDate(prev => new Date(prev.getFullYear(), idx, 1));
                                setShowMonthDropdown(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-zinc-950 text-white shadow-sm font-extrabold'
                                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                            >
                              <span>{monthName}</span>
                              {isSelected && <span className="size-1.5 rounded-full bg-emerald-400" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Custom Year Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowYearDropdown(!showYearDropdown);
                      setShowMonthDropdown(false);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-extrabold transition-colors cursor-pointer ${
                      showYearDropdown ? 'bg-zinc-950 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200/80 text-slate-800'
                    }`}
                  >
                    <span>{viewDate.getFullYear()}</span>
                    <ChevronDown className={`size-3 transition-transform duration-200 ${showYearDropdown ? 'rotate-180 text-emerald-400' : 'text-slate-500'}`} />
                  </button>

                  <AnimatePresence>
                    {showYearDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-8 left-0 z-50 w-24 max-h-48 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-2xl p-1 space-y-0.5"
                      >
                        {YEARS_LIST.map((y) => {
                          const isSelected = y === viewDate.getFullYear();
                          return (
                            <button
                              key={y}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewDate(prev => new Date(y, prev.getMonth(), 1));
                                setShowYearDropdown(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-zinc-950 text-white shadow-sm font-extrabold'
                                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                            >
                              <span>{y}</span>
                              {isSelected && <span className="size-1.5 rounded-full bg-emerald-400" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center py-0.5">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d, idx) => {
                const cellDateStr = formatDateToISO(d.date);
                const isSelected = cellDateStr === internalValue;
                const isToday = cellDateStr === todayStr;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDate(d.date)}
                    className={`h-7 w-7 mx-auto flex items-center justify-center rounded-lg text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                      !d.isCurrentMonth
                        ? 'text-slate-300 hover:text-slate-500 hover:bg-slate-50/80'
                        : isSelected
                          ? 'bg-zinc-950 text-white shadow-sm shadow-zinc-950/25 scale-105 z-10 font-extrabold'
                          : isToday
                            ? 'text-zinc-950 font-black border border-zinc-900/30 bg-zinc-50 hover:bg-zinc-100'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Shortcuts Footer */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[10px] font-bold text-slate-400">Quick:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleShortcut(0)}
                  className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-bold rounded-md border border-slate-200/60 transition-colors text-[10px] cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleShortcut(1)}
                  className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-bold rounded-md border border-slate-200/60 transition-colors text-[10px] cursor-pointer"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleShortcut(7)}
                  className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-bold rounded-md border border-slate-200/60 transition-colors text-[10px] cursor-pointer"
                >
                  +1 Week
                </button>
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};
