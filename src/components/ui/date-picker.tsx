'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { addDays, addMonths, format, isValid, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from './button';

const dateKey = (date: Date) => format(date, 'yyyy-MM-dd');
const control = 'inline-flex h-11 min-w-11 items-center justify-center rounded-lg text-teal hover:bg-mint focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2';

export function DatePicker({ id, value, onChange, required, label }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [focused, setFocused] = useState(() => dateKey(new Date()));
  const today = dateKey(new Date());
  const firstDay = startOfWeek(month, { weekStartsOn: 0 });
  const days = Array.from({ length: 42 }, (_, index) => addDays(firstDay, index));
  const years = Array.from({ length: 201 }, (_, index) => month.getFullYear() - 100 + index);

  const focusDay = (date: Date) => {
    const key = dateKey(date);
    setMonth(startOfMonth(date));
    setFocused(key);
    requestAnimationFrame(() => dialog.current?.querySelector<HTMLButtonElement>(`[data-date="${key}"]`)?.focus());
  };
  const open = () => {
    const selected = parseISO(value);
    dialog.current?.showModal();
    focusDay(isValid(selected) ? selected : new Date());
  };
  const close = () => { dialog.current?.close(); trigger.current?.focus(); };
  const choose = (date: Date) => { onChange(dateKey(date)); close(); };
  const navigate = (event: KeyboardEvent<HTMLButtonElement>, date: Date) => {
    let target: Date;
    switch (event.key) {
      case 'ArrowLeft': target = addDays(date, -1); break;
      case 'ArrowRight': target = addDays(date, 1); break;
      case 'ArrowUp': target = addDays(date, -7); break;
      case 'ArrowDown': target = addDays(date, 7); break;
      case 'Home': target = startOfWeek(date); break;
      case 'End': target = addDays(startOfWeek(date), 6); break;
      case 'PageUp': target = addMonths(date, event.shiftKey ? -12 : -1); break;
      case 'PageDown': target = addMonths(date, event.shiftKey ? 12 : 1); break;
      default: return;
    }
    event.preventDefault();
    focusDay(target);
  };
  const changeMonth = (next: Date) => { setMonth(startOfMonth(next)); setFocused(dateKey(startOfMonth(next))); };

  return (
    <div>
      <div className="flex min-h-11 items-center rounded-xl border border-line bg-white focus-within:ring-2 focus-within:ring-teal">
        <input id={id} type="date" required={required} value={value} onChange={event => onChange(event.target.value)} className="date-picker-input min-w-0 flex-1 rounded-l-xl bg-transparent px-3 py-2 text-sm text-ink focus:outline-none" />
        <button ref={trigger} type="button" className={cn(control, 'mr-1 shrink-0')} aria-label={`Open calendar for ${label}`} aria-haspopup="dialog" onClick={open}><CalendarDays size={20} /></button>
      </div>
      <dialog ref={dialog} aria-labelledby={`${id}-calendar-title`} onCancel={event => { event.preventDefault(); close(); }} className="m-auto w-[calc(100%_-_24px)] max-w-sm max-h-[90dvh] overflow-y-auto rounded-2xl border border-line bg-paper p-4 text-ink shadow-2xl backdrop:bg-ink/40 backdrop:backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between"><h2 id={`${id}-calendar-title`} className="font-semibold">Choose {label.toLowerCase()}</h2><button type="button" aria-label="Close calendar" className={control} onClick={close}><X size={20} /></button></div>
        <div className="mb-3 flex gap-2">
          {['Today', 'Tomorrow', 'In a week'].map((title, index) => <button key={title} type="button" className="min-h-11 flex-1 rounded-lg border border-line bg-white px-2 text-xs font-semibold text-teal hover:bg-mint" onClick={() => choose(addDays(new Date(), [0, 1, 7][index]))}>{title}</button>)}
        </div>
        <div className="mb-2 flex items-center gap-1">
          <button type="button" aria-label="Previous month" className={control} onClick={() => changeMonth(addMonths(month, -1))}><ChevronLeft size={20} /></button>
          <select aria-label="Calendar month" value={month.getMonth()} onChange={event => changeMonth(new Date(month.getFullYear(), Number(event.target.value), 1))} className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-white px-2 text-sm">{Array.from({ length: 12 }, (_, index) => <option key={index} value={index}>{format(new Date(2026, index, 1), 'MMMM')}</option>)}</select>
          <select aria-label="Calendar year" value={month.getFullYear()} onChange={event => changeMonth(new Date(Number(event.target.value), month.getMonth(), 1))} className="h-11 w-20 rounded-lg border border-line bg-white px-2 text-sm">{years.map(year => <option key={year} value={year}>{year}</option>)}</select>
          <button type="button" aria-label="Next month" className={control} onClick={() => changeMonth(addMonths(month, 1))}><ChevronRight size={20} /></button>
        </div>
        <p className="sr-only" aria-live="polite">{format(month, 'MMMM yyyy')}</p>
        <table className="w-full table-fixed border-separate border-spacing-0" aria-label={format(month, 'MMMM yyyy')}>
          <thead><tr>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => <th key={day} scope="col" className="h-9 text-xs font-medium text-muted"><abbr title={day} className="no-underline">{day.slice(0, 2)}</abbr></th>)}</tr></thead>
          <tbody>{Array.from({ length: 6 }, (_, week) => <tr key={week}>{days.slice(week * 7, week * 7 + 7).map(day => {
            const key = dateKey(day);
            return <td key={key} className="p-0.5"><button type="button" data-date={key} aria-label={format(day, 'EEEE, MMMM d, yyyy')} aria-pressed={value === key} aria-current={today === key ? 'date' : undefined} tabIndex={focused === key ? 0 : -1} onKeyDown={event => navigate(event, day)} onFocus={() => setFocused(key)} onClick={() => choose(day)} className={cn('min-h-11 w-full rounded-lg text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal', value === key ? 'bg-teal font-bold text-white' : 'hover:bg-mint', day.getMonth() !== month.getMonth() && value !== key && 'text-muted', today === key && value !== key && 'ring-1 ring-inset ring-teal')}>{day.getDate()}</button></td>;
          })}</tr>)}</tbody>
        </table>
        <p className="mt-3 text-xs leading-relaxed text-muted">Use arrow keys to move between days, Enter to select, or Escape to close.</p>
      </dialog>
    </div>
  );
}
