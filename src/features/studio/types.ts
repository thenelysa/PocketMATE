import type { StudioPlan as PlanRow, Household, HouseholdMember, HouseholdExpense, HouseholdShare, User } from '@prisma/client';
export interface StatementRow { id: string; date: string; merchant: string; amount: number }
export type StudioPlan = Omit<PlanRow, 'balance' | 'income' | 'reserve' | 'dailySpending' | 'balanceDate' | 'nextPayday' | 'transactions'> & {
  balance: number; income: number; reserve: number; dailySpending: number;
  balanceDate: string; nextPayday: string | null; transactions: StatementRow[];
};
export type PlanInput = Pick<StudioPlan, 'balance' | 'income' | 'reserve' | 'dailySpending' | 'nextPayday' | 'cadence' | 'version'>;
export type HouseholdView = Pick<Household, 'id' | 'name'> & {
  members: (Pick<HouseholdMember, 'userId' | 'role'> & { user: Pick<User, 'name' | 'email'> })[];
  expenses: (Omit<HouseholdExpense, 'amount' | 'dueDate'> & { amount: number; dueDate: string; shares: (Omit<HouseholdShare, 'amount'> & { amount: number })[] })[];
};
