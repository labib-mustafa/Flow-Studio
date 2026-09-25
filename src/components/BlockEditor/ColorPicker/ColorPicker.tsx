import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Info, AlertTriangle, Eye, Pipette, Plus, X } from 'lucide-react';
import { 
  createHighlightColor, 
  getContrastRatio,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  getLuminance
} from '../../../utils/colorUtils';

interface HighlightColor {
  bg: string;
  text: string;
  contrast: number;
}

interface ColorPickerProps {
  onSelect: (color: HighlightColor | null) => void;
  onClose: () => void;
  activeColor?: string;
}

// 80 colors matching the image structure (8 rows x 10 columns)
const GRID_COLORS = [
  // Row 1: Grayscale
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  // Row 2: Vibrant Base Hues
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  // Row 3: Tints 1
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  // Row 4: Tints 2
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  // Row 5: Tints 3
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  // Row 6: Shades 1
  '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
  // Row 7: Shades 2
  '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
  // Row 8: Shades 3
  '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130'
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ onSelect, onClose, activeColor }) => {
  const [view, setView] = useState<'grid' | 'advanced'>('grid');
  const [advancedColor, setAdvancedColor] = useState('#ff0000');

  const handleEyedropper = async () => {
    if (!('EyeDropper' in window)) {
      // Fallback: just open advanced picker if API not supported
      setView('advanced');
      return;
    }

    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      if (result.sRGBHex) {
        setAdvancedColor(result.sRGBHex);
        setView('advanced');
      }
    } catch (e) {
      // User cancelled or error
      console.log('Eyedropper cancelled or failed', e);
    }
  };

  const normalizeRgbToHex = (rgbStr: string) => {
    const match = rgbStr.match(/\d+/g);
    if (!match) return null;
    const [r, g, b] = match.map(Number);
    return rgbToHex(r, g, b).toLowerCase();
  };

  if (view === 'advanced') {
    return <AdvancedPicker 
      initialColor={advancedColor} 
      onCancel={() => setView('grid')} 
      onOk={(color) => {
        onSelect(createHighlightColor(color));
        onClose();
      }} 
    />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute top-full left-0 mt-2 p-3 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] w-[320px] flex flex-col gap-3"
    >
      {/* None Option */}
      <button 
        onClick={() => {
          onSelect(null);
          onClose();
        }}
        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-md transition-colors group"
      >
        <div className="w-6 h-6 flex items-center justify-center text-slate-600 group-hover:text-slate-900">
          <span className="material-symbols-outlined text-[20px]">format_color_reset</span>
        </div>
        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">None</span>
      </button>

      {/* Color Grid */}
      <div className="grid grid-cols-10 gap-1.5 px-1">
        {GRID_COLORS.map((color, idx) => (
          <button
            key={idx}
            onClick={() => {
              onSelect(createHighlightColor(color));
              onClose();
            }}
            className={`w-6 h-6 rounded-full border hover:scale-110 transition-transform relative shadow-sm ${
              activeColor && activeColor !== 'mixed' && (activeColor.toLowerCase() === color.toLowerCase() || 
              (activeColor.startsWith('rgb') && normalizeRgbToHex(activeColor) === color.toLowerCase()))
                ? 'border-accent ring-2 ring-accent/20 scale-110 z-10' 
                : (getLuminance(color) > 0.85 ? 'border-slate-300' : 'border-slate-200')
            }`}
            style={{ backgroundColor: color }}
          >
            {(activeColor && activeColor !== 'mixed' && (activeColor.toLowerCase() === color.toLowerCase() || 
              (activeColor.startsWith('rgb') && normalizeRgbToHex(activeColor) === color.toLowerCase()))) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-1.5 h-1.5 rounded-full ${getContrastRatio(color, '#ffffff') > 2 ? 'bg-white' : 'bg-black'}`} />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom Section */}
      <div className="pt-2 border-top border-slate-100">
        <div className="px-2 mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom</span>
        </div>
        <div className="flex items-center gap-2 px-1">
          <button 
            onClick={() => {
              if (activeColor) {
                if (activeColor.startsWith('rgb')) {
                  const hexVal = normalizeRgbToHex(activeColor);
                  if (hexVal) setAdvancedColor(hexVal);
                } else if (activeColor !== 'transparent') {
                  setAdvancedColor(activeColor);
                }
              }
              setView('advanced');
            }}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-90"
            title="Custom Color"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button 
            onClick={handleEyedropper}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-90"
            title="Eyedropper"
          >
            <Pipette className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

interface AdvancedPickerProps {
  initialColor: string;
  onCancel: () => void;
  onOk: (color: string) => void;
}

const AdvancedPicker: React.FC<AdvancedPickerProps> = ({ initialColor, onCancel, onOk }) => {
  const [hex, setHex] = useState(initialColor);
  const [rgb, setRgb] = useState(hexToRgb(initialColor) || { r: 255, g: 0, b: 0 });
  
  // h: 0-360, s: 0-100, v: 0-100
  const getHsv = (r: number, g: number, b: number) => {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    const s = max === 0 ? 0 : (d / max) * 100;
    const v = (max / 255) * 100;
    let h = 0;
    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    return { h, s, v };
  };

  const hsvToRgbLocal = (h: number, s: number, v: number) => {
    s /= 100;
    v /= 100;
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h / 60);
    const f = h / 60 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  const [hsv, setHsv] = useState(getHsv(rgb.r, rgb.g, rgb.b));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Base color for the current hue
    const baseRgb = hsvToRgbLocal(hsv.h, 100, 100);
    const baseHex = rgbToHex(baseRgb.r, baseRgb.g, baseRgb.b);

    // Saturation gradient (left to right: white to hue)
    const gradS = ctx.createLinearGradient(0, 0, width, 0);
    gradS.addColorStop(0, '#fff');
    gradS.addColorStop(1, baseHex);
    ctx.fillStyle = gradS;
    ctx.fillRect(0, 0, width, height);

    // Value gradient (top to bottom: transparent to black)
    const gradV = ctx.createLinearGradient(0, 0, 0, height);
    gradV.addColorStop(0, 'rgba(0,0,0,0)');
    gradV.addColorStop(1, '#000');
    ctx.fillStyle = gradV;
    ctx.fillRect(0, 0, width, height);
  };

  useEffect(() => {
    drawCanvas();
  }, [hsv.h]);

  const updateFromPosition = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    
    const s = (x / rect.width) * 100;
    const v = (1 - (y / rect.height)) * 100;
    
    setHsv(prev => {
      const next = { ...prev, s, v };
      const newRgb = hsvToRgbLocal(next.h, next.s, next.v);
      setRgb(newRgb);
      setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    updateFromPosition(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        updateFromPosition(e.clientX, e.clientY);
      }
    };
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = parseFloat(e.target.value);
    setHsv(prev => {
      const next = { ...prev, h };
      const newRgb = hsvToRgbLocal(next.h, next.s, next.v);
      setRgb(newRgb);
      setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
      return next;
    });
  };

  const handleRgbChange = (key: keyof typeof rgb, value: string) => {
    const val = Math.min(255, Math.max(0, parseInt(value) || 0));
    const newRgb = { ...rgb, [key]: val };
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    setHsv(getHsv(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleHexChange = (value: string) => {
    setHex(value);
    if (value.length === 7 && value.startsWith('#')) {
      const newRgb = hexToRgb(value);
      if (newRgb) {
        setRgb(newRgb);
        setHsv(getHsv(newRgb.r, newRgb.g, newRgb.b));
      }
    }
  };

  const handleEyedropper = async () => {
    if (!('EyeDropper' in window)) return;
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      if (result.sRGBHex) {
        handleHexChange(result.sRGBHex);
      }
    } catch (e) {
      console.log('Eyedropper cancelled', e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute top-full left-0 mt-2 p-5 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] w-[340px] flex flex-col gap-5"
    >
      {/* Saturation/Brightness Square */}
      <div 
        className="relative w-full h-44 rounded-lg overflow-hidden border border-slate-100 cursor-crosshair select-none"
        onMouseDown={handleMouseDown}
      >
        <canvas 
          ref={canvasRef}
          width={300}
          height={176}
          className="w-full h-full"
        />
        {/* Selector circle */}
        <div 
          className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)] pointer-events-none"
          style={{ 
            left: `${hsv.s}%`, 
            top: `${100 - hsv.v}%`,
            backgroundColor: hex
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-full border-4 border-white shadow-md shrink-0" 
          style={{ 
            backgroundColor: hex,
            boxShadow: getLuminance(hex) > 0.85 
              ? '0 0 0 1px rgba(0,0,0,0.1), 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' 
              : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
          }} 
        />
        
        <div className="flex-1 flex items-center gap-3">
          <button 
            onClick={handleEyedropper}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Pipette className="w-4 h-4 text-slate-600" />
          </button>
          <div className="flex-1 relative h-4 flex items-center">
            <input 
              type="range" 
              min="0" 
              max="360" 
              step="0.1"
              value={hsv.h}
              onChange={handleHueChange}
              className="w-full h-2.5 rounded-full appearance-none cursor-pointer"
              style={{ 
                WebkitAppearance: 'none',
                background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hex</label>
          <input 
            type="text" 
            value={hex}
            onChange={(e) => handleHexChange(e.target.value)}
            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:border-accent outline-none transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">R</label>
          <input 
            type="text" 
            value={rgb.r}
            onChange={(e) => handleRgbChange('r', e.target.value)}
            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs text-center focus:border-accent outline-none transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">G</label>
          <input 
            type="text" 
            value={rgb.g}
            onChange={(e) => handleRgbChange('g', e.target.value)}
            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs text-center focus:border-accent outline-none transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">B</label>
          <input 
            type="text" 
            value={rgb.b}
            onChange={(e) => handleRgbChange('b', e.target.value)}
            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs text-center focus:border-accent outline-none transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button 
          onClick={onCancel}
          className="px-6 py-2 text-blue-600 font-bold hover:bg-blue-50 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={() => onOk(hex)}
          className="px-10 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95"
        >
          OK
        </button>
      </div>
    </motion.div>
  );
};
