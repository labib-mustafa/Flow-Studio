import React from 'react';
import { motion } from 'motion/react';
import { sound } from '../../stores/soundStore';

interface PillTabProps {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  counter?: number;
}

export const PillTab: React.FC<PillTabProps> = ({ label, icon, isActive, onClick, counter }) => {
  const handleClick = (e: React.MouseEvent) => {
    sound.tick();
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 select-none ${
        isActive
          ? 'text-white'
          : 'text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="active-pill-tab"
          className="absolute inset-0 bg-slate-900 rounded-full shadow-sm z-0"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}

      <span className="relative z-10 flex items-center gap-2">
        {icon && (
          typeof icon === 'string' ? (
            <span className="material-symbols-outlined text-[16px]">{icon}</span>
          ) : (
            <span className="flex items-center justify-center shrink-0">{icon}</span>
          )
        )}
        <span>{label}</span>
      </span>

      {typeof counter !== 'undefined' && counter !== null && (
        <span
          className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
            isActive
              ? 'bg-white/20 text-white'
              : 'bg-slate-100 border border-slate-200 text-slate-500'
          }`}
        >
          {counter}
        </span>
      )}
    </button>
  );
};
