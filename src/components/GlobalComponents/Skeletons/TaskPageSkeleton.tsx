import React from 'react';
import { Skeleton } from '../../ui/Skeleton';

export const TaskPageSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-white px-8 py-6 overflow-hidden">
      {/* Task Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
      </div>

      {/* Task Table Header Skeleton */}
      <div className="flex items-center gap-4 py-3 px-3 border-b border-slate-100 mt-3 text-xs">
        <Skeleton className="size-4 rounded-full shrink-0" />
        <Skeleton className="h-4 w-1/3 rounded-md" />
        <Skeleton className="h-4 w-20 rounded-md shrink-0 ml-auto" />
        <Skeleton className="h-4 w-24 rounded-md shrink-0" />
        <Skeleton className="h-4 w-20 rounded-md shrink-0" />
        <Skeleton className="h-4 w-20 rounded-md shrink-0" />
      </div>

      {/* Task Rows Skeleton */}
      <div className="flex-1 flex flex-col divide-y divide-slate-100 overflow-y-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3.5 px-3">
            <Skeleton className="size-4 rounded-full shrink-0" />
            <div className="flex-1 flex items-center gap-2.5">
              <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-2/5' : 'w-3/5'} rounded-md`} />
            </div>
            <Skeleton className="size-6 rounded-full shrink-0 ml-auto" />
            <Skeleton className="h-5 w-24 rounded-lg shrink-0" />
            <Skeleton className="h-5 w-18 rounded-full shrink-0" />
            <Skeleton className="h-5 w-20 rounded-md shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
