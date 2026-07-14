import React from 'react';

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  isCollapsed?: boolean;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children, isCollapsed }) => {
  return (
    <div className="space-y-1">
      {!isCollapsed ? (
        <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 whitespace-nowrap">{title}</p>
      ) : (
        <div className="h-4 border-b border-slate-100 mb-2 mx-2"></div>
      )}
      {children}
    </div>
  );
};
