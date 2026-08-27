import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'NPR'): string {
  const symbols: Record<string, string> = {
    NPR: '₨',
    USD: '$',
    EUR: '€',
    INR: '₹',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getDaysUntil(dateString: string): number {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = date.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isOverdue(dateString: string): boolean {
  return getDaysUntil(dateString) < 0;
}

export function isDueSoon(dateString: string, days: number = 7): boolean {
  const daysUntil = getDaysUntil(dateString);
  return daysUntil >= 0 && daysUntil <= days;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth());
}

export function calculateCreditUtilization(outstanding: number, limit: number): number {
  if (limit === 0) return 0;
  return (outstanding / limit) * 100;
}

export function getUtilizationColor(utilization: number): string {
  if (utilization < 50) return 'text-green-600';
  if (utilization < 75) return 'text-yellow-600';
  return 'text-red-600';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800';
    case 'OVERDUE':
      return 'bg-red-100 text-red-800';
    case 'PARTIALLY_PAID':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'RENT':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'ELECTRICITY':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'WATER':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'INTERNET':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'PHONE':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'INSURANCE':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'SUBSCRIPTIONS':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'EMI_LOANS':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'BUSINESS_EXPENSES':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'RENT':
      return '🏠';
    case 'ELECTRICITY':
      return '💡';
    case 'WATER':
      return '💧';
    case 'INTERNET':
      return '🌐';
    case 'PHONE':
      return '📱';
    case 'INSURANCE':
      return '🛡️';
    case 'SUBSCRIPTIONS':
      return '📺';
    case 'EMI_LOANS':
      return '🏦';
    case 'BUSINESS_EXPENSES':
      return '💼';
    default:
      return '📄';
  }
}
