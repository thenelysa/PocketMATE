'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBills, useCreateBill, useUpdateBill, useDeleteBill, Bill } from '@/lib/hooks';
import { Button } from '@/components/ui';
import { Plus, Receipt, X, Edit2, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const categories = ['Utilities', 'Insurance', 'Subscription', 'Rent', 'Phone', 'Internet', 'Other'];
const recurrences = ['One-time', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];

export default function BillsPage() {
  const { user } = useAuth();
  const { data: bills = [], isLoading } = useBills();
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const deleteBill = useDeleteBill();

  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    amount: '',
    due_date: '',
    category: '',
    recurrence: '',
    notes: '',
    is_business: false,
    status: 'UNPAID',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      provider: '',
      amount: '',
      due_date: '',
      category: '',
      recurrence: '',
      notes: '',
      is_business: false,
      status: 'UNPAID',
    });
    setEditingBill(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const billData = {
        name: formData.name,
        provider: formData.provider || null,
        amount: parseFloat(formData.amount),
        due_date: new Date(formData.due_date).toISOString(),
        category: formData.category || null,
        recurrence: formData.recurrence || null,
        notes: formData.notes || null,
        is_business: formData.is_business,
        status: formData.status,
        paid_amount: formData.status === 'PAID' ? parseFloat(formData.amount) : 0,
        payment_date: formData.status === 'PAID' ? new Date().toISOString() : null,
      };

      if (editingBill) {
        await updateBill.mutateAsync({ id: editingBill.id, ...billData });
      } else {
        await createBill.mutateAsync(billData);
      }
      resetForm();
    } catch (err) {
      console.error('Failed to save bill:', err);
    }
  };

  const handleEdit = (bill: Bill) => {
    setFormData({
      name: bill.name,
      provider: bill.provider || '',
      amount: String(bill.amount),
      due_date: format(new Date(bill.due_date), 'yyyy-MM-dd'),
      category: bill.category || '',
      recurrence: bill.recurrence || '',
      notes: bill.notes || '',
      is_business: bill.is_business,
      status: bill.status,
    });
    setEditingBill(bill);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      await deleteBill.mutateAsync(id);
    }
  };

  const handleMarkPaid = async (bill: Bill) => {
    await updateBill.mutateAsync({
      id: bill.id,
      status: 'PAID',
      paid_amount: Number(bill.amount),
      payment_date: new Date().toISOString(),
    });
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
          <h2 className="text-2xl font-bold text-[#071936]">Bills</h2>
          <p className="text-[#4B5D7A] mt-1">Manage your recurring bills</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Add Bill
        </Button>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#D5ECEB]">
              <h3 className="text-lg font-bold text-[#071936]">
                {editingBill ? 'Edit Bill' : 'Add New Bill'}
              </h3>
              <button onClick={resetForm} className="text-[#4B5D7A] hover:text-[#071936]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#071936] mb-1">Bill Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                  placeholder="e.g., Electric Bill"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#071936] mb-1">Provider</label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={e => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                  placeholder="e.g., ConEdison"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                  >
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#071936] mb-1">Recurrence</label>
                  <select
                    value={formData.recurrence}
                    onChange={e => setFormData({ ...formData, recurrence: e.target.value })}
                    className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                  >
                    <option value="">Select recurrence</option>
                    {recurrences.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#071936] mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-[#D5ECEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#078D88]"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_business"
                  checked={formData.is_business}
                  onChange={e => setFormData({ ...formData, is_business: e.target.checked })}
                  className="w-4 h-4 text-[#078D88] border-[#D5ECEB] rounded focus:ring-[#078D88]"
                />
                <label htmlFor="is_business" className="text-sm text-[#071936]">Business expense</label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={createBill.isPending || updateBill.isPending}>
                  {createBill.isPending || updateBill.isPending ? 'Saving...' : editingBill ? 'Update Bill' : 'Add Bill'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bills List */}
      {bills.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#D5ECEB]">
          <Receipt className="w-16 h-16 text-[#D5ECEB] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#071936] mb-2">No bills yet</h3>
          <p className="text-[#4B5D7A] mb-4">Start by adding your first bill</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Add Your First Bill
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#D5ECEB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F8F5] border-b border-[#D5ECEB]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#071936]">Bill</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#071936]">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#071936]">Due Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#071936]">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-[#071936]">Amount</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-[#071936]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D5ECEB]">
                {bills.map(bill => (
                  <tr key={bill.id} className="hover:bg-[#F7F8F5]/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#078D88] to-[#19C4B6] flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#071936]">{bill.name}</p>
                          <p className="text-sm text-[#4B5D7A]">{bill.provider || 'No provider'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4B5D7A]">{bill.category || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#4B5D7A]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(bill.due_date), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        bill.status === 'PAID'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#071936]">
                      ${Number(bill.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {bill.status === 'UNPAID' && (
                          <button
                            onClick={() => handleMarkPaid(bill)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Mark as paid"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(bill)}
                          className="p-2 text-[#4B5D7A] hover:bg-[#F7F8F5] rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(bill.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
