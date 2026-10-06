'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button, DatePicker } from '@/components/ui';
import { useCreateReminder } from '../hooks';
import { BILL_REFERENCE, BILL_REMINDER } from '../types';
import type { Bill } from '@/features/bills/types';

const inputClass =
  'w-full px-4 py-2 border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-teal';
const labelClass = 'block text-sm font-semibold text-ink mb-1';

/**
 * Create-only modal. `bills` populates the optional "related bill" select; the
 * page already has them loaded, so they are passed in rather than re-fetched.
 *
 * The date and time inputs are combined into the single `remindAt` timestamp the
 * table stores. Picking a bill fills `referenceType` / `referenceId`.
 */
export function ReminderForm({ bills, onClose }: { bills: Bill[]; onClose: () => void }) {
  const createReminder = useCreateReminder();
  const [error, setError] = useState('');
  const [values, setValues] = useState({
    billId: '',
    title: '',
    remindDate: '',
    remindTime: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const remindAt = new Date(`${values.remindDate}T${values.remindTime}`);
    if (!Number.isFinite(remindAt.getTime()) || remindAt.getTime() <= Date.now()) {
      setError('Choose a reminder date and time in the future.');
      return;
    }
    const bill = bills.find(b => b.id === values.billId);
    try {
      await createReminder.mutateAsync({
        type: BILL_REMINDER,
        title: values.title || bill?.name || 'Reminder',
        remindAt: remindAt.toISOString(),
        referenceType: bill ? BILL_REFERENCE : null,
        referenceId: bill ? bill.id : null,
        message: values.message || null,
        isSent: false,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this reminder. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-line">
          <h3 className="text-lg font-bold text-ink">Create Reminder</h3>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <p className="text-xs text-muted">Times use your device&apos;s time zone. Alerts appear while PocketMATE is open.</p>
          <div>
            <label htmlFor="reminder-title" className={labelClass}>Title *</label>
            <input
              id="reminder-title"
              type="text"
              required
              value={values.title}
              onChange={e => setValues({ ...values, title: e.target.value })}
              className={inputClass}
              placeholder="e.g., Pay the electric bill"
            />
          </div>

          <div>
            <label htmlFor="reminder-bill" className={labelClass}>Related Bill</label>
            <select
              id="reminder-bill"
              value={values.billId}
              onChange={e => setValues({ ...values, billId: e.target.value })}
              className={inputClass}
            >
              <option value="">Select a bill (optional)</option>
              {bills.map(bill => (
                <option key={bill.id} value={bill.id}>{bill.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reminder-date" className={labelClass}>Date *</label>
              <DatePicker id="reminder-date" label="Reminder date" required value={values.remindDate} onChange={date => setValues({ ...values, remindDate: date })} />
            </div>
            <div>
              <label htmlFor="reminder-time" className={labelClass}>Time *</label>
              <input
                id="reminder-time"
                type="time"
                required
                value={values.remindTime}
                onChange={e => setValues({ ...values, remindTime: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="reminder-message" className={labelClass}>Message</label>
            <textarea
              id="reminder-message"
              value={values.message}
              onChange={e => setValues({ ...values, message: e.target.value })}
              className={inputClass}
              rows={3}
              placeholder="Reminder message..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={createReminder.isPending}>
              {createReminder.isPending ? 'Creating...' : 'Create Reminder'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
