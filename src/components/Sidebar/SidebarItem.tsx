import React from 'react';
import { WithDevHoverBounds } from '../GlobalComponents/DevTools/WithDevHoverBounds';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon | string;
  label: string;
  count?: number;
  active?: boolean;
  href?: string;
  className?: string;
  onClick?: () => void;
  isCollapsed?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, count, active, href = '#', className = '', onClick, isCollapsed }) => {
  const renderIcon = () => {
    if (typeof icon === 'string') {
      return (
        <span className={`material-symbols-outlined text-[20px] size-5 flex items-center justify-center transition-colors ${active ? 'active-icon' : 'group-hover:text-primary'}`}>
          {icon}
        </span>
      );
    }
    const Icon = icon;
    return (
      <Icon className={`size-5 transition-colors ${active ? '' : 'group-hover:text-primary'}`} />
    );
  };

  return (
    <a
      href={href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`flex items-center gap-3 py-2 rounded-xl transition-[padding,justify-content,background-color] duration-200 ease-linear group cursor-pointer ${
        isCollapsed ? 'justify-center px-0' : 'px-3'
      } ${
        active
          ? 'bg-blue-500 shadow-lg shadow-primary/25 text-white'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      } ${className}`}
      title={isCollapsed ? label : undefined}
    >
      <WithDevHoverBounds devId={`sidebar-item-${label}`} devName={`Sidebar Item (${label})`} devCategory="Navigation & Sidebar">
        {renderIcon()}
      </WithDevHoverBounds>
      <div className={`flex items-center gap-2 flex-1 overflow-hidden transition-[max-width,opacity] duration-200 ease-linear ${
        isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[200px] opacity-100'
      }`}>
        <span className="text-sm font-medium whitespace-nowrap truncate">{label}</span>
        {count !== undefined && (
          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
            {count}
          </span>
        )}
      </div>
    </a>
  );
};
