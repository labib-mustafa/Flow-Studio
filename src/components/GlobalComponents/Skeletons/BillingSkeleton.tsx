import React from 'react';
import { Skeleton } from '../../ui/Skeleton';

export const BillingSkeleton: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar bg-[#f5f5f7] min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-44 rounded-xl mb-2" />
            <Skeleton className="h-4 w-60 rounded-md" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        {/* Balance Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col gap-3">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-9 w-32 rounded-lg" />
              <Skeleton className="h-3 w-40 rounded-md" />
            </div>
          ))}
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton className="h-8 w-48 rounded-xl" />
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-xl" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
