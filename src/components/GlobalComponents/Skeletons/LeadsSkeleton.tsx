import React from 'react';
import { Skeleton } from '../../ui/Skeleton';

export const LeadsSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#f5f5f7] p-8 overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Skeleton className="h-8 w-36 rounded-xl mb-2" />
          <Skeleton className="h-4 w-52 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-20 rounded-xl" />
        </div>
      </div>

      {/* Pipeline Columns Skeleton */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 overflow-hidden">
        {[1, 2, 3, 4].map((col) => (
          <div key={col} className="bg-slate-100/70 rounded-2xl p-4 flex flex-col gap-3.5 border border-slate-200/60">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="size-5 rounded-full" />
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto">
              {[1, 2, 3].map((card) => (
                <div key={card} className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex flex-col gap-2.5">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-12 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-6 rounded-full" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                    <Skeleton className="h-5 w-14 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
