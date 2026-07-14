import React from 'react';
import { format } from 'date-fns';
import { X, Clock, Users, Trash2, Plus } from 'lucide-react';
import { useEventStore, CalendarEvent } from '../../stores/eventStore';
import { motion, AnimatePresence } from 'framer-motion';

interface DayDetailPanelProps {
  selectedDate: Date | null;
  onClose: () => void;
  onAddEvent: () => void;
}

const EVENT_TYPE_STYLES: Record<CalendarEvent['type'], { badge: string; dot: string }> = {
  Call: { badge: 'bg-blue-50 text-blue-700 border border-blue-200/60', dot: 'bg-blue-500' },
  Design: { badge: 'bg-purple-50 text-purple-700 border border-purple-200/60', dot: 'bg-purple-500' },
  'Team Sync': { badge: 'bg-amber-50 text-amber-700 border border-amber-200/60', dot: 'bg-amber-500' },
  Other: { badge: 'bg-slate-100 text-slate-600 border border-slate-200/60', dot: 'bg-slate-400' },
};

export const DayDetailPanel: React.FC<DayDetailPanelProps> = ({
  selectedDate,
  onClose,
  onAddEvent,
}) => {
  const events = useEventStore((s) => s.events);
  const deleteEvent = useEventStore((s) => s.deleteEvent);

  if (!selectedDate) return null;

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dayEvents = events
    .filter((evt) => evt.date === dateKey)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <AnimatePresence>
      <motion.div
        key="day-detail"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 340, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.05 }}
        className="h-full border-l border-slate-200/80 bg-white flex flex-col overflow-hidden shrink-0"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {format(selectedDate, 'EEEE')}
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {format(selectedDate, 'MMMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2.5">
          {dayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-slate-400 text-[24px]">
                  calendar_month
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-500">No events</p>
              <p className="text-xs text-slate-400 mt-1">This day is wide open.</p>
            </div>
          ) : (
            dayEvents.map((evt) => {
              const style = EVENT_TYPE_STYLES[evt.type] || EVENT_TYPE_STYLES.Other;
              return (
                <div
                  key={evt.id}
                  className="bg-white border border-slate-200/80 rounded-xl p-3.5 group hover:shadow-sm transition-shadow"
                >
                  {/* Top row: time + type badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="size-3" />
                      <span className="text-[11px] font-semibold">{evt.time}</span>
                    </div>
                    <span
                      className={`${style.badge} text-[10px] font-bold px-2 py-0.5 rounded-full`}
                    >
                      {evt.type}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                    {evt.title}
                  </h4>

                  {/* Description */}
                  {evt.description && (
                    <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2">
                      {evt.description}
                    </p>
                  )}

                  {/* Participants + Delete */}
                  <div className="flex items-center justify-between">
                    {evt.participants ? (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Users className="size-3" />
                        <span className="text-[10px] font-medium truncate max-w-[160px]">
                          {evt.participants}
                        </span>
                      </div>
                    ) : (
                      <div />
                    )}
                    <button
                      onClick={() => deleteEvent(evt.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Event Button */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button
            onClick={onAddEvent}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="size-3.5" />
            Add Event
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
