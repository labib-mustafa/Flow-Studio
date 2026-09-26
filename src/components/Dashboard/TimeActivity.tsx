import React, { useMemo, useState, useEffect } from 'react';
import { useActivityStore } from '../../stores/activityStore';

export const TimeActivity: React.FC = () => {
  const { getActivityCounts, activities } = useActivityStore();
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  // Wait for hydration or rely on useActivityStore
  // (No dummy fetch)
  // Re-calculate the grid whenever activities change
  const { weeks, maxCount } = useMemo(() => {
    const counts = getActivityCounts();
    let max = 0;
    Object.values(counts).forEach(c => {
      if (c > max) max = c;
    });

    // We want 52 columns of 7 days, ending on today.
    const today = new Date();
    // Normalize to midnight
    today.setHours(0, 0, 0, 0);

    const days: { date: Date; dateStr: string; count: number }[] = [];

    // Go back exactly 364 days + today = 365 days
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);

      // format YYYY-MM-DD local
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      days.push({
        date: d,
        dateStr,
        count: counts[dateStr] || 0
      });
    }

    // Proper alignment:
    const startDayOfWeek = days[0].date.getDay(); // 0 = Sunday, 6 = Saturday
    const alignedWeeks: { dateStr: string; count: number; empty: boolean }[][] = [];

    let currentWeek: { dateStr: string; count: number; empty: boolean }[] = [];

    // Pad first week with empty days if needed
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({ dateStr: '', count: 0, empty: true });
    }

    days.forEach(day => {
      currentWeek.push({ dateStr: day.dateStr, count: day.count, empty: false });
      if (currentWeek.length === 7) {
        alignedWeeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      // Pad last week with empty days
      while (currentWeek.length < 7) {
        currentWeek.push({ dateStr: '', count: 0, empty: true });
      }
      alignedWeeks.push(currentWeek);
    }

    return { weeks: alignedWeeks, maxCount: max > 5 ? max : 5 };
  }, [activities, getActivityCounts]);

  const getColorClass = (count: number, max: number) => {
    if (count === 0) return 'bg-slate-100 border-slate-200/60';
    const ratio = count / max;
    if (ratio < 0.25) return 'bg-accent/20 border-accent/30';
    if (ratio < 0.5) return 'bg-accent/40 border-accent/50';
    if (ratio < 0.75) return 'bg-accent/60 border-accent/70';
    return 'bg-accent/80 border-accent/90';
  };

  const handleMouseEnter = (e: React.MouseEvent, count: number, dateStr: string) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setHoveredDay({
      date: dateStr,
      count,
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    // Manual formatting to ensure local time is used and no timezone shift occurs on parsing
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-200/80 font-sans mt-8 overflow-x-auto custom-scrollbar relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 min-w-[750px]">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-2">
            Time Activity
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="size-3 rounded-sm bg-slate-100 border border-slate-200/60"></div>
            <div className="size-3 rounded-sm bg-accent/20"></div>
            <div className="size-3 rounded-sm bg-accent/40"></div>
            <div className="size-3 rounded-sm bg-accent/60"></div>
            <div className="size-3 rounded-sm bg-accent/80"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="flex gap-1 min-w-[750px] relative pb-2" onMouseLeave={() => setHoveredDay(null)}>
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-1">
            {week.map((day, dIdx) => (
              <div
                key={dIdx}
                onMouseEnter={(e) => !day.empty && handleMouseEnter(e, day.count, day.dateStr)}
                className={`size-3 rounded-sm ${day.empty ? 'bg-transparent border-transparent' : getColorClass(day.count, maxCount)} transition-colors duration-200 hover:ring-2 hover:ring-slate-400 hover:ring-offset-1 z-10 cursor-crosshair`}
              ></div>
            ))}
          </div>
        ))}
      </div>

      {hoveredDay && (
        <div
          className="fixed z-50 bg-slate-950 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-2xl border border-slate-800 pointer-events-none animate-in fade-in zoom-in-95 duration-100 whitespace-nowrap"
          style={{
            left: hoveredDay.x,
            top: hoveredDay.y - 8,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <span className="text-slate-300 font-medium">{hoveredDay.count} activit{hoveredDay.count !== 1 ? 'ies' : 'y'} on </span>
          <span className="text-white">{formatDate(hoveredDay.date)}</span>
        </div>
      )}
    </div>
  );
};
