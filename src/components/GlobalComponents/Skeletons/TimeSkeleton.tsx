import React from 'react';
import { Skeleton } from '../../ui/Skeleton';

export const TimeSkeleton: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar bg-[#f5f5f7] min-h-screen">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-44 rounded-xl mb-2" />
            <Skeleton className="h-4 w-60 rounded-md" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        {/* Stopwatch Active Bar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Skeleton className="size-12 rounded-2xl" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-3.5 w-32 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>

        {/* Weekly Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col gap-2">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Recent Time Entries */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col gap-3">
          <Skeleton className="h-5 w-36 rounded-md mb-2" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-xl" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-44 rounded-md" />
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
