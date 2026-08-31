import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, AlertTriangle, HelpCircle, Info, X } from 'lucide-react';
import { useConfirmStore } from '../../stores/confirmStore';

export const ConfirmDialogModal: React.FC = () => {
  const { isOpen, options, closeConfirm } = useConfirmStore();
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (isOpen && options?.delaySeconds) {
      setCountdown(options.delaySeconds);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setCountdown(0);
    }
  }, [isOpen, options?.delaySeconds]);

  if (!isOpen || !options) return null;

  const { title, message, type = 'default', confirmText, cancelText = 'Cancel' } = options;

  let IconComponent = HelpCircle;
  let iconBg = 'bg-slate-100 text-slate-700 border-slate-200';
  let primaryBtnClass = 'bg-slate-950 hover:bg-slate-900 text-white';
  let defaultConfirmText = 'Confirm';

  switch (type) {
    case 'danger':
      IconComponent = AlertCircle;
      iconBg = 'bg-rose-50 text-rose-600 border-rose-200/60';
      primaryBtnClass = 'bg-rose-600 hover:bg-rose-700 text-white';
      defaultConfirmText = 'Confirm Delete';
      break;
    case 'warning':
      IconComponent = AlertTriangle;
      iconBg = 'bg-amber-50 text-amber-600 border-amber-200/60';
      primaryBtnClass = 'bg-amber-600 hover:bg-amber-700 text-white';
      defaultConfirmText = 'Confirm';
      break;
    case 'info':
      IconComponent = Info;
      iconBg = 'bg-sky-50 text-sky-600 border-sky-200/60';
      primaryBtnClass = 'bg-sky-600 hover:bg-sky-700 text-white';
      defaultConfirmText = 'Continue';
      break;
  }

  const isBtnDisabled = countdown > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => closeConfirm(false)}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white/95 backdrop-blur-xl w-full max-w-[420px] rounded-3xl p-6 shadow-2xl border border-slate-200/90 z-10 overflow-hidden"
        >
          <div className="flex items-start gap-4">
            <div className={`p-2.5 rounded-2xl border ${iconBg} shrink-0 flex items-center justify-center`}>
              <IconComponent className="size-5" />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">{title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">{message}</p>
            </div>

            <button
              onClick={() => closeConfirm(false)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5 mt-6 pt-2">
            <button
              onClick={() => closeConfirm(false)}
              className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all focus:outline-none"
            >
              {cancelText}
            </button>
            <button
              disabled={isBtnDisabled}
              onClick={() => closeConfirm(true)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm focus:outline-none flex items-center gap-1.5 ${primaryBtnClass} ${
                isBtnDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isBtnDisabled
                ? `Confirm (${countdown}s)`
                : confirmText || defaultConfirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
