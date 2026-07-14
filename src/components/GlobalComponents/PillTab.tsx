import React from 'react';

interface PillTabProps {
  label: string;
  icon?: string;
  isActive: boolean;
  onClick: () => void;
  counter?: number;
}

export const PillTab: React.FC<PillTabProps> = ({ label, icon, isActive, onClick, counter }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
        isActive
          ? 'bg-slate-900 text-white border border-slate-900 shadow-sm'
          : 'text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
      }`}
    >
      {icon && <span className="material-symbols-outlined text-[16px]">{icon}</span>}
      <span>{label}</span>
      {typeof counter !== 'undefined' && counter !== null && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
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
