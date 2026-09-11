'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import { useCreateReminder } from '../hooks';
import { BILL_REFERENCE, BILL_REMINDER } from '../types';
import type { Bill } from '@/features/bills/types';

const inputClass =
  'w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]';
const labelClass = 'block text-sm font-semibold text-[#071936] mb-1';

/**
 * Create-only modal. `bills` populates the optional "related bill" select; the
 * page already has them loaded, so they are passed in rather than re-fetched.
 *
 * The date and time inputs are combined into the single `remindAt` timestamp the
 * table stores. Picking a bill fills `referenceType` / `referenceId`.
 */
export function ReminderForm({ bills, onClose }: { bills: Bill[]; onClose: () => void }) {
  const createReminder = useCreateReminder();
  const [values, setValues] = useState({
    billId: '',
    title: '',
    remindDate: '',
    remindTime: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bill = bills.find(b => b.id === values.billId);
    try {
      await createReminder.mutateAsync({
        type: BILL_REMINDER,
        title: values.title || bill?.name || 'Reminder',
        // a blank time means midnight local
        remindAt: new Date(`${values.remindDate}T${values.remindTime || '00:00'}`).toISOString(),
        referenceType: bill ? BILL_REFERENCE : null,
        referenceId: bill ? bill.id : null,
        message: values.message || null,
        isSent: false,
      });
      onClose();
    } catch (err) {
      console.error('Failed to create reminder:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-[#D5ECEB]">
          <h3 className="text-lg font-bold text-[#071936]">Create Reminder</h3>
          <button onClick={onClose} className="text-[#4B5D7A] hover:text-[#071936]" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              <input
                id="reminder-date"
                type="date"
                required
                value={values.remindDate}
                onChange={e => setValues({ ...values, remindDate: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="reminder-time" className={labelClass}>Time</label>
              <input
                id="reminder-time"
                type="time"
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
