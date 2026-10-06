'use client';

import { useState } from 'react';
import { Plus, Bell } from 'lucide-react';
import { Button, DeleteDialog, showToast } from '@/components/ui';
import { useReminders, useDeleteReminder, useCreateReminder } from '@/features/reminders/hooks';
import { useBills } from '@/features/bills/hooks';
import { ReminderForm } from '@/features/reminders/components/reminder-form';
import { ReminderList } from '@/features/reminders/components/reminder-list';

export default function RemindersPage() {
  const { data: reminders = [], isLoading, isError, refetch } = useReminders();
  const { data: bills = [] } = useBills();
  const deleteReminder = useDeleteReminder();
  const createReminder = useCreateReminder();
  const [formOpen, setFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedReminder, setDeletedReminder] = useState<typeof reminders[0] | null>(null);

  const handleDelete = (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
      setDeletedReminder(reminder);
    }
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const reminder = deletedReminder;
    await deleteReminder.mutateAsync(deletingId);
    setDeletingId(null);
    setDeletedReminder(null);
    if (reminder) {
      showToast({
        message: `"${reminder.title}" deleted`,
        undoLabel: 'Undo',
        onUndo: () => {
          createReminder.mutate({
            title: reminder.title,
            type: reminder.type,
            isSent: reminder.isSent,
            message: reminder.message,
            remindAt: reminder.remindAt,
            referenceType: reminder.referenceType,
            referenceId: reminder.referenceId,
          });
        },
      });
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {deletingId && <DeleteDialog title="Delete reminder" itemName={reminders.find(item => item.id === deletingId)?.title || 'this item'} onConfirm={confirmDelete} onClose={() => { setDeletingId(null); setDeletedReminder(null); }} />}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="dashboard-heading">Reminders</h2>
          <p className="text-muted mt-1">Get alerts while PocketMATE is open</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Reminder
        </Button>
      </div>

      {formOpen && <ReminderForm bills={bills} onClose={() => setFormOpen(false)} />}

      {isError ? <div role="alert" className="rounded-xl border border-line bg-white p-6"><p>Could not load reminders.</p><Button variant="ghost" onClick={() => void refetch()}>Try again</Button></div> : reminders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-line">
          <Bell className="w-16 h-16 text-line mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-ink mb-2">No reminders yet</h3>
          <p className="text-muted mb-4">Set up reminders to never miss a payment</p>
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
