import React, { useState, useEffect } from 'react';
import { addMonths, subMonths, format } from 'date-fns';
import { CalendarGrid } from './CalendarGrid';
import { DayDetailPanel } from './DayDetailPanel';
import { EventModal } from '../Dashboard/EventModal';
import { Search, Plus, ChevronLeft, ChevronRight, Calendar1 } from 'lucide-react';
import { useEventStore } from '../../stores/eventStore';
import { CalendarSkeleton } from '../GlobalComponents/Skeletons/CalendarSkeleton';

export const CalendarPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const isEventModalOpen = useEventStore((s) => s.isEventModalOpen);
  const setEventModalOpen = useEventStore((s) => s.setEventModalOpen);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    return () => {
      setEventModalOpen(false);
    };
  }, [setEventModalOpen]);

  const goToPrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleAddEvent = () => {
    setEventModalOpen(true);
  };

  const _hasHydrated = useEventStore((s) => s._hasHydrated);

  if (!_hasHydrated) {
    return <CalendarSkeleton />;
  }

  return (
    <div className={`flex flex-col h-full bg-[#f5f5f7] overflow-hidden relative transition-all duration-200 ease-linear ${isEventModalOpen ? 'filter blur-[2px] pointer-events-none select-none' : ''}`}>
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-200/80 bg-white shrink-0 flex items-center justify-between gap-4 z-10 relative">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-2">
          <Calendar1 className="size-5 text-slate-900 shrink-0" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Calendar</h2>
        </div>

        {/* Center: Search */}
        <div className="relative group w-full max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-3.5 pointer-events-none" />
          <input
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all font-medium"
            placeholder="Search events..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddEvent}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-bold shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="size-3.5" />
            Add Event
          </button>
        </div>
      </header>

      {/* Toolbar: Month navigation */}
      <div className="px-6 py-3 bg-white border-b border-slate-200/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h3 className="text-base font-bold text-slate-900 tracking-tight min-w-[160px] text-center select-none">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold shadow-sm transition-colors"
        >
          Today
        </button>
      </div>

      {/* Main Content: Grid + Detail Panel */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <CalendarGrid
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            searchQuery={searchQuery}
          />
        </div>

        {selectedDate && (
          <DayDetailPanel
            selectedDate={selectedDate}
            onClose={() => setSelectedDate(null)}
            onAddEvent={handleAddEvent}
          />
        )}
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setEventModalOpen(false)}
        defaultDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
      />
    </div>
  );
};
