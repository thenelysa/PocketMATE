import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, CardContent, Input, Select, Badge, Dialog, DialogTitle, DialogContent, DialogFooter, DialogHeader, Label, showToast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getBills, addBill, deleteBill, getBillPayments, addBillPayment, updateBill, getProfile } from '@/lib/dataStore';
import { formatCurrency, formatDate, getDaysUntil, getStatusColor } from '@/lib/utils';
import { Bill, BillCategory, RecurrenceType, BillStatus, BillPayment } from '@/types';
import { Plus, Trash2, Eye, Check, Calendar, Receipt } from 'lucide-react';

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
  { value: 'ONETIME', label: 'One Time' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

export function BillsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [bills, setBills] = useState<Bill[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [billPayments, setBillPayments] = useState<BillPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('NPR');
  const [filter, setFilter] = useState<'all' | 'active' | 'paid'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    amount: '',
    dueDate: '',
    category: 'OTHER' as BillCategory,
    recurrence: 'MONTHLY' as RecurrenceType,
    notes: '',
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
      loadBills();
    }
  }, [user]);

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowAddDialog(true);
    }
  }, [searchParams]);

  const loadBills = () => {
    if (!user) return;
    const allBills = getBills(user.id);
    setBills(allBills);
    setLoading(false);
  };

  const handleAddBill = () => {
    if (!user) return;

    addBill({
      userId: user.id,
      name: formData.name,
      provider: formData.provider,
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      category: formData.category,
      recurrence: formData.recurrence,
      notes: formData.notes,
      status: 'UNPAID',
      isBusiness: false,
      paidAmount: 0,
    });

    setFormData({
      name: '',
      provider: '',
      amount: '',
      dueDate: '',
      category: 'OTHER',
      recurrence: 'MONTHLY',
      notes: '',
    });
    setShowAddDialog(false);
    loadBills();
    showToast('Bill added successfully', 'success');
  };

  const handleDeleteBill = (billId: string) => {
    deleteBill(billId);
    setShowDeleteDialog(false);
    setBillToDelete(null);
    loadBills();
    showToast('Bill deleted successfully', 'success');
  };

  const handleRecordPayment = () => {
    if (!selectedBill || !user) return;

    const payment = {
      billId: selectedBill.id,
      amount: parseFloat(paymentData.amount),
      paymentDate: paymentData.paymentDate,
      notes: paymentData.notes,
    };

    addBillPayment(payment);

    const newPaidAmount = selectedBill.paidAmount + parseFloat(paymentData.amount);
    if (newPaidAmount >= selectedBill.amount) {
      updateBill({
        ...selectedBill,
        status: 'PAID',
        paidAmount: newPaidAmount,
        paymentDate: paymentData.paymentDate
      });
      showToast('Bill marked as paid!', 'success');
    } else {
      updateBill({
        ...selectedBill,
        status: 'PARTIALLY_PAID',
        paidAmount: newPaidAmount
      });
      showToast('Partial payment recorded', 'success');
    }

    setPaymentData({ amount: '', paymentDate: new Date().toISOString().split('T')[0], notes: '' });
    setShowPaymentDialog(false);
    loadBills();
  };

  const loadBillPayments = (billId: string) => {
    const payments = getBillPayments(billId);
    setBillPayments(payments);
  };

  const filteredBills = bills.filter(bill => {
    if (filter === 'paid') return bill.status === 'PAID';
    if (filter === 'active') return bill.status !== 'PAID';
    return true;
  }).filter(bill =>
    bill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (bill.provider?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-[#078D88] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#102A4C]">Bills</h2>
          <p className="text-[#4B5D7A]">Manage your recurring bills</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2 bg-gradient-to-r from-[#078D88] to-[#19C4B6] text-white hover:opacity-90">
          <Plus className="h-4 w-4" />
          Add Bill
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            onClick={() => setFilter('active')}
            className={filter === 'active' ? 'bg-[#078D88]' : ''}
          >
            Active
          </Button>
          <Button
            variant={filter === 'paid' ? 'default' : 'outline'}
            onClick={() => setFilter('paid')}
            className={filter === 'paid' ? 'bg-[#078D88]' : ''}
          >
            Paid
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-[#078D88]' : ''}
          >
            All
          </Button>
        </div>
        <Input
          placeholder="Search bills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Bills List */}
      {filteredBills.length === 0 ? (
        <Card className="border border-[#D5ECEB] bg-[#F7F8F5]">
          <CardContent className="py-12 text-center">
            <img src="/images/mascot.png" alt="No bills" className="h-24 w-auto mx-auto mb-4 opacity-50" />
            <p className="text-[#4B5D7A] mb-2">No bills found</p>
            <Button variant="link" onClick={() => setShowAddDialog(true)} className="text-[#078D88] hover:text-[#065F5F]">
              Add your first bill
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBills.map((bill) => {
            const daysUntil = getDaysUntil(bill.dueDate);
            const isOverdue = daysUntil < 0 && bill.status !== 'PAID';
            const isDueSoon = daysUntil >= 0 && daysUntil <= 3 && bill.status !== 'PAID';

            return (
              <Card key={bill.id} className={`border border-[#D5ECEB] bg-[#F7F8F5] hover:shadow-md transition-all ${isOverdue ? 'border-l-4 border-l-[#F04444]' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-[#102A4C]">{bill.name}</h3>
                        <Badge className={`
                          ${bill.status === 'PAID' ? 'bg-green-100 text-green-800' : ''}
                          ${bill.status === 'UNPAID' && isOverdue ? 'bg-red-100 text-red-800' : ''}
                          ${bill.status === 'UNPAID' && isDueSoon ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${bill.status === 'PARTIALLY_PAID' ? 'bg-blue-100 text-blue-800' : ''}
                        `}>
                          {bill.status === 'PAID' ? 'Paid' : isOverdue ? 'Overdue' : bill.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#4B5D7A]">{bill.provider}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#4B5D7A]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {formatDate(bill.dueDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Receipt className="h-3 w-3" />
                          {bill.category}
                        </span>
                        {bill.recurrence !== 'ONETIME' && (
                          <span className="flex items-center gap-1">
                            🔄 {bill.recurrence}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#102A4C]">{formatCurrency(bill.amount, currency)}</p>
                      {bill.status !== 'PAID' && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBill(bill);
                              setPaymentData({ amount: String(bill.amount - bill.paidAmount), paymentDate: new Date().toISOString().split('T')[0], notes: '' });
                              setShowPaymentDialog(true);
                            }}
                            className="border-[#078D88] text-[#078D88] hover:bg-[#F0FAF4]"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBill(bill);
                              loadBillPayments(bill.id);
                              setShowViewDialog(true);
                            }}
                            className="border-[#4B5D7A] text-[#4B5D7A] hover:bg-gray-100"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setBillToDelete(bill.id);
                              setShowDeleteDialog(true);
                            }}
                            className="border-red-200 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Bill Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bill Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Electricity Bill"
              />
            </div>
            <div>
              <Label>Provider</Label>
              <Input
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g., NEA"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  options={categoryOptions}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as BillCategory })}
                />
              </div>
              <div>
                <Label>Recurrence</Label>
                <Select
                  options={recurrenceOptions}
                  value={formData.recurrence}
                  onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as RecurrenceType })}
                />
              </div>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddBill} className="bg-[#078D88] hover:bg-[#067a75]">Add Bill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Bill Dialog */}
      <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBill?.name}</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#4B5D7A]">Provider</p>
                  <p className="font-medium">{selectedBill.provider}</p>
                </div>
                <div>
                  <p className="text-[#4B5D7A]">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedBill.amount, currency)}</p>
                </div>
                <div>
                  <p className="text-[#4B5D7A]">Due Date</p>
                  <p className="font-medium">{formatDate(selectedBill.dueDate)}</p>
                </div>
                <div>
                  <p className="text-[#4B5D7A]">Category</p>
                  <p className="font-medium">{selectedBill.category}</p>
                </div>
                <div>
                  <p className="text-[#4B5D7A]">Recurrence</p>
                  <p className="font-medium">{selectedBill.recurrence}</p>
                </div>
                <div>
                  <p className="text-[#4B5D7A]">Status</p>
                  <p className="font-medium">{selectedBill.status}</p>
                </div>
              </div>
              {selectedBill.notes && (
                <div>
                  <p className="text-[#4B5D7A] text-sm">Notes</p>
                  <p className="font-medium">{selectedBill.notes}</p>
                </div>
              )}
              <div>
                <p className="text-[#4B5D7A] text-sm mb-2">Payment History</p>
                {billPayments.length > 0 ? (
                  <div className="space-y-2">
                    {billPayments.map((payment) => (
                      <div key={payment.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                        <span>{formatDate(payment.paymentDate)}</span>
                        <span className="font-medium text-green-600">{formatCurrency(payment.amount, currency)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#4B5D7A]">No payments recorded</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
            {selectedBill && selectedBill.status !== 'PAID' && (
              <Button
                onClick={() => {
                  setPaymentData({ amount: String(selectedBill.amount - selectedBill.paidAmount), paymentDate: new Date().toISOString().split('T')[0], notes: '' });
                  setShowViewDialog(false);
                  setShowPaymentDialog(true);
                }}
                className="bg-[#078D88] hover:bg-[#067a75]"
              >
                Record Payment
              </Button>
            )}
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} className="bg-[#078D88] hover:bg-[#067a75]">Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bill</DialogTitle>
          </DialogHeader>
          <p className="text-[#4B5D7A]">Are you sure you want to delete this bill? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onClick={() => billToDelete && handleDeleteBill(billToDelete)} className="bg-red-500 hover:bg-red-600">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BillsPage;
