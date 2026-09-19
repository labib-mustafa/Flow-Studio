import React from 'react';
import { Skeleton } from '../../ui/Skeleton';

export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar bg-[#f5f5f7] min-h-screen">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div>
          <Skeleton className="h-8 w-40 rounded-xl mb-2" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-xl" />
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xs flex flex-col gap-6">
          {/* Profile Row */}
          <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
            <Skeleton className="size-20 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-40 rounded-md" />
              <div className="flex items-center gap-2 mt-1">
                <Skeleton className="h-8 w-28 rounded-xl" />
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>

          {/* Toggle Switches */}
          <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-44 rounded-md" />
                  <Skeleton className="h-3 w-64 rounded-md" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
