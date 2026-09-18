import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Command, CheckCircle2, Layout, Keyboard } from 'lucide-react';
import { useShortcutsStore } from '../../stores/shortcutsStore';
import { sound } from '../../stores/soundStore';

interface ShortcutGroup {
  name: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  items: {
    keys: string[];
    description: string;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    name: 'General & Navigation',
    icon: Command,
    items: [
      { keys: ['⌘', 'K'], description: 'Open Spotlight Command Palette' },
      { keys: ['⌘', 'N'], description: 'Create a new project' },
      { keys: ['⌘', ','], description: 'Open Studio Settings' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close modals / exit full screen' },
    ],
  },
  {
    name: 'Task Power Flow (Linear Mode)',
    icon: CheckCircle2,
    items: [
      { keys: ['J'], description: 'Jump to next task row' },
      { keys: ['K'], description: 'Jump to previous task row' },
      { keys: ['Space'], description: 'Toggle task complete / incomplete' },
      { keys: ['Enter'], description: 'Open task inspection details' },
      { keys: ['X'], description: 'Select / unselect task row' },
      { keys: ['⌫'], description: 'Delete task (with instant Undo toast)' },
      { keys: ['Double-Click'], description: 'Inline edit task title' },
    ],
  },
  {
    name: 'Moodboard & Creative Canvas',
    icon: Layout,
    items: [
      { keys: ['⇧', '1'], description: 'Fit all cards to screen' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate selected cards' },
      { keys: ['Space', 'Drag'], description: 'Smooth pan canvas' },
      { keys: ['Alt', 'Drag'], description: 'Instant clone element' },
      { keys: ['Del'], description: 'Remove selected card' },
    ],
  },
];

export const ShortcutsModal: React.FC = () => {
  const { isOpen, closeShortcuts } = useShortcutsStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      sound.tick();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable;

      if (!isInput && e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        useShortcutsStore.getState().toggleShortcuts();
      } else if (!isInput && (e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        useShortcutsStore.getState().toggleShortcuts();
      } else if (isOpen && e.key === 'Escape') {
        e.preventDefault();
        closeShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeShortcuts]);

  const filteredGroups = SHORTCUT_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.keys.some((k) => k.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
          {/* Frosted Apple Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeShortcuts}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="relative w-full max-w-[620px] max-h-[82vh] bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.25)] flex flex-col z-10 overflow-hidden font-sans select-none"
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Keyboard size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Keyboard Shortcuts</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Navigate Flow Studio with zero friction</p>
                </div>
              </div>

              <button
                onClick={closeShortcuts}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors outline-none cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Filter */}
            <div className="px-6 py-2.5 border-b border-slate-100/80 bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-400">
                <Search size={14} className="shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Filter shortcuts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent outline-none py-1 font-medium"
                />
              </div>
            </div>

            {/* Groups list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {filteredGroups.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No matching shortcuts found
                </div>
              ) : (
                filteredGroups.map((group) => {
                  const Icon = group.icon;
                  return (
                    <div key={group.name} className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <Icon size={12} className="text-slate-400" />
                        <span>{group.name}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        {group.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between py-1.5 px-3 rounded-xl hover:bg-slate-100/70 transition-colors"
                          >
                            <span className="text-xs font-medium text-slate-700">{item.description}</span>
                            <div className="flex items-center gap-1 shrink-0 ml-4">
                              {item.keys.map((k, kIdx) => (
                                <kbd
                                  key={kIdx}
                                  className="min-w-[22px] h-6 px-1.5 flex items-center justify-center bg-white border border-slate-200/90 rounded-md text-[10.5px] font-semibold text-slate-700 shadow-xs tracking-tight"
                                >
                                  {k}
                                </kbd>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-600">?</kbd> anywhere to toggle</span>
              <span>Pro Tip: Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-600">Space</kbd> on any task to complete</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
