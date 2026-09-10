import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardStats, markOverdueBills, getBudgetSummary, getBills, getPaymentHistory, getProfile } from '@/lib/dataStore';
import { formatCurrency, getDaysUntil } from '@/lib/utils';
import { checkAndNotifyBills, requestNotificationPermission, getNotificationPermissionStatus } from '@/lib/notifications';
import { DashboardStats, Bill, BudgetSummary } from '@/types';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CreditCard,
  Plus,
  ArrowRight,
  Clock,
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('NPR');

  useEffect(() => {
    const profile = getProfile();
    if (profile?.preferredCurrency) {
      setCurrency(profile.preferredCurrency);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    markOverdueBills(user.id);
    const dashboardStats = getDashboardStats(user.id);
    setStats(dashboardStats);
    const budgetSummary = getBudgetSummary(user.id);
    setBudget(budgetSummary);

    const permission = getNotificationPermissionStatus();
    if (permission === 'granted') {
      const bills = getBills(user.id);
      checkAndNotifyBills(bills);
    } else if (permission === 'default') {
      requestNotificationPermission();
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    const handleDataChanged = () => {
      if (!user) return;
      markOverdueBills(user.id);
      const dashboardStats = getDashboardStats(user.id);
      setStats(dashboardStats);
      const budgetSummary = getBudgetSummary(user.id);
      setBudget(budgetSummary);
    };

    window.addEventListener('data-changed', handleDataChanged);
    return () => window.removeEventListener('data-changed', handleDataChanged);
  }, [user]);

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <img src="/images/pointing.png" alt="Loading" className="w-32 h-auto mx-auto mb-4" />
          <div className="h-8 w-8 border-4 border-[#078D88] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-100 min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#102A4C]">Dashboard</h1>
          <p className="text-[#4B5D7A]">Welcome back! Here's your financial overview.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/bills?add=true">
            <Button className="gap-2 bg-gradient-to-r from-[#078D88] to-[#19C4B6] text-white hover:opacity-90">
              <Plus className="h-4 w-4" />
              Add Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-[#E6535F]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4B5D7A]">Total Outstanding</p>
                <p className="text-2xl font-bold text-[#102A4C]">{formatCurrency(stats.totalOutstanding, currency)}</p>
              </div>
              <div className="p-3 bg-[#FFF1F2] rounded-full">
                <AlertTriangle className="h-6 w-6 text-[#E6535F]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#F59E0B]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4B5D7A]">Due Soon</p>
                <p className="text-2xl font-bold text-[#102A4C]">{stats.overdueCount}</p>
                <p className="text-xs text-[#4B5D7A]">Overdue bills</p>
              </div>
              <div className="p-3 bg-[#FEF3C7] rounded-full">
                <Clock className="h-6 w-6 text-[#F59E0B]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#078D88]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4B5D7A]">Paid This Month</p>
                <p className="text-2xl font-bold text-[#24966B]">{formatCurrency(stats.paidThisMonth, currency)}</p>
              </div>
              <div className="p-3 bg-[#F0FAF4] rounded-full">
                <TrendingDown className="h-6 w-6 text-[#24966B]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#8b5cf6]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4B5D7A]">Credit Card Balance</p>
                <p className="text-2xl font-bold text-[#102A4C]">{formatCurrency(stats.totalCreditCardBalance, currency)}</p>
                <p className="text-xs text-[#4B5D7A]">{stats.creditUtilization.toFixed(1)}% utilized</p>
              </div>
              <div className="p-3 bg-[#F3F0FF] rounded-full">
                <CreditCard className="h-6 w-6 text-[#8b5cf6]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      {budget && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#102A4C]">Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[#4B5D7A]">Spent: {formatCurrency(budget.spent, currency)}</span>
                <span className="text-sm text-[#4B5D7A]">Budget: {formatCurrency(budget.budget, currency)}</span>
              </div>
              <div className="h-3 bg-[#D5ECEB] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${budget.isOverBudget ? 'bg-[#E6535F]' : 'bg-gradient-to-r from-[#078D88] to-[#19C4B6]'}`}
                  style={{ width: `${Math.min(100, budget.percentUsed)}%` }}
                />
              </div>
              <p className="text-sm text-right">
                {budget.isOverBudget ? (
                  <span className="text-[#E6535F] font-medium">Over budget by {formatCurrency(budget.spent - budget.budget, currency)}</span>
                ) : (
                  <span className="text-[#24966B] font-medium">{formatCurrency(budget.remaining, currency)} remaining</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Due Soon Bills */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-[#102A4C]">Due Soon</CardTitle>
              <Link to="/app/bills" className="text-sm text-[#078D88] hover:text-[#065F5F] flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.dueSoon.length === 0 ? (
              <div className="text-center py-8">
                <img src="/images/mascot-bill.png" alt="All caught up" className="w-16 h-auto mx-auto mb-4 opacity-50" />
                <p className="text-[#4B5D7A]">No bills due soon</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.dueSoon.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-3 bg-[#F7F8F5] rounded-lg border border-[#D5ECEB]">
                    <div>
                      <p className="font-medium text-[#102A4C]">{bill.name}</p>
                      <p className="text-sm text-[#4B5D7A]">{bill.provider}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#102A4C]">{formatCurrency(bill.amount, currency)}</p>
                      <Badge className={`${getDaysUntil(bill.dueDate) < 0 ? 'bg-[#FFF1F2] text-[#E6535F]' : 'bg-[#FEF3C7] text-[#D97706]'}`}>
                        {getDaysUntil(bill.dueDate) < 0 ? `${Math.abs(getDaysUntil(bill.dueDate))} days overdue` : `Due in ${getDaysUntil(bill.dueDate)} days`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#102A4C]">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/app/bills?add=true">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 border-[#D5ECEB] hover:bg-[#F7F8F5]">
                  <Plus className="h-5 w-5 text-[#078D88]" />
                  <span className="text-sm">Add Bill</span>
                </Button>
              </Link>
              <Link to="/app/cards">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 border-[#D5ECEB] hover:bg-[#F7F8F5]">
                  <CreditCard className="h-5 w-5 text-[#078D88]" />
                  <span className="text-sm">Add Card</span>
                </Button>
              </Link>
              <Link to="/app/reminders">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 border-[#D5ECEB] hover:bg-[#F7F8F5]">
                  <Clock className="h-5 w-5 text-[#078D88]" />
                  <span className="text-sm">Reminders</span>
                </Button>
              </Link>
              <Link to="/app/reports">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 border-[#D5ECEB] hover:bg-[#F7F8F5]">
                  <TrendingUp className="h-5 w-5 text-[#078D88]" />
                  <span className="text-sm">Reports</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Cards Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#102A4C]">Credit Cards</CardTitle>
            <Link to="/app/cards" className="text-sm text-[#078D88] hover:text-[#065F5F] flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.creditCardCount === 0 ? (
            <div className="text-center py-8">
              <img src="/images/card.png" alt="No cards" className="w-16 h-auto mx-auto mb-4 opacity-50" />
              <p className="text-[#4B5D7A] mb-4">No credit cards added</p>
              <Link to="/app/cards">
                <Button variant="outline" className="border-[#078D88] text-[#078D88]">Add Credit Card</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-[#F7F8F5] rounded-lg border border-[#D5ECEB]">
                <div>
                  <p className="font-medium text-[#102A4C]">Total Outstanding</p>
                  <p className="text-sm text-[#4B5D7A]">Across {stats.creditCardCount} cards</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#102A4C]">{formatCurrency(stats.totalCreditCardBalance, currency)}</p>
                  <p className="text-sm text-[#4B5D7A]">{formatCurrency(stats.availableCredit, currency)} available</p>
                </div>
              </div>
              <div className="h-2 bg-[#D5ECEB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#078D88] to-[#19C4B6] transition-all"
                  style={{ width: `${Math.min(100, stats.creditUtilization)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
