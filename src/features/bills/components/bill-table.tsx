'use client';

import { useCurrency } from '@/features/preferences/hooks';
import { format } from 'date-fns';
import { Receipt, Edit2, Trash2, Calendar, Check } from 'lucide-react';
import { money } from '@/lib/format';
import type { Bill } from '../types';

const th = 'px-4 py-3 text-left text-sm font-semibold text-ink';

export function BillTable({
  bills,
  onEdit,
  onDelete,
  onMarkPaid,
}: {
  bills: Bill[];
  onEdit: (bill: Bill) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (bill: Bill) => void;
}) {
  const currency = useCurrency();
  return (
    <div className="bg-white rounded-2xl border border-line overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-paper border-b border-line">
            <tr>
              <th className={th}>Bill</th>
              <th className={th}>Category</th>
              <th className={th}>Due Date</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Amount</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {bills.map(bill => (
              <tr key={bill.id} className="hover:bg-paper/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{bill.name}</p>
                      <p className="text-sm text-muted">{bill.provider || 'No provider'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted">{bill.category || '-'}</td>
                <td className="px-4 py-3 text-sm text-muted">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(bill.dueDate), 'MMM d, yyyy')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      bill.status === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {bill.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-ink">
                  {money(bill.amount, currency)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {bill.status === 'UNPAID' && (
                      <button
                        onClick={() => onMarkPaid(bill)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Mark as paid"
                        aria-label={`Mark ${bill.name} as paid`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(bill)}
                      className="p-2 text-muted hover:bg-paper rounded-lg"
                      aria-label={`Edit ${bill.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(bill.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      aria-label={`Delete ${bill.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
