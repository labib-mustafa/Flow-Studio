import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePromptStore } from '../../stores/promptStore';

export const PromptModal: React.FC = () => {
  const { isOpen, options, closePrompt } = usePromptStore();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && options) {
      setValue(options.defaultValue || '');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, options]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    closePrompt(value);
  };

  const handleCancel = () => {
    closePrompt(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && options && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Frosted Apple Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="relative w-full max-w-[420px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] p-6 z-10 font-sans"
          >
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{options.title}</h3>
            {options.description && (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{options.description}</p>
            )}

            <form onSubmit={handleSubmit} className="mt-4">
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={options.placeholder || ''}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-slate-900 transition-all"
              />

              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  {options.cancelText || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all shadow-sm shadow-blue-600/25 cursor-pointer"
                >
                  {options.confirmText || 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
