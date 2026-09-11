'use client';

import { format } from 'date-fns';
import { Bell, Trash2 } from 'lucide-react';
import { BILL_REFERENCE } from '../types';
import type { Reminder } from '../types';
import type { Bill } from '@/features/bills/types';

export function ReminderList({
  reminders,
  bills,
  onDelete,
}: {
  reminders: Reminder[];
  bills: Bill[];
  onDelete: (id: string) => void;
}) {
  /** Reminders are polymorphic; only resolve a name when this one points at a bill. */
  const linkedBill = (reminder: Reminder) =>
    reminder.referenceType === BILL_REFERENCE
      ? bills.find(b => b.id === reminder.referenceId)?.name ?? 'Unknown bill'
      : null;

  return (
    <div className="space-y-3">
      {reminders.map(reminder => {
        const bill = linkedBill(reminder);
        return (
          <div
            key={reminder.id}
            className="bg-white rounded-xl border border-[#D5ECEB] p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#078D88] to-[#19C4B6] flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#071936]">{reminder.title}</p>
                {bill && <p className="text-sm text-[#4B5D7A]">for {bill}</p>}
                {reminder.message && <p className="text-sm text-[#4B5D7A]">{reminder.message}</p>}
                <p className="text-sm text-[#4B5D7A]">
                  {format(new Date(reminder.remindAt), "MMM d, yyyy 'at' HH:mm")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  reminder.isSent ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {reminder.isSent ? 'Sent' : 'Pending'}
              </span>
              <button
                onClick={() => onDelete(reminder.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                aria-label={`Delete reminder ${reminder.title}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
