import React from 'react';
import { Grid, X } from 'lucide-react';
import { GridConfig, GridType } from './MoodboardItem';

export interface GridConfigPopoverProps {
  gridConfig: GridConfig;
  onChangeGridConfig: (updates: Partial<GridConfig>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const GridConfigPopover: React.FC<GridConfigPopoverProps> = ({
  gridConfig,
  onChangeGridConfig,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const styleOptions: { id: GridType; label: string }[] = [
    { id: 'dot', label: 'Dot' },
    { id: 'square', label: 'Square' },
    { id: 'isometric', label: 'Isometric' },
    { id: 'blank', label: 'Blank' }
  ];

  return (
    <div
      className="bg-white rounded-2xl shadow-xl border border-slate-200 w-72 p-4 flex flex-col gap-4 z-50 no-pan no-pan-ui"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
            <Grid size={16} />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">Grid Settings</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Grid Style Segmented Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Grid Style</label>
        <div className="grid grid-cols-4 bg-slate-100 p-1 rounded-xl gap-1">
          {styleOptions.map((opt) => (
            <button
              type="button"
              key={opt.id}
              onClick={() => onChangeGridConfig({ type: opt.id })}
              className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                gridConfig.type === opt.id
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Size Slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
          <span>Grid Size</span>
          <span className="font-mono text-slate-800">{gridConfig.size}px</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={gridConfig.size}
          onChange={(e) => onChangeGridConfig({ size: parseInt(e.target.value) })}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-accent"
        />
      </div>

      {/* Grid Opacity Slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
          <span>Opacity</span>
          <span className="font-mono text-slate-800">{Math.round(gridConfig.opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.05}
          max={0.50}
          step={0.05}
          value={gridConfig.opacity}
          onChange={(e) => onChangeGridConfig({ opacity: parseFloat(e.target.value) })}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-accent"
        />
      </div>

      {/* Snap to Grid Toggle */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-700">Snap to Grid</span>
          <span className="text-[10px] text-slate-400">Align items on move & resize</span>
        </div>
        <button
          type="button"
          onClick={() => onChangeGridConfig({ snapToGrid: !gridConfig.snapToGrid })}
          className={`w-10 h-6 rounded-full transition-colors p-0.5 relative ${
            gridConfig.snapToGrid ? 'bg-primary' : 'bg-slate-300'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${
              gridConfig.snapToGrid ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
