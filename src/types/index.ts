// Bill enums and types
export type BillCategory =
  | 'RENT'
  | 'ELECTRICITY'
  | 'WATER'
  | 'INTERNET'
  | 'PHONE'
  | 'INSURANCE'
  | 'SUBSCRIPTIONS'
  | 'EMI_LOANS'
  | 'BUSINESS_EXPENSES'
  | 'OTHER';

export type RecurrenceType = 'ONETIME' | 'MONTHLY' | 'YEARLY';
export type BillStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export interface Bill {
  id: string;
  userId: string;
  name: string;
  provider?: string;
  amount: number;
  dueDate: string;
  category: BillCategory;
  recurrence: RecurrenceType;
  notes?: string;
  status: BillStatus;
  isBusiness: boolean;
  paidAmount: number;
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillPayment {
  id: string;
  billId: string;
  amount: number;
  paymentDate: string;
  notes?: string;
  receiptPath?: string;
  createdAt: string;
}

// Credit Card types
export type CardStatus = 'ACTIVE' | 'BLOCKED' | 'CLOSED' | 'EXPIRED';

export interface CreditCard {
  id: string;
  userId: string;
  bankName: string;
  cardName: string;
  lastFourDigits: string;
  creditLimit: number;
  currentOutstanding: number;
  statementDate: number;
  paymentDueDate: number;
  minimumPayment: number;
  totalAmountDue: number;
  annualInterestRate: number;
  cardStatus: CardStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  description: string;
  amount: number;
  transactionDate: string;
  category?: BillCategory;
  createdAt: string;
}

export interface CardPayment {
  id: string;
  cardId: string;
  amount: number;
  paymentDate: string;
  notes?: string;
  createdAt: string;
}

// Reminder types
export type ReminderType =
  | 'BILL_DUE'
  | 'CARD_PAYMENT_DUE'
  | 'CARD_STATEMENT'
  | 'OVERDUE_BILL'
  | 'OVERDUE_CARD_PAYMENT'
  | 'CUSTOM';

export interface Reminder {
  id: string;
  userId: string;
  type: ReminderType;
  referenceId?: string;
  referenceType?: string;
  title: string;
  message?: string;
  remindAt: string;
  isSent: boolean;
  createdAt: string;
}

// User types
export interface UserProfile {
  userId: string;
  displayName?: string;
  preferredCurrency: string;
  reminderDaysBefore: number;
  monthlyBudget?: number;
}

// Budget tracking
export interface BudgetSummary {
  budget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}

// Dashboard types
export interface DashboardStats {
  totalOutstanding: number;
  totalOverdue: number;
  dueSoon: Bill[];
  overdueCount: number;
  paidThisMonth: number;
  totalCreditCardBalance: number;
  availableCredit: number;
  creditUtilization: number;
  creditCardCount: number;
}

// Sheet row types (for Google Sheets)
export interface SheetRow {
  [key: string]: string | number | boolean;
}

// Category display names
export const CATEGORY_LABELS: Record<BillCategory, string> = {
  RENT: 'Rent',
  ELECTRICITY: 'Electricity',
  WATER: 'Water',
  INTERNET: 'Internet',
  PHONE: 'Phone',
  INSURANCE: 'Insurance',
  SUBSCRIPTIONS: 'Subscriptions',
  EMI_LOANS: 'EMI/Loans',
  BUSINESS_EXPENSES: 'Business Expenses',
  OTHER: 'Other',
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NPR: '₨',
  USD: '$',
  EUR: '€',
  INR: '₹',
};
