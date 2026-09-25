import React, { useState, useRef } from 'react';
import { DropdownMenu, DropdownOption } from './DropdownMenu';

interface CustomSelectProps {
  options: { value: string; label: string; icon?: string | React.ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
  width?: number;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  className = '', 
  label,
  width = 180
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = (options || []).find(opt => opt.value === value) || (options || [])[0];

  const dropdownOptions: DropdownOption[] = (options || []).map(opt => ({
    id: opt.value,
    label: opt.label,
    icon: opt.icon,
    onClick: () => onChange(opt.value),
    className: opt.value === value ? 'bg-slate-50 text-accent' : ''
  }));

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300 transition-all focus:ring-2 focus:ring-accent/10 outline-none"
      >
        <div className="flex items-center gap-2">
          {selectedOption.icon && (
            typeof selectedOption.icon === 'string' ? (
              <span className="material-symbols-outlined text-[18px] text-slate-400">
                {selectedOption.icon}
              </span>
            ) : (
              <div className="text-slate-400 flex items-center justify-center shrink-0 w-[18px] h-[18px]">
                {selectedOption.icon}
              </div>
            )
          )}
          <span>{selectedOption.label}</span>
        </div>
        <span className={`material-symbols-outlined text-slate-400 text-[18px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      <DropdownMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRect={triggerRef.current?.getBoundingClientRect() || null}
        options={dropdownOptions}
        width={width}
      />
    </div>
  );
};
