import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { WithDevHoverBounds } from '../GlobalComponents/DevTools/WithDevHoverBounds';
import { LucideIcon } from 'lucide-react';
import { sound } from '../../stores/soundStore';
import { SidebarTooltip } from './SidebarTooltip';

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
  const [isHovered, setIsHovered] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

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
    <>
      <a
        ref={linkRef}
        href={href}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative flex items-center rounded-xl transition-all duration-200 group cursor-pointer select-none ${
          isCollapsed
            ? 'size-10 mx-auto justify-center'
            : 'w-full h-10 px-3 gap-3 justify-start'
        } ${
          active
            ? 'text-white'
            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
        } ${className}`}
      >
        {active && (
          <motion.div
            layoutId="sidebar-active-pill"
            className="absolute inset-0 bg-blue-600 rounded-xl shadow-xs shadow-blue-500/25 z-0"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}

        <WithDevHoverBounds devId={`sidebar-item-${label}`} devName={`Sidebar Item (${label})`} devCategory="Navigation & Sidebar">
          <div className="relative z-10 flex items-center justify-center shrink-0 size-5">
            {renderIcon()}
          </div>
        </WithDevHoverBounds>

        {/* Expanded State: Label & Count */}
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

        {/* Collapsed State: Top-Right Notification Badge */}
        {isCollapsed && count !== undefined && count > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center z-20 shadow-xs border transition-colors ${
              active
                ? 'bg-white text-blue-600 border-blue-100'
                : 'bg-blue-600 text-white border-white'
            }`}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </a>

      {/* Floating Portal Tooltip - Escapes overflow-hidden & renders above main content */}
      <SidebarTooltip
        isOpen={Boolean(isCollapsed && isHovered)}
        targetRef={linkRef}
        label={label}
        badge={count}
      />
    </>
  );
};

