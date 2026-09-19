import React from 'react';
import { Skeleton } from '../../ui/Skeleton';

export const MoodboardSkeleton: React.FC = () => {
  return (
    <div className="flex-1 relative h-full w-full bg-[#f8f9fa] overflow-hidden">
      {/* Top Floating Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-2 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-lg">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="size-9 rounded-xl" />
        ))}
      </div>

      {/* Floating Canvas Elements Skeleton */}
      <div className="absolute inset-0 p-20 flex flex-wrap gap-8 items-center justify-center">
        {/* Large Image Card */}
        <div className="w-80 h-64 bg-white rounded-2xl p-3 border border-slate-200/90 shadow-md flex flex-col gap-2">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4 rounded-md mt-1" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>

        {/* Color Palette Card */}
        <div className="w-56 h-56 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-md flex flex-col gap-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-4 w-2/3 rounded-md" />
          <Skeleton className="h-3 w-1/3 rounded-md" />
        </div>

        {/* Sticky Note Card */}
        <div className="w-64 h-52 bg-amber-50 rounded-2xl p-5 border border-amber-200/80 shadow-md flex flex-col gap-2.5">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-3.5 w-full rounded-md" />
          <Skeleton className="h-3.5 w-5/6 rounded-md" />
          <Skeleton className="h-3.5 w-3/4 rounded-md" />
        </div>

        {/* Web Bookmark Card */}
        <div className="w-72 h-44 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-md flex gap-3">
          <Skeleton className="size-14 rounded-xl shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-3 w-4/5 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md mt-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};
