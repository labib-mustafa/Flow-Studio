import React from 'react';
import { Skeleton } from '../../ui/Skeleton';

export const ProjectsSkeleton: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar bg-[#f5f5f7] min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Header Toolbar Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-44 rounded-xl mb-2" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>

        {/* Search & Filter Pills Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-9 w-64 rounded-xl" />
        </div>

        {/* Project Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs flex flex-col"
            >
              {/* Banner Image Skeleton */}
              <div className="h-48 w-full bg-slate-100 relative">
                <Skeleton className="h-full w-full rounded-none" />
                <div className="absolute top-3.5 left-3.5">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>

              {/* Body Content Skeleton */}
              <div className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <Skeleton className="h-3.5 w-1/2 rounded-md" />
                  </div>
                  <Skeleton className="size-7 rounded-xl" />
                </div>

                {/* Progress bar skeleton */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-3 w-8 rounded-md" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>

                {/* Footer skeleton */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3.5 w-16 rounded-md" />
                    <Skeleton className="h-3.5 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
