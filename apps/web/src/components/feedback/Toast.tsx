import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastMessage } from '@/types/ui';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.durationMs || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const getIcon = () => {
            switch (t.type) {
              case 'success':
                return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />;
              case 'error':
                return <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />;
              case 'warning':
                return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />;
              default:
                return <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />;
            }
          };

          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto rounded-lg border border-neutral-200 bg-white p-4 shadow-lg flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom-2"
            >
              {getIcon()}
              <div className="flex-1 text-sm">
                <p className="font-semibold text-neutral-900">{t.title}</p>
                {t.message && <p className="text-neutral-600 mt-0.5 text-xs">{t.message}</p>}
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.onClick();
                      removeToast(t.id);
                    }}
                    className="mt-2 text-xs font-semibold text-primary-800 underline hover:no-underline"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss toast notification"
                className="text-neutral-400 hover:text-neutral-600 p-1"
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

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
