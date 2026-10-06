'use client';

import { useState } from 'react';
import { Plus, CreditCard as CreditCardIcon } from 'lucide-react';
import { Button, DeleteDialog, showToast } from '@/components/ui';
import { useCards, useDeleteCard, useCreateCard } from '@/features/cards/hooks';
import { CardForm } from '@/features/cards/components/card-form';
import { CardTile } from '@/features/cards/components/card-tile';

export default function CardsPage() {
  const { data: cards = [], isLoading } = useCards();
  const deleteCard = useDeleteCard();
  const createCard = useCreateCard();
  const [formOpen, setFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedCard, setDeletedCard] = useState<typeof cards[0] | null>(null);

  const handleDelete = (id: string) => {
    const card = cards.find(c => c.id === id);
    if (card) {
      setDeletedCard(card);
    }
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const card = deletedCard;
    await deleteCard.mutateAsync(deletingId);
    setDeletingId(null);
    setDeletedCard(null);
    if (card) {
      showToast({
        message: `"${card.bankName}" deleted`,
        undoLabel: 'Undo',
        onUndo: () => {
          createCard.mutate({
            bankName: card.bankName,
            cardStatus: card.cardStatus,
            cardName: card.cardName,
            lastFourDigits: card.lastFourDigits,
            currentOutstanding: card.currentOutstanding,
            creditLimit: card.creditLimit,
            minimumPayment: card.minimumPayment,
            annualInterestRate: card.annualInterestRate,
            statementDate: card.statementDate,
            paymentDueDate: card.paymentDueDate,
          });
        },
      });
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {deletingId && <DeleteDialog title="Delete card" itemName={cards.find(item => item.id === deletingId)?.bankName || 'this item'} onConfirm={confirmDelete} onClose={() => { setDeletingId(null); setDeletedCard(null); }} />}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="dashboard-heading">Credit Cards</h2>
          <p className="text-muted mt-1">Track your credit card balances</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Card
        </Button>
      </div>

      {formOpen && <CardForm onClose={() => setFormOpen(false)} />}

      {cards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-line">
          <CreditCardIcon className="w-16 h-16 text-line mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-ink mb-2">No credit cards yet</h3>
          <p className="text-muted mb-4">Add a credit card to track your spending</p>
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
