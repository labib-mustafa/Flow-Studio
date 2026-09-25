import React, { useState } from 'react';
import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';
import { UserProfile } from './UserProfile';
import { WorkspacePill } from './WorkspacePill';
import { useSettings } from '../../hooks/useSettings';
import { useDevStore } from '../../stores/devStore';
import { useAuthStore } from '../../stores/authStore';
import { useEventStore } from '../../stores/eventStore';
import { useProjectStore } from '../../stores/projectStore';
import { useLeadStore } from '../../stores/leadStore';
import { motion, AnimatePresence } from 'framer-motion';
import { sound } from '../../stores/soundStore';
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
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SidebarTooltip } from './SidebarTooltip';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenCommandPalette?: () => void;
  onOpenAICopilot?: () => void;
  isAICopilotOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenCommandPalette,
  onOpenAICopilot,
  isAICopilotOpen = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchHovered, setIsSearchHovered] = useState(false);
  const [isAiHovered, setIsAiHovered] = useState(false);
  const searchBtnRef = React.useRef<HTMLButtonElement>(null);
  const aiBtnRef = React.useRef<HTMLButtonElement>(null);

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

  // Support Cmd+\ or Cmd+B to toggle sidebar collapse
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === '\\' || e.key === 'b')) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        setIsCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

      {/* Collapse/Expand Toggle Button - Placed at header level on the border */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        disabled={isEventModalOpen}
        title={isCollapsed ? "Expand sidebar (⌘\\)" : "Collapse sidebar (⌘\\)"}
        className={`absolute top-7 -right-3 z-[30] flex items-center justify-center size-6 bg-white border border-slate-200/90 rounded-full text-slate-400 hover:text-slate-800 hover:border-slate-300 shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer ${isEventModalOpen ? 'opacity-50 pointer-events-none blur-[1px]' : ''}`}
      >
        {isCollapsed ? (
          <ChevronRight size={13} className="text-slate-500 hover:text-slate-900 transition-colors" />
        ) : (
          <ChevronLeft size={13} className="text-slate-500 hover:text-slate-900 transition-colors" />
        )}
      </button>

      <div className={`flex flex-col h-full w-full transition-all duration-200 ease-linear ${isEventModalOpen ? 'filter blur-[2px] opacity-60 pointer-events-none select-none' : ''}`}>
        {/* Header: Logo, App Title, Search & Nova AI */}
        <div className={`pt-5 pb-2 transition-[padding] duration-200 ease-linear ${isCollapsed ? 'px-2' : 'px-3.5'}`}>
          <WorkspacePill isCollapsed={isCollapsed} onOpenSettings={() => onTabChange('settings')} />

          {/* Quick Search */}
          {!isCollapsed ? (
            <button
              type="button"
              onClick={() => {
                if (onOpenCommandPalette) onOpenCommandPalette();
                else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
              }}
              className="mt-3.5 w-full flex items-center justify-between px-3 py-2 bg-slate-100/70 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2">
                <Search size={14} className="text-slate-400 group-hover:text-slate-600" />
                <span className="text-[12px] tracking-tight">Quick Search...</span>
              </div>
            </button>
          ) : (
            <div className="mt-2.5 flex justify-center">
              <button
                ref={searchBtnRef}
                type="button"
                onMouseEnter={() => setIsSearchHovered(true)}
                onMouseLeave={() => setIsSearchHovered(false)}
                onClick={() => {
                  if (onOpenCommandPalette) onOpenCommandPalette();
                  else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
                }}
                className="relative size-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-150 cursor-pointer group"
              >
                <Search size={18} className="transition-transform group-hover:scale-110" />
              </button>
              <SidebarTooltip
                isOpen={Boolean(isCollapsed && isSearchHovered)}
                targetRef={searchBtnRef}
                label="Quick Search"
                shortcut="⌘K"
              />
            </div>
          )}

          {/* Apple-Grade Nova AI Co-Pilot Launcher */}
          {!isCollapsed ? (
            <motion.button
              type="button"
              data-ai-button="true"
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.975 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              onClick={(e) => {
                sound.pop();
                const btnRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const anchorDetail = { anchorRect: { x: btnRect.left, y: btnRect.top, width: btnRect.width, height: btnRect.height } };
                if (onOpenAICopilot) onOpenAICopilot();
                window.dispatchEvent(new CustomEvent('open-ai-copilot', { detail: anchorDetail }));
              }}
              className={`relative mt-2.5 w-full flex items-center justify-between p-2.5 rounded-2xl cursor-pointer select-none group overflow-hidden ${isAICopilotOpen
                ? 'bg-[#0f0f14] text-white ring-2 ring-purple-500/60 '
                : 'bg-[#0e0e13] text-white border border-white/10 '
                }`}
              title="Nova AI Copilot (⌘J)"
            >
              {/* Left: Icon & Label */}
              <div className="flex items-center gap-2.5 min-w-0 z-10">
                <div className="w-7 h-7 rounded-xl p-[1px] shrink-0 shadow-sm flex items-center justify-center">
                  <div className="w-full h-full rounded-[11px] bg-white flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                  </div>
                </div>

                <div className="flex flex-col text-left leading-tight min-w-0 pl-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold tracking-tight text-white/95 font-display flex items-center gap-1.5">
                      Nova AI
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Apple Keycap */}
              <div className="flex items-center gap-1 shrink-0 z-10">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-300/80 bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 rounded-md shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] flex items-center gap-0.5 transition-colors">
                  <span>⌘</span><span>J</span>
                </kbd>
              </div>
            </motion.button>
          ) : (
            /* Collapsed State: Apple Dynamic Squircle Icon */
            <div className="mt-2 flex justify-center">
              <motion.button
                ref={aiBtnRef}
                type="button"
                data-ai-button="true"
                onMouseEnter={() => setIsAiHovered(true)}
                onMouseLeave={() => setIsAiHovered(false)}
                whileHover={{ scale: 1.06, y: -1 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                onClick={(e) => {
                  sound.pop();
                  const btnRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const anchorDetail = { anchorRect: { x: btnRect.left, y: btnRect.top, width: btnRect.width, height: btnRect.height } };
                  if (onOpenAICopilot) onOpenAICopilot();
                  window.dispatchEvent(new CustomEvent('open-ai-copilot', { detail: anchorDetail }));
                }}
                className={`relative size-10 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer shadow-sm group overflow-hidden ${isAICopilotOpen
                  ? 'bg-[#0f0f14] ring-2 ring-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                  : 'bg-[#0e0e13] hover:bg-[#14141d] border border-white/10 hover:border-purple-400/40 hover:shadow-[0_6px_16px_-2px_rgba(147,51,234,0.3)]'
                  }`}
              >
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                <div className="relative flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-amber-300 fill-amber-300/30 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 border border-slate-950"></span>
                  </span>
                </div>
              </motion.button>
              <SidebarTooltip
                isOpen={Boolean(isCollapsed && isAiHovered)}
                targetRef={aiBtnRef}
                label="Nova AI Copilot"
                shortcut="⌘J"
              />
            </div>
          )}
        </div>

        {/* Scrollable Navigation Items */}
        <div className={`flex-1 overflow-y-auto py-2 ${isCollapsed ? 'space-y-3 px-2' : 'space-y-6 px-4'} custom-scrollbar transition-[padding] duration-200 ease-linear`}>
          <SidebarSection title="Main Menu" isCollapsed={isCollapsed} showDividerInCollapsed={false}>
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
          <SidebarSection title="Management" isCollapsed={isCollapsed} showDividerInCollapsed={true}>
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

        {/* Footer: Dev Mode, Settings & User Profile */}
        <div className={`p-3 border-t border-slate-100 bg-white/50 backdrop-blur-sm transition-[padding] duration-200 ease-linear ${isCollapsed ? 'px-2 flex flex-col items-center gap-1.5' : ''}`}>
          <SidebarItem
            icon={Bug}
            label="Dev Mode"
            className={`${isCollapsed ? '' : 'mb-1'} text-slate-500 hover:text-red-500`}
            isCollapsed={isCollapsed}
            active={activeTab === 'dev-settings' || isDeveloperModeEnabled}
            onClick={() => onTabChange('dev-settings')}
          />
          <SidebarItem
            icon={Settings}
            label="Settings"
            className={`${isCollapsed ? '' : 'mb-1'}`}
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
