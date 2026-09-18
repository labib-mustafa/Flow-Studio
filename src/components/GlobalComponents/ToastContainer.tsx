import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, RefreshCw, X } from 'lucide-react';
import { useToastStore, ToastItem, toast as toastHelper } from '../../stores/toastStore';

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      id="flow-toast-container"
      className="fixed bottom-6 right-6 z-[999999] flex flex-col gap-2.5 w-full max-w-[380px] pointer-events-none overflow-visible select-none"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((toastItem) => (
          <ToastCard key={toastItem.id} toast={toastItem} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem }> = ({ toast }) => {
  const [isPaused, setIsPaused] = useState(false);
  const remainingTimeRef = useRef<number>(toast.duration || 4000);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    toastHelper.dismiss(toast.id);
  }, [toast.id]);

  useEffect(() => {
    if (isPaused) {
      // Freeze progress bar and record remaining elapsed duration
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      if (progressRef.current) {
        const computedWidth = window.getComputedStyle(progressRef.current).width;
        progressRef.current.style.transition = 'none';
        progressRef.current.style.width = computedWidth;
      }
      return;
    }

    const remaining = remainingTimeRef.current;
    if (remaining <= 0) {
      dismiss();
      return;
    }

    startTimeRef.current = Date.now();

    // Kick off CSS progress animation for remaining time
    const animFrame = requestAnimationFrame(() => {
      if (progressRef.current) {
        progressRef.current.style.transition = `width ${remaining}ms linear`;
        progressRef.current.style.width = '0%';
      }
    });

    // Set auto-dismiss timer
    timerRef.current = setTimeout(() => {
      dismiss();
    }, remaining);

    return () => {
      cancelAnimationFrame(animFrame);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, dismiss]);

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
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.1, right: 0.7 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 80 || info.velocity.x > 250) {
          dismiss();
        }
      }}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.92, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }}
      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="w-full pointer-events-auto cursor-grab active:cursor-grabbing"
      style={{
        transform: 'translateZ(0)',
        willChange: 'transform, opacity',
      }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  if (toast.onAction) toast.onAction();
                  dismiss();
                }}
                className="mt-2.5 px-3 py-1 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-[10px] font-semibold transition-colors focus:outline-none shadow-sm cursor-pointer"
              >
                {toast.actionText}
              </button>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            className="shrink-0 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all focus:outline-none cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Auto-dismiss progress bar */}
        <div
          ref={progressRef}
          className={`absolute bottom-0 left-0 h-0.5 ${progressBg} w-full rounded-b-2xl`}
        />
      </div>
    </motion.div>
  );
};

