import React, { useState } from 'react';
import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';
import { UserProfile } from './UserProfile';
import { useSettings } from '../../hooks/useSettings';
import { useDevStore } from '../../stores/devStore';
import { useAuthStore } from '../../stores/authStore';
import { useEventStore } from '../../stores/eventStore';
import { useProjectStore } from '../../stores/projectStore';
import { useLeadStore } from '../../stores/leadStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderBookmark,
  Users,
  BookUser,
  IdCardLanyard,
  Files,
  Calendar1,
  Timer,
  Receipt,
  FileChartColumn,
  Server,
  Bug,
  Settings,
  Bot,
  Search
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenCommandPalette?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onOpenCommandPalette }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { settings } = useSettings();
  const { user } = useAuthStore();
  const isDeveloperModeEnabled = useDevStore(state => state.isDeveloperModeEnabled);
  const toggleDeveloperMode = useDevStore(state => state.toggleDeveloperMode);
  const isEventModalOpen = useEventStore(state => state.isEventModalOpen);
  const setEventModalOpen = useEventStore(state => state.setEventModalOpen);
  const projectsCount = useProjectStore(state => state.projects.length);
  const leadsCount = useLeadStore(state => state.leads.length);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '80px' : '280px');
  }, [isCollapsed]);

  return (
    <aside className={`flex flex-col bg-white h-full border-r ${isEventModalOpen ? 'border-slate-900/40' : 'border-slate-200'} relative transition-[width] duration-200 ease-linear ${isCollapsed ? 'w-[80px]' : 'w-[280px]'} z-[100]`}>
      <AnimatePresence>
        {isEventModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'linear' }}
            onClick={() => setEventModalOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[99] cursor-pointer"
          />
        )}
      </AnimatePresence>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        disabled={isEventModalOpen}
        className={`absolute top-1/2 -translate-y-1/2 -right-3 z-[99999] flex items-center justify-center w-6 h-6 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-primary hover:border-primary shadow-sm transition-all duration-200 ease-linear ${isEventModalOpen ? 'opacity-50 pointer-events-none blur-[1px]' : ''}`}
      >
        <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ease-linear ${isCollapsed ? 'rotate-180' : ''}`}>chevron_left</span>
      </button>

      <div className="flex flex-col h-full w-full overflow-hidden">
        <div className={`px-6 pt-8 pb-3 transition-[padding] duration-200 ease-linear ${isCollapsed ? 'px-4' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <img
              src="/logo.png"
              alt="Flow Studio Logo"
              className="size-10 shrink-0 object-contain rounded-xl shadow-sm"
            />
            <div className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-linear ${isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[200px] opacity-100'
              }`}>
              <h1 className="text-slate-900 text-lg font-bold tracking-tight leading-none">Flow Studio</h1>
            </div>
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => {
                if (onOpenCommandPalette) onOpenCommandPalette();
                else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
              }}
              className="mt-3.5 w-full flex items-center justify-between px-3 py-1.5 bg-slate-100/70 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2">
                <Search size={13} className="text-slate-400 group-hover:text-slate-600" />
                <span className="text-[12px] tracking-tight">Quick Search...</span>
              </div>
              <kbd className="text-[10.5px] px-1.5 py-0.5 bg-white rounded-md border border-slate-200 text-slate-400 font-bold shadow-2xs">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        <div className={`flex-1 overflow-y-auto py-2 space-y-8 custom-scrollbar transition-[padding] duration-200 ease-linear ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <SidebarSection title="Main Menu" isCollapsed={isCollapsed}>
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              active={activeTab === 'dashboard'}
              onClick={() => onTabChange('dashboard')}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon={FolderBookmark}
              label="Projects"
              count={projectsCount > 0 ? projectsCount : undefined}
              active={activeTab === 'projects'}
              onClick={() => onTabChange('projects')}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon={Users}
              label="Clients"
              active={activeTab === 'clients'}
              onClick={() => onTabChange('clients')}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon={BookUser}
              label="Leads"
              count={leadsCount > 0 ? leadsCount : undefined}
              active={activeTab === 'leads'}
              onClick={() => onTabChange('leads')}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon={Bot}
              label="Lead Scraper"
              active={activeTab === 'lead-generator'}
              onClick={() => onTabChange('lead-generator')}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon={IdCardLanyard}
              label="Team"
              active={activeTab === 'team'}
              onClick={() => onTabChange('team')}
              isCollapsed={isCollapsed}
            />
            <SidebarItem
              icon={Files}
              label="Files"
              active={activeTab === 'files'}
              onClick={() => onTabChange('files')}
              isCollapsed={isCollapsed}
            />
          </SidebarSection>
          <SidebarSection title="Management" isCollapsed={isCollapsed}>
            <SidebarItem icon={Calendar1} label="Calendar" isCollapsed={isCollapsed} active={activeTab === 'calendar'} onClick={() => onTabChange('calendar')} />
            <SidebarItem
              icon={Timer}
              label="Time"
              isCollapsed={isCollapsed}
              active={activeTab === 'time'}
              onClick={() => onTabChange('time')}
            />
            <SidebarItem
              icon={Receipt}
              label="Billing"
              isCollapsed={isCollapsed}
              active={activeTab === 'billing' || activeTab === 'new-invoice'}
              onClick={() => onTabChange('billing')}
            />
            <SidebarItem
              icon={FileChartColumn}
              label="Reports"
              isCollapsed={isCollapsed}
              active={activeTab === 'reports'}
              onClick={() => onTabChange('reports')}
            />
            <SidebarItem
              icon={Server}
              label="Data"
              isCollapsed={isCollapsed}
              active={activeTab === 'data'}
              onClick={() => onTabChange('data')}
            />
          </SidebarSection>
        </div>

        <div className={`p-3 border-t border-slate-100 bg-white/50 backdrop-blur-sm transition-[padding] duration-200 ease-linear ${isCollapsed ? 'px-2' : ''}`}>
          <SidebarItem
            icon={Bug}
            label="Dev Mode"
            className="mb-1 text-slate-500 hover:text-red-500"
            isCollapsed={isCollapsed}
            active={activeTab === 'dev-settings' || isDeveloperModeEnabled}
            onClick={() => onTabChange('dev-settings')}
          />
          <SidebarItem
            icon={Settings}
            label="Settings"
            className="mb-1"
            isCollapsed={isCollapsed}
            active={activeTab === 'settings'}
            onClick={() => onTabChange('settings')}
          />
          <UserProfile
            name={settings.displayName || user?.displayName || 'User'}
            role={settings.role || 'Member'}
            avatarUrl={settings.profileImage && (settings.profileImage.startsWith('data:') || !settings.profileImage.includes('aida-public')) ? settings.profileImage : (user?.photoURL || settings.profileImage || '')}
            isCollapsed={isCollapsed}
            onClick={() => onTabChange('settings')}
          />

        </div>
      </div>
    </aside>
  );
};
