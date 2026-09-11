'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useReminders, useBills, useCreateReminder, useDeleteReminder, Reminder } from '@/lib/hooks';
import { Button } from '@/components/ui';
import { Plus, Bell, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function RemindersPage() {
  const { user } = useAuth();
  const { data: reminders = [], isLoading } = useReminders();
  const { data: bills = [] } = useBills();
  const createReminder = useCreateReminder();
  const deleteReminder = useDeleteReminder();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bill_id: '',
    remind_date: '',
    remind_time: '',
    message: '',
  });

  const resetForm = () => {
    setFormData({
      bill_id: '',
      remind_date: '',
      remind_time: '',
      message: '',
    });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReminder.mutateAsync({
        bill_id: formData.bill_id || null,
        remind_date: new Date(formData.remind_date).toISOString(),
        remind_time: formData.remind_time || null,
        message: formData.message || null,
        is_sent: false,
      });
      resetForm();
    } catch (err) {
      console.error('Failed to create reminder:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this reminder?')) {
      await deleteReminder.mutateAsync(id);
    }
  };

  const getBillName = (billId: string | null) => {
    if (!billId) return 'General reminder';
    const bill = bills.find(b => b.id === billId);
    return bill ? bill.name : 'Unknown bill';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#078D88] border-t-transparent"></div>
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
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Add Reminder
        </Button>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-[#D5ECEB]">
              <h3 className="text-lg font-bold text-[#071936]">Create Reminder</h3>
              <button onClick={resetForm} className="text-[#4B5D7A] hover:text-[#071936]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#071936] mb-1">Related Bill</label>
                <select
                  value={formData.bill_id}
                  onChange={e => setFormData({ ...formData, bill_id: e.target.value })}
                  className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                >
                  <option value="">Select a bill (optional)</option>
                  {bills.map(bill => (
                    <option key={bill.id} value={bill.id}>{bill.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.remind_date}
                    onChange={e => setFormData({ ...formData, remind_date: e.target.value })}
                    className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.remind_time}
                    onChange={e => setFormData({ ...formData, remind_time: e.target.value })}
                    className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#071936] mb-1">Message</label>
                <textarea
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                  rows={3}
                  placeholder="Reminder message..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={createReminder.isPending}>
                  {createReminder.isPending ? 'Creating...' : 'Create Reminder'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reminders List */}
      {reminders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#D5ECEB]">
          <Bell className="w-16 h-16 text-[#D5ECEB] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#071936] mb-2">No reminders yet</h3>
          <p className="text-[#4B5D7A] mb-4">Set up reminders to never miss a payment</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Create Your First Reminder
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map(reminder => (
            <div key={reminder.id} className="bg-white rounded-xl border border-[#D5ECEB] p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#078D88] to-[#19C4B6] flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[#071936]">{getBillName(reminder.bill_id)}</p>
                  {reminder.message && (
                    <p className="text-sm text-[#4B5D7A]">{reminder.message}</p>
                  )}
                  <p className="text-sm text-[#4B5D7A]">
                    {format(new Date(reminder.remind_date), 'MMM d, yyyy')}
                    {reminder.remind_time && ` at ${reminder.remind_time}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  reminder.is_sent
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {reminder.is_sent ? 'Sent' : 'Pending'}
                </span>
                <button
                  onClick={() => handleDelete(reminder.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
