'use client';
import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null), id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => { dialog?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={id} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} className="studio-modal">
    <div className="flex items-center justify-between gap-4 mb-5"><h2 id={id} className="text-xl font-semibold">{title}</h2><button type="button" className="studio-icon" onClick={onClose} aria-label="Close dialog"><X size={20}/></button></div>{children}
  </dialog>;
}
