'use client';

import { Trash2 } from 'lucide-react';
import { money, ordinal } from '@/lib/format';
import type { CreditCard } from '../types';

/** Percentage of the limit currently drawn, clamped to 0–100 for the bar width. */
function utilization(card: CreditCard) {
  const limit = Number(card.creditLimit);
  if (!(limit > 0)) return 0;
  return (Number(card.currentOutstanding) / limit) * 100;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[#4B5D7A]">{label}</span>
      <span className="font-semibold text-[#071936]">{value}</span>
    </div>
  );
}

export function CardTile({ card, onDelete }: { card: CreditCard; onDelete: (id: string) => void }) {
  const used = utilization(card);

  return (
    <div className="bg-white rounded-2xl border border-[#D5ECEB] p-6 relative">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#071936]">{card.bankName}</h3>
          {card.cardName && <p className="text-sm text-[#4B5D7A]">{card.cardName}</p>}
        </div>
        <button
          onClick={() => onDelete(card.id)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
          aria-label={`Delete ${card.bankName} card`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {card.lastFourDigits && (
        <p className="text-2xl font-mono text-[#4B5D7A] mb-4">•••• {card.lastFourDigits}</p>
      )}

      <div className="space-y-2">
        <Row label="Balance" value={money(card.currentOutstanding)} />
        <Row label="Credit Limit" value={money(card.creditLimit)} />
        <Row label="Min. Payment" value={money(card.minimumPayment)} />
        <Row label="Interest Rate" value={`${Number(card.annualInterestRate).toFixed(2)}%`} />
      </div>

      <div className="mt-4 pt-4 border-t border-[#D5ECEB]">
        <Row label="Statement / Due" value={`${ordinal(card.statementDate ?? 1)} / ${ordinal(card.paymentDueDate ?? 15)}`} />
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[#4B5D7A]">Utilization</span>
          <span className="text-[#4B5D7A]">{used.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-[#D5ECEB] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#078D88] to-[#19C4B6] rounded-full"
            style={{ width: `${Math.min(used, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
