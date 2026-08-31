import React from 'react';

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  isCollapsed?: boolean;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children, isCollapsed }) => {
  return (
    <div className="space-y-1">
      <div className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-linear ${
        isCollapsed ? 'max-h-0 opacity-0 mb-0' : 'max-h-6 opacity-100 mb-2'
      }`}>
        <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{title}</p>
      </div>
      <div className={`transition-[max-height,opacity] duration-200 ease-linear ${
        isCollapsed ? 'opacity-100 max-h-6 mb-2' : 'opacity-0 max-h-0 mb-0 overflow-hidden pointer-events-none'
      }`}>
        <div className="h-4 border-b border-slate-100 mb-2 mx-2"></div>
      </div>
      {children}
    </div>
  );
};
