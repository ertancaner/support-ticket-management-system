import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  showSuccess: (message: string, durationMs?: number) => void;
  showError: (message: string, durationMs?: number) => void;
  showInfo: (message: string, durationMs?: number) => void;
  showWarning: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', durationMs = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, durationMs);
    },
    [removeToast]
  );

  const showSuccess = useCallback((message: string, durationMs?: number) => {
    showToast(message, 'success', durationMs);
  }, [showToast]);

  const showError = useCallback((message: string, durationMs?: number) => {
    showToast(message, 'error', durationMs);
  }, [showToast]);

  const showInfo = useCallback((message: string, durationMs?: number) => {
    showToast(message, 'info', durationMs);
  }, [showToast]);

  const showWarning = useCallback((message: string, durationMs?: number) => {
    showToast(message, 'warning', durationMs);
  }, [showToast]);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-600',
          border: 'border-emerald-500',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-100 shrink-0" />,
          text: 'text-white'
        };
      case 'error':
        return {
          bg: 'bg-rose-600',
          border: 'border-rose-500',
          icon: <AlertCircle className="w-5 h-5 text-rose-100 shrink-0" />,
          text: 'text-white'
        };
      case 'warning':
        return {
          bg: 'bg-amber-600',
          border: 'border-amber-500',
          icon: <AlertTriangle className="w-5 h-5 text-amber-100 shrink-0" />,
          text: 'text-white'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-600',
          border: 'border-blue-500',
          icon: <Info className="w-5 h-5 text-blue-100 shrink-0" />,
          text: 'text-white'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}

      {/* Top Floating Toast Notification Container */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4">
        {toasts.map((toast) => {
          const style = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl shadow-slate-900/15 border ${style.bg} ${style.border} ${style.text} text-sm font-medium transform transition-all duration-300 animate-in fade-in slide-in-from-top-6`}
              role="alert"
            >
              {style.icon}
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-80 hover:opacity-100 p-1 rounded-lg transition-opacity cursor-pointer ml-1"
                aria-label="Kapat"
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

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
