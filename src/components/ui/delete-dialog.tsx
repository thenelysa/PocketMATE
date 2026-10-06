'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from './button';

export function DeleteDialog({ title, itemName, onConfirm, onClose }: {
  title: string;
  itemName: string;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    cancel.current?.focus();
    return () => {
      element?.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  const confirmDelete = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this item. Please try again.');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return (
    <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={pending} onCancel={event => { event.preventDefault(); if (!inFlight.current) onClose(); }} className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-2xl border border-line bg-paper p-6 text-ink shadow-2xl backdrop:bg-ink/40 backdrop:backdrop-blur-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600"><Trash2 className="h-6 w-6" /></div>
      <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
      <p id={descriptionId} className="mt-3 break-words text-sm leading-relaxed text-muted">Delete <strong className="font-semibold text-ink">{itemName}</strong>? This cannot be undone.</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button ref={cancel} type="button" variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
        <Button type="button" variant="destructive" onClick={confirmDelete} disabled={pending}>{pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</> : 'Delete'}</Button>
      </div>
    </dialog>
  );
}
