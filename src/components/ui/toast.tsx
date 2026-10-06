'use client';

import { useEffect, useState } from 'react';
import { X, Undo2 } from 'lucide-react';

interface ToastProps {
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, undoLabel = 'Undo', onUndo, onDismiss, duration = 5000 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-ink text-white rounded-xl shadow-2xl transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <span className="text-sm font-medium">{message}</span>
      {onUndo && (
        <button
          onClick={() => {
            onUndo();
            setVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
        >
          <Undo2 className="w-4 h-4" />
          {undoLabel}
        </button>
      )}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onDismiss, 300);
        }}
        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Toast manager to handle multiple toasts
interface ToastItem {
  id: string;
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
}

let toastListeners: ((toasts: ToastItem[]) => void)[] = [];
let currentToasts: ToastItem[] = [];

export function showToast(toast: Omit<ToastItem, 'id'>) {
  const id = Math.random().toString(36).slice(2);
  currentToasts = [...currentToasts, { ...toast, id }];
  toastListeners.forEach(listener => listener([...currentToasts]));

  return id;
}

export function dismissToast(id: string) {
  currentToasts = currentToasts.filter(t => t.id !== id);
  toastListeners.forEach(listener => listener([...currentToasts]));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter(l => l !== setToasts);
    };
  }, []);

  return (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          undoLabel={toast.undoLabel}
          onUndo={toast.onUndo}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </>
  );
}
