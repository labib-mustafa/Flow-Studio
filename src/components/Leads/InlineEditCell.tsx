import React, { useState, useEffect, useRef } from 'react';

type EditableType = 'text' | 'number' | 'email' | 'status' | 'tags';

interface InlineEditCellProps {
  value: any;
  type?: EditableType;
  onSave: (val: any) => void;
  className?: string;
  renderValue?: (val: any) => React.ReactNode;
}

export const InlineEditCell: React.FC<InlineEditCellProps> = ({ 
  value, 
  type = 'text', 
  onSave,
  className = '',
  renderValue
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<any>(value);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.select) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    e.stopPropagation();
    setIsEditing(true);
    if (type === 'tags') {
      setEditValue((value || []).join(', '));
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    save();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      setIsEditing(false);
      save();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(type === 'tags' ? (value || []).join(', ') : value);
    }
  };

  const save = () => {
    if (type === 'number') {
      const num = parseFloat(editValue);
      onSave(isNaN(num) ? 0 : num);
    } else if (type === 'tags') {
      const tags = (editValue as string).split(',').map(s => s.trim()).filter(s => s !== '');
      onSave(tags);
    } else {
      onSave(editValue);
    }
  };

  if (isEditing) {
    // Determine base classes to apply to inner input/select to match typography of the container wrapper
    // We strip out some layout properties that might break inputs, though Tailwind generally handles them.
    const inputStyleClasses = `w-full h-full bg-transparent border-none outline-none focus:ring-0 p-0 m-0 ${className}`;

    if (type === 'status') {
      const options = ['New', 'Proposal Sent', 'Contacted', 'Lost', 'Archived'];
      
      const getStatusStyles = (status: string) => {
        switch (status) {
          case 'New':
            return {
              bg: 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100/70',
              dot: 'bg-emerald-500'
            };
          case 'Proposal Sent':
            return {
              bg: 'bg-purple-50 text-purple-800 border-purple-100 hover:bg-purple-100/70',
              dot: 'bg-purple-500'
            };  
          case 'Contacted':
            return {
              bg: 'bg-indigo-50 text-indigo-800 border-indigo-100 hover:bg-indigo-100/70',
              dot: 'bg-indigo-500'
            };
          case 'Lost':
            return {
              bg: 'bg-rose-50 text-rose-800 border-rose-100 hover:bg-rose-100/70',
              dot: 'bg-rose-500'
            };
          case 'Archived':
          default:
            return {
              bg: 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100/70',
              dot: 'bg-slate-400'
            };
        }
      };

      const currentStyles = getStatusStyles(editValue);

      return (
        <div 
          ref={inputRef}
          tabIndex={0}
          onBlur={handleBlur}
          className="relative w-fit flex items-center min-w-0 outline-none" 
          onClick={e => e.stopPropagation()}
        >
          <div className={`w-fit min-w-0 flex items-center justify-between gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm cursor-pointer transition-none ${currentStyles.bg}`}>
             <div className="flex items-center gap-1.5 min-w-0">
               <span className={`w-1.5 h-1.5 rounded-full ${currentStyles.dot} shrink-0`} />
               <span className="truncate">{editValue}</span>
             </div>
          </div>
          <div className="absolute top-full left-0 mt-1.5 w-44 bg-white/95 backdrop-blur-md rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 py-1.5 z-50 flex flex-col overflow-hidden transition-all">
            {options.map(opt => {
              const optStyles = getStatusStyles(opt);
              const isSelected = opt === editValue;
              return (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditValue(opt);
                    setIsEditing(false);
                    onSave(opt);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-bold transition-colors ${
                    isSelected 
                      ? 'bg-slate-50/80 text-slate-900' 
                      : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full border border-white ${optStyles.dot} shrink-0 shadow-sm`} />
                    <span className="truncate tracking-wide">{opt}</span>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[15px] text-slate-800 font-bold">check</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <input
        ref={inputRef}
        type={type === 'number' ? 'number' : type === 'email' ? 'email' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className={inputStyleClasses}
      />
    );
  }

  return (
    <div 
      onClick={handleClick}
      className={`cursor-pointer ${className}`}
      title="Click to edit inline"
    >
      {renderValue ? renderValue(value) : value}
    </div>
  );
};
