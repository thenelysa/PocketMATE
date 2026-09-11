'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import { useCreateBill, useUpdateBill } from '../hooks';
import type { Bill } from '../types';

const CATEGORIES = ['Utilities', 'Insurance', 'Subscription', 'Rent', 'Phone', 'Internet', 'Other'];
const RECURRENCES = ['One-time', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];

const inputClass =
  'w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]';
const labelClass = 'block text-sm font-semibold text-[#071936] mb-1';

function initialValues(bill: Bill | null) {
  if (!bill) {
    return {
      name: '', provider: '', amount: '', dueDate: '',
      category: '', recurrence: '', notes: '', isBusiness: false, status: 'UNPAID',
    };
  }
  return {
    name: bill.name,
    provider: bill.provider ?? '',
    amount: String(bill.amount),
    dueDate: format(new Date(bill.dueDate), 'yyyy-MM-dd'),
    category: bill.category ?? '',
    recurrence: bill.recurrence ?? '',
    notes: bill.notes ?? '',
    isBusiness: bill.isBusiness,
    status: bill.status,
  };
}

/**
 * Create/edit modal. Pass `bill` to edit, `null` to create.
 * Mount it only while open — the form seeds its state from `bill` once, on mount.
 */
export function BillForm({ bill, onClose }: { bill: Bill | null; onClose: () => void }) {
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const [values, setValues] = useState(() => initialValues(bill));

  const isSaving = createBill.isPending || updateBill.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(values.amount);
    const payload = {
      name: values.name,
      provider: values.provider || null,
      amount,
      dueDate: new Date(values.dueDate).toISOString(),
      category: values.category || null,
      recurrence: values.recurrence || null,
      notes: values.notes || null,
      isBusiness: values.isBusiness,
      status: values.status,
      paidAmount: values.status === 'PAID' ? amount : 0,
      paymentDate: values.status === 'PAID' ? new Date().toISOString() : null,
    };

    try {
      if (bill) {
        await updateBill.mutateAsync({ id: bill.id, ...payload });
      } else {
        await createBill.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save bill:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#D5ECEB]">
          <h3 className="text-lg font-bold text-[#071936]">
            {bill ? 'Edit Bill' : 'Add New Bill'}
          </h3>
          <button onClick={onClose} className="text-[#4B5D7A] hover:text-[#071936]" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="bill-name" className={labelClass}>Bill Name *</label>
            <input
              id="bill-name"
              type="text"
              required
              value={values.name}
              onChange={e => setValues({ ...values, name: e.target.value })}
              className={inputClass}
              placeholder="e.g., Electric Bill"
            />
          </div>

          <div>
            <label htmlFor="bill-provider" className={labelClass}>Provider</label>
            <input
              id="bill-provider"
              type="text"
              value={values.provider}
              onChange={e => setValues({ ...values, provider: e.target.value })}
              className={inputClass}
              placeholder="e.g., ConEdison"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="bill-amount" className={labelClass}>Amount *</label>
              <input
                id="bill-amount"
                type="number"
                step="0.01"
                required
                value={values.amount}
                onChange={e => setValues({ ...values, amount: e.target.value })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="bill-due" className={labelClass}>Due Date *</label>
              <input
                id="bill-due"
                type="date"
                required
                value={values.dueDate}
                onChange={e => setValues({ ...values, dueDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="bill-category" className={labelClass}>Category</label>
              <select
                id="bill-category"
                value={values.category}
                onChange={e => setValues({ ...values, category: e.target.value })}
                className={inputClass}
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="bill-recurrence" className={labelClass}>Recurrence</label>
              <select
                id="bill-recurrence"
                value={values.recurrence}
                onChange={e => setValues({ ...values, recurrence: e.target.value })}
                className={inputClass}
              >
                <option value="">Select recurrence</option>
                {RECURRENCES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="bill-notes" className={labelClass}>Notes</label>
            <textarea
              id="bill-notes"
              value={values.notes}
              onChange={e => setValues({ ...values, notes: e.target.value })}
              className={inputClass}
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bill-business"
              checked={values.isBusiness ?? false}
              onChange={e => setValues({ ...values, isBusiness: e.target.checked })}
              className="w-4 h-4 text-[#078D88] border-[#D5ECEB] rounded focus:ring-[#078D88]"
            />
            <label htmlFor="bill-business" className="text-sm text-[#071936]">Business expense</label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? 'Saving...' : bill ? 'Update Bill' : 'Add Bill'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
