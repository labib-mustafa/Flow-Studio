import React from 'react';
import { Skeleton } from '../../ui/Skeleton';

export const ClientsSkeleton: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar bg-[#f5f5f7] min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-40 rounded-xl mb-2" />
            <Skeleton className="h-4 w-60 rounded-md" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col gap-2">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </div>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center justify-between gap-4 py-2">
          <Skeleton className="h-10 w-72 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </div>

        {/* Client Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/90 flex flex-col gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <Skeleton className="size-12 rounded-2xl shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-3.5 w-1/2 rounded-md" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="h-4 w-12 rounded-md" />
                </div>
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
