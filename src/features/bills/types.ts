import type { Bill as BillRow } from '@prisma/client';

/**
 * Wire shape of a bill — what `/api/bills` returns and components consume.
 *
 * Derived from the Prisma model so a schema change propagates here, with the two
 * types JSON cannot carry substituted: `Decimal` becomes `number` (converted by
 * `ok()` in `@/lib/api`) and `DateTime` becomes an ISO string.
 */
export type Bill = Omit<
  BillRow,
  'amount' | 'paidAmount' | 'dueDate' | 'paymentDate' | 'createdAt' | 'updatedAt'
> & {
  amount: number;
  paidAmount: number;
  dueDate: string;
  paymentDate: string | null;
  createdAt: string;
  updatedAt: string;
};

/** What the caller supplies when creating a bill; the server fills in the rest. */
export type BillInput = Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
