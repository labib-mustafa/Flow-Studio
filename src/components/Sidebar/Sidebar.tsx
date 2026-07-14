import React, { useState } from 'react';
import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';
import { UserProfile } from './UserProfile';
import { useSettings } from '../../hooks/useSettings';
import { useDevStore } from '../../stores/devStore';
import { useAuthStore } from '../../stores/authStore';
import { useEventStore } from '../../stores/eventStore';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { settings } = useSettings();
  const { user } = useAuthStore();
  const isDeveloperModeEnabled = useDevStore(state => state.isDeveloperModeEnabled);
  const toggleDeveloperMode = useDevStore(state => state.toggleDeveloperMode);
  const isEventModalOpen = useEventStore(state => state.isEventModalOpen);
  const setEventModalOpen = useEventStore(state => state.setEventModalOpen);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '80px' : '280px');
  }, [isCollapsed]);

  return (
    <aside className={`flex flex-col bg-white h-full border-r ${isEventModalOpen ? 'border-slate-900/40' : 'border-slate-200'} relative transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-[280px]'} z-[100]`}>
      <AnimatePresence>
        {isEventModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={() => setEventModalOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[99] cursor-pointer"
          />
        )}
      </AnimatePresence>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        disabled={isEventModalOpen}
        className={`absolute top-1/2 -translate-y-1/2 -right-3 z-[99999] flex items-center justify-center w-6 h-6 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-primary hover:border-primary shadow-sm transition-all duration-300 ${isEventModalOpen ? 'opacity-50 pointer-events-none blur-[1px]' : ''}`}
      >
        <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>chevron_left</span>
      </button>

      <div className="flex flex-col h-full w-full overflow-hidden">
        <div className={`px-6 pt-8 pb-4 transition-all duration-300 ${isCollapsed ? 'px-4' : ''}`}>
          <div className={`flex items-center gap-3 mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
            <img
              src="/logo.png"
              alt="Flow Studio Logo"
              className="size-10 shrink-0 object-contain rounded-xl shadow-sm"
            />
            {!isCollapsed && (
              <div className="overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
                <h1 className="text-slate-900 text-lg font-bold tracking-tight leading-none">Flow Studio</h1>
              </div>
            )}
          </div>

          {!isCollapsed ? (
            <div className="relative group animate-in fade-in duration-300">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2.5 border-none rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-medium shadow-sm outline-none"
                placeholder="Search projects..."
                type="text"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>
            </div>
          )}
        </div>

        <div className={`flex-1 overflow-y-auto py-2 space-y-8 custom-scrollbar ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <SidebarSection title="Main Menu" isCollapsed={isCollapsed}>
            <SidebarItem
              icon="dashboard"
              label="Dashboard"
              count={12}
              active={activeTab === 'dashboard'}
              onClick={() => onTabChange('dashboard')}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon="folder_open"
              label="Projects"
              active={activeTab === 'projects'}
              onClick={() => onTabChange('projects')}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon="groups"
              label="Clients"
              active={activeTab === 'clients'}
              onClick={() => onTabChange('clients')}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon="filter_alt"
              label="Leads"
              active={activeTab === 'leads'}
              onClick={() => onTabChange('leads')}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon="badge"
              label="Team"
              active={activeTab === 'team'}
              onClick={() => onTabChange('team')}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon="folder"
              label="Files"
              active={activeTab === 'files'}
              onClick={() => onTabChange('files')}
              isCollapsed={isCollapsed}
            />
          </SidebarSection>
          <SidebarSection title="Management" isCollapsed={isCollapsed}>
            <SidebarItem icon="calendar_month" label="Calendar" isCollapsed={isCollapsed} active={activeTab === 'calendar'} onClick={() => onTabChange('calendar')} />
            <SidebarItem
              icon="schedule"
              label="Time"
              isCollapsed={isCollapsed}
              active={activeTab === 'time'}
              onClick={() => onTabChange('time')}
            />
            <SidebarItem
              icon="receipt_long"
              label="Billing"
              isCollapsed={isCollapsed}
              active={activeTab === 'billing' || activeTab === 'new-invoice'}
              onClick={() => onTabChange('billing')}
            />
            <SidebarItem
              icon="description"
              label="Reports"
              isCollapsed={isCollapsed}
              active={activeTab === 'reports'}
              onClick={() => onTabChange('reports')}
            />
            <SidebarItem
              icon="database"
              label="Data"
              isCollapsed={isCollapsed}
              active={activeTab === 'data'}
              onClick={() => onTabChange('data')}
            />
          </SidebarSection>
        </div>

        <div className={`p-3 border-t border-slate-100 bg-white/50 backdrop-blur-sm ${isCollapsed ? 'px-2' : ''}`}>
          <SidebarItem
            icon="bug_report"
            label="Dev Mode"
            className="mb-1 text-slate-500 hover:text-red-500"
            isCollapsed={isCollapsed}
            active={activeTab === 'dev-settings' || isDeveloperModeEnabled}
            onClick={() => onTabChange('dev-settings')}
          />
          <SidebarItem
            icon="settings"
            label="Settings"
            className="mb-1"
            isCollapsed={isCollapsed}
            active={activeTab === 'settings'}
            onClick={() => onTabChange('settings')}
          />
          <UserProfile
            name={settings.displayName === 'Design Pro' ? (user?.displayName || settings.displayName) : (settings.displayName || user?.displayName || '')}
            role={settings.role}
            avatarUrl={settings.profileImage && (settings.profileImage.startsWith('data:') || !settings.profileImage.includes('aida-public')) ? settings.profileImage : (user?.photoURL || settings.profileImage || '')}
            isCollapsed={isCollapsed}
            onClick={() => onTabChange('settings')}
          />
        </div>
      </div>
    </aside>
  );
};
