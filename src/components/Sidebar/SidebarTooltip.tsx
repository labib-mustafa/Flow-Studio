import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface SidebarTooltipProps {
  isOpen: boolean;
  targetRef: React.RefObject<HTMLElement | null>;
  label: string;
  badge?: string | number;
  shortcut?: string;
  subtitle?: string;
}

export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({
  isOpen,
  targetRef,
  label,
  badge,
  shortcut,
  subtitle,
}) => {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    if (!targetRef.current) return;
    const rect = targetRef.current.getBoundingClientRect();
    const tooltipTop = Math.max(12, Math.min(rect.top + rect.height / 2, window.innerHeight - 30));
    setCoords({
      top: tooltipTop,
      left: rect.right + 12,
    });
  }, [targetRef]);

  useEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }

    updatePosition();

    // Re-position on scroll or resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  if (!isOpen || !coords || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed z-[999999] pointer-events-none select-none transition-all duration-150"
      style={{
        top: coords.top,
        left: coords.left,
        transform: 'translateY(-50%)',
      }}
    >
      <div className="relative px-2.5 py-1.5 bg-slate-900/95 text-white text-xs font-medium rounded-lg shadow-xl backdrop-blur-md border border-white/10 whitespace-nowrap flex items-center gap-2">
        <div className="flex flex-col items-start leading-tight">
          <div className="flex items-center gap-1.5">
            <span>{label}</span>
            {badge !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 bg-white/20 text-white font-semibold rounded-full leading-none">
                {badge}
              </span>
            )}
            {shortcut && (
              <kbd className="text-[10px] px-1 py-0.2 bg-white/20 text-white font-mono rounded">
                {shortcut}
              </kbd>
            )}
          </div>
          {subtitle && <span className="text-[10px] text-slate-400 mt-0.5">{subtitle}</span>}
        </div>
        {/* Subtle arrow pointer pointing left toward the button */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-[4px] border-transparent border-r-slate-900/95" />
      </div>
    </div>,
    document.body
  );
};
