import { getProfile } from './dataStore';
import { getDaysUntil } from './utils';
import { Bill, Reminder } from '@/types';

export function requestNotificationPermission(): Promise<NotificationPermission> {
  return Notification.requestPermission();
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export function showNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/images/logo.png',
      badge: '/images/logo.png',
      ...options,
    });
  }
}

export function notifyBillDue(bill: Bill): void {
  const daysUntil = getDaysUntil(bill.dueDate);
  let message = '';

  if (daysUntil < 0) {
    message = `${bill.name} is ${Math.abs(daysUntil)} days overdue!`;
  } else if (daysUntil === 0) {
    message = `${bill.name} is due today!`;
  } else if (daysUntil === 1) {
    message = `${bill.name} is due tomorrow`;
  } else {
    message = `${bill.name} is due in ${daysUntil} days`;
  }

  showNotification('Bill Due Reminder', {
    body: message,
    tag: `bill-${bill.id}`,
    requireInteraction: daysUntil <= 1,
  });
}

export function notifyBillOverdue(bill: Bill): void {
  showNotification('⚠️ Bill Overdue!', {
    body: `${bill.name} (${bill.provider || 'Unknown provider'}) is overdue. Amount: ₨${bill.amount.toLocaleString()}`,
    tag: `overdue-${bill.id}`,
    requireInteraction: true,
  });
}

export function notifyCardPaymentDue(cardName: string, amount: number, daysUntil: number): void {
  showNotification('Credit Card Payment Due', {
    body: `${cardName}: ₨${amount.toLocaleString()} due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
    tag: `card-${cardName}`,
    requireInteraction: daysUntil <= 2,
  });
}

export function notifyReminder(reminder: Reminder): void {
  showNotification(reminder.title, {
    body: reminder.message || 'You have a reminder',
    tag: `reminder-${reminder.id}`,
  });
}

// Check and send notifications for all bills
export function checkAndNotifyBills(bills: Bill[]): void {
  const profile = getProfile();
  const reminderDays = profile?.reminderDaysBefore || 3;

  bills.forEach(bill => {
    if (bill.status === 'PAID') return;

    const daysUntil = getDaysUntil(bill.dueDate);

    // Overdue notification
    if (daysUntil < 0) {
      notifyBillOverdue(bill);
    }
    // Due soon notification (within reminder days)
    else if (daysUntil <= reminderDays) {
      notifyBillDue(bill);
    }
  });
}
