'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCards, useCreateCard, useDeleteCard, CreditCard } from '@/lib/hooks';
import { Button } from '@/components/ui';
import { Plus, CreditCard as CreditCardIcon, X, Trash2 } from 'lucide-react';

export default function CardsPage() {
  const { user } = useAuth();
  const { data: cards = [], isLoading } = useCards();
  const createCard = useCreateCard();
  const deleteCard = useDeleteCard();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: '',
    card_name: '',
    last_four_digits: '',
    credit_limit: '',
    current_outstanding: '0',
    statement_date: '1',
    payment_due_date: '15',
    minimum_payment: '0',
    annual_interest_rate: '0',
  });

  const resetForm = () => {
    setFormData({
      bank_name: '',
      card_name: '',
      last_four_digits: '',
      credit_limit: '',
      current_outstanding: '0',
      statement_date: '1',
      payment_due_date: '15',
      minimum_payment: '0',
      annual_interest_rate: '0',
    });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCard.mutateAsync({
        bank_name: formData.bank_name,
        card_name: formData.card_name || null,
        last_four_digits: formData.last_four_digits || null,
        credit_limit: parseFloat(formData.credit_limit),
        current_outstanding: parseFloat(formData.current_outstanding),
        statement_date: parseInt(formData.statement_date),
        payment_due_date: parseInt(formData.payment_due_date),
        minimum_payment: parseFloat(formData.minimum_payment),
        annual_interest_rate: parseFloat(formData.annual_interest_rate),
        card_status: 'ACTIVE',
      });
      resetForm();
    } catch (err) {
      console.error('Failed to save card:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this card?')) {
      await deleteCard.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#078D88] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#071936]">Credit Cards</h2>
          <p className="text-[#4B5D7A] mt-1">Track your credit card balances</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Add Card
        </Button>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#D5ECEB]">
              <h3 className="text-lg font-bold text-[#071936]">Add New Card</h3>
              <button onClick={resetForm} className="text-[#4B5D7A] hover:text-[#071936]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#071936] mb-1">Bank Name *</label>
                <input
                  type="text"
                  required
                  value={formData.bank_name}
                  onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                  placeholder="e.g., Chase"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#071936] mb-1">Card Nickname</label>
                <input
                  type="text"
                  value={formData.card_name}
                  onChange={e => setFormData({ ...formData, card_name: e.target.value })}
                  className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                  placeholder="e.g., Sapphire Reserve"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#071936] mb-1">Last 4 Digits</label>
                <input
                  type="text"
                  maxLength={4}
                  value={formData.last_four_digits}
                  onChange={e => setFormData({ ...formData, last_four_digits: e.target.value })}
                  className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                  placeholder="1234"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1">Credit Limit *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.credit_limit}
                    onChange={e => setFormData({ ...formData, credit_limit: e.target.value })}
                    className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                    placeholder="5000.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1">Current Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_outstanding}
                    onChange={e => setFormData({ ...formData, current_outstanding: e.target.value })}
                    className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1">Statement Date</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.statement_date}
                    onChange={e => setFormData({ ...formData, statement_date: e.target.value })}
                    className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1">Payment Due Date</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.payment_due_date}
                    onChange={e => setFormData({ ...formData, payment_due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1">Minimum Payment</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minimum_payment}
                    onChange={e => setFormData({ ...formData, minimum_payment: e.target.value })}
                    className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.annual_interest_rate}
                    onChange={e => setFormData({ ...formData, annual_interest_rate: e.target.value })}
                    className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                    placeholder="24.99"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={createCard.isPending}>
                  {createCard.isPending ? 'Adding...' : 'Add Card'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cards List */}
      {cards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#D5ECEB]">
          <CreditCardIcon className="w-16 h-16 text-[#D5ECEB] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#071936] mb-2">No credit cards yet</h3>
          <p className="text-[#4B5D7A] mb-4">Add a credit card to track your spending</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Add Your First Card
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => (
            <div key={card.id} className="bg-white rounded-2xl border border-[#D5ECEB] p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[#071936]">{card.bank_name}</h3>
                  {card.card_name && (
                    <p className="text-sm text-[#4B5D7A]">{card.card_name}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(card.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {card.last_four_digits && (
                <p className="text-2xl font-mono text-[#4B5D7A] mb-4">
                  •••• {card.last_four_digits}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#4B5D7A]">Balance</span>
                  <span className="font-semibold text-[#071936]">
                    ${Number(card.current_outstanding).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4B5D7A]">Credit Limit</span>
                  <span className="font-semibold text-[#071936]">
                    ${Number(card.credit_limit).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4B5D7A]">Min. Payment</span>
                  <span className="font-semibold text-[#071936]">
                    ${Number(card.minimum_payment).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4B5D7A]">Interest Rate</span>
                  <span className="font-semibold text-[#071936]">
                    {Number(card.annual_interest_rate).toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#D5ECEB]">
                <div className="flex justify-between text-sm">
                  <span className="text-[#4B5D7A]">Statement / Due</span>
                  <span className="font-semibold text-[#071936]">
                    {card.statement_date}th / {card.payment_due_date}th
                  </span>
                </div>
              </div>

              {/* Credit utilization bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#4B5D7A]">Utilization</span>
                  <span className="text-[#4B5D7A]">
                    {card.credit_limit > 0
                      ? ((Number(card.current_outstanding) / Number(card.credit_limit)) * 100).toFixed(0)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-[#D5ECEB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#078D88] to-[#19C4B6] rounded-full"
                    style={{
                      width: `${
                        card.credit_limit > 0
                          ? Math.min((Number(card.current_outstanding) / Number(card.credit_limit)) * 100, 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
