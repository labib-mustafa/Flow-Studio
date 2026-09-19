import React from 'react';
import { Skeleton } from '../../ui/Skeleton';

export const CalendarSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-white p-8 overflow-hidden">
      {/* Calendar Header Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <div className="flex items-center gap-1">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Weekdays Row */}
      <div className="grid grid-cols-7 gap-2 pb-3 border-b border-slate-100 text-center">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex justify-center">
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>
        ))}
      </div>

      {/* Month Days Grid (7x5) */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-2 pt-2 overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="border border-slate-100 rounded-xl p-2 flex flex-col gap-1.5 bg-slate-50/40">
            <div className="flex justify-end">
              <Skeleton className="size-5 rounded-full" />
            </div>
            {i % 3 === 0 && <Skeleton className="h-4 w-full rounded-md" />}
            {i % 5 === 0 && <Skeleton className="h-4 w-3/4 rounded-md" />}
          </div>
        ))}
      </div>
    </div>
  );
};
