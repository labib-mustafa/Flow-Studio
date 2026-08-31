import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownOption {
  id: string;
  label: string;
  icon?: string | React.ReactNode;
  badge?: string;
  divider?: boolean;
  onClick?: () => void;
  className?: string;
  color?: string;
}
 
interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
  options: DropdownOption[];
  align?: 'left' | 'right';
  width?: number;
}
 
export const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
  isOpen, 
  onClose, 
  anchorRect, 
  options, 
  align = 'left',
  width = 240
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
 
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
 
  if (!isOpen || !anchorRect) return null;
 
  const top = anchorRect.bottom + 8;
  const left = align === 'left' 
    ? anchorRect.left 
    : anchorRect.right - width;
 
  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="fixed z-[9999] bg-white rounded-[24px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 p-2 overflow-hidden no-pan"
        style={{ 
          top, 
          left, 
          width,
          transformOrigin: align === 'left' ? 'top left' : 'top right'
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          {options.map((option, index) => (
            <React.Fragment key={option.id}>
              {option.divider && index > 0 && (
                <div className="h-px bg-slate-100 my-1.5 mx-2" />
              )}
              <button
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[16px] transition-all duration-200 group text-left ${
                  option.className || 'hover:bg-slate-50'
                }`}
                onClick={() => {
                  option.onClick?.();
                  onClose();
                }}
              >
                {option.icon && (
                  typeof option.icon === 'string' ? (
                    <span className={`material-symbols-outlined text-[20px] ${
                      option.color ? '' : 'text-slate-500 group-hover:text-slate-900'
                    }`} style={{ color: option.color }}>
                      {option.icon}
                    </span>
                  ) : (
                    <div className={`flex items-center justify-center shrink-0 w-5 h-5 ${
                      option.color ? '' : 'text-slate-500 group-hover:text-slate-900'
                    }`} style={{ color: option.color }}>
                      {option.icon}
                    </div>
                  )
                )}
                <span className={`text-sm font-medium flex-1 ${
                  option.color ? '' : 'text-slate-700 group-hover:text-slate-900'
                }`} style={{ color: option.color }}>
                  {option.label}
                </span>
                {option.badge && (
                  <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    {option.badge}
                  </span>
                )}
              </button>
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
