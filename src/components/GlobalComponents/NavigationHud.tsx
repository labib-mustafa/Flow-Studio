import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sound } from '../../stores/soundStore';
import {
  LayoutDashboard,
  FolderBookmark,
  CheckSquare,
  Users,
  BookUser,
  Files,
  Settings,
  X
} from 'lucide-react';

interface NavigationHudProps {
  onNavigate: (view: string) => void;
}

const SHORTCUTS = [
  { key: 'D', view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'P', view: 'projects', label: 'Projects', icon: FolderBookmark },
  { key: 'T', view: 'project-tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'C', view: 'clients', label: 'Clients', icon: Users },
  { key: 'L', view: 'leads', label: 'Leads', icon: BookUser },
  { key: 'F', view: 'files', label: 'Files', icon: Files },
  { key: 'S', view: 'settings', label: 'Settings', icon: Settings },
];

export const NavigationHud: React.FC<NavigationHudProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let chordTimer: ReturnType<typeof setTimeout> | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing in inputs or contentEditable
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isInput) return;

      // When HUD is not open and 'G' is pressed (without modifiers)
      if (!isOpen && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setIsOpen(true);
        sound.tick();

        if (chordTimer) clearTimeout(chordTimer);
        chordTimer = setTimeout(() => {
          setIsOpen(false);
        }, 2200);
        return;
      }

      // When HUD is open and a destination key is pressed
      if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsOpen(false);
          if (chordTimer) clearTimeout(chordTimer);
          return;
        }

        const match = SHORTCUTS.find((s) => s.key.toLowerCase() === e.key.toLowerCase());
        if (match) {
          e.preventDefault();
          setIsOpen(false);
          if (chordTimer) clearTimeout(chordTimer);
          sound.pop();
          onNavigate(match.view);
        } else {
          // Any other key closes the chord
          setIsOpen(false);
          if (chordTimer) clearTimeout(chordTimer);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (chordTimer) clearTimeout(chordTimer);
    };
  }, [isOpen, onNavigate]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[999999] pointer-events-auto select-none"
        >
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/15 text-white rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 pr-2 border-r border-white/10">
              <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">Go to</span>
            </div>

            <div className="flex items-center gap-2">
              {SHORTCUTS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setIsOpen(false);
                      sound.pop();
                      onNavigate(item.view);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/5 hover:bg-white/15 transition-all text-xs font-medium text-slate-200 hover:text-white cursor-pointer group"
                  >
                    <Icon className="size-3 text-slate-400 group-hover:text-blue-400 transition-colors" />
                    <span className="text-[11px]">{item.label}</span>
                    <kbd className="px-1 py-0.2 bg-white/10 group-hover:bg-white/20 border border-white/15 rounded text-[9.5px] font-bold text-slate-300">
                      {item.key}
                    </kbd>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
