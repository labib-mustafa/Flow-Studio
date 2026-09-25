import React, { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { useEventStore, CalendarEvent } from '../../stores/eventStore';

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  searchQuery?: string;
}

const EVENT_TYPE_COLORS: Record<CalendarEvent['type'], { bg: string; text: string }> = {
  Call: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Design: { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Team Sync': { bg: 'bg-amber-100', text: 'text-amber-700' },
  Other: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentMonth,
  selectedDate,
  onSelectDate,
  searchQuery = '',
}) => {
  const events = useEventStore((s) => s.events);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    const filteredEvents = searchQuery
      ? events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()) || (e.client && e.client.toLowerCase().includes(searchQuery.toLowerCase())))
      : events;

    filteredEvents.forEach((evt) => {
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    });
    return map;
  }, [events, searchQuery]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200/60">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 flex-1 min-h-0">
        {calendarDays.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = selectedDate ? isSameDay(day, selectedDate) : false;
          const dayEvents = eventsByDate[dateKey] || [];
          const maxVisible = 3;
          const overflow = dayEvents.length - maxVisible;

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(day)}
              className={`
                relative flex flex-col items-start p-1.5 sm:p-2 border-b border-r border-slate-100
                text-left transition-colors duration-150 cursor-pointer min-h-[80px] group
                ${!inMonth ? 'bg-slate-50/40' : 'bg-white hover:bg-slate-50/60'}
                ${selected ? 'ring-2 ring-inset ring-accent/30 bg-blue-50/30' : ''}
              `}
            >
              {/* Day number */}
              <span
                className={`
                  inline-flex items-center justify-center size-7 rounded-full text-sm font-semibold mb-1 transition-colors
                  ${today ? 'bg-primary text-white' : ''}
                  ${!today && inMonth ? 'text-slate-800 group-hover:text-slate-900' : ''}
                  ${!today && !inMonth ? 'text-slate-300' : ''}
                `}
              >
                {format(day, 'd')}
              </span>

              {/* Event pills */}
              <div className="flex flex-col gap-0.5 w-full overflow-hidden flex-1">
                {dayEvents.slice(0, maxVisible).map((evt) => {
                  const color = EVENT_TYPE_COLORS[evt.type] || EVENT_TYPE_COLORS.Other;
                  return (
                    <div
                      key={evt.id}
                      className={`${color.bg} ${color.text} text-[10px] font-medium leading-tight px-1.5 py-0.5 rounded-md truncate w-full`}
                    >
                      {evt.title}
                    </div>
                  );
                })}
                {overflow > 0 && (
                  <span className="text-[10px] font-semibold text-slate-400 pl-1">
                    +{overflow} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
