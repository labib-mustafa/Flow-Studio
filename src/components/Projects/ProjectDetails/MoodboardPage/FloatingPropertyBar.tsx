import React from 'react';
import { MoodboardItemData } from './MoodboardItem';
import { CustomSelect } from '../../../GlobalComponents/CustomSelect';

interface FloatingPropertyBarProps {
  items: MoodboardItemData[];
  onUpdate: (id: string, updates: Partial<MoodboardItemData>) => void;
  onUpdateMany: (ids: string[], updates: Partial<MoodboardItemData>) => void;
  onDelete: (ids: string[]) => void;
  onToggleColorSidebar?: () => void;
  position: { x: number, y: number };
  zoom: number;
}

export const FloatingPropertyBar: React.FC<FloatingPropertyBarProps> = ({ items, onUpdate, onUpdateMany, onDelete, onToggleColorSidebar, position, zoom }) => {
  const noteColors = ['#fffbeb', '#dcfce7', '#fef3c7', '#f1f5f9', '#fee2e2'];
  const strokeColors = ['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
  
  const isSingleItem = items.length === 1;
  const item = isSingleItem ? items[0] : null;
  
  const allNotesOrShapes = items.every(i => i.type === 'note' || i.type === 'shape');
  const allArrowsOrPencils = items.every(i => i.type === 'arrow' || i.type === 'pencil');
  const allArrows = items.every(i => i.type === 'arrow');

  const showNoteColors = allNotesOrShapes;
  const showStrokeColors = allArrowsOrPencils;
  const showArrowStyles = allArrows;

  const handleUpdate = (updates: Partial<MoodboardItemData>) => {
    if (isSingleItem && item) {
      onUpdate(item.id, updates);
    } else {
      onUpdateMany(items.map(i => i.id), updates);
    }
  };

  const widthOptions = [
    { value: '1', label: '1px', icon: 'line_weight' },
    { value: '2', label: '2px', icon: 'line_weight' },
    { value: '4', label: '4px', icon: 'line_weight' },
    { value: '8', label: '8px', icon: 'line_weight' },
  ];

  const tailOptions = [
    { value: 'none', label: 'None', icon: 'remove' },
    { value: 'dot', label: 'Dot', icon: 'circle' },
    { value: 'flat', label: 'Flat', icon: 'horizontal_rule' },
    { value: 'arrow', label: 'Arrow', icon: 'arrow_back' },
  ];

  const headOptions = [
    { value: 'none', label: 'None', icon: 'remove' },
    { value: 'filled', label: 'Filled', icon: 'arrow_forward' },
    { value: 'triangle', label: 'Triangle', icon: 'arrow_right_alt' },
    { value: 'line', label: 'Line', icon: 'trending_flat' },
  ];

  return (
    <div
      className="absolute z-50 bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-2 no-pan"
      style={{ 
        left: position.x, 
        top: position.y - (60 / zoom),
        transform: `scale(${1 / zoom})`,
        transformOrigin: 'bottom left'
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {showNoteColors && (
        <div className="flex gap-1.5 pr-2 border-r border-slate-100 items-center">
          {noteColors.map(color => (
            <button
              key={color}
              className="w-7 h-7 rounded-full border border-slate-200 hover:scale-110 transition-transform shadow-sm"
              style={{ backgroundColor: color }}
              onClick={() => handleUpdate({ color })}
            />
          ))}
          {onToggleColorSidebar && (
            <button
              className="w-7 h-7 rounded-full border border-slate-200 hover:scale-110 flex items-center justify-center transition-transform shadow-sm bg-white"
              onClick={onToggleColorSidebar}
              title="Custom Color"
            >
              <span className="material-symbols-outlined text-[14px]">palette</span>
            </button>
          )}
        </div>
      )}
      
      {showStrokeColors && (
        <>
          <div className="flex gap-1.5 pr-2 border-r border-slate-100 items-center">
            {strokeColors.map(color => (
              <button
                key={color}
                className="w-7 h-7 rounded-full border border-slate-200 hover:scale-110 transition-transform shadow-sm"
                style={{ backgroundColor: color }}
                onClick={() => handleUpdate({ color })}
              />
            ))}
            {onToggleColorSidebar && (
              <button
                className="w-7 h-7 rounded-full border border-slate-200 hover:scale-110 flex items-center justify-center transition-transform shadow-sm bg-white"
                onClick={onToggleColorSidebar}
                title="Custom Color"
              >
                <span className="material-symbols-outlined text-[14px]">palette</span>
              </button>
            )}
          </div>
          <div className="flex gap-2 pr-2 border-r border-slate-100 items-center">
            <CustomSelect
              options={widthOptions}
              value={(items[0]?.borderWidth || 2).toString()}
              onChange={(val) => handleUpdate({ borderWidth: parseInt(val) })}
              width={120}
            />
          </div>
        </>
      )}
      
      {showArrowStyles && (
        <div className="flex gap-2 pr-2 border-r border-slate-100 items-center">
          <CustomSelect
            options={tailOptions}
            value={items[0]?.arrowTailStyle || 'none'}
            onChange={(val) => handleUpdate({ arrowTailStyle: val as any })}
            width={140}
          />
          <CustomSelect
            options={headOptions}
            value={items[0]?.arrowHeadStyle || 'filled'}
            onChange={(val) => handleUpdate({ arrowHeadStyle: val as any })}
            width={140}
          />
        </div>
      )}
      <button
        className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
        onClick={() => onDelete(items.map(i => i.id))}
        title="Delete"
      >
        <span className="material-symbols-outlined text-[20px]">delete</span>
      </button>
    </div>
  );
};
