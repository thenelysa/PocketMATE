'use client';

import { useCurrency } from '@/features/preferences/hooks';
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
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

export function CardTile({ card, onDelete }: { card: CreditCard; onDelete: (id: string) => void }) {
  const used = utilization(card);
  const currency = useCurrency();

  return (
    <div className="bg-white rounded-2xl border border-line p-6 relative shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-ink">{card.bankName}</h3>
          {card.cardName && <p className="text-sm text-muted">{card.cardName}</p>}
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
        <p className="text-2xl font-mono text-muted mb-4">•••• {card.lastFourDigits}</p>
      )}

      <div className="space-y-2">
        <Row label="Balance" value={money(card.currentOutstanding, currency)} />
        <Row label="Credit Limit" value={money(card.creditLimit, currency)} />
        <Row label="Min. Payment" value={money(card.minimumPayment, currency)} />
        <Row label="Interest Rate" value={`${Number(card.annualInterestRate).toFixed(2)}%`} />
      </div>

      <div className="mt-4 pt-4 border-t border-line">
        <Row label="Statement / Due" value={`${ordinal(card.statementDate ?? 1)} / ${ordinal(card.paymentDueDate ?? 15)}`} />
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted">Utilization</span>
          <span className="text-muted">{used.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-line rounded-full overflow-hidden">
          <div
            className="h-full bg-teal rounded-full"
            style={{ width: `${Math.min(used, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
