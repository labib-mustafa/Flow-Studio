import React, { useState } from 'react';
import { useTaskStore } from '../../../../stores/taskStore';
import { HexColorPicker } from 'react-colorful';
import tinycolor from 'tinycolor2';
import { CellPopover } from '../../../ui/CellPopover';

const PRESET_COLORS = [
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#0ea5e9', // Light Blue
  '#14b8a6', // Teal
  '#22c55e', // Green
  '#eab308', // Yellow
  '#f97316', // Orange
  '#ef4444', // Red
  '#ec4899', // Pink
  '#a855f7', // Light Purple
  '#84cc16', // Lime Green
  '#64748b', // Slate
];

interface StatusConfigPopoverProps {
  statusId: string;
  defaultName: string;
  defaultColor: string;
  children: React.ReactNode;
  initialIsEditing?: boolean;
  onSave?: (name: string) => void;
  onCancel?: () => void;
}

export const StatusConfigPopover: React.FC<StatusConfigPopoverProps> = ({ 
  statusId, 
  defaultName, 
  defaultColor, 
  children,
  initialIsEditing = false,
  onSave,
  onCancel
}) => {
  const { statusConfigs, updateStatusConfig } = useTaskStore();
  const config = statusConfigs?.[statusId] || { name: defaultName, color: defaultColor };
  
  const [isEditing, setIsEditing] = useState(initialIsEditing);
  const [colorFormat, setColorFormat] = useState<'HEX' | 'RGB' | 'CMYK' | 'HSL'>('HEX');
  const [tier2Open, setTier2Open] = useState(false);
  const [tier3Open, setTier3Open] = useState(false);

  const [nameInput, setNameInput] = useState(config.name);
  const [hexInput, setHexInput] = useState(config.color);

  const toggleFormat = () => {
    setColorFormat(prev => prev === 'HEX' ? 'RGB' : prev === 'RGB' ? 'CMYK' : prev === 'CMYK' ? 'HSL' : 'HEX');
  };

  const formattedColor = React.useMemo(() => {
    const t = tinycolor(hexInput);
    if (colorFormat === 'HEX') return t.toHexString();
    if (colorFormat === 'RGB') return t.toRgbString();
    if (colorFormat === 'HSL') return t.toHslString();
    if (colorFormat === 'CMYK') {
       const r = t.toRgb().r / 255;
       const g = t.toRgb().g / 255;
       const b = t.toRgb().b / 255;
       let k = 1 - Math.max(r, g, b);
       if (k === 1) return `cmyk(0%, 0%, 0%, 100%)`;
       const c = Math.round(((1 - r - k) / (1 - k)) * 100);
       const m = Math.round(((1 - g - k) / (1 - k)) * 100);
       const y = Math.round(((1 - b - k) / (1 - k)) * 100);
       k = Math.round(k * 100);
       return `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;
    }
    return t.toHexString();
  }, [hexInput, colorFormat]);

  // Sync state when opening
  React.useEffect(() => {
    if (isEditing) {
      setNameInput(config.name);
      setHexInput(config.color);
    }
  }, [isEditing, config]);

  const handleSaveName = () => {
    if (nameInput.trim() !== '') {
      updateStatusConfig(statusId, { name: nameInput.trim() });
      if (onSave) onSave(nameInput.trim());
    } else {
      if (onCancel) onCancel();
    }
    setIsEditing(false);
  };

  const handleColorSelect = (color: string) => {
    updateStatusConfig(statusId, { color });
    setHexInput(color);
    setTier2Open(false);
  };

  const handleCustomHexSave = () => {
    if (/^#[0-9A-F]{6}$/i.test(hexInput)) {
      updateStatusConfig(statusId, { color: hexInput });
      setTier3Open(false);
      setTier2Open(false);
    }
  };

  if (!isEditing) {
    return (
      <div onClick={() => setIsEditing(true)}>
        {children}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 border border-slate-400 bg-white shadow-sm rounded-md h-[24px] pl-1.5 pr-1">
      <CellPopover
        open={tier2Open}
        onOpenChange={setTier2Open}
        align="start"
        sideOffset={4}
        side="bottom"
        triggerClassName=""
        content={
          <div className="w-64 p-2 font-sans">
            <h4 className="text-sm font-semibold text-slate-500 mb-3">Color</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  className="w-6 h-6 rounded-full flex items-center justify-center border border-slate-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  onClick={() => handleColorSelect(c)}
                />
              ))}
              
              <CellPopover
                open={tier3Open}
                onOpenChange={setTier3Open}
                align="start"
                sideOffset={8}
                side="bottom"
                triggerClassName=""
                content={
                  <div className="w-64 p-2 font-sans">
                    <div className="flex items-center gap-1.5 mb-3.5">
                      <div className="w-[14px] h-[14px] rounded-full shrink-0" style={{ backgroundColor: hexInput }} />
                      <span className="text-[13px] font-bold text-slate-800 leading-none">{hexInput}</span>
                      <span className="text-[13px] text-slate-500 font-medium leading-none">· Contrast OK</span>
                    </div>

                    <div className="mb-4 -mx-1 status-color-picker">
                      <style>{`
                        .status-color-picker .react-colorful {
                          width: 100%;
                          height: 160px;
                        }
                        .status-color-picker .react-colorful__saturation {
                          border-radius: 8px;
                          border-bottom: none;
                        }
                        .status-color-picker .react-colorful__hue {
                          height: 12px;
                          border-radius: 9999px;
                          margin-top: 16px;
                          margin-bottom: 4px;
                        }
                        .status-color-picker .react-colorful__hue-pointer {
                          width: 16px;
                          height: 16px;
                          border-width: 2px;
                        }
                        .status-color-picker .react-colorful__saturation-pointer {
                          width: 16px;
                          height: 16px;
                          border-width: 2px;
                        }
                      `}</style>
                       <HexColorPicker color={hexInput} onChange={setHexInput} />
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                       <button 
                         onClick={toggleFormat}
                         className="px-2 py-1.5 flex items-center justify-between border border-slate-200 rounded-lg text-[13px] font-medium text-slate-800 bg-white hover:bg-slate-50 transition-colors w-[76px]"
                       >
                         {colorFormat}
                         <span className="material-symbols-outlined text-[16px] text-slate-500">unfold_more</span>
                       </button>
                       <input 
                         type="text" 
                         value={formattedColor}
                         onChange={(e) => {
                           const newColor = tinycolor(e.target.value);
                           if (newColor.isValid()) {
                             setHexInput(newColor.toHexString());
                           }
                         }}
                         className="flex-1 w-0 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] text-slate-800 outline-none focus:border-blue-500 transition-colors"
                       />
                    </div>
                    <button 
                      className="w-full bg-[#1A1A1A] text-white rounded-[8px] py-1.5 text-[13px] font-bold hover:bg-black transition-colors"
                      onClick={handleCustomHexSave}
                    >
                      Save
                    </button>
                  </div>
                }
              >
                <button className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </CellPopover>
            </div>
          </div>
        }
      >
        <button 
          className="w-[14px] h-[14px] rounded-[4px] flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
          style={{ backgroundColor: config.color }}
        />
      </CellPopover>

      <div className="relative grid items-center min-w-[20px]">
        <span className="invisible whitespace-pre col-start-1 row-start-1 px-1 font-medium text-[12px]">
          {nameInput || "Group name"}
        </span>
        <input 
          type="text" 
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSaveName();
            } else if (e.key === 'Escape') {
              if (onCancel) onCancel();
              setIsEditing(false);
            }
          }}
          className="col-start-1 row-start-1 w-full h-full bg-transparent text-slate-500 placeholder-slate-400 px-1 py-0 outline-none font-medium text-[12px] border-none"
          autoFocus
          placeholder="Group name"
        />
      </div>
      
      <button 
        onClick={handleSaveName}
        className="w-[18px] h-[18px] rounded border border-slate-200 flex items-center justify-center shrink-0 bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors ml-0.5"
      >
        <span className="material-symbols-outlined text-[12px]">check</span>
      </button>
    </div>
  );
};

