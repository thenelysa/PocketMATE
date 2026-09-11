import type { Reminder as ReminderRow } from '@prisma/client';

/**
 * Wire shape of a reminder — see the note in `@/features/bills/types`.
 *
 * The `reminders` table is **polymorphic**: a row points at any kind of record
 * via `referenceType` + `referenceId`, not at a bill specifically. Bill
 * reminders use `type: 'BILL'`, `referenceType: 'bill'`.
 */
export type Reminder = Omit<ReminderRow, 'remindAt' | 'createdAt'> & {
  remindAt: string;
  createdAt: string | null;
};

export type ReminderInput = Omit<Reminder, 'id' | 'userId' | 'createdAt'>;

/** `referenceType` for a reminder attached to a bill. */
export const BILL_REFERENCE = 'bill';
/** `type` for a bill-due reminder. */
export const BILL_REMINDER = 'BILL';
