'use client';

import { useState } from 'react';
import { Plus, Bell } from 'lucide-react';
import { Button } from '@/components/ui';
import { useReminders, useDeleteReminder } from '@/features/reminders/hooks';
import { useBills } from '@/features/bills/hooks';
import { ReminderForm } from '@/features/reminders/components/reminder-form';
import { ReminderList } from '@/features/reminders/components/reminder-list';

export default function RemindersPage() {
  const { data: reminders = [], isLoading } = useReminders();
  const { data: bills = [] } = useBills();
  const deleteReminder = useDeleteReminder();
  const [formOpen, setFormOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this reminder?')) {
      await deleteReminder.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#078D88] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#071936]">Reminders</h2>
          <p className="text-[#4B5D7A] mt-1">Get notified before bills are due</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Reminder
        </Button>
      </div>

      {formOpen && <ReminderForm bills={bills} onClose={() => setFormOpen(false)} />}

      {reminders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#D5ECEB]">
          <Bell className="w-16 h-16 text-[#D5ECEB] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#071936] mb-2">No reminders yet</h3>
          <p className="text-[#4B5D7A] mb-4">Set up reminders to never miss a payment</p>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Your First Reminder
          </Button>
        </div>
      ) : (
        <ReminderList reminders={reminders} bills={bills} onDelete={handleDelete} />
      )}
    </div>
  );
}
