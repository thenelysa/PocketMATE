import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  undoId?: string;
  undoLabel?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number, undoId?: string, undoLabel?: string) => void;
  executeUndo: (undoId: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Store undo functions by ID
const undoCallbacks = new Map<string, () => void>();

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: AlertCircle,
};

const colors = {
  success: 'bg-green-100 border-green-300 text-green-900',
  error: 'bg-red-100 border-red-300 text-red-900',
  info: 'bg-blue-100 border-blue-300 text-blue-900',
};

export function Toast({ message, type = 'info', duration = 3000, onClose, undoId, undoLabel = 'Undo' }: ToastProps) {
  const Icon = icons[type];
  const hasUndo = undoId && undoCallbacks.has(undoId);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (undoId) undoCallbacks.delete(undoId);
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose, undoId]);

  const handleUndo = () => {
    if (undoId) {
      const callback = undoCallbacks.get(undoId);
      if (callback) {
        callback();
      }
      undoCallbacks.delete(undoId);
    }
    // Dispatch event to notify data changed
    window.dispatchEvent(new CustomEvent('data-changed'));
    onClose();
  };

  return (
    <div
      className={cn(
        'fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg',
        colors[type]
      )}
    >
      <Icon className="h-5 w-5" />
      <p className="font-medium">{message}</p>
      {hasUndo && (
        <button onClick={handleUndo} className="ml-2 hover:opacity-70 underline">
          {undoLabel}
        </button>
      )}
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Global undo registry
export function registerUndo(id: string, callback: () => void) {
  undoCallbacks.set(id, callback);
}

export function showToast(message: string, type: ToastType = 'success', duration: number = 5000, undoId?: string, undoLabel?: string) {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type, duration, undoId, undoLabel } }));
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType; duration: number; undoId?: string; undoLabel?: string } | null>(null);

  useEffect(() => {
    const handleShowToast = (e: CustomEvent) => {
      setToast({ message: e.detail.message, type: e.detail.type, duration: e.detail.duration ?? 5000, undoId: e.detail.undoId, undoLabel: e.detail.undoLabel });
    };
    window.addEventListener('show-toast', handleShowToast as EventListener);
    return () => window.removeEventListener('show-toast', handleShowToast as EventListener);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const executeUndo = useCallback((undoId: string) => {
    const callback = undoCallbacks.get(undoId);
    if (callback) {
      callback();
      undoCallbacks.delete(undoId);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, executeUndo }}>
      {children}
      {toast && (
        <Toast message={toast.message} type={toast.type} duration={toast.duration} onClose={hideToast} undoId={toast.undoId} undoLabel={toast.undoLabel} />
      )}
    </ToastContext.Provider>
  );
}
