import React, { useState, useRef } from 'react';
import { DropdownMenu, DropdownOption } from './DropdownMenu';

interface CustomSelectProps {
  options: { value: string; label: string; icon?: string }[];
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
    className: opt.value === value ? 'bg-slate-50 text-primary' : ''
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
        className="flex items-center justify-between w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300 transition-all focus:ring-2 focus:ring-primary/10 outline-none"
      >
        <div className="flex items-center gap-2">
          {selectedOption.icon && (
            <span className="material-symbols-outlined text-[18px] text-slate-400">
              {selectedOption.icon}
            </span>
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
