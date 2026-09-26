import React, { useState } from 'react';
import { useEventStore, CalendarEvent } from '../../stores/eventStore';
import { EventModal } from './EventModal';

interface RightPanelProps {
  onNavigate?: (view: string) => void;
  onNewProject?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ onNavigate, onNewProject }) => {
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const currentMonthName = viewDate.toLocaleString('default', { month: 'long' }) + ' ' + viewDate.getFullYear();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const { getEventsByDate, events, isEventModalOpen, setEventModalOpen } = useEventStore();

  const selectedDateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const dayEvents = getEventsByDate(selectedDateStr);

  const getEventStyle = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'Call': return { bg: 'bg-accent/5', border: 'border-accent/20 hover:border-accent/40', text: 'text-accent', icon: 'videocam' };
      case 'Design': return { bg: 'bg-purple-50/80', border: 'border-purple-100 hover:border-purple-200', text: 'text-purple-600', icon: 'design_services' };
      case 'Team Sync': return { bg: 'bg-amber-50/80', border: 'border-amber-100 hover:border-amber-200', text: 'text-amber-600', icon: 'groups' };
      default: return { bg: 'bg-slate-50/80', border: 'border-slate-200 hover:border-slate-300', text: 'text-slate-600', icon: 'event' };
    }
  };

  return (
    <aside className="w-80 flex-shrink-0 bg-white border-l border-slate-100 hidden 2xl:flex flex-col p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
        ><span className="material-symbols-outlined text-sm">arrow_back_ios</span></button>
        <h3 className="font-bold text-slate-800 tracking-tight">{currentMonthName}</h3>
        <button
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
        ><span className="material-symbols-outlined text-sm">arrow_forward_ios</span></button>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
          {weekDays.map(day => (
            <span key={day} className="text-[10px] font-bold text-slate-400">{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-slate-600 font-medium text-xs">
          {Array.from({ length: startOffset }).map((_, i) => <span key={`empty-${i}`}></span>)}
          {days.map(day => (
            <span
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`p-1.5 rounded-full cursor-pointer transition-all ${day === selectedDay
                ? 'bg-black text-white font-bold shadow-md scale-105'
                : 'hover:bg-slate-100 text-slate-700'
                }`}
            >
              {day}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={() => setEventModalOpen(true)}
        className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl mb-6 shadow hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-sm">event_available</span>
        Schedule Event
      </button>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base text-slate-800">{viewDate.toLocaleString('default', { month: 'short' })} {selectedDay} Schedule</h3>
        <div className="flex gap-2 text-slate-400">
          <span className="material-symbols-outlined text-sm cursor-pointer hover:text-slate-600 transition-colors" onClick={() => { }}>refresh</span>
          <span className="material-symbols-outlined text-sm cursor-pointer hover:text-slate-600 transition-colors" onClick={() => { }}>edit_document</span>
        </div>
      </div>

      <div className="space-y-5 relative flex-1">
        <div className="absolute left-[34px] top-2 bottom-0 w-px bg-slate-100"></div>

        {dayEvents.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs font-medium text-slate-400">No events scheduled for today.</p>
          </div>
        ) : (
          dayEvents.map(evt => {
            const style = getEventStyle(evt.type);
            return (
              <div key={evt.id} className="flex gap-4 relative group cursor-pointer">
                <span className="text-[10px] text-slate-400 font-semibold w-8 text-right pt-1 shrink-0">{evt.time}</span>
                <div className={`flex-1 ${style.bg} p-3 rounded-xl border ${style.border} group-hover:shadow-sm transition-all`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`material-symbols-outlined ${style.text} text-sm`}>{style.icon}</span>
                      <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                    </div>
                  </div>
                  {evt.description && (
                    <p className="text-[10px] text-slate-600 font-medium mb-1.5">{evt.description}</p>
                  )}
                  {evt.participants && (
                    <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold text-slate-500 bg-white/60 w-fit px-2 py-0.5 rounded-md border border-white">
                      <span className="material-symbols-outlined text-[12px]">group</span>
                      {evt.participants}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setEventModalOpen(false)}
        defaultDate={selectedDateStr}
      />
    </aside>
  );
};
