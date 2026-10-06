'use client';

import { useCurrency } from '@/features/preferences/hooks';
import { useBills } from '@/features/bills/hooks';
import { useCards } from '@/features/cards/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { BarChart3, TrendingUp, DollarSign, CreditCard, CheckCircle, Clock, PieChart } from 'lucide-react';
import { money } from '@/lib/format';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function ReportsPage() {
  const { data: bills = [] } = useBills();
  const { data: cards = [] } = useCards();
  const currency = useCurrency();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // This month's bills
  const thisMonthBills = bills.filter(b => {
    const dueDate = new Date(b.dueDate);
    return isWithinInterval(dueDate, { start: monthStart, end: monthEnd });
  });

  const paidThisMonth = thisMonthBills.filter(b => b.status === 'PAID');
  const unpaidThisMonth = thisMonthBills.filter(b => b.status === 'UNPAID');
  const totalPaid = paidThisMonth.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalUnpaid = unpaidThisMonth.reduce((sum, b) => sum + Number(b.amount), 0);

  // Overall stats
  const totalBillsAmount = bills.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalPaidAll = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + Number(b.amount), 0);
  const totalCardDebt = cards.reduce((sum, c) => sum + Number(c.currentOutstanding || 0), 0);
  const totalCreditLimit = cards.reduce((sum, c) => sum + Number(c.creditLimit), 0);

  // Calculate payment rate
  const paymentRate = bills.length > 0 ? Math.round((bills.filter(b => b.status === 'PAID').length / bills.length) * 100) : 0;

  // Simple bar chart data for last 6 months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthBills = bills.filter(b => {
      const dueDate = new Date(b.dueDate);
      return dueDate.getMonth() === d.getMonth() && dueDate.getFullYear() === d.getFullYear();
    });
    const paid = monthBills.filter(b => b.status === 'PAID').length;
    const total = monthBills.length;
    months.push({
      label: format(d, 'MMM'),
      paid,
      total,
      amount: monthBills.reduce((sum, b) => sum + Number(b.amount), 0),
    });
  }

  const maxAmount = Math.max(...months.map(m => m.amount), 1);

  // Provider breakdown
  const providerStats = bills.reduce((acc, bill) => {
    const provider = bill.provider || 'Other';
    if (!acc[provider]) {
      acc[provider] = { count: 0, amount: 0 };
    }
    acc[provider].count += 1;
    acc[provider].amount += Number(bill.amount);
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  const topProviders = Object.entries(providerStats)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const maxProviderAmount = Math.max(...topProviders.map(p => p.amount), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#071936]">Reports</h2>
        <p className="text-[#4B5D7A] mt-1">Visualize your spending patterns</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#078D88]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4B5D7A]">Paid This Month</p>
                <p className="text-2xl font-bold text-[#078D88]">{money(totalPaid, currency)}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-[#078D88]/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#8B1538]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4B5D7A]">Due This Month</p>
                <p className="text-2xl font-bold text-[#8B1538]">{money(totalUnpaid, currency)}</p>
              </div>
              <Clock className="w-10 h-10 text-[#8B1538]/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#071936]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4B5D7A]">Card Balance</p>
                <p className="text-2xl font-bold text-[#071936]">{money(totalCardDebt, currency)}</p>
              </div>
              <CreditCard className="w-10 h-10 text-[#071936]/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#19C4B6]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4B5D7A]">Payment Rate</p>
                <p className="text-2xl font-bold text-[#19C4B6]">{paymentRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-[#19C4B6]/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Overview Chart */}
      <Card className="border-t-4 border-t-[#078D88]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#078D88]">
            <BarChart3 className="w-5 h-5" />
            Monthly Bill Amount
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-48">
            {months.map((month, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-sm font-medium text-[#071936]">{money(month.amount, currency)}</span>
                <div
                  className="w-full bg-gradient-to-t from-[#078D88] to-[#19C4B6] rounded-t-lg transition-all"
                  style={{ height: `${(month.amount / maxAmount) * 150}px` }}
                />
                <span className="text-xs text-[#4B5D7A]">{month.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bill Status Breakdown */}
        <Card className="border-t-4 border-t-[#071936]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#071936]">
              <PieChart className="w-5 h-5" />
              Bill Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              {/* Simple pie representation */}
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#F7F8F5"
                    strokeWidth="20"
                  />
                  {bills.length > 0 && (
                    <>
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#078D88"
                        strokeWidth="20"
                        strokeDasharray={`${(bills.filter(b => b.status === 'PAID').length / bills.length) * 251.2} 251.2`}
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#8B1538"
                        strokeWidth="20"
                        strokeDasharray={`${(bills.filter(b => b.status === 'UNPAID').length / bills.length) * 251.2} 251.2`}
                        strokeDashoffset={`-${(bills.filter(b => b.status === 'PAID').length / bills.length) * 251.2}`}
                      />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-[#071936]">{bills.length}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#078D88]" />
                  <span className="text-sm text-[#4B5D7A]">Paid: {bills.filter(b => b.status === 'PAID').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#8B1538]" />
                  <span className="text-sm text-[#4B5D7A]">Unpaid: {bills.filter(b => b.status === 'UNPAID').length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Providers */}
        <Card className="border-t-4 border-t-[#F59E0B]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#F59E0B]">
              <DollarSign className="w-5 h-5" />
              Top Providers by Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProviders.length === 0 ? (
              <p className="text-[#4B5D7A] text-center py-4">No bill data yet</p>
            ) : (
              topProviders.map((provider, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-[#071936]">{provider.name}</span>
                    <span className="text-[#4B5D7A]">{money(provider.amount, currency)}</span>
                  </div>
                  <div className="h-2 bg-[#F7F8F5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F59E0B] rounded-full"
                      style={{ width: `${(provider.amount / maxProviderAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bill Breakdown */}
      <Card className="border-t-4 border-t-[#078D88]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#078D88]">
            <DollarSign className="w-5 h-5" />
            Bill Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-[#F7F8F5] rounded-xl text-center">
              <p className="text-2xl font-bold text-[#071936]">{bills.length}</p>
              <p className="text-sm text-[#4B5D7A]">Total Bills</p>
            </div>
            <div className="p-4 bg-[#F7F8F5] rounded-xl text-center">
              <p className="text-2xl font-bold text-[#078D88]">{bills.filter(b => b.status === 'PAID').length}</p>
              <p className="text-sm text-[#4B5D7A]">Paid</p>
            </div>
            <div className="p-4 bg-[#F7F8F5] rounded-xl text-center">
              <p className="text-2xl font-bold text-[#8B1538]">{bills.filter(b => b.status === 'UNPAID').length}</p>
              <p className="text-sm text-[#4B5D7A]">Unpaid</p>
            </div>
            <div className="p-4 bg-[#F7F8F5] rounded-xl text-center">
              <p className="text-2xl font-bold text-[#071936]">{money(totalBillsAmount, currency)}</p>
              <p className="text-sm text-[#4B5D7A]">Total</p>
            </div>
            <div className="p-4 bg-[#F7F8F5] rounded-xl text-center">
              <p className="text-2xl font-bold text-[#19C4B6]">{money(totalPaidAll, currency)}</p>
              <p className="text-sm text-[#4B5D7A]">Paid Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Card Summary */}
      <Card className="border-t-4 border-t-[#071936]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#071936]">
            <CreditCard className="w-5 h-5" />
            Credit Card Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cards.length === 0 ? (
            <p className="text-[#4B5D7A] text-center py-8">No credit cards added yet</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#F7F8F5] rounded-xl text-center">
                  <p className="text-2xl font-bold text-[#071936]">{cards.length}</p>
                  <p className="text-sm text-[#4B5D7A]">Cards</p>
                </div>
                <div className="p-4 bg-[#F7F8F5] rounded-xl text-center">
                  <p className="text-2xl font-bold text-[#071936]">{money(totalCardDebt, currency)}</p>
                  <p className="text-sm text-[#4B5D7A]">Balance</p>
                </div>
                <div className="p-4 bg-[#F7F8F5] rounded-xl text-center">
                  <p className="text-2xl font-bold text-[#071936]">{money(totalCreditLimit, currency)}</p>
                  <p className="text-sm text-[#4B5D7A]">Limit</p>
                </div>
                <div className="p-4 bg-[#F7F8F5] rounded-xl text-center">
                  <p className="text-2xl font-bold text-[#F59E0B]">
                    {totalCreditLimit > 0 ? Math.round((totalCardDebt / totalCreditLimit) * 100) : 0}%
                  </p>
                  <p className="text-sm text-[#4B5D7A]">Utilization</p>
                </div>
              </div>
              {/* Credit utilization bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[#071936]">Credit Utilization</span>
                  <span className="text-[#4B5D7A]">
                    {money(totalCardDebt, currency)} / {money(totalCreditLimit, currency)}
                  </span>
                </div>
                <div className="h-4 bg-[#F7F8F5] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (totalCardDebt / totalCreditLimit) > 0.8 ? 'bg-[#8B1538]' :
                      (totalCardDebt / totalCreditLimit) > 0.5 ? 'bg-[#F59E0B]' :
                      'bg-[#078D88]'
                    }`}
                    style={{ width: `${Math.min((totalCardDebt / totalCreditLimit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
