import type { CreditCard as CreditCardRow } from '@prisma/client';

/** Wire shape of a credit card — see the note in `@/features/bills/types`. */
export type CreditCard = Omit<
  CreditCardRow,
  | 'creditLimit' | 'currentOutstanding' | 'minimumPayment' | 'annualInterestRate'
  | 'createdAt' | 'updatedAt'
> & {
  creditLimit: number;
  currentOutstanding: number;
  minimumPayment: number;
  annualInterestRate: number;
  createdAt: string;
  updatedAt: string;
};

export type CreditCardInput = Omit<CreditCard, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
