// Google Sheets Service - MVP uses localStorage
// For production, integrate with Google Sheets API via a backend

import { Bill, BillPayment, CreditCard, CardTransaction, CardPayment, Reminder, UserProfile } from '@/types';

const STORAGE_KEYS = {
  BILLS: 'billpay_bills',
  BILL_PAYMENTS: 'billpay_bill_payments',
  CARDS: 'billpay_cards',
  CARD_TRANSACTIONS: 'billpay_card_transactions',
  CARD_PAYMENTS: 'billpay_card_payments',
  REMINDERS: 'billpay_reminders',
  PROFILE: 'billpay_profile',
};

function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Bills
export async function getBills(userId: string): Promise<Bill[]> {
  const bills = getFromStorage<Bill>(STORAGE_KEYS.BILLS);
  return bills.filter(b => b.userId === userId);
}

export async function addBill(bill: Bill): Promise<boolean> {
  const bills = getFromStorage<Bill>(STORAGE_KEYS.BILLS);
  bills.push(bill);
  saveToStorage(STORAGE_KEYS.BILLS, bills);
  return true;
}

export async function updateBill(bill: Bill): Promise<boolean> {
  const bills = getFromStorage<Bill>(STORAGE_KEYS.BILLS);
  const index = bills.findIndex(b => b.id === bill.id);
  if (index === -1) return false;
  bills[index] = bill;
  saveToStorage(STORAGE_KEYS.BILLS, bills);
  return true;
}

export async function deleteBill(id: string): Promise<boolean> {
  const bills = getFromStorage<Bill>(STORAGE_KEYS.BILLS);
  saveToStorage(STORAGE_KEYS.BILLS, bills.filter(b => b.id !== id));
  const payments = getFromStorage<BillPayment>(STORAGE_KEYS.BILL_PAYMENTS);
  saveToStorage(STORAGE_KEYS.BILL_PAYMENTS, payments.filter(p => p.billId !== id));
  return true;
}

// Bill Payments
export async function getBillPayments(billId: string): Promise<BillPayment[]> {
  const payments = getFromStorage<BillPayment>(STORAGE_KEYS.BILL_PAYMENTS);
  return payments.filter(p => p.billId === billId);
}

export async function addBillPayment(payment: BillPayment): Promise<boolean> {
  const payments = getFromStorage<BillPayment>(STORAGE_KEYS.BILL_PAYMENTS);
  payments.push(payment);
  saveToStorage(STORAGE_KEYS.BILL_PAYMENTS, payments);
  return true;
}

// Credit Cards
export async function getCreditCards(userId: string): Promise<CreditCard[]> {
  const cards = getFromStorage<CreditCard>(STORAGE_KEYS.CARDS);
  return cards.filter(c => c.userId === userId);
}

export async function addCreditCard(card: CreditCard): Promise<boolean> {
  const cards = getFromStorage<CreditCard>(STORAGE_KEYS.CARDS);
  cards.push(card);
  saveToStorage(STORAGE_KEYS.CARDS, cards);
  return true;
}

export async function updateCreditCard(card: CreditCard): Promise<boolean> {
  const cards = getFromStorage<CreditCard>(STORAGE_KEYS.CARDS);
  const index = cards.findIndex(c => c.id === card.id);
  if (index === -1) return false;
  cards[index] = card;
  saveToStorage(STORAGE_KEYS.CARDS, cards);
  return true;
}

export async function deleteCreditCard(id: string): Promise<boolean> {
  const cards = getFromStorage<CreditCard>(STORAGE_KEYS.CARDS);
  saveToStorage(STORAGE_KEYS.CARDS, cards.filter(c => c.id !== id));
  const transactions = getFromStorage<CardTransaction>(STORAGE_KEYS.CARD_TRANSACTIONS);
  saveToStorage(STORAGE_KEYS.CARD_TRANSACTIONS, transactions.filter(t => t.cardId !== id));
  const payments = getFromStorage<CardPayment>(STORAGE_KEYS.CARD_PAYMENTS);
  saveToStorage(STORAGE_KEYS.CARD_PAYMENTS, payments.filter(p => p.cardId !== id));
  return true;
}

// Card Transactions
export async function getCardTransactions(cardId: string): Promise<CardTransaction[]> {
  const transactions = getFromStorage<CardTransaction>(STORAGE_KEYS.CARD_TRANSACTIONS);
  return transactions.filter(t => t.cardId === cardId);
}

export async function addCardTransaction(transaction: CardTransaction): Promise<boolean> {
  const transactions = getFromStorage<CardTransaction>(STORAGE_KEYS.CARD_TRANSACTIONS);
  transactions.push(transaction);
  saveToStorage(STORAGE_KEYS.CARD_TRANSACTIONS, transactions);
  return true;
}

// Card Payments
export async function getCardPayments(cardId: string): Promise<CardPayment[]> {
  const payments = getFromStorage<CardPayment>(STORAGE_KEYS.CARD_PAYMENTS);
  return payments.filter(p => p.cardId === cardId);
}

export async function addCardPayment(payment: CardPayment): Promise<boolean> {
  const payments = getFromStorage<CardPayment>(STORAGE_KEYS.CARD_PAYMENTS);
  payments.push(payment);
  saveToStorage(STORAGE_KEYS.CARD_PAYMENTS, payments);
  return true;
}

// Reminders
export async function getReminders(userId: string): Promise<Reminder[]> {
  const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  return reminders.filter(r => r.userId === userId);
}

export async function addReminder(reminder: Reminder): Promise<boolean> {
  const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  reminders.push(reminder);
  saveToStorage(STORAGE_KEYS.REMINDERS, reminders);
  return true;
}

export async function updateReminder(reminder: Reminder): Promise<boolean> {
  const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  const index = reminders.findIndex(r => r.id === reminder.id);
  if (index === -1) return false;
  reminders[index] = reminder;
  saveToStorage(STORAGE_KEYS.REMINDERS, reminders);
  return true;
}

export async function deleteReminder(id: string): Promise<boolean> {
  const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  saveToStorage(STORAGE_KEYS.REMINDERS, reminders.filter(r => r.id !== id));
  return true;
}

// User Profile
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const profiles = getFromStorage<UserProfile>(STORAGE_KEYS.PROFILE);
  return profiles.find(p => p.userId === userId) || null;
}

export async function saveProfile(profile: UserProfile): Promise<boolean> {
  const profiles = getFromStorage<UserProfile>(STORAGE_KEYS.PROFILE);
  const index = profiles.findIndex(p => p.userId === profile.userId);
  if (index === -1) {
    profiles.push(profile);
  } else {
    profiles[index] = profile;
  }
  saveToStorage(STORAGE_KEYS.PROFILE, profiles);
  return true;
}
