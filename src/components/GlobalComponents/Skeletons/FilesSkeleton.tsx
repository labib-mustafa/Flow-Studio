import React from 'react';
import { Skeleton } from '../../ui/Skeleton';

export const FilesSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* File Explorer Tab Bar */}
      <div className="flex items-center gap-2 px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50/50">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="size-8 rounded-xl shrink-0" />
      </div>

      {/* Navigation Breadcrumb Bar */}
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-1">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="h-7 w-64 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-40 rounded-lg" />
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="size-7 rounded-lg" />
        </div>
      </div>

      {/* Main Files Area */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
        {/* Folders Section */}
        <div>
          <Skeleton className="h-4 w-24 rounded-md mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Skeleton className="size-8 rounded-lg shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <Skeleton className="h-3.5 w-3/4 rounded-md" />
                  <Skeleton className="h-2.5 w-1/2 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Files Grid Section */}
        <div>
          <Skeleton className="h-4 w-20 rounded-md mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3">
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-4 w-4/5 rounded-md" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-12 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
