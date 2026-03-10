import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'deny';

export interface Toast {
  id: number;
  title?: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => number;
  addToastWithTitle: (title: string, message: string, type?: ToastType, duration?: number) => number;
  removeToast: (id: number) => void;
  toast: {
    success: (message: string, duration?: number) => number;
    error: (message: string, duration?: number) => number;
    warning: (message: string, duration?: number) => number;
    info: (message: string, duration?: number) => number;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000): number => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const addToastWithTitle = useCallback(
    (title: string, message: string, type: ToastType = 'info', duration: number = 4000): number => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, title, message, type }]);
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
      return id;
    },
    [],
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useMemo(
    () => ({
      success: (msg: string, duration?: number) => addToast(msg, 'success', duration),
      error: (msg: string, duration?: number) => addToast(msg, 'error', duration),
      warning: (msg: string, duration?: number) => addToast(msg, 'warning', duration),
      info: (msg: string, duration?: number) => addToast(msg, 'info', duration),
    }),
    [addToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, addToast, addToastWithTitle, removeToast, toast }),
    [toasts, addToast, addToastWithTitle, removeToast, toast],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
