import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

let toastListeners: ((data: ToastData) => void)[] = [];
let toastCounter = 0;

export function showToast(message: string, type: ToastData['type'] = 'info') {
  const id = `toast-${++toastCounter}`;
  toastListeners.forEach((fn) => fn({ id, message, type }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const listener = (data: ToastData) => {
      setToasts((prev) => [...prev, data]);
      setTimeout(() => removeToast(data.id), 3000);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const colors = {
          success: 'bg-accent-green text-white',
          error: 'bg-accent-red text-white',
          info: 'bg-text text-white',
        };
        return (
          <div
            key={t.id}
            className={cn(
              'px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg animate-slide-down',
              colors[t.type || 'info']
            )}
          >
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
