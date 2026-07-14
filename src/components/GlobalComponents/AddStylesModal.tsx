import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type QueueItem = 
  | { type: 'color'; value: string }
  | { type: 'typography'; font: string; weight: string; italic: boolean };

interface AddStylesModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorPos: { x: number; y: number };
  onSave: (items: QueueItem[]) => void;
}

const SUGGESTED_PALETTES = [
  { name: 'Oceanic Depth', colors: ['#0c4a6e', '#0369a1', '#38bdf8', '#bae6fd'] },
  { name: 'Sunset Warmth', colors: ['#7c2d12', '#c2410c', '#fb923c', '#fed7aa'] },
];

const ACTIVE_PROJECT_COLORS = ['#0f172a', '#1978e5', '#64748b'];
const SECONDARY_ACCENTS = ['#10b981', '#f59e0b', '#fb7185'];

export const AddStylesModal: React.FC<AddStylesModalProps> = ({ isOpen, onClose, anchorPos, onSave }) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Typography State
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontWeight, setFontWeight] = useState('Bold');
  const [isItalic, setIsItalic] = useState(false);

  // Color Mixer State
  const [hue, setHue] = useState(217);
  const [saturation, setSaturation] = useState(91);
  const [lightness, setLightness] = useState(60);
  const [hex, setHex] = useState('#3B82F6');
  const [inputMode, setInputMode] = useState<'HSL' | 'RGB' | 'CMYK'>('HSL');

  const slMapRef = React.useRef<HTMLDivElement>(null);
  const hueSliderRef = React.useRef<HTMLDivElement>(null);

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const hexToHsl = (hexStr: string) => {
    let r = 0, g = 0, b = 0;
    if (hexStr.length === 4) {
      r = parseInt(hexStr[1] + hexStr[1], 16);
      g = parseInt(hexStr[2] + hexStr[2], 16);
      b = parseInt(hexStr[3] + hexStr[3], 16);
    } else if (hexStr.length === 7) {
      r = parseInt(hexStr.substring(1, 3), 16);
      g = parseInt(hexStr.substring(3, 5), 16);
      b = parseInt(hexStr.substring(5, 7), 16);
    }
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const hexToCmyk = (hexStr: string) => {
    let r = 0, g = 0, b = 0;
    if (hexStr.length === 4) {
      r = parseInt(hexStr[1] + hexStr[1], 16);
      g = parseInt(hexStr[2] + hexStr[2], 16);
      b = parseInt(hexStr[3] + hexStr[3], 16);
    } else if (hexStr.length === 7) {
      r = parseInt(hexStr.substring(1, 3), 16);
      g = parseInt(hexStr.substring(3, 5), 16);
      b = parseInt(hexStr.substring(5, 7), 16);
    }
    if (Number.isNaN(r)) r = 0;
    if (Number.isNaN(g)) g = 0;
    if (Number.isNaN(b)) b = 0;

    const rPrime = r / 255;
    const gPrime = g / 255;
    const bPrime = b / 255;

    const k = 1 - Math.max(rPrime, gPrime, bPrime);
    if (k === 1) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }

    const c = (1 - rPrime - k) / (1 - k);
    const m = (1 - gPrime - k) / (1 - k);
    const y = (1 - bPrime - k) / (1 - k);

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  };

  const cmykToHex = (c: number, m: number, y: number, k: number) => {
    const r = 255 * (1 - c / 100) * (1 - k / 100);
    const g = 255 * (1 - m / 100) * (1 - k / 100);
    const b = 255 * (1 - y / 100) * (1 - k / 100);
    return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (x: number) => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const updateColorFromSL = (e: React.PointerEvent | PointerEvent) => {
    if (!slMapRef.current) return;
    const rect = slMapRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    // The UI is an SV map (HSV color model)
    // x = S_hsv (0 to 1)
    // y = 1 - V_hsv (0 to 1)
    const s_hsv = x;
    const v_hsv = 1 - y;

    // Convert HSV to HSL
    const l_hsl = v_hsv * (1 - s_hsv / 2);
    const s_hsl = l_hsl === 0 || l_hsl === 1 ? 0 : (v_hsv - l_hsl) / Math.min(l_hsl, 1 - l_hsl);
    
    const newS = Math.round(s_hsl * 100);
    const newL = Math.round(l_hsl * 100);
    
    setSaturation(newS);
    setLightness(newL);
    setHex(hslToHex(hue, newS, newL));
  };

  const updateColorFromHue = (e: React.PointerEvent | PointerEvent) => {
    if (!hueSliderRef.current) return;
    const rect = hueSliderRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const newHue = Math.round(y * 360);
    setHue(newHue);
    setHex(hslToHex(newHue, saturation, lightness));
  };

  useEffect(() => {
    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handleSLMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointermove', handleHueMove);
    };

    const handleSLMove = (e: PointerEvent) => updateColorFromSL(e);
    const handleHueMove = (e: PointerEvent) => updateColorFromHue(e);

    return () => {
      document.removeEventListener('pointermove', handleSLMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointermove', handleHueMove);
    };
  }, [hue, saturation, lightness]);

  const onSLPointerDown = (e: React.PointerEvent) => {
    updateColorFromSL(e);
    const handleSLMove = (e: PointerEvent) => updateColorFromSL(e);
    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handleSLMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
    document.addEventListener('pointermove', handleSLMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const onHuePointerDown = (e: React.PointerEvent) => {
    updateColorFromHue(e);
    const handleHueMove = (e: PointerEvent) => updateColorFromHue(e);
    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handleHueMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
    document.addEventListener('pointermove', handleHueMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const addToQueue = (item: QueueItem) => {
    setQueue(prev => [...prev, item]);
  };

  const clearQueue = () => setQueue([]);

  const handleSave = () => {
    onSave(queue);
    onClose();
    clearQueue();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100000]"
        >
          <div className="absolute inset-0 bg-slate-900/60" onClick={onClose}></div>
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh] pointer-events-auto"
            >
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add Styles</h2>
            <p className="text-xs text-slate-500 mt-0.5">Customize and queue elements for your moodboard</p>
          </div>
          <div className="flex items-center gap-4">
            {queue.length > 0 && (
              <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 flex items-center gap-2 animate-in slide-in-from-right-4">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                {queue.length} Items in Queue
              </div>
            )}
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          
          {/* Left Panel: Typography */}
          <div className="w-full md:w-[30%] p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-100 flex flex-col gap-6 bg-white">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">text_fields</span>
                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Typography</h3>
              </div>
              <button 
                onClick={() => addToQueue({ type: 'typography', font: fontFamily, weight: fontWeight, italic: isItalic })}
                className="text-primary hover:bg-blue-50 p-1 rounded transition-colors" 
                title="Add to Queue"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Font Family</label>
                <div className="relative">
                  <select 
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-primary focus:border-primary appearance-none font-medium outline-none"
                  >
                    <option>Inter</option>
                    <option>Playfair Display</option>
                    <option>Roboto</option>
                    <option>Montserrat</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Weight</label>
                <div className="flex gap-2">
                  {['Regular', 'Bold', 'Italic'].map((w) => (
                    <button
                      key={w}
                      onClick={() => w === 'Italic' ? setIsItalic(!isItalic) : setFontWeight(w)}
                      className={`flex-1 py-2 px-2 border rounded-lg text-xs transition-all ${
                        (w === 'Italic' && isItalic) || (w !== 'Italic' && fontWeight === w)
                          ? 'border-primary bg-blue-50 text-primary font-bold shadow-sm'
                          : 'border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300'
                      } ${w === 'Italic' ? 'italic font-black' : ''}`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div 
                  className="bg-slate-50 rounded-xl p-4 border border-slate-100 min-h-[140px] flex flex-col justify-center relative group cursor-pointer hover:border-blue-200 transition-colors"
                  style={{ fontFamily: fontFamily }}
                >
                  <h1 className={`text-3xl mb-1 ${fontWeight === 'Bold' ? 'font-bold' : 'font-normal'} ${isItalic ? 'italic' : ''}`}>Ag</h1>
                  <p className={`text-sm text-slate-600 leading-snug ${fontWeight === 'Bold' ? 'font-bold' : 'font-normal'} ${isItalic ? 'italic' : ''}`}>
                    The quick brown fox jumps over the lazy dog.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel: Color Palette */}
          <div className="w-full md:w-[35%] flex flex-col bg-slate-50/50 overflow-hidden border-r border-slate-100">
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">palette</span>
                  <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Color Palette</h3>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700">Saved Colors</label>
                    <span className="text-[10px] text-primary font-bold cursor-pointer hover:underline">View All</span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-2">Active Project</p>
                    <div className="flex gap-2 flex-wrap">
                      {ACTIVE_PROJECT_COLORS.map(c => (
                        <button 
                          key={c}
                          onClick={() => addToQueue({ type: 'color', value: c })}
                          className="w-9 h-9 rounded-full ring-2 ring-offset-2 ring-transparent hover:ring-slate-200 transition-all shadow-sm relative group"
                          style={{ backgroundColor: c }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 rounded-full transition-opacity">
                            <span className="material-symbols-outlined text-white text-xs">add</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-2">Secondary Accents</p>
                    <div className="flex gap-2 flex-wrap">
                      {SECONDARY_ACCENTS.map(c => (
                        <button 
                          key={c}
                          onClick={() => addToQueue({ type: 'color', value: c })}
                          className="w-8 h-8 rounded-full ring-2 ring-offset-2 ring-transparent hover:ring-slate-200 transition-all group relative"
                          style={{ backgroundColor: c }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 rounded-full transition-opacity">
                            <span className="material-symbols-outlined text-white text-xs">add</span>
                          </span>
                        </button>
                      ))}
                      <button className="w-8 h-8 rounded-full bg-transparent border-2 border-dashed border-slate-300 text-slate-400 flex items-center justify-center hover:border-slate-400 hover:text-slate-500 transition-all">
                        <span className="material-symbols-outlined text-xs">add</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Suggested Palettes</label>
                  <div className="space-y-2">
                    {SUGGESTED_PALETTES.map(p => (
                      <div 
                        key={p.name}
                        onClick={() => p.colors.forEach(c => addToQueue({ type: 'color', value: c }))}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">{p.name}</span>
                          <span className="material-symbols-outlined text-slate-300 text-sm group-hover:text-blue-500 transition-colors">add_circle</span>
                        </div>
                        <div className="flex h-5 w-full rounded-md overflow-hidden">
                          {p.colors.map(c => (
                            <div key={c} className="flex-1" style={{ backgroundColor: c }}></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Custom Color Mixer */}
          <div className="w-full md:w-[35%] p-6 overflow-y-auto bg-white flex flex-col h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">tune</span>
                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Custom Color</h3>
              </div>
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                <button 
                  onClick={() => setInputMode('HSL')}
                  className={`p-1 rounded text-[10px] font-bold px-2 transition-all ${inputMode === 'HSL' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  HSL
                </button>
                <button 
                  onClick={() => setInputMode('RGB')}
                  className={`p-1 rounded text-[10px] font-bold px-2 transition-all ${inputMode === 'RGB' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  RGB
                </button>
                <button 
                  onClick={() => setInputMode('CMYK')}
                  className={`p-1 rounded text-[10px] font-bold px-2 transition-all ${inputMode === 'CMYK' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  CMYK
                </button>
              </div>
            </div>

            <div className="space-y-5 flex-1">
              <div className="flex gap-4 h-48">
                {/* Saturation/Brightness Map */}
                <div 
                  ref={slMapRef}
                  onPointerDown={onSLPointerDown}
                  className="relative flex-1 rounded-xl shadow-inner border border-slate-200 overflow-hidden cursor-crosshair group touch-none"
                  style={{ 
                    background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, transparent), hsl(${hue}, 100%, 50%)`,
                  }}
                >
                  <div 
                    className="absolute w-5 h-5 bg-transparent border-[2.5px] border-white rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.15),inset_0_0_0_1px_rgba(0,0,0,0.15)] pointer-events-none"
                    style={{ 
                      top: `${(1 - (lightness/100 + (saturation/100) * Math.min(lightness/100, 1 - lightness/100))) * 100}%`, 
                      left: `${((lightness/100 + (saturation/100) * Math.min(lightness/100, 1 - lightness/100)) === 0 ? 0 : 2 * (1 - (lightness/100) / (lightness/100 + (saturation/100) * Math.min(lightness/100, 1 - lightness/100)))) * 100}%`, 
                      transform: 'translate(-50%, -50%)' 
                    }}
                  ></div>
                </div>
                {/* Hue Slider */}
                <div 
                  ref={hueSliderRef}
                  onPointerDown={onHuePointerDown}
                  className="relative w-5 cursor-ns-resize touch-none ml-1"
                >
                  <div className="absolute inset-0 rounded-full shadow-inner border border-slate-200 overflow-hidden" style={{ 
                    background: 'linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                  }}></div>
                  <div 
                    className="absolute left-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ top: `${(hue / 360) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl border-2 border-white shadow-md ring-1 ring-slate-100 shrink-0 transition-colors"
                  style={{ backgroundColor: hex }}
                ></div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Hex</label>
                    <span className="text-[10px] text-slate-400">100%</span>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-slate-50 border border-r-0 border-slate-200 text-slate-400 px-2.5 py-2 rounded-l-lg font-mono text-xs">#</span>
                    <input 
                      className="w-full border-l-0 border-slate-200 bg-slate-50 rounded-r-lg py-2 px-2 text-slate-700 font-mono focus:ring-primary focus:border-primary text-xs uppercase font-bold outline-none" 
                      type="text" 
                      value={hex.replace('#', '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHex(`#${val}`);
                        if (val.length === 3 || val.length === 6) {
                          const { h, s, l } = hexToHsl(`#${val}`);
                          setHue(h);
                          setSaturation(s);
                          setLightness(l);
                        }
                      }}
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className={`grid ${inputMode === 'CMYK' ? 'grid-cols-4' : 'grid-cols-3'} gap-2`}>
                {inputMode === 'HSL' ? [
                  { label: 'Hue', value: Math.round(hue), key: 'h' },
                  { label: 'Sat', value: Math.round(saturation), key: 's' },
                  { label: 'Light', value: Math.round(lightness), key: 'l' }
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-center relative">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{stat.label}</span>
                    <input 
                      className="w-full bg-transparent text-center font-mono text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-primary rounded"
                      type="number"
                      value={stat.value}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(stat.key === 'h' ? 360 : 100, parseInt(e.target.value) || 0));
                        if (stat.key === 'h') setHue(val);
                        if (stat.key === 's') setSaturation(val);
                        if (stat.key === 'l') setLightness(val);
                        const newH = stat.key === 'h' ? val : hue;
                        const newS = stat.key === 's' ? val : saturation;
                        const newL = stat.key === 'l' ? val : lightness;
                        setHex(hslToHex(newH, newS, newL));
                      }}
                    />
                    <span className="absolute right-2 bottom-2 text-[8px] text-slate-400 pointer-events-none">{stat.key === 'h' ? '°' : '%'}</span>
                  </div>
                )) : inputMode === 'RGB' ? [
                  { label: 'R', value: hex.length === 4 ? parseInt(hex[1] + hex[1], 16) : parseInt(hex.slice(1, 3) || '0', 16) },
                  { label: 'G', value: hex.length === 4 ? parseInt(hex[2] + hex[2], 16) : parseInt(hex.slice(3, 5) || '0', 16) },
                  { label: 'B', value: hex.length === 4 ? parseInt(hex[3] + hex[3], 16) : parseInt(hex.slice(5, 7) || '0', 16) }
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-center">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{stat.label}</span>
                    <input 
                      className="w-full bg-transparent text-center font-mono text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-primary rounded"
                      type="number"
                      value={Number.isNaN(stat.value) ? 0 : stat.value}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                        let r = hex.length === 4 ? parseInt(hex[1] + hex[1], 16) : parseInt(hex.slice(1, 3), 16) || 0;
                        let g = hex.length === 4 ? parseInt(hex[2] + hex[2], 16) : parseInt(hex.slice(3, 5), 16) || 0;
                        let b = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) : parseInt(hex.slice(5, 7), 16) || 0;
                        if (stat.label === 'R') r = val;
                        if (stat.label === 'G') g = val;
                        if (stat.label === 'B') b = val;
                        const newHex = rgbToHex(r, g, b);
                        setHex(newHex);
                        const { h, s, l } = hexToHsl(newHex);
                        setHue(h);
                        setSaturation(s);
                        setLightness(l);
                      }}
                    />
                  </div>
                )) : (() => {
                  const cmyk = hexToCmyk(hex);
                  return [
                    { label: 'C', value: cmyk.c, key: 'c' },
                    { label: 'M', value: cmyk.m, key: 'm' },
                    { label: 'Y', value: cmyk.y, key: 'y' },
                    { label: 'K', value: cmyk.k, key: 'k' }
                  ].map(stat => (
                    <div key={stat.label} className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-center relative">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{stat.label}</span>
                      <input 
                        className="w-full bg-transparent text-center font-mono text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-primary rounded"
                        type="number"
                        value={stat.value}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                          const newCmyk = { ...cmyk, [stat.key]: val };
                          const newHex = cmykToHex(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
                          setHex(newHex);
                          const { h, s, l } = hexToHsl(newHex);
                          setHue(h);
                          setSaturation(s);
                          setLightness(l);
                        }}
                      />
                      <span className="absolute right-1 bottom-2 text-[8px] text-slate-400 pointer-events-none">%</span>
                    </div>
                  ));
                })()}
              </div>

              <button 
                onClick={() => addToQueue({ type: 'color', value: hex })}
                className="w-full py-2.5 border border-primary text-primary bg-blue-50/50 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mt-auto"
              >
                <span className="material-symbols-outlined text-base">queue</span>
                Queue Custom Color
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Dynamic Queue Preview */}
        <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-500">Current Queue:</span>
            
            {/* Dynamic Preview Box */}
            <div className="relative w-24 h-10 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 transition-all duration-300 group">
              {queue.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">Empty</div>
              ) : (
                <div className="w-full h-full flex transition-all duration-300">
                  {queue.length === 1 ? (
                    <PreviewItem item={queue[0]} style={{ width: '100%' }} />
                  ) : queue.length === 2 ? (
                    <>
                      <PreviewItem item={queue[0]} style={{ width: '50%' }} />
                      <PreviewItem item={queue[1]} style={{ width: '50%' }} />
                    </>
                  ) : (
                    <>
                      {/* Primary (First Item) takes 60% */}
                      <PreviewItem item={queue[0]} style={{ width: '60%' }} />
                      <div className="flex flex-col flex-1">
                        {queue.slice(1).map((item, idx) => (
                          <PreviewItem 
                            key={idx} 
                            item={item} 
                            style={{ height: `${100 / (queue.length - 1)}%`, width: '100%' }} 
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <button 
              onClick={clearQueue}
              className="text-xs text-slate-400 hover:text-slate-600 underline decoration-slate-300 hover:decoration-slate-500"
            >
              Clear
            </button>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={queue.length === 0}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2 ${
                queue.length > 0 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-blue-600 hover:shadow-blue-600/30' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-lg">check</span>
              Save {queue.length} Items to Moodboard
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  </motion.div>
  )}
  </AnimatePresence>
);
};

const PreviewItem: React.FC<{ item: QueueItem; style: React.CSSProperties }> = ({ item, style }) => {
  if (item.type === 'color') {
    return (
      <div 
        className="transition-all duration-300 border-r border-white/10 last:border-0" 
        style={{ ...style, backgroundColor: item.value }} 
      />
    );
  }
  
  return (
    <div 
      className="bg-white flex items-center justify-center transition-all duration-300 border-r border-slate-100 last:border-0 overflow-hidden" 
      style={style}
    >
      <span className="text-[10px] font-serif font-bold text-slate-800">Ag</span>
    </div>
  );
};
