import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, RefreshCw, X } from 'lucide-react';
import { useToastStore, ToastItem, toast as toastHelper } from '../../stores/toastStore';

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999999] flex flex-col gap-2.5 w-full max-w-[380px] pointer-events-none overflow-visible select-none">
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((toastItem) => (
          <ToastCard key={toastItem.id} toast={toastItem} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem }> = ({ toast }) => {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Progress bar animation
    const progressTimer = setTimeout(() => {
      if (progressRef.current) {
        progressRef.current.style.width = '0%';
      }
    }, 30);

    return () => {
      clearTimeout(progressTimer);
    };
  }, [toast.id, toast.duration]);

  let badgeStyle = '';
  let IconComponent = CheckCircle2;
  let progressBg = '';
  let isSpin = false;

  switch (toast.type) {
    case 'success':
      badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-200/60';
      IconComponent = CheckCircle2;
      progressBg = 'bg-emerald-500';
      break;
    case 'error':
      badgeStyle = 'bg-rose-50 text-rose-600 border-rose-200/60';
      IconComponent = AlertCircle;
      progressBg = 'bg-rose-500';
      break;
    case 'warning':
      badgeStyle = 'bg-amber-50 text-amber-600 border-amber-200/60';
      IconComponent = AlertTriangle;
      progressBg = 'bg-amber-500';
      break;
    case 'info':
      badgeStyle = 'bg-sky-50 text-sky-600 border-sky-200/60';
      IconComponent = Info;
      progressBg = 'bg-sky-500';
      break;
    case 'sync':
      badgeStyle = 'bg-indigo-50 text-indigo-600 border-indigo-200/60';
      IconComponent = RefreshCw;
      progressBg = 'bg-indigo-500';
      isSpin = true;
      break;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.94 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="w-full pointer-events-auto"
      style={{ transformZ: 0 }}
    >
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-900/5 p-3.5 flex flex-col w-full relative overflow-hidden group">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 p-2 rounded-xl border ${badgeStyle} flex items-center justify-center`}>
            <IconComponent className={`size-4 ${isSpin ? 'animate-spin' : ''}`} />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h4 className="text-xs font-bold text-slate-900 leading-snug tracking-tight">{toast.title}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">{toast.message}</p>
            {toast.actionText && (
              <button
                onClick={() => {
                  if (toast.onAction) toast.onAction();
                  toastHelper.dismiss(toast.id);
                }}
                className="mt-2.5 px-3 py-1 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-[10px] font-semibold transition-colors focus:outline-none shadow-sm"
              >
                {toast.actionText}
              </button>
            )}
          </div>

          <button
            onClick={() => toastHelper.dismiss(toast.id)}
            className="shrink-0 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all focus:outline-none"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Auto-dismiss progress bar */}
        <div
          ref={progressRef}
          className={`absolute bottom-0 left-0 h-0.5 ${progressBg} w-full transition-all ease-linear rounded-b-2xl`}
          style={{ transitionDuration: `${toast.duration}ms` }}
        />
      </div>
    </motion.div>
  );
};
