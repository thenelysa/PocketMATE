import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header, useSidebarPadding } from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui';
import { Input } from '@/components/ui';
import { Select } from '@/components/ui';
import { Plus, Receipt, CreditCard } from 'lucide-react';
import { addBill, addCreditCard } from '@/lib/dataStore';
import { BillCategory, RecurrenceType } from '@/types';

const categoryOptions = [
  { value: 'RENT', label: 'Rent' },
  { value: 'ELECTRICITY', label: 'Electricity' },
  { value: 'WATER', label: 'Water' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'SUBSCRIPTIONS', label: 'Subscriptions' },
  { value: 'EMI_LOANS', label: 'EMI/Loans' },
  { value: 'BUSINESS_EXPENSES', label: 'Business Expenses' },
  { value: 'OTHER', label: 'Other' },
];

const recurrenceOptions = [
  { value: 'ONETIME', label: 'One-time' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

export function Layout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showQuickAddBtn, setShowQuickAddBtn] = useState(true);
  const [addType, setAddType] = useState<'bill' | 'card'>('bill');

  // Bill form state
  const [billForm, setBillForm] = useState({
    name: '',
    provider: '',
    amount: '',
    dueDate: '',
    category: 'OTHER' as BillCategory,
    recurrence: 'ONETIME' as RecurrenceType,
  });

  // Card form state
  const [cardForm, setCardForm] = useState({
    bankName: '',
    cardName: '',
    lastFourDigits: '',
    creditLimit: '',
    statementDate: '1',
    paymentDueDate: '15',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <img src="/images/pointing.png" alt="Loading" className="w-24 h-auto mx-auto mb-4" />
          <div className="h-8 w-8 border-4 border-[#078D88] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-[#4B5D7A]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleQuickAddBill = () => {
    if (!user || !billForm.name || !billForm.amount || !billForm.dueDate) return;

    addBill({
      userId: user.id,
      name: billForm.name,
      provider: billForm.provider || undefined,
      amount: parseFloat(billForm.amount),
      dueDate: new Date(billForm.dueDate).toISOString(),
      category: billForm.category,
      recurrence: billForm.recurrence,
      status: 'UNPAID',
      isBusiness: false,
      paidAmount: 0,
    });

    setShowQuickAdd(false);
    setBillForm({ name: '', provider: '', amount: '', dueDate: '', category: 'OTHER', recurrence: 'ONETIME' });
    window.location.reload();
  };

  const handleQuickAddCard = () => {
    if (!user || !cardForm.bankName || !cardForm.creditLimit) return;

    addCreditCard({
      userId: user.id,
      bankName: cardForm.bankName,
      cardName: cardForm.cardName || cardForm.bankName,
      lastFourDigits: cardForm.lastFourDigits || '0000',
      creditLimit: parseFloat(cardForm.creditLimit),
      currentOutstanding: 0,
      statementDate: parseInt(cardForm.statementDate) || 1,
      paymentDueDate: parseInt(cardForm.paymentDueDate) || 15,
      minimumPayment: 0,
      totalAmountDue: 0,
      annualInterestRate: 0,
      cardStatus: 'ACTIVE',
    });

    setShowQuickAdd(false);
    setCardForm({ bankName: '', cardName: '', lastFourDigits: '', creditLimit: '', statementDate: '1', paymentDueDate: '15' });
    window.location.reload();
  };

  const sidebarPadding = useSidebarPadding();

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div className={sidebarPadding}>
        <Header />
        <main className="p-4">
          <Outlet />
        </main>
      </div>

      {/* Floating Quick Add Button */}
      {showQuickAddBtn && !showQuickAdd && (
        <button
          onClick={() => { setShowQuickAdd(true); setShowQuickAddBtn(false); }}
          className="fixed bottom-6 right-6 w-10 h-10 bg-gradient-to-r from-[#078D88] to-[#19C4B6] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:scale-110 flex items-center justify-center z-40 animate-bounce-in"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      {/* Quick Add Dialog */}
      <Dialog open={showQuickAdd} onClose={() => { setShowQuickAdd(false); setShowQuickAddBtn(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="mb-3">
            <DialogTitle className="text-lg">Quick Add</DialogTitle>
          </DialogHeader>

          {/* Type Selector */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setAddType('bill')}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 font-semibold ${
                addType === 'bill'
                  ? 'border-[#078D88] bg-[#F1FAFA] text-[#078D88] shadow-sm'
                  : 'border-[#D5ECEB] text-[#4B5D7A] hover:border-[#078D88]/50 hover:bg-gray-50'
              }`}
            >
              <Receipt className="h-5 w-5" />
              Bill
            </button>
            <button
              onClick={() => setAddType('card')}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 font-semibold ${
                addType === 'card'
                  ? 'border-[#078D88] bg-[#F1FAFA] text-[#078D88] shadow-sm'
                  : 'border-[#D5ECEB] text-[#4B5D7A] hover:border-[#078D88]/50 hover:bg-gray-50'
              }`}
            >
              <CreditCard className="h-5 w-5" />
              Card
            </button>
          </div>

          {addType === 'bill' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#071936] mb-1.5">Bill Name</label>
                <Input
                  value={billForm.name}
                  onChange={(e) => setBillForm({ ...billForm, name: e.target.value })}
                  placeholder="e.g., Electric Company"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#071936] mb-1.5">Provider</label>
                <Input
                  value={billForm.provider}
                  onChange={(e) => setBillForm({ ...billForm, provider: e.target.value })}
                  placeholder="e.g., ConEd"
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1.5">Amount</label>
                  <Input
                    type="number"
                    value={billForm.amount}
                    onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1.5">Due Date</label>
                  <Input
                    type="date"
                    value={billForm.dueDate}
                    onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1.5">Category</label>
                  <Select
                    options={categoryOptions}
                    value={billForm.category}
                    onChange={(e) => setBillForm({ ...billForm, category: e.target.value as BillCategory})}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1.5">Recurrence</label>
                  <Select
                    options={recurrenceOptions}
                    value={billForm.recurrence}
                    onChange={(e) => setBillForm({ ...billForm, recurrence: e.target.value as RecurrenceType })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#071936] mb-1.5">Bank Name</label>
                <Input
                  value={cardForm.bankName}
                  onChange={(e) => setCardForm({ ...cardForm, bankName: e.target.value })}
                  placeholder="e.g., Chase Bank"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#071936] mb-1.5">Card Name</label>
                <Input
                  value={cardForm.cardName}
                  onChange={(e) => setCardForm({ ...cardForm, cardName: e.target.value })}
                  placeholder="e.g., My Visa Card"
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1.5">Last 4 Digits</label>
                  <Input
                    value={cardForm.lastFourDigits}
                    onChange={(e) => setCardForm({ ...cardForm, lastFourDigits: e.target.value })}
                    placeholder="1234"
                    maxLength={4}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1.5">Credit Limit</label>
                  <Input
                    type="number"
                    value={cardForm.creditLimit}
                    onChange={(e) => setCardForm({ ...cardForm, creditLimit: e.target.value })}
                    placeholder="100000"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1.5">Statement Date</label>
                  <Input
                    type="number"
                    value={cardForm.statementDate}
                    onChange={(e) => setCardForm({ ...cardForm, statementDate: e.target.value })}
                    placeholder="1"
                    min="1"
                    max="28"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1.5">Payment Due Date</label>
                  <Input
                    type="number"
                    value={cardForm.paymentDueDate}
                    onChange={(e) => setCardForm({ ...cardForm, paymentDueDate: e.target.value })}
                    placeholder="15"
                    min="1"
                    max="31"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-row justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => { setShowQuickAdd(false); setShowQuickAddBtn(true); }} className="min-w-[100px]">
              Cancel
            </Button>
            {addType === 'bill' ? (
              <Button
                onClick={handleQuickAddBill}
                disabled={!billForm.name || !billForm.amount || !billForm.dueDate}
                className="bg-gradient-to-r from-[#078D88] to-[#19C4B6] min-w-[100px]"
              >
                Add Bill
              </Button>
            ) : (
              <Button
                onClick={handleQuickAddCard}
                disabled={!cardForm.bankName || !cardForm.creditLimit}
                className="bg-gradient-to-r from-[#078D88] to-[#19C4B6] min-w-[100px]"
              >
                Add Card
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
