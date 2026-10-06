'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { Button, DeleteDialog, showToast } from '@/components/ui';
import { useBills, useUpdateBill, useDeleteBill, useCreateBill } from '../hooks';
import { BillForm } from './bill-form';
import { BillTable } from './bill-table';
import type { Bill } from '../types';

export function BillsScreen() {
  const search = useSearchParams().get('search') || '';
  const { data: bills = [], isLoading } = useBills();
  const updateBill = useUpdateBill();
  const deleteBill = useDeleteBill();
  const createBill = useCreateBill();

  // formOpen + editing === null means "create"; editing set means "edit".
  const [editing, setEditing] = useState<Bill | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedBill, setDeletedBill] = useState<Bill | null>(null);
  const [paymentError, setPaymentError] = useState('');

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (bill: Bill) => { setEditing(bill); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const handleDelete = (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (bill) {
      setDeletedBill(bill);
    }
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const bill = deletedBill;
    await deleteBill.mutateAsync(deletingId);
    setDeletingId(null);
    setDeletedBill(null);
    if (bill) {
      showToast({
        message: `"${bill.name}" deleted`,
        undoLabel: 'Undo',
        onUndo: () => {
          createBill.mutate({
            name: bill.name,
            recurrence: bill.recurrence,
            isBusiness: bill.isBusiness,
            notes: bill.notes,
            amount: bill.amount,
            dueDate: bill.dueDate,
            category: bill.category,
            provider: bill.provider,
            status: bill.status,
            paymentDate: bill.paymentDate,
            paidAmount: bill.paidAmount,
          });
        },
      });
    }
  };

  const handleMarkPaid = async (bill: Bill) => {
    setPaymentError('');
    try { await updateBill.mutateAsync({
      id: bill.id,
      status: 'PAID',
      paidAmount: Number(bill.amount),
      paymentDate: new Date().toISOString(),
    }); } catch (error) { setPaymentError(error instanceof Error ? error.message : 'Could not record payment'); }
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
      {deletingId && <DeleteDialog title="Delete bill" itemName={bills.find(item => item.id === deletingId)?.name || 'this item'} onConfirm={confirmDelete} onClose={() => { setDeletingId(null); setDeletedBill(null); }} />}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="dashboard-heading">Bills</h2>
          <p className="text-muted mt-1">Manage your recurring bills</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Add Bill
        </Button>
      </div>

      {formOpen && <BillForm bill={editing} onClose={closeForm} />}
      {paymentError && <p role="alert" className="studio-error">{paymentError}</p>}
      {search && <p className="text-sm">Showing matches for “{search}”. <Link href="/bills" className="underline">Show all bills</Link></p>}

      {bills.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-line">
          <Receipt className="w-16 h-16 text-line mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-ink mb-2">No bills yet</h3>
          <p className="text-muted mb-4">Start by adding your first bill</p>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add Your First Bill
          </Button>
        </div>
      ) : (
        <BillTable
          bills={bills.filter(bill => bill.name.toLowerCase().includes(search.toLowerCase()))}
          onEdit={openEdit}
          onDelete={handleDelete}
          onMarkPaid={handleMarkPaid}
        />
      )}
    </div>
  );
}
