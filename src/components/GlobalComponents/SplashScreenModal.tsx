import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize2, RefreshCcw, Eye, Sliders, Check } from 'lucide-react';

interface SplashScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SplashScreenModal: React.FC<SplashScreenModalProps> = ({ isOpen, onClose }) => {
  const [cardWidth, setCardWidth] = useState(720);
  const [cardHeight, setCardHeight] = useState(480);
  const [scale, setScale] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const resetDefaults = () => {
    setCardWidth(720);
    setCardHeight(480);
    setScale(100);
  };

  const saveDimensions = () => {
    // Perform save API call or local update
    try {
      fetch('/api/dev/splash-dimensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ width: cardWidth, height: cardHeight, scale })
      }).catch(() => {});
    } catch (_) {}
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-auto custom-scrollbar select-none"
      >
        {/* Floating Top Control Toolbar */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-5 z-[1000000] bg-slate-900/90 text-white px-5 py-3 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center gap-6 backdrop-blur-lg"
        >
          <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
            <Sliders size={16} className="text-blue-400" />
            <span>Splash Screen Fine-Tuner</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Width Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Width:</span>
            <input
              type="range"
              min="700"
              max="1300"
              step="10"
              value={cardWidth}
              onChange={(e) => setCardWidth(Number(e.target.value))}
              className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <input
              type="number"
              value={cardWidth}
              onChange={(e) => setCardWidth(Number(e.target.value))}
              className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-center font-mono font-bold focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-slate-400">px</span>
          </div>

          {/* Height Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Height:</span>
            <input
              type="range"
              min="450"
              max="900"
              step="10"
              value={cardHeight}
              onChange={(e) => setCardHeight(Number(e.target.value))}
              className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <input
              type="number"
              value={cardHeight}
              onChange={(e) => setCardHeight(Number(e.target.value))}
              className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-center font-mono font-bold focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-slate-400">px</span>
          </div>

          {/* Scale Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Scale:</span>
            <input
              type="range"
              min="50"
              max="130"
              step="5"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-xs font-mono font-bold text-slate-300 w-10 text-right">{scale}%</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={resetDefaults}
              title="Reset to 720x480"
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCcw size={15} />
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <X size={14} /> Close
            </button>
          </div>
        </motion.div>

        {/* Scaled Splash Card Container */}
        <div
          className="transition-all duration-150 flex items-center justify-center my-auto"
          style={{ transform: `scale(${scale / 100})`, transformOrigin: 'center center' }}
        >
          <iframe
            src="/splash.html"
            style={{
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              border: 'none',
              borderRadius: '32px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            className="bg-white rounded-[32px] overflow-hidden"
            title="Splash Screen Preview"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
