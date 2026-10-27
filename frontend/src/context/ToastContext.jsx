import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', message, title, duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, type, message, title };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (message, title = 'Success') => addToast({ type: 'success', message, title }),
    error: (message, title = 'Error') => addToast({ type: 'error', message, title, duration: 6000 }),
    warning: (message, title = 'Warning') => addToast({ type: 'warning', message, title, duration: 5000 }),
    info: (message, title = 'Notification') => addToast({ type: 'info', message, title }),
    showToast: (message, type = 'info', title) => {
      const typeKey = typeof type === 'string' && ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
      addToast({ type: typeKey, message, title: title || (typeKey.charAt(0).toUpperCase() + typeKey.slice(1)) });
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((item) => {
          const isSuccess = item.type === 'success';
          const isError = item.type === 'error';
          const isWarning = item.type === 'warning';

          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
                isSuccess
                  ? 'bg-[#0b1b17]/95 border-emerald-500/40 text-emerald-300'
                  : isError
                  ? 'bg-[#1e0d14]/95 border-rose-500/40 text-rose-300'
                  : isWarning
                  ? 'bg-[#1e1507]/95 border-amber-500/40 text-amber-300'
                  : 'bg-[#0f172a]/95 border-sky-500/40 text-sky-300'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {isError && <XCircle className="w-5 h-5 text-rose-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-sky-400" />}
              </div>

              <div className="flex-1 min-w-0">
                {item.title && (
                  <h4 className="text-xs font-bold font-mono tracking-wide uppercase text-white mb-0.5">
                    {item.title}
                  </h4>
                )}
                <p className="text-xs text-slate-200 leading-relaxed font-sans">{item.message}</p>
              </div>

              <button
                onClick={() => removeToast(item.id)}
                className="shrink-0 text-slate-400 hover:text-white transition p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
