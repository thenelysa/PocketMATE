'use client';

import { useAuth } from '@/features/auth/auth-context';
import { useBills } from '@/features/bills/hooks';
import { Receipt, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: bills = [], isLoading } = useBills();

  const totalBills = bills.length;
  const paidBills = bills.filter(b => b.status === 'PAID').length;
  const unpaidBills = bills.filter(b => b.status === 'UNPAID');
  const totalDue = unpaidBills.reduce((sum, b) => sum + Number(b.amount), 0);

  // Get upcoming bills (due in next 7 days)
  const now = new Date();
  const upcomingBills = unpaidBills
    .filter(b => {
      const dueDate = new Date(b.dueDate);
      const diff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#078D88] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#071936]">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}!
        </h2>
        <p className="text-[#4B5D7A] mt-1">Here&apos;s your bill overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4B5D7A]">Total Bills</p>
                <p className="text-2xl font-bold text-[#071936]">{totalBills}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#078D88] to-[#19C4B6] flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4B5D7A]">Due This Month</p>
                <p className="text-2xl font-bold text-[#071936]">${totalDue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#078D88] to-[#19C4B6] flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4B5D7A]">Credit Cards</p>
                <p className="text-2xl font-bold text-[#071936]">-</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#078D88] to-[#19C4B6] flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4B5D7A]">Paid This Month</p>
                <p className="text-2xl font-bold text-[#071936]">{paidBills}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#078D88] to-[#19C4B6] flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bills */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingBills.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-[#D5ECEB] mx-auto mb-4" />
              <p className="text-[#4B5D7A]">No upcoming bills due in the next 7 days</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBills.map(bill => (
                <div key={bill.id} className="flex items-center justify-between p-4 bg-[#F7F8F5] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#078D88] to-[#19C4B6] flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#071936]">{bill.name}</p>
                      <p className="text-sm text-[#4B5D7A]">{bill.provider || 'No provider'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#071936]">${Number(bill.amount).toFixed(2)}</p>
                    <p className="text-sm text-[#4B5D7A]">{format(new Date(bill.dueDate), 'MMM d')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
