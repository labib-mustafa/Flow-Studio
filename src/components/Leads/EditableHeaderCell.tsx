import React, { useState, useRef, useEffect } from 'react';

interface EditableHeaderCellProps {
  label: string;
  onSave: (newLabel: string) => void;
  className?: string;
  forceEdit?: boolean;
  onEditComplete?: () => void;
}

export const EditableHeaderCell: React.FC<EditableHeaderCellProps> = ({ 
  label, 
  onSave, 
  className = '', 
  forceEdit = false, 
  onEditComplete 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(label);
  }, [label]);

  useEffect(() => {
    if (forceEdit) {
      setIsEditing(true);
    }
  }, [forceEdit]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== label) {
      onSave(trimmed);
    } else {
      setValue(label);
    }
    setIsEditing(false);
    if (onEditComplete) onEditComplete();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(label);
      setIsEditing(false);
      if (onEditComplete) onEditComplete();
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center min-w-0 ${className}`} onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="bg-slate-50 border-none outline-none font-bold text-[11px] text-slate-800 tracking-wider uppercase px-2 py-1 rounded w-full focus:ring-1 focus:ring-accent/25 min-w-[70px] leading-none"
        />
      </div>
    );
  }

  return (
    <div 
      className={`group/header cursor-pointer select-none min-w-0 w-full ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      title="Click to rename"
    >
      <div className="font-bold text-[11px] text-slate-500 tracking-wider uppercase truncate leading-none w-full">
        {label}
      </div>
    </div>
  );
};
