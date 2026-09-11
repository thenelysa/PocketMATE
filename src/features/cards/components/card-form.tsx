'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import { useCreateCard } from '../hooks';

const inputClass =
  'w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]';
const labelClass = 'block text-sm font-semibold text-[#071936] mb-1';

const EMPTY = {
  bankName: '',
  cardName: '',
  lastFourDigits: '',
  creditLimit: '',
  currentOutstanding: '0',
  statementDate: '1',
  paymentDueDate: '15',
  minimumPayment: '0',
  annualInterestRate: '0',
};

/** Create-only modal — the API has no card update endpoint yet. */
export function CardForm({ onClose }: { onClose: () => void }) {
  const createCard = useCreateCard();
  const [values, setValues] = useState(EMPTY);

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues({ ...values, [key]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCard.mutateAsync({
        bankName: values.bankName,
        cardName: values.cardName || null,
        lastFourDigits: values.lastFourDigits || null,
        creditLimit: parseFloat(values.creditLimit),
        currentOutstanding: parseFloat(values.currentOutstanding),
        statementDate: parseInt(values.statementDate),
        paymentDueDate: parseInt(values.paymentDueDate),
        minimumPayment: parseFloat(values.minimumPayment),
        annualInterestRate: parseFloat(values.annualInterestRate),
        cardStatus: 'ACTIVE',
      });
      onClose();
    } catch (err) {
      console.error('Failed to save card:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#D5ECEB]">
          <h3 className="text-lg font-bold text-[#071936]">Add New Card</h3>
          <button onClick={onClose} className="text-[#4B5D7A] hover:text-[#071936]" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="card-bank" className={labelClass}>Bank Name *</label>
            <input id="card-bank" type="text" required value={values.bankName}
              onChange={set('bankName')} className={inputClass} placeholder="e.g., Chase" />
          </div>

          <div>
            <label htmlFor="card-nickname" className={labelClass}>Card Nickname</label>
            <input id="card-nickname" type="text" value={values.cardName}
              onChange={set('cardName')} className={inputClass} placeholder="e.g., Sapphire Reserve" />
          </div>

          <div>
            <label htmlFor="card-last4" className={labelClass}>Last 4 Digits</label>
            <input id="card-last4" type="text" maxLength={4} value={values.lastFourDigits}
              onChange={set('lastFourDigits')} className={inputClass} placeholder="1234" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="card-limit" className={labelClass}>Credit Limit *</label>
              <input id="card-limit" type="number" step="0.01" required value={values.creditLimit}
                onChange={set('creditLimit')} className={inputClass} placeholder="5000.00" />
            </div>
            <div>
              <label htmlFor="card-balance" className={labelClass}>Current Balance</label>
              <input id="card-balance" type="number" step="0.01" value={values.currentOutstanding}
                onChange={set('currentOutstanding')} className={inputClass} placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="card-statement" className={labelClass}>Statement Date</label>
              <input id="card-statement" type="number" min="1" max="31" value={values.statementDate}
                onChange={set('statementDate')} className={inputClass} />
            </div>
            <div>
              <label htmlFor="card-due" className={labelClass}>Payment Due Date</label>
              <input id="card-due" type="number" min="1" max="31" value={values.paymentDueDate}
                onChange={set('paymentDueDate')} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="card-min" className={labelClass}>Minimum Payment</label>
              <input id="card-min" type="number" step="0.01" value={values.minimumPayment}
                onChange={set('minimumPayment')} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label htmlFor="card-apr" className={labelClass}>Interest Rate (%)</label>
              <input id="card-apr" type="number" step="0.01" value={values.annualInterestRate}
                onChange={set('annualInterestRate')} className={inputClass} placeholder="24.99" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={createCard.isPending}>
              {createCard.isPending ? 'Adding...' : 'Add Card'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
