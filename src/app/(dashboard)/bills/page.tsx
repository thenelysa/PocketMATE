'use client';

import { useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui';
import { useBills, useUpdateBill, useDeleteBill } from '@/features/bills/hooks';
import { BillForm } from '@/features/bills/components/bill-form';
import { BillTable } from '@/features/bills/components/bill-table';
import type { Bill } from '@/features/bills/types';

export default function BillsPage() {
  const { data: bills = [], isLoading } = useBills();
  const updateBill = useUpdateBill();
  const deleteBill = useDeleteBill();

  // formOpen + editing === null means "create"; editing set means "edit".
  const [editing, setEditing] = useState<Bill | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (bill: Bill) => { setEditing(bill); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      await deleteBill.mutateAsync(id);
    }
  };

  const handleMarkPaid = (bill: Bill) =>
    updateBill.mutateAsync({
      id: bill.id,
      status: 'PAID',
      paidAmount: Number(bill.amount),
      paymentDate: new Date().toISOString(),
    });

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
          <h2 className="text-2xl font-bold text-[#071936]">Bills</h2>
          <p className="text-[#4B5D7A] mt-1">Manage your recurring bills</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Add Bill
        </Button>
      </div>

      {formOpen && <BillForm bill={editing} onClose={closeForm} />}

      {bills.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#D5ECEB]">
          <Receipt className="w-16 h-16 text-[#D5ECEB] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#071936] mb-2">No bills yet</h3>
          <p className="text-[#4B5D7A] mb-4">Start by adding your first bill</p>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add Your First Bill
          </Button>
        </div>
      ) : (
        <BillTable
          bills={bills}
          onEdit={openEdit}
          onDelete={handleDelete}
          onMarkPaid={handleMarkPaid}
        />
      )}
    </div>
  );
}
