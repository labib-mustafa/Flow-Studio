import React from 'react';

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  isCollapsed?: boolean;
  showDividerInCollapsed?: boolean;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({ 
  title, 
  children, 
  isCollapsed,
  showDividerInCollapsed = true,
}) => {
  return (
    <div className={isCollapsed ? 'space-y-1.5' : 'space-y-1'}>
      {/* Expanded Header Title */}
      <div className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-linear ${
        isCollapsed ? 'max-h-0 opacity-0 mb-0 pointer-events-none' : 'max-h-6 opacity-100 mb-2'
      }`}>
        <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{title}</p>
      </div>

      {/* Collapsed Divider (only between sections, never above the first section) */}
      {showDividerInCollapsed && (
        <div className={`transition-[max-height,opacity] duration-200 ease-linear ${
          isCollapsed ? 'opacity-100 max-h-4 mb-2' : 'opacity-0 max-h-0 mb-0 overflow-hidden pointer-events-none'
        }`}>
          <div className="w-7 h-[1px] bg-slate-200/90 mx-auto" />
        </div>
      )}

      {children}
    </div>
  );
};
