import { useState, useEffect } from 'react';
import { Button, Card, CardContent, Badge, Dialog, DialogTitle, DialogContent, DialogFooter, DialogHeader, Label, Select, Input, showToast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getReminders, addReminder, updateReminder, deleteReminder, getBills, getCreditCards, restoreReminder } from '@/lib/dataStore';
import { registerUndo } from '@/components/ui/toast';
import { formatDate, getDaysUntil } from '@/lib/utils';
import { Reminder, ReminderType, Bill, CreditCard } from '@/types';
import { Bell, BellOff, Plus, Trash2, Check, X } from 'lucide-react';

const reminderTypeOptions = [
  { value: 'BILL_DUE', label: 'Bill Due' },
  { value: 'CARD_PAYMENT_DUE', label: 'Card Payment Due' },
  { value: 'CARD_STATEMENT', label: 'Card Statement' },
  { value: 'OVERDUE_BILL', label: 'Overdue Bill' },
  { value: 'CUSTOM', label: 'Custom' },
];

export function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    type: 'BILL_DUE' as ReminderType,
    referenceId: '',
    referenceType: '',
    title: '',
    message: '',
    remindAt: '',
  });

  useEffect(() => {
    if (user) {
      loadReminders();
    }
  }, [user]);

  const loadReminders = () => {
    if (!user) return;
    const allReminders = getReminders(user.id);
    setReminders(allReminders);
    setLoading(false);
  };

  const handleAddReminder = () => {
    if (!user) return;

    const reminder = addReminder({
      userId: user.id,
      type: formData.type,
      referenceId: formData.referenceId || undefined,
      referenceType: formData.referenceType || undefined,
      title: formData.title,
      message: formData.message || undefined,
      remindAt: new Date(formData.remindAt).toISOString(),
      isSent: false,
    });

    loadReminders();
    setShowAddDialog(false);
    resetForm();
  };

  const handleDeleteReminder = (id: string) => {
    setReminderToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (reminderToDelete) {
      const reminder = reminders.find(r => r.id === reminderToDelete);
      const undoId = `reminder-${reminderToDelete}-${Date.now()}`;

      if (reminder) {
        registerUndo(undoId, () => {
          restoreReminder(reminder);
          loadReminders();
        });
      }

      deleteReminder(reminderToDelete);
      loadReminders();
      showToast('Reminder deleted', 'success', 5000, undoId, 'Undo');
    }
    setShowDeleteDialog(false);
    setReminderToDelete(null);
  };

  const handleToggleSent = (reminder: Reminder) => {
    updateReminder({ ...reminder, isSent: !reminder.isSent });
    loadReminders();
  };

  const resetForm = () => {
    setFormData({
      type: 'BILL_DUE',
      referenceId: '',
      referenceType: '',
      title: '',
      message: '',
      remindAt: '',
    });
  };

  const getDaysUntilText = (dateString: string) => {
    const days = getDaysUntil(dateString);
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  const getReminderIcon = (type: ReminderType) => {
    return <Bell className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Sort reminders by remindAt date
  const sortedReminders = [...reminders].sort(
    (a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()
  );

  const upcomingReminders = sortedReminders.filter(r => !r.isSent && new Date(r.remindAt) >= new Date());
  const pastReminders = sortedReminders.filter(r => r.isSent || new Date(r.remindAt) < new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reminders</h2>
          <p className="text-muted-foreground">Manage your payment reminders</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Reminder
        </Button>
      </div>

      {/* Upcoming Reminders */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Upcoming Reminders
          </h3>
          {upcomingReminders.length === 0 ? (
            <div className="text-center py-8">
              <img src="/images/notification.png" alt="No reminders" className="h-24 w-auto mx-auto mb-4 opacity-80" />
              <p className="text-muted-foreground">No upcoming reminders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-start justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      {getReminderIcon(reminder.type)}
                    </div>
                    <div>
                      <p className="font-medium">{reminder.title}</p>
                      {reminder.message && (
                        <p className="text-sm text-muted-foreground">{reminder.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(reminder.remindAt)} • {getDaysUntilText(reminder.remindAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleSent(reminder)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past/Sent Reminders */}
      {pastReminders.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BellOff className="h-4 w-4" />
              Past Reminders
            </h3>
            <div className="space-y-3">
              {pastReminders.slice(0, 10).map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-start justify-between p-3 rounded-lg border bg-muted/50 opacity-60"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-muted text-muted-foreground">
                      {getReminderIcon(reminder.type)}
                    </div>
                    <div>
                      <p className="font-medium">{reminder.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(reminder.remindAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleSent(reminder)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Reminder Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)}>
        <DialogHeader>
          <DialogTitle>Add Reminder</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <div>
              <Label>Reminder Type</Label>
              <Select
                options={reminderTypeOptions}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ReminderType })}
              />
            </div>
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Electricity Bill Due"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Input
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Optional message..."
              />
            </div>
            <div>
              <Label>Remind At *</Label>
              <Input
                type="datetime-local"
                value={formData.remindAt}
                onChange={(e) => setFormData({ ...formData, remindAt: e.target.value })}
              />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddReminder}
            disabled={!formData.title || !formData.remindAt}
          >
            Add Reminder
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogHeader>
          <DialogTitle>Delete Reminder</DialogTitle>
        </DialogHeader>
        <DialogContent className="text-center">
          <img src="/images/mascot-bill.png" alt="Delete" className="w-20 h-20 mx-auto mb-4" />
          <p className="text-muted-foreground">Are you sure you want to delete this reminder? This action cannot be undone.</p>
        </DialogContent>
        <DialogFooter className="justify-center sm:justify-center">
          <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default RemindersPage;
