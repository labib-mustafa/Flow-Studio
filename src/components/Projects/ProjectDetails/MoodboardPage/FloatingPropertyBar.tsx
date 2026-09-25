import React, { useState } from 'react';
import { MoodboardItemData, CropMaskConfig } from './MoodboardItem';
import { CustomSelect } from '../../../GlobalComponents/CustomSelect';
import { 
  Palette, 
  Trash2, 
  Minus, 
  Circle, 
  ArrowLeft, 
  ArrowRight,
  Lock,
  Unlock,
  Crop,
  Tag,
  Sparkles,
  RotateCcw,
  Plus,
  X,
  Square,
  Hexagon,
  Star
} from 'lucide-react';

export interface FloatingPropertyBarProps {
  items: MoodboardItemData[];
  onUpdate: (id: string, updates: Partial<MoodboardItemData>) => void;
  onUpdateMany: (ids: string[], updates: Partial<MoodboardItemData>) => void;
  onDelete: (ids: string[]) => void;
  onToggleColorSidebar?: () => void;
  onExtractPalette?: (itemId: string) => void;
  onToggleLock?: (itemIds: string[]) => void;
  onCreateColorCard?: (hex: string) => void;
  onCopy?: (text: string, label: string) => void;
  position: { x: number; y: number };
  zoom: number;
}

export const FloatingPropertyBar: React.FC<FloatingPropertyBarProps> = ({ 
  items, 
  onUpdate, 
  onUpdateMany, 
  onDelete, 
  onToggleColorSidebar, 
  onExtractPalette,
  onToggleLock,
  onCreateColorCard,
  onCopy,
  position, 
  zoom 
}) => {
  const [isCropPanelOpen, setIsCropPanelOpen] = useState(false);
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const noteColors = ['#fffbeb', '#dcfce7', '#fef3c7', '#f1f5f9', '#fee2e2'];
  const strokeColors = ['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
  
  const isSingleItem = items.length === 1;
  const item = isSingleItem ? items[0] : null;
  
  const allNotesOrShapes = items.length > 0 && items.every(i => i.type === 'note' || (i.type as any) === 'sticky' || i.type === 'shape');
  const allArrowsOrPencils = items.length > 0 && items.every(i => i.type === 'arrow' || i.type === 'pencil');
  const allArrows = items.length > 0 && items.every(i => i.type === 'arrow');
  const allImages = items.length > 0 && items.every(i => i.type === 'image');
  const isLocked = items.length > 0 && items.every(i => i.isLocked === true);

  const showNoteColors = allNotesOrShapes;
  const showStrokeColors = allArrowsOrPencils;
  const showArrowStyles = allArrows;
  const showImageControls = allImages;

  React.useEffect(() => {
    if (showImageControls && item && item.type === 'image' && (!item.paletteColors || item.paletteColors.length === 0)) {
      if (onExtractPalette) {
        onExtractPalette(item.id);
      }
    }
  }, [showImageControls, item, onExtractPalette]);

  const handleUpdate = (updates: Partial<MoodboardItemData>) => {
    if (isSingleItem && item) {
      onUpdate(item.id, updates);
    } else {
      onUpdateMany(items.map(i => i.id), updates);
    }
  };

  const handleToggleLock = () => {
    const nextLock = !isLocked;
    if (onToggleLock) {
      onToggleLock(items.map(i => i.id));
    } else {
      handleUpdate({ isLocked: nextLock });
    }
  };

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    if (onCopy) {
      onCopy(hex, 'Color Swatch');
    } else {
      setCopyToast(`Copied ${hex}`);
      setTimeout(() => setCopyToast(null), 2000);
    }
  };

  const handleAddCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    const currentCats = item?.categories || [];
    if (!currentCats.includes(trimmed)) {
      const updated = [...currentCats, trimmed];
      handleUpdate({ categories: updated });
    }
    setNewCategoryInput('');
  };

  const handleRemoveCategory = (catName: string) => {
    const currentCats = item?.categories || [];
    const updated = currentCats.filter(c => c !== catName);
    handleUpdate({ categories: updated });
  };

  const widthOptions = [
    { value: '1', label: '1px', icon: <Minus size={18} strokeWidth={1} /> },
    { value: '2', label: '2px', icon: <Minus size={18} strokeWidth={2} /> },
    { value: '4', label: '4px', icon: <Minus size={18} strokeWidth={4} /> },
    { value: '8', label: '8px', icon: <Minus size={18} strokeWidth={8} /> },
  ];

  const tailOptions = [
    { value: 'none', label: 'None', icon: <Minus size={18} /> },
    { value: 'dot', label: 'Dot', icon: <Circle size={14} fill="currentColor" /> },
    { value: 'flat', label: 'Flat', icon: <Minus size={18} className="rotate-90" /> },
    { value: 'arrow', label: 'Arrow', icon: <ArrowLeft size={18} /> },
  ];

  const headOptions = [
    { value: 'none', label: 'None', icon: <Minus size={18} /> },
    { value: 'filled', label: 'Filled', icon: <ArrowRight size={18} /> },
    { value: 'triangle', label: 'Triangle', icon: <ArrowRight size={18} /> },
    { value: 'line', label: 'Line', icon: <ArrowRight size={18} /> },
  ];

  const activeTagCount = (item?.categories || []).length;

  return (
    <div
      className="absolute z-50 bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-2 no-pan no-pan-ui"
      style={{ 
        left: position.x, 
        top: position.y - (60 / zoom),
        transform: `scale(${1 / zoom})`,
        transformOrigin: 'bottom left'
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Toast notification overlay */}
      {copyToast && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-lg shadow-md whitespace-nowrap z-50 pointer-events-none">
          {copyToast}
        </div>
      )}

      {/* R6: Image Crop & Mask Panel Popover */}
      {isCropPanelOpen && showImageControls && (
        <div className="absolute bottom-full mb-2 left-0 bg-white p-3 rounded-2xl shadow-xl border border-slate-200 flex flex-col gap-3 min-w-[260px] z-50 no-pan no-pan-ui">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Crop & Mask</span>
            <button
              type="button"
              onClick={() => {
                const defaultCrop: CropMaskConfig = { mode: 'crop', maskShape: 'none', zoom: 1, panX: 0, panY: 0 };
                handleUpdate({ cropMask: defaultCrop });
              }}
              className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs transition-colors"
              title="Reset Crop & Mask"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold">
            <button
              type="button"
              className={`flex-1 py-1 rounded-lg transition-all ${
                (item?.cropMask?.mode || 'crop') === 'crop'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => {
                const current = item?.cropMask || { mode: 'crop', maskShape: 'none', zoom: 1, panX: 0, panY: 0 };
                handleUpdate({ cropMask: { ...current, mode: 'crop' } });
              }}
            >
              Crop
            </button>
            <button
              type="button"
              className={`flex-1 py-1 rounded-lg transition-all ${
                item?.cropMask?.mode === 'mask'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => {
                const current = item?.cropMask || { mode: 'crop', maskShape: 'none', zoom: 1, panX: 0, panY: 0 };
                handleUpdate({ cropMask: { ...current, mode: 'mask' } });
              }}
            >
              Mask
            </button>
          </div>

          {/* Mask Shape Presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-400">Mask Shape</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'none', label: 'None', icon: Square },
                { id: 'circle', label: 'Circle', icon: Circle },
                { id: 'rounded', label: 'Rounded', icon: Square },
                { id: 'hexagon', label: 'Hexagon', icon: Hexagon },
                { id: 'star', label: 'Star', icon: Star },
              ].map((preset) => {
                const Icon = preset.icon;
                const isActive = (item?.cropMask?.maskShape || 'none') === preset.id;
                return (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => {
                      const current = item?.cropMask || { mode: 'mask', maskShape: 'none', zoom: 1, panX: 0, panY: 0 };
                      handleUpdate({ cropMask: { ...current, mode: 'mask', maskShape: preset.id as any } });
                    }}
                    className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-accent/10 border-accent text-accent shadow-xs'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800'
                    }`}
                    title={preset.label}
                  >
                    <Icon size={16} className={preset.id === 'rounded' ? 'rounded-xs' : ''} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
              <span>Zoom</span>
              <span>{Math.round((item?.cropMask?.zoom || 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={item?.cropMask?.zoom || 1}
              onChange={(e) => {
                const zoomVal = parseFloat(e.target.value);
                const current = item?.cropMask || { mode: 'crop', maskShape: 'none', zoom: 1, panX: 0, panY: 0 };
                handleUpdate({ cropMask: { ...current, zoom: zoomVal } });
              }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
        </div>
      )}

      {/* R7: Category Tag Selector Popover */}
      {isTagPopoverOpen && (
        <div className="absolute bottom-full mb-2 right-0 bg-white p-3 rounded-2xl shadow-xl border border-slate-200 flex flex-col gap-2.5 w-64 z-50 no-pan no-pan-ui">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Category Tags</span>
            <button
              type="button"
              onClick={() => setIsTagPopoverOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
            >
              <X size={14} />
            </button>
          </div>

          {/* Input field */}
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="Add category..."
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCategory(newCategoryInput);
                }
              }}
              className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => handleAddCategory(newCategoryInput)}
              className="px-2.5 py-1 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Current Active Tags */}
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto py-1">
            {activeTagCount === 0 ? (
              <span className="text-xs text-slate-400 italic">No tags added yet</span>
            ) : (
              (item?.categories || []).map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 text-xs font-medium rounded-full"
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="hover:text-red-500 rounded-full p-0.5"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Suggested Tags */}
          <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested</span>
            <div className="flex flex-wrap gap-1">
              {['Inspiration', 'Branding', 'Color Palette', 'Typography', 'UI Concept'].map((sug) => {
                const isAdded = (item?.categories || []).includes(sug);
                return (
                  <button
                    type="button"
                    key={sug}
                    disabled={isAdded}
                    onClick={() => handleAddCategory(sug)}
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                      isAdded
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-accent/5 hover:text-accent hover:border-accent/30'
                    }`}
                  >
                    + {sug}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* R1: Image Color Palette Swatches Bar */}
      {showImageControls && item && (
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-100 no-pan-ui">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Palette</span>
          <div className="flex items-center gap-1">
            {item.paletteColors && item.paletteColors.length > 0 ? (
              item.paletteColors.map((hex) => (
                <div key={hex} className="relative group flex items-center">
                  <button
                    type="button"
                    className="w-7 h-7 rounded-full border border-slate-200 hover:scale-110 active:scale-95 transition-transform shadow-xs relative"
                    style={{ backgroundColor: hex }}
                    onClick={() => handleCopyColor(hex)}
                    title={`Copy ${hex}`}
                  />
                  {onCreateColorCard && (
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border border-slate-300 shadow-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-opacity text-slate-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateColorCard(hex);
                      }}
                      title={`Create Color Card for ${hex}`}
                    >
                      <Plus size={10} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <span className="text-[11px] text-slate-400 italic px-1">Extracting...</span>
            )}
          </div>
          {onExtractPalette && (
            <button
              type="button"
              className="w-7 h-7 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors shadow-xs ml-0.5"
              onClick={() => onExtractPalette(item.id)}
              title="Re-extract Palette"
            >
              <Sparkles size={13} />
            </button>
          )}
        </div>
      )}

      {/* R6: Image Crop & Mask Control Trigger */}
      {showImageControls && (
        <div className="flex gap-1 pr-2 border-r border-slate-100 items-center">
          <button
            type="button"
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
              isCropPanelOpen
                ? 'bg-accent/10 text-accent border border-accent/30'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
            onClick={() => setIsCropPanelOpen(!isCropPanelOpen)}
            title="Crop & Mask Image"
          >
            <Crop size={18} />
          </button>
        </div>
      )}

      {/* Note/Shape Fill Swatches */}
      {showNoteColors && (
        <div className="flex gap-1.5 pr-2 border-r border-slate-100 items-center">
          {noteColors.map(color => (
            <button
              type="button"
              key={color}
              className="w-7 h-7 rounded-full border border-slate-200 hover:scale-110 transition-transform shadow-xs"
              style={{ backgroundColor: color }}
              onClick={() => handleUpdate({ color })}
            />
          ))}
          {onToggleColorSidebar && (
            <button
              type="button"
              className="w-7 h-7 rounded-full border border-slate-200 hover:scale-110 flex items-center justify-center transition-transform shadow-xs bg-white"
              onClick={onToggleColorSidebar}
              title="Custom Color"
            >
              <Palette size={14} />
            </button>
          )}
        </div>
      )}
      
      {/* Stroke Swatches & Width */}
      {showStrokeColors && (
        <>
          <div className="flex gap-1.5 pr-2 border-r border-slate-100 items-center">
            {strokeColors.map(color => (
              <button
                type="button"
                key={color}
                className="w-7 h-7 rounded-full border border-slate-200 hover:scale-110 transition-transform shadow-xs"
                style={{ backgroundColor: color }}
                onClick={() => handleUpdate({ color })}
              />
            ))}
            {onToggleColorSidebar && (
              <button
                type="button"
                className="w-7 h-7 rounded-full border border-slate-200 hover:scale-110 flex items-center justify-center transition-transform shadow-xs bg-white"
                onClick={onToggleColorSidebar}
                title="Custom Color"
              >
                <Palette size={14} />
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
      
      {/* Arrow Style Selectors */}
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

      {/* R7: Category Tag Selector Trigger */}
      <div className="flex gap-1 pr-2 border-r border-slate-100 items-center">
        <button
          type="button"
          className={`h-9 px-2.5 flex items-center gap-1.5 rounded-xl text-xs font-semibold transition-all ${
            isTagPopoverOpen || activeTagCount > 0
              ? 'bg-accent/10 text-accent border border-accent/30'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
          onClick={() => setIsTagPopoverOpen(!isTagPopoverOpen)}
          title="Category Tags"
        >
          <Tag size={16} />
          <span>Tags</span>
          {activeTagCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
              {activeTagCount}
            </span>
          )}
        </button>
      </div>

      {/* R4: Lock / Unlock Position Toggle */}
      <button
        type="button"
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
          isLocked
            ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
        }`}
        onClick={handleToggleLock}
        title={isLocked ? "Unlock Position" : "Lock Position"}
      >
        {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
      </button>

      {/* Item Delete Button */}
      <button
        type="button"
        className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
        onClick={() => onDelete(items.map(i => i.id))}
        title="Delete"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
};
