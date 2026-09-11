'use client';

import { format } from 'date-fns';
import { Receipt, Edit2, Trash2, Calendar, Check } from 'lucide-react';
import type { Bill } from '../types';

const th = 'px-4 py-3 text-left text-sm font-semibold text-[#071936]';

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
  return (
    <div className="bg-white rounded-2xl border border-[#D5ECEB] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F7F8F5] border-b border-[#D5ECEB]">
            <tr>
              <th className={th}>Bill</th>
              <th className={th}>Category</th>
              <th className={th}>Due Date</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Amount</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D5ECEB]">
            {bills.map(bill => (
              <tr key={bill.id} className="hover:bg-[#F7F8F5]/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#078D88] to-[#19C4B6] flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#071936]">{bill.name}</p>
                      <p className="text-sm text-[#4B5D7A]">{bill.provider || 'No provider'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-[#4B5D7A]">{bill.category || '-'}</td>
                <td className="px-4 py-3 text-sm text-[#4B5D7A]">
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
                <td className="px-4 py-3 text-right font-semibold text-[#071936]">
                  ${Number(bill.amount).toFixed(2)}
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
                      className="p-2 text-[#4B5D7A] hover:bg-[#F7F8F5] rounded-lg"
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
