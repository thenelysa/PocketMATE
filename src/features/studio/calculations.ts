import { addDays, addMonths, format, parseISO, startOfDay, differenceInCalendarDays } from 'date-fns';
import type { Bill } from '@/features/bills/types';
import type { CreditCard } from '@/features/cards/types';
import type { StatementRow, StudioPlan } from './types';
export const dateKey = (date: Date) => format(date, 'yyyy-MM-dd');
export const cents = (value: number) => Math.round(value * 100);
export interface FlowEvent { date: string; name: string; amount: number; kind: 'income' | 'bill' | 'card' | 'spending' | 'purchase' }
export interface Scenario { purchase?: number; shift?: number; cardExtra?: number }
export function forecast(plan: StudioPlan, bills: Bill[], cards: CreditCard[], scenario: Scenario = {}, today = new Date()) {
  const start = startOfDay(today), end = addDays(start, 60);
  const events: FlowEvent[] = [];
  const push = (date: Date, name: string, amount: number, kind: FlowEvent['kind']) => {
    if (date <= end) events.push({ date: dateKey(date < start ? start : date), name, amount: cents(amount), kind });
  };
  if (plan.nextPayday && plan.income > 0) {
    const original = parseISO(plan.nextPayday);
    for (let i = 0; i < 1000; i++) {
      const payday = plan.cadence === 30 ? addMonths(original, i) : addDays(original, plan.cadence * i);
      if (payday > end) break;
      if (payday >= start) push(payday, 'Payday', plan.income, 'income');
    }
  }
  for (const bill of bills) {
    const original = startOfDay(parseISO(bill.dueDate));
    const recurrence = bill.recurrence?.toLowerCase();
    const months = recurrence === 'monthly' ? 1 : recurrence === 'quarterly' ? 3 : recurrence === 'yearly' ? 12 : 0;
    // A paid bill's next occurrence is projected; only the current occurrence has paidAmount.
    for (let i = 0; i < 1000; i++) {
      if (i && !months && recurrence !== 'weekly') break;
      const date = months ? addMonths(original, months * i) : addDays(original, recurrence === 'weekly' ? 7 * i : 0);
      if (date > addDays(end, 30)) break;
      if (i === 0 && bill.status === 'PAID') continue;
      if (i > 0 && date < start) continue;
      const remaining = i === 0 ? Math.max(0, bill.amount - (bill.paidAmount || 0)) : bill.amount;
      push(addDays(date, scenario.shift ?? 0), bill.name, -remaining, 'bill');
    }
  }
  for (const card of cards.filter(c => c.cardStatus !== 'CLOSED')) {
    let remaining = cents(card.currentOutstanding || 0);
    for (let i = 0; i < 3 && remaining > 0; i++) {
      const month = addMonths(new Date(start.getFullYear(), start.getMonth(), 1), i);
      const last = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      const due = new Date(month.getFullYear(), month.getMonth(), Math.min(card.paymentDueDate || 1, last));
      if (due < start) continue;
      const payment = Math.min(remaining, cents((card.minimumPayment || 0) + (scenario.cardExtra || 0)));
      push(due, `${card.bankName} payment`, -payment / 100, 'card'); remaining -= payment;
    }
  }
  if (scenario.purchase) push(start, 'Planned purchase', -scenario.purchase, 'purchase');
  for (let i = 0; i <= 60; i++) if (plan.dailySpending) push(addDays(start, i), 'Everyday spending', -plan.dailySpending, 'spending');
  events.sort((a, b) => a.date.localeCompare(b.date) || a.amount - b.amount);
  let balance = cents(plan.balance), lowest = balance;
  const days = Array.from({ length: 61 }, (_, i) => {
    const date = dateKey(addDays(start, i));
    const daily = events.filter(event => event.date === date);
    // Expenses before income is deliberately conservative for same-day payments.
    for (const event of daily) { balance += event.amount; lowest = Math.min(lowest, balance); }
    return { date, balance: balance / 100, events: daily };
  });
  return { days, events, lowest: lowest / 100, endBalance: balance / 100, room: Math.max(0, lowest / 100 - plan.reserve) };
}

export function detectSubscriptions(rows: StatementRow[]) {
  const groups = new Map<string, StatementRow[]>();
  for (const row of rows) {
    if (row.amount <= 0) continue;
    const key = row.merchant.trim().toLowerCase().replace(/\s+/g, ' ');
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  return [...groups.values()].flatMap(group => {
    group.sort((a,b) => a.date.localeCompare(b.date));
    if (group.length < 2) return [];
    const last = group.at(-1)!, previous = group.at(-2)!;
    const gap = differenceInCalendarDays(parseISO(last.date), parseISO(previous.date));
    const interval = gap >= 5 && gap <= 9 ? 'weekly' : gap >= 25 && gap <= 35 ? 'monthly' : gap >= 350 && gap <= 380 ? 'yearly' : null;
    if (!interval) return [];
    const next = interval === 'weekly' ? addDays(parseISO(last.date), 7) : addMonths(parseISO(last.date), interval === 'monthly' ? 1 : 12);
    return [{ merchant: last.merchant, amount: last.amount, previousAmount: previous.amount, increase: Math.round((last.amount - previous.amount) * 100) / 100, interval, nextDate: dateKey(next), count: group.length }];
  });
}

export function splitCents(amount: number, userIds: string[]) {
  const total = cents(amount), base = Math.floor(total / userIds.length);
  return userIds.map((userId, i) => ({ userId, amount: (base + (i < total % userIds.length ? 1 : 0)) / 100 }));
}
