import React from 'react';
import { Skeleton } from '../../ui/Skeleton';

export const NotesSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex h-full bg-white overflow-hidden">
      {/* Left Sidebar Notes List */}
      <div className="w-80 border-r border-slate-100 flex flex-col p-4 gap-4 bg-slate-50/40">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="size-7 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-full rounded-xl" />

        <div className="flex flex-col gap-2.5 overflow-y-auto mt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-3.5 bg-white rounded-xl border border-slate-100 flex flex-col gap-2 shadow-2xs">
              <Skeleton className="h-4 w-4/5 rounded-md" />
              <Skeleton className="h-3 w-full rounded-md" />
              <div className="flex justify-between items-center mt-1">
                <Skeleton className="h-2.5 w-16 rounded-md" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Document Editor Area */}
      <div className="flex-1 flex flex-col p-10 overflow-y-auto max-w-4xl mx-auto w-full gap-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <Skeleton className="h-4 w-32 rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>

        <Skeleton className="h-10 w-3/4 rounded-xl" />

        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-28 rounded-md ml-auto" />
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-11/12 rounded-md" />
          <Skeleton className="h-4 w-4/5 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md mt-4" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
        </div>
      </div>
    </div>
  );
};
