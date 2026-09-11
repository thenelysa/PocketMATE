'use client';

import { useState } from 'react';
import { Plus, CreditCard as CreditCardIcon } from 'lucide-react';
import { Button } from '@/components/ui';
import { useCards, useDeleteCard } from '@/features/cards/hooks';
import { CardForm } from '@/features/cards/components/card-form';
import { CardTile } from '@/features/cards/components/card-tile';

export default function CardsPage() {
  const { data: cards = [], isLoading } = useCards();
  const deleteCard = useDeleteCard();
  const [formOpen, setFormOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this card?')) {
      await deleteCard.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#078D88] border-t-transparent" />
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
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Card
        </Button>
      </div>

      {formOpen && <CardForm onClose={() => setFormOpen(false)} />}

      {cards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#D5ECEB]">
          <CreditCardIcon className="w-16 h-16 text-[#D5ECEB] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#071936] mb-2">No credit cards yet</h3>
          <p className="text-[#4B5D7A] mb-4">Add a credit card to track your spending</p>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Your First Card
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => (
            <CardTile key={card.id} card={card} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
