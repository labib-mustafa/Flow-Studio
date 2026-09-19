import React from 'react';
import { Skeleton } from '../../ui/Skeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex h-full overflow-hidden bg-[#f5f5f7]">
      <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar bg-white">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-4 w-48 rounded-full" />
            </div>
            <Skeleton className="h-9 w-72 rounded-xl" />
            {/* Quick capture bar */}
            <Skeleton className="h-11 w-full rounded-2xl mt-2" />
          </div>

          {/* 4 Bento Stat Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-slate-50/80 rounded-[24px] p-6 border border-slate-100 flex flex-col justify-between min-h-[180px]"
              >
                <div className="flex justify-between items-start">
                  <Skeleton className="size-10 rounded-xl" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
                <div className="my-4">
                  <Skeleton className="h-10 w-24 rounded-lg mb-2" />
                  <Skeleton className="h-3.5 w-32 rounded-md" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>

          {/* Ongoing Projects + Renewals Grid Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Ongoing Projects (2 Cols) */}
            <div className="xl:col-span-2 bg-slate-50/80 rounded-[28px] p-6 border border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-6 w-40 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col gap-3">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <Skeleton className="h-3.5 w-1/2 rounded-md" />
                    <Skeleton className="h-2 w-full rounded-full mt-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Renewals / Activity Panel (1 Col) */}
            <div className="bg-slate-50/80 rounded-[28px] p-6 border border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-6 w-32 rounded-lg" />
                <Skeleton className="h-4 w-12 rounded-md" />
              </div>
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
                    <Skeleton className="size-9 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-3/4 rounded-md" />
                      <Skeleton className="h-3 w-1/2 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Time Activity Chart Skeleton */}
          <div className="bg-slate-50/80 rounded-[28px] p-6 border border-slate-100 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-44 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-xl" />
            </div>
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Right Panel Skeleton */}
      <div className="hidden 2xl:flex w-[340px] border-l border-slate-200 bg-white flex-col p-6 gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-28 rounded-lg" />
          <Skeleton className="size-8 rounded-full" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="flex flex-col gap-3 mt-4">
          <Skeleton className="h-5 w-36 rounded-md" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};
