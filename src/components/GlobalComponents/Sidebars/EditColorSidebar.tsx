import React, { useState, useEffect, useRef, useCallback } from 'react';

interface EditColorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialColor?: string;
  initialBorderColor?: string;
  initialBorderWidth?: number;
  showBorderToggle?: boolean;
  onSave: (color: string, target: 'fill' | 'border', borderWidth?: number) => void;
  onChange?: (color: string, target: 'fill' | 'border', borderWidth?: number) => void;
}

// Helper functions for color conversion
const hexToHsv = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt('0x' + hex[1] + hex[1]);
    g = parseInt('0x' + hex[2] + hex[2]);
    b = parseInt('0x' + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt('0x' + hex[1] + hex[2]);
    g = parseInt('0x' + hex[3] + hex[4]);
    b = parseInt('0x' + hex[5] + hex[6]);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToHex = (h: number, s: number, v: number) => {
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h / 60);
  const f = h / 60 - i;
  const p = v * (1 - s / 100);
  const q = v * (1 - f * s / 100);
  const t = v * (1 - (1 - f) * s / 100);
  const v_ = v; // v is in 0-100, need to normalize later? No, v is 0-100.

  // Wait, standard algorithm assumes s, v in 0-1.
  const s_ = s / 100;
  const v__ = v / 100;

  const i_ = Math.floor(h / 60);
  const f_ = h / 60 - i_;
  const p_ = v__ * (1 - s_);
  const q_ = v__ * (1 - f_ * s_);
  const t_ = v__ * (1 - (1 - f_) * s_);

  switch (i_ % 6) {
    case 0: r = v__; g = t_; b = p_; break;
    case 1: r = q_; g = v__; b = p_; break;
    case 2: r = p_; g = v__; b = t_; break;
    case 3: r = p_; g = q_; b = v__; break;
    case 4: r = t_; g = p_; b = v__; break;
    case 5: r = v__; g = p_; b = q_; break;
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export const EditColorSidebar: React.FC<EditColorSidebarProps> = ({ isOpen, onClose, initialColor = '#1978E5', initialBorderColor = '#000000', initialBorderWidth = 2, showBorderToggle = false, onSave, onChange }) => {
  const [activeTarget, setActiveTarget] = useState<'fill' | 'border'>('fill');
  const [inputMode, setInputMode] = useState<'HSV' | 'RGB' | 'CMYK'>('HSV');

  const [fillHsv, setFillHsv] = useState({ h: 212, s: 80, v: 90 });
  const [fillHex, setFillHex] = useState(initialColor.replace('#', ''));

  const [borderHsv, setBorderHsv] = useState({ h: 0, s: 0, v: 0 });
  const [borderHex, setBorderHex] = useState(initialBorderColor.replace('#', ''));

  const [borderWidth, setBorderWidth] = useState(initialBorderWidth);

  const hsv = activeTarget === 'fill' ? fillHsv : borderHsv;
  const hex = activeTarget === 'fill' ? fillHex : borderHex;
  const setHsv = activeTarget === 'fill' ? setFillHsv : setBorderHsv;
  const setHex = activeTarget === 'fill' ? setFillHex : setBorderHex;

  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const isDraggingSaturation = useRef(false);
  const isDraggingHue = useRef(false);
  const hsvRef = useRef(hsv);

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

  // Keep hsvRef in sync with hsv state
  useEffect(() => {
    hsvRef.current = hsv;
  }, [hsv]);

  useEffect(() => {
    if (isOpen) {
      const newFillHsv = hexToHsv(initialColor);
      setFillHsv(newFillHsv);
      setFillHex(initialColor.replace('#', ''));

      const newBorderHsv = hexToHsv(initialBorderColor);
      setBorderHsv(newBorderHsv);
      setBorderHex(initialBorderColor.replace('#', ''));
      setBorderWidth(initialBorderWidth);

      setActiveTarget('fill');
    }
  }, [isOpen, initialColor, initialBorderColor, initialBorderWidth]);

  const updateColorFromHsv = (newHsv: { h: number, s: number, v: number }) => {
    setHsv(newHsv);
    const newHex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    const hexString = newHex.replace('#', '');
    setHex(hexString);
    if (onChange) {
      onChange(newHex, activeTarget, activeTarget === 'border' ? borderWidth : undefined);
    }
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHex(val);
    if (val.length === 6) {
      const newHsv = hexToHsv(`#${val}`);
      setHsv(newHsv);
      if (onChange) {
        onChange(`#${val}`, activeTarget, activeTarget === 'border' ? borderWidth : undefined);
      }
    }
  };

  const handleBorderWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setBorderWidth(val);
      if (onChange) {
        onChange(`#${hex}`, 'border', val);
      }
    }
  };

  const handleSave = () => {
    onSave(`#${hex}`, activeTarget, activeTarget === 'border' ? borderWidth : undefined);
    onClose();
  };

  // Drag Logic
  const latestChange = useRef<{ hex: string, target: 'fill' | 'border', width?: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const throttledOnChange = useCallback((hex: string, target: 'fill' | 'border', width?: number) => {
    if (!onChange) return;
    latestChange.current = { hex, target, width };

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        if (latestChange.current) {
          onChange(latestChange.current.hex, latestChange.current.target, latestChange.current.width);
        }
        rafRef.current = null;
      });
    }
  }, [onChange]);

  const handleSaturationMove = useCallback((e: PointerEvent) => {
    if (!saturationRef.current) return;
    const { left, top, width, height } = saturationRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - left) / width));
    const y = Math.max(0, Math.min(1, (e.clientY - top) / height));

    // Use ref to get latest state without dependency
    const currentHsv = hsvRef.current;
    const newHsv = { ...currentHsv, s: x * 100, v: (1 - y) * 100 };

    setHsv(newHsv);

    const newHex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    const hexString = newHex.replace('#', '');
    setHex(hexString);

    throttledOnChange(newHex, activeTarget, activeTarget === 'border' ? borderWidth : undefined);
  }, [throttledOnChange, activeTarget, borderWidth]);

  const handleHueMove = useCallback((e: PointerEvent) => {
    if (!hueRef.current) return;
    const { top, height } = hueRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(1, (e.clientY - top) / height));

    // Use ref to get latest state without dependency
    const currentHsv = hsvRef.current;
    const newHsv = { ...currentHsv, h: y * 360 };

    setHsv(newHsv);

    const newHex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    const hexString = newHex.replace('#', '');
    setHex(hexString);

    throttledOnChange(newHex, activeTarget, activeTarget === 'border' ? borderWidth : undefined);
  }, [throttledOnChange, activeTarget, borderWidth]);

  const handleMouseUp = useCallback(() => {
    isDraggingSaturation.current = false;
    isDraggingHue.current = false;
    window.removeEventListener('pointermove', handleSaturationMove);
    window.removeEventListener('pointermove', handleHueMove);
    window.removeEventListener('pointerup', handleMouseUp);
  }, [handleSaturationMove, handleHueMove]);

  const startDraggingSaturation = (e: React.PointerEvent) => {
    isDraggingSaturation.current = true;
    handleSaturationMove(e.nativeEvent);
    window.addEventListener('pointermove', handleSaturationMove);
    window.addEventListener('pointerup', handleMouseUp);
  };

  const startDraggingHue = (e: React.PointerEvent) => {
    isDraggingHue.current = true;
    handleHueMove(e.nativeEvent);
    window.addEventListener('pointermove', handleHueMove);
    window.addEventListener('pointerup', handleMouseUp);
  };

  // Presets
  const handlePresetClick = (presetHex: string) => {
    const newHsv = hexToHsv(presetHex);
    updateColorFromHsv(newHsv);
  };

  return (
    <div
      className={`absolute inset-y-0 right-0 z-40 flex max-w-full pointer-events-none transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="w-80 pointer-events-auto h-full no-pan" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <div className="bg-white w-full h-full shadow-2xl flex flex-col border-l border-slate-200">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
            <h2 className="text-xl font-bold text-slate-900">Edit Color</h2>
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setInputMode('HSV')}
                className={`p-1 rounded text-[10px] font-bold px-2 transition-all ${inputMode === 'HSV' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                HSV
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
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-50 ml-4"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {showBorderToggle && (
              <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
                <button
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTarget === 'fill' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTarget('fill')}
                >
                  Fill
                </button>
                <button
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTarget === 'border' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTarget('border')}
                >
                  Border
                </button>
              </div>
            )}
            <div className="flex gap-4 mb-6 h-56 select-none">
              {/* Saturation/Value Box */}
              <div
                ref={saturationRef}
                className="flex-1 rounded-xl relative overflow-hidden cursor-crosshair shadow-inner border border-slate-200 touch-none"
                style={{
                  backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
                }}
                onPointerDown={startDraggingSaturation}
              >
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, rgba(255,255,255,0))' }}></div>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, rgba(0,0,0,0))' }}></div>
                <div
                  className="absolute w-5 h-5 bg-transparent border-[2.5px] border-white rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.15),inset_0_0_0_1px_rgba(0,0,0,0.15)] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
                ></div>
              </div>

              {/* Hue Slider */}
              <div
                ref={hueRef}
                className="w-5 relative cursor-ns-resize touch-none ml-1"
                onPointerDown={startDraggingHue}
              >
                <div className="absolute inset-0 rounded-full shadow-inner border border-slate-200 overflow-hidden" style={{
                  background: 'linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                }}></div>
                <div
                  className="absolute left-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ top: `${(hsv.h / 360) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl border-2 border-white shadow-md ring-1 ring-slate-100 shrink-0 transition-colors"
                  style={{ backgroundColor: `#${hex}` }}
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
                      value={hex}
                      onChange={handleHexChange}
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className={`grid gap-3 ${inputMode === 'CMYK' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                {inputMode === 'HSV' && (
                  <>
                    {['h', 's', 'v'].map((key) => (
                      <div key={key}>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">{key}</label>
                        <div className="relative">
                          <input
                            className="w-full border border-slate-200 rounded-lg px-2 py-2.5 text-center text-sm font-mono text-slate-700 bg-slate-50 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            type="number"
                            value={Math.round(hsv[key as keyof typeof hsv])}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(key === 'h' ? 360 : 100, parseInt(e.target.value) || 0));
                              const newHsv = { ...hsv, [key]: val };
                              updateColorFromHsv(newHsv);
                            }}
                          />
                          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none">{key === 'h' ? '°' : '%'}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {inputMode === 'RGB' && (
                  <>
                    {['R', 'G', 'B'].map((label, i) => {
                      const hexStr = `#${hex}`;
                      const val = hexStr.length === 4
                        ? parseInt(hexStr[i + 1] + hexStr[i + 1], 16)
                        : parseInt(hexStr.slice(1 + i * 2, 3 + i * 2), 16) || 0;
                      return (
                        <div key={label}>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">{label}</label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-2 py-2.5 text-center text-sm font-mono text-slate-700 bg-slate-50 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            type="number"
                            value={val}
                            onChange={(e) => {
                              const newVal = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                              const hexStr = `#${hex}`;
                              let r = hexStr.length === 4 ? parseInt(hexStr[1] + hexStr[1], 16) : parseInt(hexStr.slice(1, 3), 16) || 0;
                              let g = hexStr.length === 4 ? parseInt(hexStr[2] + hexStr[2], 16) : parseInt(hexStr.slice(3, 5), 16) || 0;
                              let b = hexStr.length === 4 ? parseInt(hexStr[3] + hexStr[3], 16) : parseInt(hexStr.slice(5, 7), 16) || 0;
                              if (label === 'R') r = newVal;
                              if (label === 'G') g = newVal;
                              if (label === 'B') b = newVal;
                              const newHex = rgbToHex(r, g, b);
                              setHex(newHex.replace('#', ''));
                              setHsv(hexToHsv(newHex));
                              if (onChange) onChange(newHex, activeTarget, activeTarget === 'border' ? borderWidth : undefined);
                            }}
                          />
                        </div>
                      );
                    })}
                  </>
                )}

                {inputMode === 'CMYK' && (
                  <>
                    {['C', 'M', 'Y', 'K'].map((label) => {
                      const cmyk = hexToCmyk(`#${hex}`);
                      return (
                        <div key={label}>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">{label}</label>
                          <div className="relative">
                            <input
                              className="w-full border border-slate-200 rounded-lg px-1 py-2.5 text-center text-sm font-mono text-slate-700 bg-slate-50 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                              type="number"
                              value={cmyk[label.toLowerCase() as keyof typeof cmyk]}
                              onChange={(e) => {
                                const newVal = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                const newCmyk = { ...cmyk, [label.toLowerCase()]: newVal };
                                const newHex = cmykToHex(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
                                setHex(newHex.replace('#', ''));
                                setHsv(hexToHsv(newHex));
                                if (onChange) onChange(newHex, activeTarget, activeTarget === 'border' ? borderWidth : undefined);
                              }}
                            />
                            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 text-[8px] pointer-events-none">%</span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            {activeTarget === 'border' && showBorderToggle && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Border Width</label>
                  <span className="text-xs font-mono text-slate-600">{borderWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={borderWidth}
                  onChange={handleBorderWidthChange}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            )}

            <div className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent Colors</label>
                <button className="text-[10px] font-bold text-primary hover:underline">Clear</button>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => handlePresetClick('#0f172a')}
                  className="group w-9 h-9 rounded-full bg-[#0f172a] hover:scale-110 transition-transform ring-1 ring-slate-100 ring-offset-2 ring-offset-white relative"
                >
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Navy</span>
                </button>
                <button
                  onClick={() => handlePresetClick('#ef4444')}
                  className="w-9 h-9 rounded-full bg-[#ef4444] hover:scale-110 transition-transform ring-1 ring-slate-100 ring-offset-2 ring-offset-white"
                ></button>
                <button
                  onClick={() => handlePresetClick('#22c55e')}
                  className="w-9 h-9 rounded-full bg-[#22c55e] hover:scale-110 transition-transform ring-1 ring-slate-100 ring-offset-2 ring-offset-white"
                ></button>
                <button
                  onClick={() => handlePresetClick('#f59e0b')}
                  className="w-9 h-9 rounded-full bg-[#f59e0b] hover:scale-110 transition-transform ring-1 ring-slate-100 ring-offset-2 ring-offset-white"
                ></button>
                <button
                  onClick={() => handlePresetClick('#64748b')}
                  className="w-9 h-9 rounded-full bg-[#64748b] hover:scale-110 transition-transform ring-1 ring-slate-100 ring-offset-2 ring-offset-white"
                ></button>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-white z-10">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-[2] py-3 px-4 bg-black text-white rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Save Changes</span>
                <span className="material-symbols-outlined text-[18px]">check</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
