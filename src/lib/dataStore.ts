import { generateId } from './utils';
import { Bill, BillPayment, CreditCard, CardTransaction, CardPayment, Reminder, UserProfile, DashboardStats, BudgetSummary } from '@/types';
import { getCurrentMonthRange } from './utils';

// Local storage keys
const STORAGE_KEYS = {
  BILLS: 'billpay_bills',
  BILL_PAYMENTS: 'billpay_bill_payments',
  CARDS: 'billpay_cards',
  CARD_TRANSACTIONS: 'billpay_card_transactions',
  CARD_PAYMENTS: 'billpay_card_payments',
  REMINDERS: 'billpay_reminders',
  PROFILE: 'billpay_profile',
};

// Helper to get/set from localStorage
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

// User Profile
export function getProfile(): UserProfile | null {
  const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
  return data ? JSON.parse(data) : null;
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

// Bills
export function getBills(userId: string): Bill[] {
  const bills = getFromStorage<Bill>(STORAGE_KEYS.BILLS);
  return bills.filter(b => b.userId === userId);
}

export function getBillById(id: string): Bill | undefined {
  const bills = getFromStorage<Bill>(STORAGE_KEYS.BILLS);
  return bills.find(b => b.id === id);
}

export function addBill(bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Bill {
  const bills = getFromStorage<Bill>(STORAGE_KEYS.BILLS);
  const now = new Date().toISOString();
  const newBill: Bill = {
    ...bill,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  bills.push(newBill);
  saveToStorage(STORAGE_KEYS.BILLS, bills);
  return newBill;
}

export function updateBill(bill: Bill): void {
  const bills = getFromStorage<Bill>(STORAGE_KEYS.BILLS);
  const index = bills.findIndex(b => b.id === bill.id);
  if (index !== -1) {
    bills[index] = { ...bill, updatedAt: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.BILLS, bills);
  }
}

export function deleteBill(id: string): void {
  const bills = getFromStorage<Bill>(STORAGE_KEYS.BILLS);
  saveToStorage(STORAGE_KEYS.BILLS, bills.filter(b => b.id !== id));

  // Also delete associated payments
  const payments = getFromStorage<BillPayment>(STORAGE_KEYS.BILL_PAYMENTS);
  saveToStorage(STORAGE_KEYS.BILL_PAYMENTS, payments.filter(p => p.billId !== id));
}

export function restoreBill(bill: Bill, payments: BillPayment[]): void {
  const bills = getFromStorage<Bill>(STORAGE_KEYS.BILLS);
  bills.push(bill);
  saveToStorage(STORAGE_KEYS.BILLS, bills);

  // Restore associated payments
  const existingPayments = getFromStorage<BillPayment>(STORAGE_KEYS.BILL_PAYMENTS);
  saveToStorage(STORAGE_KEYS.BILL_PAYMENTS, [...existingPayments, ...payments]);
}

// Bill Payments
export function getBillPayments(billId: string): BillPayment[] {
  const payments = getFromStorage<BillPayment>(STORAGE_KEYS.BILL_PAYMENTS);
  return payments.filter(p => p.billId === billId);
}

export function addBillPayment(payment: Omit<BillPayment, 'id' | 'createdAt'>): BillPayment {
  const payments = getFromStorage<BillPayment>(STORAGE_KEYS.BILL_PAYMENTS);
  const newPayment: BillPayment = {
    ...payment,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  payments.push(newPayment);
  saveToStorage(STORAGE_KEYS.BILL_PAYMENTS, payments);
  return newPayment;
}

// Credit Cards
export function getCreditCards(userId: string): CreditCard[] {
  const cards = getFromStorage<CreditCard>(STORAGE_KEYS.CARDS);
  return cards.filter(c => c.userId === userId);
}

export function getCreditCardById(id: string): CreditCard | undefined {
  const cards = getFromStorage<CreditCard>(STORAGE_KEYS.CARDS);
  return cards.find(c => c.id === id);
}

export function addCreditCard(card: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>): CreditCard {
  const cards = getFromStorage<CreditCard>(STORAGE_KEYS.CARDS);
  const now = new Date().toISOString();
  const newCard: CreditCard = {
    ...card,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  cards.push(newCard);
  saveToStorage(STORAGE_KEYS.CARDS, cards);
  return newCard;
}

export function updateCreditCard(card: CreditCard): void {
  const cards = getFromStorage<CreditCard>(STORAGE_KEYS.CARDS);
  const index = cards.findIndex(c => c.id === card.id);
  if (index !== -1) {
    cards[index] = { ...card, updatedAt: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.CARDS, cards);
  }
}

export function deleteCreditCard(id: string): void {
  const cards = getFromStorage<CreditCard>(STORAGE_KEYS.CARDS);
  saveToStorage(STORAGE_KEYS.CARDS, cards.filter(c => c.id !== id));

  // Also delete associated transactions and payments
  const transactions = getFromStorage<CardTransaction>(STORAGE_KEYS.CARD_TRANSACTIONS);
  saveToStorage(STORAGE_KEYS.CARD_TRANSACTIONS, transactions.filter(t => t.cardId !== id));

  const payments = getFromStorage<CardPayment>(STORAGE_KEYS.CARD_PAYMENTS);
  saveToStorage(STORAGE_KEYS.CARD_PAYMENTS, payments.filter(p => p.cardId !== id));
}

export function restoreCreditCard(card: CreditCard, transactions: CardTransaction[], payments: CardPayment[]): void {
  const cards = getFromStorage<CreditCard>(STORAGE_KEYS.CARDS);
  cards.push(card);
  saveToStorage(STORAGE_KEYS.CARDS, cards);

  const existingTransactions = getFromStorage<CardTransaction>(STORAGE_KEYS.CARD_TRANSACTIONS);
  saveToStorage(STORAGE_KEYS.CARD_TRANSACTIONS, [...existingTransactions, ...transactions]);

  const existingPayments = getFromStorage<CardPayment>(STORAGE_KEYS.CARD_PAYMENTS);
  saveToStorage(STORAGE_KEYS.CARD_PAYMENTS, [...existingPayments, ...payments]);
}

// Card Transactions
export function getCardTransactions(cardId: string): CardTransaction[] {
  const transactions = getFromStorage<CardTransaction>(STORAGE_KEYS.CARD_TRANSACTIONS);
  return transactions.filter(t => t.cardId === cardId);
}

export function addCardTransaction(transaction: Omit<CardTransaction, 'id' | 'createdAt'>): CardTransaction {
  const transactions = getFromStorage<CardTransaction>(STORAGE_KEYS.CARD_TRANSACTIONS);
  const newTransaction: CardTransaction = {
    ...transaction,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  transactions.push(newTransaction);
  saveToStorage(STORAGE_KEYS.CARD_TRANSACTIONS, transactions);
  return newTransaction;
}

// Card Payments
export function getCardPayments(cardId: string): CardPayment[] {
  const payments = getFromStorage<CardPayment>(STORAGE_KEYS.CARD_PAYMENTS);
  return payments.filter(p => p.cardId === cardId);
}

export function addCardPayment(payment: Omit<CardPayment, 'id' | 'createdAt'>): CardPayment {
  const payments = getFromStorage<CardPayment>(STORAGE_KEYS.CARD_PAYMENTS);
  const newPayment: CardPayment = {
    ...payment,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  payments.push(newPayment);
  saveToStorage(STORAGE_KEYS.CARD_PAYMENTS, payments);
  return newPayment;
}

// Reminders
export function getReminders(userId: string): Reminder[] {
  const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  return reminders.filter(r => r.userId === userId);
}

export function addReminder(reminder: Omit<Reminder, 'id' | 'createdAt'>): Reminder {
  const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  const newReminder: Reminder = {
    ...reminder,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  reminders.push(newReminder);
  saveToStorage(STORAGE_KEYS.REMINDERS, reminders);
  return newReminder;
}

export function updateReminder(reminder: Reminder): void {
  const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  const index = reminders.findIndex(r => r.id === reminder.id);
  if (index !== -1) {
    reminders[index] = reminder;
    saveToStorage(STORAGE_KEYS.REMINDERS, reminders);
  }
}

export function deleteReminder(id: string): void {
  const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  saveToStorage(STORAGE_KEYS.REMINDERS, reminders.filter(r => r.id !== id));
}

export function restoreReminder(reminder: Reminder): void {
  const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  reminders.push(reminder);
  saveToStorage(STORAGE_KEYS.REMINDERS, reminders);
}

// Dashboard Stats
export function getDashboardStats(userId: string): DashboardStats {
  const bills = getBills(userId);
  const cards = getCreditCards(userId);
  const { start, end } = getCurrentMonthRange();

  // Calculate totals
  const unpaidBills = bills.filter(b => b.status !== 'PAID');
  const totalOutstanding = unpaidBills.reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);

  const overdueBills = bills.filter(b => b.status === 'OVERDUE');
  const totalOverdue = overdueBills.reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);

  const dueSoonBills = bills.filter(b => {
    if (b.status === 'PAID') return false;
    const dueDate = new Date(b.dueDate);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= now && dueDate <= weekFromNow;
  }).slice(0, 5);

  // Calculate paid this month
  const allPayments = getFromStorage<BillPayment>(STORAGE_KEYS.BILL_PAYMENTS);
  const paymentsThisMonth = allPayments.filter(p => {
    const paymentDate = new Date(p.paymentDate);
    return paymentDate >= start && paymentDate <= end;
  });
  const paidThisMonth = paymentsThisMonth.reduce((sum, p) => sum + p.amount, 0);

  // Credit card stats
  const totalCreditLimit = cards.reduce((sum, c) => sum + c.creditLimit, 0);
  const totalCreditCardBalance = cards.reduce((sum, c) => sum + c.currentOutstanding, 0);
  const availableCredit = totalCreditLimit - totalCreditCardBalance;
  const creditUtilization = totalCreditLimit > 0 ? (totalCreditCardBalance / totalCreditLimit) * 100 : 0;

  return {
    totalOutstanding,
    totalOverdue,
    dueSoon: dueSoonBills,
    overdueCount: overdueBills.length,
    paidThisMonth,
    totalCreditCardBalance,
    availableCredit,
    creditUtilization,
    creditCardCount: cards.length,
  };
}

// Mark overdue bills
export function markOverdueBills(userId: string): void {
  const bills = getBills(userId);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  bills.forEach(bill => {
    if (bill.status !== 'PAID') {
      const dueDate = new Date(bill.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < now) {
        updateBill({ ...bill, status: 'OVERDUE' });
      }
    }
  });
}

// Auto-create next monthly bill
export function createNextMonthlyBill(bill: Bill): Bill | null {
  if (bill.recurrence !== 'MONTHLY') return null;

  const nextDueDate = new Date(bill.dueDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);

  const nextBill = addBill({
    ...bill,
    dueDate: nextDueDate.toISOString(),
    status: 'UNPAID',
    paidAmount: 0,
    paymentDate: undefined,
  });

  return nextBill;
}

// Budget tracking
export function getBudgetSummary(userId: string): BudgetSummary | null {
  const profile = getProfile();
  if (!profile?.monthlyBudget) return null;

  const { start, end } = getCurrentMonthRange();
  const bills = getBills(userId);

  // Calculate spent this month (paid bills)
  const paidThisMonth = bills
    .filter(b => {
      if (b.status !== 'PAID' || !b.paymentDate) return false;
      const paymentDate = new Date(b.paymentDate);
      return paymentDate >= start && paymentDate <= end;
    })
    .reduce((sum, b) => sum + b.amount, 0);

  // Add credit card payments this month
  const cardPayments = getFromStorage<CardPayment>(STORAGE_KEYS.CARD_PAYMENTS);
  const cardPaymentsThisMonth = cardPayments.filter(p => {
    const paymentDate = new Date(p.paymentDate);
    return paymentDate >= start && paymentDate <= end;
  });
  const cardPaymentsTotal = cardPaymentsThisMonth.reduce((sum, p) => sum + p.amount, 0);

  const totalSpent = paidThisMonth + cardPaymentsTotal;
  const remaining = Math.max(0, profile.monthlyBudget - totalSpent);
  const percentUsed = profile.monthlyBudget > 0 ? (totalSpent / profile.monthlyBudget) * 100 : 0;

  return {
    budget: profile.monthlyBudget,
    spent: totalSpent,
    remaining,
    percentUsed: Math.min(100, percentUsed),
    isOverBudget: totalSpent > profile.monthlyBudget,
  };
}

// Payment history
export function getPaymentHistory(userId: string, limit: number = 50): (BillPayment & { billName?: string; billProvider?: string })[] {
  const bills = getBills(userId);
  const billMap = new Map(bills.map(b => [b.id, { name: b.name, provider: b.provider }]));

  const allPayments = getFromStorage<BillPayment>(STORAGE_KEYS.BILL_PAYMENTS);
  const cardPayments = getFromStorage<CardPayment>(STORAGE_KEYS.CARD_PAYMENTS);

  const billPayments = allPayments
    .filter(p => {
      const bill = billMap.get(p.billId);
      return bill && bills.find(b => b.id === p.billId)?.userId === userId;
    })
    .map(p => ({
      ...p,
      billName: billMap.get(p.billId)?.name,
      billProvider: billMap.get(p.billId)?.provider,
    }));

  const allCardPayments = cardPayments.map(p => {
    const card = getCreditCardById(p.cardId);
    return {
      ...p,
      billName: card?.cardName || card?.bankName || 'Card Payment',
      billProvider: 'Credit Card',
    };
  });

  const combined = [...billPayments, ...allCardPayments] as (BillPayment & { billName?: string; billProvider?: string })[];
  combined.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  return combined.slice(0, limit);
}
