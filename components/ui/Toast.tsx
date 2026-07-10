'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
}

let toastQueue: ToastItem[] = [];
let setToastsFn: ((t: ToastItem[]) => void) | null = null;

export function showToast(message: string, type: ToastType = 'success', action?: { label: string; onClick: () => void }) {
  const id = Math.random().toString(36).slice(2);
  const item: ToastItem = { id, message, type, action };
  toastQueue = [...toastQueue, item];
  setToastsFn?.(toastQueue);
  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t.id !== id);
    setToastsFn?.(toastQueue);
  }, action ? 6000 : 3500);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    setToastsFn = setToasts;
    return () => { setToastsFn = null; };
  }, []);

  const dismiss = (id: string) => {
    toastQueue = toastQueue.filter((t) => t.id !== id);
    setToasts([...toastQueue]);
  };

  const icons = {
    success: <CheckCircle size={16} className="text-green-600 flex-shrink-0" />,
    error: <AlertCircle size={16} className="text-red-600 flex-shrink-0" />,
    info: <Info size={16} className="text-blue-600 flex-shrink-0" />,
  };

  const borders = {
    success: 'border-l-4 border-green-500',
    error: 'border-l-4 border-red-500',
    info: 'border-l-4 border-blue-500',
  };

  return (
    <div className="fixed bottom-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4 md:bottom-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'bg-white shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 pointer-events-auto max-w-sm w-full',
            borders[toast.type]
          )}
        >
          {icons[toast.type]}
          <span className="text-sm text-slate-700 flex-1">{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => { toast.action!.onClick(); dismiss(toast.id); }}
              className="text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              {toast.action.label}
            </button>
          )}
          <button onClick={() => dismiss(toast.id)} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
