'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { useReminders, useDismissReminder } from '../hooks';

export function NotificationBell() {
  const { data: reminders = [], isLoading, isError, refetch } = useReminders();
  const dismiss = useDismissReminder();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState('');
  const container = useRef<HTMLDivElement>(null);
  const bell = useRef<HTMLButtonElement>(null);
  const notified = useRef(new Set<string>());
  const due = reminders.filter(r => !r.isSent && new Date(r.remindAt).getTime() <= now);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    window.addEventListener('focus', tick);
    return () => { clearInterval(timer); window.removeEventListener('focus', tick); };
  }, []);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try { if (localStorage.getItem('settings_notifications') === 'false') return; } catch { /* Storage can be unavailable. */ }
    for (const reminder of reminders) {
      if (reminder.isSent || new Date(reminder.remindAt).getTime() > now) continue;
      const key = `pocketmate_notified:${reminder.userId}:${reminder.id}:${reminder.remindAt}`;
      if (notified.current.has(key)) continue;
      try { if (localStorage.getItem(key)) continue; } catch { /* Fall back to session deduplication. */ }
      try {
        const notification = new Notification(reminder.title, {
          body: reminder.message || 'Your PocketMATE reminder is due.',
          icon: '/images/mascot-bill-pistachio.png', tag: key,
        });
        notification.onclick = () => { window.focus(); setOpen(true); notification.close(); };
        notified.current.add(key);
        try { localStorage.setItem(key, 'true'); } catch { /* Already tracked in memory. */ }
      } catch { notified.current.add(key); /* In-app alerts remain available on unsupported browsers. */ }
    }
  }, [reminders, now]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); bell.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);

  const enableNotifications = async () => {
    if (!('Notification' in window)) { setNotice('This browser supports in-app alerts only.'); return; }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        try { localStorage.setItem('settings_notifications', 'true'); } catch { /* Permission still applies. */ }
        setNotice('Browser alerts enabled. Keep PocketMATE open to receive reminders.');
      } else setNotice('Browser alerts are blocked. Allow notifications in your browser settings; in-app alerts still work.');
    } catch { setNotice('Browser alerts are unavailable. In-app alerts still work.'); }
  };

  return (
    <div ref={container} className="relative">
      <button ref={bell} type="button" aria-label={`Notifications${due.length ? `, ${due.length} due` : ''}`} aria-expanded={open} aria-controls="notification-panel" onClick={() => setOpen(!open)} className="relative rounded-lg p-2 text-muted hover:bg-mint hover:text-teal">
        <Bell className="h-5 w-5" />
        {due.length > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#BE193F] px-1 text-[10px] text-white">{due.length}</span>}
      </button>
      {!open && due.length > 0 && <div role="status" className="fixed bottom-5 right-5 z-40 max-w-[calc(100vw-40px)] rounded-xl border border-line bg-white p-4 shadow-lg"><button type="button" onClick={() => setOpen(true)} className="text-sm text-ink">{due.length} {due.length === 1 ? 'reminder is' : 'reminders are'} due. View notifications</button></div>}
      {open && <section id="notification-panel" aria-label="Notifications" className="absolute -right-12 top-12 z-40 w-80 max-w-[calc(100vw-32px)] rounded-xl border border-line bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-ink">Notifications</h2><button type="button" aria-label="Close notifications" onClick={() => { setOpen(false); bell.current?.focus(); }}><X size={18} /></button></div>
        {isLoading ? <p role="status">Loading reminders...</p> : isError ? <div role="alert"><p>Could not load reminders.</p><Button variant="ghost" onClick={() => void refetch()}>Try again</Button></div> : <div className="max-h-64 overflow-y-auto">
          {due.length === 0 ? <p className="py-4 text-sm text-muted">No reminders due right now.</p> : due.map(reminder => <article key={reminder.id} className="border-b border-line py-3"><p className="text-sm font-semibold text-ink">{reminder.title}</p>{reminder.message && <p className="mt-1 text-xs text-muted">{reminder.message}</p>}<p className="my-2 text-xs text-muted">{new Date(reminder.remindAt).toLocaleString()}</p><Button size="sm" variant="outline" disabled={dismiss.isPending} onClick={() => dismiss.mutate(reminder.id)}>Mark done</Button></article>)}
        </div>}
        {dismiss.isError && <p role="alert" className="mt-2 text-sm text-red-700">Could not update the reminder. Please try again.</p>}
        <div className="mt-3 space-y-3 border-t border-line pt-3"><Button size="sm" variant="ghost" onClick={enableNotifications}>Enable browser alerts</Button>{notice && <p role="status" className="text-xs text-muted">{notice}</p>}<p className="text-xs text-muted">Reminders run while PocketMATE is open.</p><Link href="/reminders" onClick={() => setOpen(false)} className="block text-sm font-semibold text-teal">Manage all reminders</Link></div>
      </section>}
    </div>
  );
}
