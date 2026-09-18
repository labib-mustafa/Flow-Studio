import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  LayoutDashboard,
  FolderBookmark,
  Users,
  BookUser,
  Bot,
  IdCardLanyard,
  Files,
  Calendar1,
  Timer,
  Receipt,
  Settings,
  Plus,
  Server,
  FolderKanban,
  CornerDownLeft,
  X
} from 'lucide-react';
import { useProjectStore } from '../../../stores/projectStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onNewProject: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Projects' | 'Actions';
  icon: React.ComponentType<{ className?: string; size?: number }>;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onNewProject,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { projects, setCurrentProject } = useProjectStore();

  // Reset query and selection when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build command list
  const commands: CommandItem[] = useMemo(() => {
    const navItems: CommandItem[] = [
      {
        id: 'nav-dashboard',
        title: 'Dashboard',
        subtitle: 'Overview & Studio Metrics',
        category: 'Navigation',
        icon: LayoutDashboard,
        action: () => onNavigate('dashboard'),
        shortcut: 'D',
      },
      {
        id: 'nav-projects',
        title: 'Projects',
        subtitle: 'All Active & Completed Projects',
        category: 'Navigation',
        icon: FolderBookmark,
        action: () => onNavigate('projects'),
        shortcut: 'P',
      },
      {
        id: 'nav-clients',
        title: 'Clients',
        subtitle: 'Client Profiles & Account History',
        category: 'Navigation',
        icon: Users,
        action: () => onNavigate('clients'),
        shortcut: 'C',
      },
      {
        id: 'nav-leads',
        title: 'Leads CRM',
        subtitle: 'Pipeline & Prospects',
        category: 'Navigation',
        icon: BookUser,
        action: () => onNavigate('leads'),
        shortcut: 'L',
      },
      {
        id: 'nav-lead-gen',
        title: 'Lead Scraper',
        subtitle: 'Multi-platform AI Scraping Tool',
        category: 'Navigation',
        icon: Bot,
        action: () => onNavigate('lead-generator'),
      },
      {
        id: 'nav-team',
        title: 'Team Members',
        subtitle: 'Directory & Role Assignments',
        category: 'Navigation',
        icon: IdCardLanyard,
        action: () => onNavigate('team'),
        shortcut: 'T',
      },
      {
        id: 'nav-files',
        title: 'File Explorer',
        subtitle: 'Local Storage & Asset Manager',
        category: 'Navigation',
        icon: Files,
        action: () => onNavigate('files'),
        shortcut: 'F',
      },
      {
        id: 'nav-calendar',
        title: 'Calendar & Schedule',
        subtitle: 'Meetings, Deadlines & Events',
        category: 'Navigation',
        icon: Calendar1,
        action: () => onNavigate('calendar'),
      },
      {
        id: 'nav-time',
        title: 'Time Tracking',
        subtitle: 'Project Billable Hours & Timers',
        category: 'Navigation',
        icon: Timer,
        action: () => onNavigate('time'),
      },
      {
        id: 'nav-billing',
        title: 'Billing & Invoices',
        subtitle: 'Invoices, Revenue & Cards',
        category: 'Navigation',
        icon: Receipt,
        action: () => onNavigate('billing'),
        shortcut: 'B',
      },
      {
        id: 'nav-data',
        title: 'Data & Trash',
        subtitle: 'Local JSON Stores & Recovery',
        category: 'Navigation',
        icon: Server,
        action: () => onNavigate('data'),
      },
      {
        id: 'nav-settings',
        title: 'Settings',
        subtitle: 'Preferences & Workspace Customization',
        category: 'Navigation',
        icon: Settings,
        action: () => onNavigate('settings'),
        shortcut: '⌘,',
      },
    ];

    const actionItems: CommandItem[] = [
      {
        id: 'action-new-project',
        title: 'Create New Project',
        subtitle: 'Start a new client or internal design project',
        category: 'Actions',
        icon: Plus,
        action: () => onNewProject(),
        shortcut: '⌘N',
      },
      {
        id: 'action-new-invoice',
        title: 'Create New Invoice',
        subtitle: 'Generate and send a client invoice',
        category: 'Actions',
        icon: Receipt,
        action: () => onNavigate('new-invoice'),
      },
      {
        id: 'action-lead-gen',
        title: 'Run Lead Scraper',
        subtitle: 'Scrape leads from Google Maps or LinkedIn',
        category: 'Actions',
        icon: Bot,
        action: () => onNavigate('lead-generator'),
      },
    ];

    const projectItems: CommandItem[] = (projects || []).map((project) => ({
      id: `project-${project.id}`,
      title: project.title || project.name || 'Untitled Project',
      subtitle: `${project.category || 'Project'} • ${project.client || 'Client'} • ${project.progress || 0}% Complete`,
      category: 'Projects',
      icon: FolderKanban,
      action: () => {
        setCurrentProject(project);
        onNavigate('project-overview');
      },
    }));

    return [...actionItems, ...projectItems, ...navItems];
  }, [projects, onNavigate, onNewProject, setCurrentProject]);

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement;
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-[14vh] px-4">
          {/* Backdrop with Apple blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="relative w-full max-w-[620px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col z-10 font-sans"
          >
            {/* Spotlight Header Search Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
              <Search className="size-5 text-slate-400 shrink-0" strokeWidth={2.2} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, pages, or actions..."
                className="w-full bg-transparent border-none outline-none text-[15px] font-medium text-slate-900 placeholder:text-slate-400 tracking-tight"
              />
              {query ? (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={14} />
                </button>
              ) : (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                  <span>ESC</span>
                </div>
              )}
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              className="max-h-[380px] overflow-y-auto p-2 space-y-1 custom-scrollbar"
            >
              {filteredCommands.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <Search size={18} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">No results found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Try searching for another project or action
                  </p>
                </div>
              ) : (
                filteredCommands.map((cmd, index) => {
                  const isSelected = index === selectedIndex;
                  const Icon = cmd.icon;
                  return (
                    <div
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-100 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-white group-hover:shadow-xs'
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[13.5px] font-semibold tracking-tight truncate ${
                                isSelected ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {cmd.title}
                            </span>
                            <span
                              className={`text-[10.5px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded ${
                                isSelected
                                  ? 'bg-white/20 text-white/90'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {cmd.category}
                            </span>
                          </div>
                          {cmd.subtitle && (
                            <p
                              className={`text-[11.5px] truncate mt-0.5 ${
                                isSelected ? 'text-white/80' : 'text-slate-400'
                              }`}
                            >
                              {cmd.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {cmd.shortcut && (
                          <span
                            className={`text-[11px] font-medium px-1.5 py-0.5 rounded border ${
                              isSelected
                                ? 'border-white/30 text-white bg-white/10'
                                : 'border-slate-200 text-slate-400 bg-slate-50'
                            }`}
                          >
                            {cmd.shortcut}
                          </span>
                        )}
                        {isSelected && (
                          <CornerDownLeft size={13} className="text-white/80 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Apple Footer Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50/80 border-t border-slate-100 text-[11px] font-medium text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-500 shadow-xs">
                    ↑
                  </kbd>
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-500 shadow-xs">
                    ↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-500 shadow-xs">
                    ↵
                  </kbd>
                  <span>Select</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-500 font-semibold">Flow Studio Spotlight</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
