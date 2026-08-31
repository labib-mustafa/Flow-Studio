import React, { useState, useRef } from 'react';
import { DropdownMenu, DropdownOption } from '../GlobalComponents/DropdownMenu';
import { useDevStore } from '../../stores/devStore';

interface UserProfileProps {
  name: string;
  role: string;
  avatarUrl: string;
  isCollapsed?: boolean;
  onClick?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ name, role, avatarUrl, isCollapsed, onClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  
  const toggleDeveloperMode = useDevStore(state => state.toggleDeveloperMode);

  const menuOptions: DropdownOption[] = [
    { id: 'profile', label: 'Profile', icon: 'person', onClick: onClick },
    { id: 'subscription', label: 'Subscription', icon: 'credit_card', badge: 'PRO', onClick: onClick },
    { id: 'settings', label: 'Settings', icon: 'settings', onClick: onClick },
    { id: 'signout', label: 'Sign out', icon: 'logout', color: '#ef4444', divider: true, onClick: () => window.location.reload() },
  ];

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
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
        onClick={handleToggleMenu}
        onDoubleClick={handleSecretDoubleTap}
        className={`mt-2 flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-[padding,justify-content] duration-200 ease-linear ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}
      >
        <div 
          className="size-9 shrink-0 rounded-full bg-slate-200 bg-cover bg-center border border-slate-100 shadow-sm" 
          style={{ backgroundImage: `url('${avatarUrl}')` }}
          title={isCollapsed ? name : undefined}
        ></div>
        <div className={`flex items-center gap-2 flex-1 overflow-hidden transition-[max-width,opacity] duration-200 ease-linear ${
          isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[200px] opacity-100'
        }`}>
          <div className="flex flex-col whitespace-nowrap overflow-hidden flex-1">
            <span className="text-sm font-semibold text-slate-900 truncate">{name}</span>
            <span className="text-xs text-slate-500 truncate">{role}</span>
          </div>
          <span className={`material-symbols-outlined text-slate-400 text-[18px] shrink-0 transition-transform duration-200 ease-linear ${isMenuOpen ? 'rotate-180' : ''}`}>
            unfold_more
          </span>
        </div>
      </div>

      <DropdownMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        anchorRect={triggerRef.current?.getBoundingClientRect() || null}
        options={menuOptions}
        align={isCollapsed ? 'left' : 'right'}
        width={isCollapsed ? 220 : triggerRef.current?.offsetWidth || 220}
      />
    </div>
  );
};
