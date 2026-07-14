import React from 'react';
import { WithDevHoverBounds } from '../GlobalComponents/DevTools/WithDevHoverBounds';

interface SidebarItemProps {
  icon: string;
  label: string;
  count?: number;
  active?: boolean;
  href?: string;
  className?: string;
  onClick?: () => void;
  isCollapsed?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, count, active, href = '#', className = '', onClick, isCollapsed }) => {
  return (
    <a
      href={href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`flex items-center gap-3 py-2 rounded-xl transition-all duration-200 group cursor-pointer ${
        isCollapsed ? 'justify-center px-0' : 'px-3'
      } ${
        active
          ? 'bg-blue-500 shadow-lg shadow-primary/25 text-white'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      } ${className}`}
      title={isCollapsed ? label : undefined}
    >
      <WithDevHoverBounds devId={`sidebar-item-${label}`} devName={`Sidebar Item (${label})`} devCategory="Navigation & Sidebar">
        <span className={`material-symbols-outlined transition-colors ${active ? 'active-icon' : 'group-hover:text-primary'}`}>
          {icon}
        </span>
      </WithDevHoverBounds>
      {!isCollapsed && (
        <>
          <span className="text-sm font-medium whitespace-nowrap">{label}</span>
          {count !== undefined && (
            <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
              {count}
            </span>
          )}
        </>
      )}
    </a>
  );
};
