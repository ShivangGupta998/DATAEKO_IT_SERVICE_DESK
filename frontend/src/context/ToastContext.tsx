import React, { useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { showDesktopNotification } from '../utils/notifications';
import { ToastContext, Toast, ToastType, ToastPosition } from './toastContextDef';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (
      type: ToastType,
      title: string,
      message?: string,
      duration = 4500,
      position?: ToastPosition
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      // Action feedback (success, etc.) defaults to bottom-right near submit place;
      // System & ticket notifications default to top-right top place.
      const resolvedPosition: ToastPosition =
        position || (type === 'info' ? 'top-right' : 'bottom-right');

      const newToast: Toast = {
        id,
        type,
        title,
        message,
        duration,
        position: resolvedPosition,
      };

      // 1. Add toast to UI pop-up stack
      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      // 2. Automatically trigger native OS/browser desktop pop-up notification
      showDesktopNotification(title, {
        body: message,
      });

      // 3. Dispatch notification bell counter refresh event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('itsm:refresh-notifications'));
      }

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  // Listen to remote or cross-component toast events (e.g. WebSocket messages)
  useEffect(() => {
    const handleRemoteToast = (e: any) => {
      if (e.detail && e.detail.title) {
        showToast(
          e.detail.type || 'info',
          e.detail.title,
          e.detail.message,
          e.detail.duration,
          e.detail.position || 'top-right'
        );
      }
    };
    window.addEventListener('itsm:toast', handleRemoteToast);
    return () => window.removeEventListener('itsm:toast', handleRemoteToast);
  }, [showToast]);

  // Action toasts (green success) default to bottom-right near the submit/save place
  const success = useCallback(
    (title: string, message?: string, position?: ToastPosition) =>
      showToast('success', title, message, 4500, position || 'bottom-right'),
    [showToast]
  );
  const error = useCallback(
    (title: string, message?: string, position?: ToastPosition) =>
      showToast('error', title, message, 6000, position || 'bottom-right'),
    [showToast]
  );
  const warning = useCallback(
    (title: string, message?: string, position?: ToastPosition) =>
      showToast('warning', title, message, 4500, position || 'bottom-right'),
    [showToast]
  );
  // System / ticket notifications default to top-right top place
  const info = useCallback(
    (title: string, message?: string, position?: ToastPosition) =>
      showToast('info', title, message, 5500, position || 'top-right'),
    [showToast]
  );

  const topToasts = toasts.filter((t) => t.position === 'top-right');
  const bottomToasts = toasts.filter((t) => t.position === 'bottom-right' || !t.position);

  const renderToastItem = (toast: Toast, yOffset: number) => {
    const isSuccess = toast.type === 'success';
    const isError = toast.type === 'error';
    const isWarning = toast.type === 'warning';

    return (
      <motion.div
        key={toast.id}
        initial={{ opacity: 0, y: yOffset, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: yOffset * 0.7, scale: 0.9, transition: { duration: 0.15 } }}
        className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-start gap-3.5 transition-all text-slate-800 dark:text-slate-100 ${
          isSuccess
            ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-400 dark:border-emerald-600 shadow-emerald-500/10'
            : isError
            ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-400 dark:border-rose-600 shadow-rose-500/10'
            : isWarning
            ? 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-400 dark:border-amber-600 shadow-amber-500/10'
            : 'bg-white/95 dark:bg-slate-900/90 border-indigo-400 dark:border-indigo-600 shadow-indigo-500/10'
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          {isError && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm leading-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>{toast.title}</span>
          </div>
          {toast.message && (
            <div className="text-xs mt-1 text-slate-600 dark:text-slate-300 break-words leading-relaxed font-medium">
              {toast.message}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => dismissToast(toast.id)}
          className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  };

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, success, error, warning, info, dismissToast }}
    >
      {children}

      {/* Top Place Pop-ups: System & Ticket Update Alerts (e.g. #80, #84) */}
      <div
        id="toast-container-top"
        className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {topToasts.map((toast) => renderToastItem(toast, -20))}
        </AnimatePresence>
      </div>

      {/* Near Submit Place Pop-ups: Action Feedback & Green Success Toasts */}
      <div
        id="toast-container-bottom"
        className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {bottomToasts.map((toast) => renderToastItem(toast, 20))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

