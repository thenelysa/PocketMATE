import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, CardContent, Input, Select, Badge, Dialog, DialogTitle, DialogContent, DialogFooter, DialogHeader, Label, showToast } from '@/components/ui';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/contexts/AuthContext';
import { getBills, addBill, deleteBill, addBillPayment, updateBill, createNextMonthlyBill, restoreBill, getBillPayments, getProfile } from '@/lib/dataStore';
import { registerUndo } from '@/components/ui/toast';
import { formatCurrency, getDaysUntil, getStatusColor, getCategoryColor, getCategoryIcon } from '@/lib/utils';
import { Bill, BillCategory, RecurrenceType, CATEGORY_LABELS } from '@/types';
import { parseInvoicePDF, ParsedInvoice } from '@/lib/invoiceParser';
import { Plus, Search, Upload, Trash2, Eye, DollarSign, FileText, Calendar as CalendarIcon, X } from 'lucide-react';

const categoryOptions = [
  { value: 'ALL', label: 'All Categories' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];
const recurrenceOptions = [
  { value: 'ONETIME', label: 'One-time' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];
const statusOptions = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
];

export function BillsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedDateBills, setSelectedDateBills] = useState<{ date: Date; bills: Bill[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [parsedInvoice, setParsedInvoice] = useState<ParsedInvoice | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    amount: '',
    dueDate: '',
    category: 'OTHER' as BillCategory,
    recurrence: 'ONETIME' as RecurrenceType,
    notes: '',
    isBusiness: false,
  });

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('NPR');

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

  // Check for add=true query param to auto-open add dialog
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowAddDialog(true);
    }
  }, [searchParams]);

  useEffect(() => {
    filterBills();
  }, [bills, search, categoryFilter, statusFilter]);

  const loadBills = () => {
    if (!user) return;
    const allBills = getBills(user.id);
    setBills(allBills);
    setLoading(false);
  };

  const filterBills = () => {
    let filtered = [...bills];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(searchLower) ||
          b.provider?.toLowerCase().includes(searchLower)
      );
    }

    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter((b) => b.category === categoryFilter);
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Sort: unpaid/overdue first by due date, paid bills last
    filtered.sort((a, b) => {
      // Paid bills go last
      if (a.status === 'PAID' && b.status !== 'PAID') return 1;
      if (b.status === 'PAID' && a.status !== 'PAID') return -1;
      if (a.status === 'PAID' && b.status === 'PAID') {
        // Among paid bills, sort by most recently paid first
        return new Date(b.paymentDate || b.updatedAt).getTime() - new Date(a.paymentDate || a.updatedAt).getTime();
      }
      // For unpaid bills, sort by due date
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      // Within same date, newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setFilteredBills(filtered);
  };

  const handleAddBill = () => {
    if (!user) return;

    const newBill = addBill({
      userId: user.id,
      name: formData.name,
      provider: formData.provider || undefined,
      amount: parseFloat(formData.amount),
      dueDate: new Date(formData.dueDate).toISOString(),
      category: formData.category,
      recurrence: formData.recurrence,
      notes: formData.notes || undefined,
      status: 'UNPAID',
      isBusiness: formData.isBusiness,
      paidAmount: 0,
    });

    loadBills();
    setShowAddDialog(false);
    resetForm();
    // Notify Dashboard to refresh
    window.dispatchEvent(new CustomEvent('data-changed'));
  };

  const handleDeleteBill = (id: string) => {
    setBillToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDeleteBill = () => {
    if (billToDelete) {
      const bill = bills.find(b => b.id === billToDelete);
      const payments = getBillPayments(billToDelete);
      const undoId = `bill-${billToDelete}-${Date.now()}`;

      if (bill) {
        registerUndo(undoId, () => {
          restoreBill(bill, payments);
          loadBills();
        });
      }

      deleteBill(billToDelete);
      loadBills();
      window.dispatchEvent(new CustomEvent('data-changed'));
      showToast('Bill deleted', 'success', 5000, undoId, 'Undo');
    }
    setShowDeleteDialog(false);
    setBillToDelete(null);
  };

  const handleRecordPayment = () => {
    if (!selectedBill) return;

    const amount = parseFloat(paymentAmount);
    const totalDue = selectedBill.amount - selectedBill.paidAmount;

    if (amount > totalDue) {
      alert('Payment amount exceeds remaining balance');
      return;
    }

    // Add payment
    addBillPayment({
      billId: selectedBill.id,
      amount,
      paymentDate: new Date(paymentDate).toISOString(),
    });

    // Update bill
    const newPaidAmount = selectedBill.paidAmount + amount;
    const isFullyPaid = newPaidAmount >= selectedBill.amount;

    const updatedBill: Bill = {
      ...selectedBill,
      paidAmount: newPaidAmount,
      status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
      paymentDate: isFullyPaid ? new Date(paymentDate).toISOString() : undefined,
    };

    updateBill(updatedBill);

    // Auto-create next monthly bill if fully paid
    if (isFullyPaid && selectedBill.recurrence === 'MONTHLY') {
      createNextMonthlyBill(selectedBill);
    }

    loadBills();
    window.dispatchEvent(new CustomEvent('data-changed'));
    showToast('Payment recorded successfully', 'success');
    setShowPaymentDialog(false);
    setSelectedBill(null);
    resetPaymentForm();
    // Close the date bills dialog if open
    setSelectedDateBills(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      provider: '',
      amount: '',
      dueDate: '',
      category: 'OTHER',
      recurrence: 'ONETIME',
      notes: '',
      isBusiness: false,
    });
  };

  const resetPaymentForm = () => {
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  const openPaymentDialog = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentAmount((bill.amount - bill.paidAmount).toString());
    setShowPaymentDialog(true);
  };

  const getDaysUntilText = (dueDate: string) => {
    const days = getDaysUntil(dueDate);
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.size, file.type);
    setImporting(true);

    try {
      console.log('Calling parseInvoicePDF...');
      const parsed = await parseInvoicePDF(file);
      console.log('Parse result:', parsed);

      if (parsed) {
        setParsedInvoice(parsed);
        setShowImportDialog(true);
      } else {
        alert('Could not parse the invoice. Please enter details manually.');
        setShowAddDialog(true);
      }
    } catch (err) {
      console.error('Import error:', err);
      alert('Error importing invoice. Please enter details manually.');
      setShowAddDialog(true);
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportConfirm = () => {
    if (!parsedInvoice) return;

    setFormData({
      name: parsedInvoice.name,
      provider: parsedInvoice.provider,
      amount: parsedInvoice.amount.toString(),
      dueDate: parsedInvoice.dueDate.split('T')[0],
      category: 'OTHER',
      recurrence: 'ONETIME',
      notes: parsedInvoice.invoiceNumber ? `Invoice: ${parsedInvoice.invoiceNumber}` : '',
      isBusiness: false,
    });
    setShowImportDialog(false);
    setShowAddDialog(true);
    setParsedInvoice(null);
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="text-left">
          <h2 className="text-2xl font-bold text-[#102A4C]">Bills</h2>
          <p className="text-sm text-[#4B5D7A]">Manage your recurring bills</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#D5ECEB] text-[#4B5D7A] bg-[#F7F8F5] hover:border-[#078D88] hover:text-[#078D88] hover:bg-[#F1FAFA] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Import PDF
          </button>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#078D88] to-[#19C4B6] text-white hover:shadow-lg transition-all duration-200 font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Bill
          </button>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-200 font-medium ${showCalendar ? 'border-[#078D88] text-[#078D88] bg-[#F1FAFA]' : 'border-[#D5ECEB] text-[#4B5D7A] bg-[#F7F8F5] hover:border-[#078D88] hover:text-[#078D88]'}`}
          >
            <CalendarIcon className="h-4 w-4" />
            {showCalendar ? 'List View' : 'Calendar'}
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {showCalendar && (
        <div className="mb-6">
          <Calendar
            bills={bills}
            onDateClick={(date, dateBills) => setSelectedDateBills({ date, bills: dateBills })}
          />
        </div>
      )}

      {/* Filters */}
      <Card className="border border-[#D5ECEB] bg-[#F7F8F5]">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#4B5D7A]" />
              <Input
                placeholder="Search bills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-10 bg-white border border-[#D5ECEB] rounded-xl"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#4B5D7A] hover:text-[#102A4C]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-44 bg-white border border-[#D5ECEB] rounded-xl"
            />
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-40 bg-white border border-[#D5ECEB] rounded-xl"
            />
            {(search || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-[#078D88] hover:text-[#065F5F] hover:bg-[#F1FAFA] w-full sm:w-auto"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      {filteredBills.length === 0 ? (
        <Card className="border border-[#D5ECEB] bg-[#F7F8F5]">
          <CardContent className="py-12 text-center">
            <img src="/images/mascot-n'.png" alt="No bills" className="h-24 w-auto mx-auto mb-4 opacity-80" />
            <p className="text-[#4B5D7A] mb-2">No bills found</p>
            <Button
              variant="link"
              onClick={() => setShowAddDialog(true)}
              className="text-[#078D88] hover:text-[#065F5F] mt-2"
            >
              Add your first bill
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBills.map((bill) => {
            const daysUntil = getDaysUntil(bill.dueDate);
            const remainingAmount = bill.amount - bill.paidAmount;

            return (
              <Card
                key={bill.id}
                className={`border border-[#D5ECEB] bg-[#F7F8F5] hover:shadow-md transition-all duration-200 ${
                  bill.status === 'OVERDUE' ? 'border-l-4 border-l-[#E6535F]' : bill.status === 'PAID' ? 'border-l-4 border-l-[#24966B]' : 'border-l-4 border-l-[#078D88]'
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xl">{getCategoryIcon(bill.category)}</span>
                        <h3 className="font-bold text-[#102A4C]">{bill.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(bill.category)}`}>
                          {CATEGORY_LABELS[bill.category as BillCategory]}
                        </span>
                        {bill.isBusiness && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Business</Badge>
                        )}
                      </div>
                      <p className="text-sm text-[#4B5D7A] mb-1">{bill.provider}</p>
                      <div className="flex items-center gap-3 text-xs text-[#4B5D7A]">
                        <span className={`px-2 py-0.5 rounded-full ${
                          bill.recurrence === 'MONTHLY' ? 'bg-[#DFF5F2] text-[#078D88]' :
                          bill.recurrence === 'YEARLY' ? 'bg-[#FEF3C7] text-[#D97706]' :
                          'bg-gray-100 text-[#4B5D7A]'
                        }`}>
                          {bill.recurrence === 'MONTHLY' ? '🔄 Monthly' : bill.recurrence === 'YEARLY' ? '📅 Yearly' : '📌 One-time'}
                        </span>
                        {bill.status === 'OVERDUE' && (
                          <Badge className="bg-[#FFF1F2] text-[#E6535F] border border-[#E6535F] animate-pulse">OVERDUE</Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-[#102A4C]">{formatCurrency(bill.amount, currency)}</p>
                      {bill.paidAmount > 0 && (
                        <p className="text-sm text-[#24966B] font-semibold">
                          Paid: {formatCurrency(bill.paidAmount, currency)}
                        </p>
                      )}
                      <div className="mt-2">
                        <Badge className={`${getStatusColor(bill.status)} text-xs`}>
                          {getDaysUntilText(bill.dueDate)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-[#D5ECEB]">
                    <Button
                      size="sm"
                      onClick={() => openPaymentDialog(bill)}
                      disabled={bill.status === 'PAID'}
                      className={bill.status === 'PAID' ? 'bg-[#F0FAF4] text-[#24966B] border border-[#24966B] cursor-default' : 'gap-1 bg-gradient-to-r from-[#078D88] to-[#19C4B6] text-white hover:opacity-90'}
                    >
                      <DollarSign className="h-3 w-3" />
                      {bill.status === 'PAID' ? 'Payment Recorded' : 'Record Payment'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => { setSelectedBill(bill); setShowDetailsDialog(true); }}
                      className="flex-1 gap-1 bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] hover:bg-[#FEF3C7]/80"
                    >
                      <Eye className="h-3 w-3" />
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBill(bill.id)}
                      className="text-[#E6535F] hover:text-[#DC2626] hover:bg-[#FFF1F2]"
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

      {/* Add Bill Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)}>
        <DialogHeader>
          <DialogTitle>Add New Bill</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="grid gap-4">
            <div>
              <Label>Bill Name <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Electric Company"
              />
            </div>
            <div>
              <Label>Provider</Label>
              <Input
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g., ConEd"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Due Date <span className="text-red-500">*</span></Label>
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
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isBusiness"
                checked={formData.isBusiness}
                onChange={(e) => setFormData({ ...formData, isBusiness: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isBusiness">This is a business expense</Label>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddBill}
            disabled={!formData.name || !formData.amount || !formData.dueDate}
          >
            Add Bill
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)}>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {selectedBill && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedBill.name}</p>
                <p className="text-sm text-muted-foreground">
                  Remaining: {formatCurrency(selectedBill.amount - selectedBill.paidAmount, currency)}
                </p>
              </div>
              <div>
                <Label>Payment Amount <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={selectedBill.amount - selectedBill.paidAmount}
                />
              </div>
              <div>
                <Label>Payment Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleRecordPayment} disabled={!paymentAmount || !paymentDate}>
            Record Payment
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Import Invoice Dialog */}
      <Dialog open={showImportDialog} onClose={() => setShowImportDialog(false)}>
        <DialogHeader>
          <DialogTitle>Import Invoice</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {parsedInvoice && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Invoice Detected</p>
                  <p className="text-sm text-muted-foreground">Review the extracted details below</p>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{parsedInvoice.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-medium">{parsedInvoice.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">{formatCurrency(parsedInvoice.amount, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-medium">{new Date(parsedInvoice.dueDate).toLocaleDateString()}</span>
                </div>
                {parsedInvoice.invoiceNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice #:</span>
                    <span className="font-medium">{parsedInvoice.invoiceNumber}</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Click "Continue" to review and edit before saving, or "Cancel" to discard.
              </p>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowImportDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleImportConfirm}>
            Continue
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Date Bills Dialog */}
      <Dialog open={!!selectedDateBills} onClose={() => setSelectedDateBills(null)}>
        <DialogHeader>
          <DialogTitle>
            {selectedDateBills && new Date(selectedDateBills.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          {selectedDateBills && (
            <div className="space-y-3">
              {selectedDateBills.bills.map((bill) => (
                <div key={bill.id} className="p-3 rounded-lg border border-[#D5ECEB] hover:bg-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{bill.name}</p>
                      <p className="text-sm text-muted-foreground">{bill.provider}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(bill.amount, currency)}</p>
                      <Badge className={getStatusColor(bill.status)}>{bill.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSelectedDateBills(null)}>Close</Button>
        </DialogFooter>
      </Dialog>

      {/* Bill Details Dialog */}
      <Dialog open={showDetailsDialog} onClose={() => setShowDetailsDialog(false)}>
        <DialogHeader>
          <DialogTitle>Bill Details</DialogTitle>
        </DialogHeader>
        <DialogContent>
          {selectedBill && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getCategoryIcon(selectedBill.category)}</span>
                <div>
                  <h3 className="font-bold text-lg text-[#102A4C]">{selectedBill.name}</h3>
                  <p className="text-sm text-[#4B5D7A]">{selectedBill.provider || 'No provider'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#D5ECEB]">
                <div>
                  <p className="text-xs text-[#4B5D7A]">Amount</p>
                  <p className="font-bold text-[#102A4C]">{formatCurrency(selectedBill.amount, currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#4B5D7A]">Paid</p>
                  <p className="font-bold text-[#24966B]">{formatCurrency(selectedBill.paidAmount, currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#4B5D7A]">Due Date</p>
                  <p className="font-semibold text-[#102A4C]">{new Date(selectedBill.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-[#4B5D7A]">Status</p>
                  <Badge className={`${getStatusColor(selectedBill.status)} mt-1`}>{selectedBill.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-[#4B5D7A]">Category</p>
                  <p className="font-semibold text-[#102A4C]">{CATEGORY_LABELS[selectedBill.category as BillCategory]}</p>
                </div>
                <div>
                  <p className="text-xs text-[#4B5D7A]">Recurrence</p>
                  <p className="font-semibold text-[#102A4C]">
                    {selectedBill.recurrence === 'MONTHLY' ? 'Monthly' : selectedBill.recurrence === 'YEARLY' ? 'Yearly' : 'One-time'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>Close</Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogHeader>
          <DialogTitle>Delete Bill</DialogTitle>
        </DialogHeader>
        <DialogContent className="text-center">
          <img src="/images/delete.png" alt="Delete" className="w-20 h-20 mx-auto mb-4" />
          <p className="text-muted-foreground">Are you sure you want to delete this bill? This action cannot be undone.</p>
        </DialogContent>
        <DialogFooter className="justify-center sm:justify-center">
          <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDeleteBill}>
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default BillsPage;
