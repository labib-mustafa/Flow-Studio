import React, { useState, useRef } from 'react';
import { useDevStore } from '../../stores/devStore';
import { SidebarTooltip } from './SidebarTooltip';
import { sound } from '../../stores/soundStore';

interface UserProfileProps {
  name: string;
  role: string;
  avatarUrl: string;
  isCollapsed?: boolean;
  onClick?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ name, role, avatarUrl, isCollapsed, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  
  const toggleDeveloperMode = useDevStore(state => state.toggleDeveloperMode);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.tick();
    onClick?.();
  };
  
  const handleSecretDoubleTap = (e: React.MouseEvent) => {
    // Secret backdoor to toggle Developer Hover mode: Alt/Option + Double-click the user avatar
    if (e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      toggleDeveloperMode();
    }
  };

  return (
    <div className="relative">
      <div 
        ref={triggerRef}
        onClick={handleClick}
        onDoubleClick={handleSecretDoubleTap}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`mt-2 flex items-center cursor-pointer rounded-xl transition-all duration-200 select-none group relative ${
          isCollapsed
            ? 'size-10 mx-auto justify-center hover:bg-slate-100/80'
            : 'gap-3 p-2 hover:bg-slate-100/70'
        }`}
        title={!isCollapsed ? 'Go to Settings' : undefined}
      >
        <div 
          className={`size-8.5 shrink-0 rounded-full bg-slate-200 bg-cover bg-center border border-slate-200/80 shadow-2xs transition-all duration-200 ${
            isCollapsed ? 'group-hover:ring-2 group-hover:ring-blue-500/30 group-hover:scale-105' : ''
          }`} 
          style={{ backgroundImage: `url('${avatarUrl}')` }}
        />

        <div className={`flex items-center gap-2 flex-1 overflow-hidden transition-[max-width,opacity] duration-200 ease-linear ${
          isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[200px] opacity-100'
        }`}>
          <div className="flex flex-col whitespace-nowrap overflow-hidden flex-1">
            <span className="text-sm font-semibold text-slate-900 truncate">{name}</span>
            <span className="text-xs text-slate-500 truncate">{role}</span>
          </div>
        </div>
      </div>

      {/* Floating Portal Tooltip */}
      <SidebarTooltip
        isOpen={Boolean(isCollapsed && isHovered)}
        targetRef={triggerRef}
        label={name}
        subtitle={role}
      />
    </div>
  );
};
