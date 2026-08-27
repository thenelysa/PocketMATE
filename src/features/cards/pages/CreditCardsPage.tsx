import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, CardContent, Input, Select, Badge, Dialog, DialogTitle, DialogContent, DialogFooter, DialogHeader, Label, showToast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getCreditCards, addCreditCard, deleteCreditCard, getCardTransactions, addCardTransaction, addCardPayment, getProfile } from '@/lib/dataStore';
import { formatCurrency, calculateCreditUtilization, getUtilizationColor } from '@/lib/utils';
import { CreditCard, CardStatus, CardTransaction, CATEGORY_LABELS, BillCategory } from '@/types';
import { Plus, Trash2, CreditCard as CreditCardIcon, AlertTriangle } from 'lucide-react';

const cardStatusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'EXPIRED', label: 'Expired' },
];

export function CreditCardsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('NPR');

  const [formData, setFormData] = useState({
    bankName: '',
    cardName: '',
    lastFourDigits: '',
    creditLimit: '',
    statementDate: '',
    paymentDueDate: '',
    minimumPayment: '',
    annualInterestRate: '',
  });

  const [transactionData, setTransactionData] = useState({
    description: '',
    amount: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    const profile = getProfile();
    if (profile?.preferredCurrency) {
      setCurrency(profile.preferredCurrency);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadCards();
    }
  }, [user]);

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowAddDialog(true);
    }
  }, [searchParams]);

  const loadCards = () => {
    if (!user) return;
    const allCards = getCreditCards(user.id);
    setCards(allCards);
    setLoading(false);
  };

  const handleAddCard = () => {
    if (!user) return;

    addCreditCard({
      userId: user.id,
      bankName: formData.bankName,
      cardName: formData.cardName,
      lastFourDigits: formData.lastFourDigits.slice(-4),
      creditLimit: parseFloat(formData.creditLimit),
      currentOutstanding: 0,
      statementDate: parseInt(formData.statementDate) || 1,
      paymentDueDate: parseInt(formData.paymentDueDate) || 15,
      minimumPayment: parseFloat(formData.minimumPayment) || 0,
      totalAmountDue: 0,
      annualInterestRate: parseFloat(formData.annualInterestRate) || 0,
      cardStatus: 'ACTIVE',
    });

    setFormData({
      bankName: '',
      cardName: '',
      lastFourDigits: '',
      creditLimit: '',
      statementDate: '',
      paymentDueDate: '',
      minimumPayment: '',
      annualInterestRate: '',
    });
    setShowAddDialog(false);
    loadCards();
    showToast('Card added successfully', 'success');
  };

  const handleDeleteCard = (cardId: string) => {
    deleteCreditCard(cardId);
    setShowDeleteDialog(false);
    setCardToDelete(null);
    loadCards();
    showToast('Card deleted successfully', 'success');
  };

  const handleAddTransaction = () => {
    if (!selectedCard || !user) return;

    const transaction = {
      cardId: selectedCard.id,
      description: transactionData.description,
      amount: parseFloat(transactionData.amount),
      transactionDate: transactionData.transactionDate,
    };

    addCardTransaction(transaction);
    setTransactionData({
      description: '',
      amount: '',
      transactionDate: new Date().toISOString().split('T')[0],
    });
    setShowTransactionDialog(false);
    loadCards();
    showToast('Transaction added successfully', 'success');
  };

  const handleAddPayment = () => {
    if (!selectedCard || !user) return;

    addCardPayment({
      cardId: selectedCard.id,
      amount: parseFloat(paymentData.amount),
      paymentDate: paymentData.paymentDate,
      notes: paymentData.notes,
    });

    setPaymentData({
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowPaymentDialog(false);
    loadCards();
    showToast('Payment recorded successfully', 'success');
  };

  const getUtilization = (card: CreditCard) => {
    if (card.creditLimit === 0) return 0;
    return (card.currentOutstanding / card.creditLimit) * 100;
  };

  const getUtilizationBarColor = (utilization: number) => {
    if (utilization > 75) return 'bg-red-500';
    if (utilization > 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#102A4C]">Credit Cards</h2>
          <p className="text-[#4B5D7A]">Manage your credit cards</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2 bg-gradient-to-r from-[#078D88] to-[#19C4B6] text-white hover:opacity-90">
          <Plus className="h-4 w-4" />
          Add Card
        </Button>
      </div>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <Card className="border border-[#D5ECEB] bg-[#F7F8F5]">
          <CardContent className="py-12 text-center">
            <img src="/images/card.png" alt="No cards" className="h-24 w-auto mx-auto mb-4 opacity-80" />
            <p className="text-[#4B5D7A] mb-2">No credit cards added yet</p>
            <Button
              variant="link"
              onClick={() => setShowAddDialog(true)}
              className="text-[#078D88] hover:text-[#065F5F] mt-2"
            >
              Add your first card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const utilization = getUtilization(card);
            const availableCredit = card.creditLimit - card.currentOutstanding;

            return (
              <Card key={card.id} className="border border-[#D5ECEB] bg-[#F7F8F5] hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-[#102A4C]">{card.bankName}</h3>
                      <p className="text-sm text-[#4B5D7A]">{card.cardName}</p>
                      <p className="text-xs text-[#4B5D7A] mt-1 font-mono">
                        •••• {card.lastFourDigits}
                      </p>
                    </div>
                    <Badge
                      className={`${
                        card.cardStatus === 'ACTIVE'
                          ? 'bg-[#F0FAF4] text-[#24966B] border border-[#24966B]'
                          : card.cardStatus === 'BLOCKED'
                          ? 'bg-[#FFF1F2] text-[#E6535F] border border-[#E6535F]'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {card.cardStatus}
                    </Badge>
                  </div>

                  {/* Utilization */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#4B5D7A]">Credit Used</span>
                      <span className={`font-semibold ${getUtilizationColor(utilization)}`}>
                        {utilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-[#D5ECEB] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getUtilizationBarColor(utilization)}`}
                        style={{ width: `${Math.min(100, utilization)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-[#4B5D7A]">Outstanding</p>
                      <p className="text-sm font-bold text-[#102A4C]">
                        {formatCurrency(card.currentOutstanding, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#4B5D7A]">Available</p>
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(availableCredit, currency)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCard(card);
                        setTransactionData({
                          description: '',
                          amount: '',
                          transactionDate: new Date().toISOString().split('T')[0],
                        });
                        setShowTransactionDialog(true);
                      }}
                      className="flex-1 border-[#078D88] text-[#078D88] hover:bg-[#F0FAF4]"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Spend
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCard(card);
                        setPaymentData({
                          amount: '',
                          paymentDate: new Date().toISOString().split('T')[0],
                          notes: '',
                        });
                        setShowPaymentDialog(true);
                      }}
                      className="flex-1 border-[#078D88] text-[#078D88] hover:bg-[#F0FAF4]"
                    >
                      Pay
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCardToDelete(card.id);
                        setShowDeleteDialog(true);
                      }}
                      className="border-red-200 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Card Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Credit Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bank Name</Label>
                <Input
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g., Himalayan Bank"
                />
              </div>
              <div>
                <Label>Card Nickname</Label>
                <Input
                  value={formData.cardName}
                  onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                  placeholder="e.g., My Visa Card"
                />
              </div>
            </div>
            <div>
              <Label>Last 4 Digits</Label>
              <Input
                value={formData.lastFourDigits}
                onChange={(e) => setFormData({ ...formData, lastFourDigits: e.target.value })}
                placeholder="1234"
                maxLength={4}
              />
            </div>
            <div>
              <Label>Credit Limit</Label>
              <Input
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                placeholder="100000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statement Date</Label>
                <Input
                  type="number"
                  value={formData.statementDate}
                  onChange={(e) => setFormData({ ...formData, statementDate: e.target.value })}
                  placeholder="1-28"
                  min={1}
                  max={28}
                />
              </div>
              <div>
                <Label>Payment Due Date</Label>
                <Input
                  type="number"
                  value={formData.paymentDueDate}
                  onChange={(e) => setFormData({ ...formData, paymentDueDate: e.target.value })}
                  placeholder="1-28"
                  min={1}
                  max={28}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimum Payment</Label>
                <Input
                  type="number"
                  value={formData.minimumPayment}
                  onChange={(e) => setFormData({ ...formData, minimumPayment: e.target.value })}
                  placeholder="500"
                />
              </div>
              <div>
                <Label>Interest Rate (%)</Label>
                <Input
                  type="number"
                  value={formData.annualInterestRate}
                  onChange={(e) => setFormData({ ...formData, annualInterestRate: e.target.value })}
                  placeholder="18"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCard} className="bg-[#078D88] hover:bg-[#067a75]">Add Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={showTransactionDialog} onClose={() => setShowTransactionDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Input
                value={transactionData.description}
                onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
                placeholder="e.g., Grocery shopping"
              />
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={transactionData.amount}
                onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={transactionData.transactionDate}
                onChange={(e) => setTransactionData({ ...transactionData, transactionDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransactionDialog(false)}>Cancel</Button>
            <Button onClick={handleAddTransaction} className="bg-[#078D88] hover:bg-[#067a75]">Add Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Input
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                placeholder="Any notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button onClick={handleAddPayment} className="bg-[#078D88] hover:bg-[#067a75]">Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Credit Card</DialogTitle>
          </DialogHeader>
          <div className="text-center">
            <img src="/images/delete.png" alt="Delete" className="w-20 h-20 mx-auto mb-4" />
            <p className="text-[#4B5D7A]">Are you sure you want to delete this credit card? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onClick={() => cardToDelete && handleDeleteCard(cardToDelete)} className="bg-red-500 hover:bg-red-600">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CreditCardsPage;
