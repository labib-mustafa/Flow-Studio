import React from 'react';
import { motion } from 'motion/react';
import { WithDevHoverBounds } from '../GlobalComponents/DevTools/WithDevHoverBounds';
import { LucideIcon } from 'lucide-react';
import { sound } from '../../stores/soundStore';

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

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  count,
  active,
  href = '#',
  className = '',
  onClick,
  isCollapsed,
}) => {
  const renderIcon = () => {
    if (typeof icon === 'string') {
      return (
        <span
          className={`material-symbols-outlined text-[20px] size-5 flex items-center justify-center transition-colors ${
            active ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'
          }`}
        >
          {icon}
        </span>
      );
    }
    const Icon = icon;
    return (
      <Icon
        className={`size-5 transition-colors ${
          active ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'
        }`}
      />
    );
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    sound.tick();
    if (onClick) {
      onClick();
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`relative flex items-center gap-3 py-2 rounded-xl transition-all duration-150 group cursor-pointer select-none ${
        isCollapsed ? 'justify-center px-0' : 'px-3'
      } ${
        active
          ? 'text-white'
          : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
      } ${className}`}
      title={isCollapsed ? label : undefined}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 bg-blue-500 rounded-xl shadow-md shadow-blue-500/20 z-0"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      <WithDevHoverBounds devId={`sidebar-item-${label}`} devName={`Sidebar Item (${label})`} devCategory="Navigation & Sidebar">
        <div className="relative z-10 flex items-center justify-center">
          {renderIcon()}
        </div>
      </WithDevHoverBounds>

      <div
        className={`relative z-10 flex items-center gap-2 flex-1 overflow-hidden transition-[max-width,opacity] duration-200 ease-linear ${
          isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[200px] opacity-100'
        }`}
      >
        <span className="text-sm font-medium whitespace-nowrap truncate tracking-tight">{label}</span>
        {count !== undefined && (
          <span
            className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 transition-colors ${
              active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {count}
          </span>
        )}
      </div>
    </a>
  );
};

