import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Select } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getBills, getCreditCards, getReminders } from '@/lib/dataStore';
import { formatCurrency, getMonthRange } from '@/lib/utils';
import { CATEGORY_LABELS, BillCategory } from '@/types';
import { Download, TrendingUp, TrendingDown, PieChart, Database } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import Papa from 'papaparse';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16'];

export function ReportsPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [categorySpending, setCategorySpending] = useState<{ category: string; amount: number }[]>([]);
  const [paidVsUnpaid, setPaidVsUnpaid] = useState({ paid: 0, unpaid: 0 });
  const [personalVsBusiness, setPersonalVsBusiness] = useState({ personal: 0, business: 0 });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedMonth]);

  const loadData = () => {
    if (!user) return;

    const allBills = getBills(user.id);
    const allCards = getCreditCards(user.id);

    setBills(allBills);
    setCards(allCards);

    const [year, month] = selectedMonth.split('-').map(Number);
    const { start, end } = getMonthRange(year, month - 1);

    const monthBills = allBills.filter((b: any) => {
      const dueDate = new Date(b.dueDate);
      return dueDate >= start && dueDate <= end;
    });

    const categoryTotals: { [key: string]: number } = {};
    monthBills.forEach((bill: any) => {
      const category = CATEGORY_LABELS[bill.category as BillCategory] || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + bill.amount;
    });
    setCategorySpending(
      Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
    );

    const paid = monthBills.filter((b: any) => b.status === 'PAID').reduce((sum: number, b: any) => sum + b.amount, 0);
    const unpaid = monthBills.filter((b: any) => b.status !== 'PAID').reduce((sum: number, b: any) => sum + b.amount, 0);
    setPaidVsUnpaid({ paid, unpaid });

    const personal = monthBills.filter((b: any) => !b.isBusiness).reduce((sum: number, b: any) => sum + b.amount, 0);
    const business = monthBills.filter((b: any) => b.isBusiness).reduce((sum: number, b: any) => sum + b.amount, 0);
    setPersonalVsBusiness({ personal, business });

    setLoading(false);
  };

  const exportToCSV = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const { start, end } = getMonthRange(year, month - 1);

    const dataToExport = bills
      .filter((b: any) => {
        const dueDate = new Date(b.dueDate);
        return dueDate >= start && dueDate <= end;
      })
      .map((bill: any) => ({
        Name: bill.name,
        Provider: bill.provider || '',
        Amount: bill.amount,
        Category: CATEGORY_LABELS[bill.category as BillCategory],
        DueDate: new Date(bill.dueDate).toLocaleDateString(),
        Status: bill.status,
        Type: bill.isBusiness ? 'Business' : 'Personal',
      }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `billpay-report-${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    if (!user) return;

    const allBills = getBills(user.id);
    const allCards = getCreditCards(user.id);
    const allReminders = getReminders(user.id);

    const dataToExport = {
      exportDate: new Date().toISOString(),
      bills: allBills,
      creditCards: allCards,
      reminders: allReminders,
    };

    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pocketmate-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const monthOptions = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      monthOptions.push({ value, label });
    }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pieData = categorySpending.map((item, index) => ({
    name: item.category,
    value: item.amount,
    color: COLORS[index % COLORS.length],
  }));

  const totalSpending = categorySpending.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-muted-foreground">Analyze your spending</p>
        </div>
        <div className="flex gap-2">
          <Select
            options={monthOptions}
            value={selectedMonth}
            onChange={(e: any) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportToJSON} className="gap-2">
            <Database className="h-4 w-4" />
            Backup JSON
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bills</p>
                <p className="text-xl font-bold">{formatCurrency(totalSpending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingDown className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(paidVsUnpaid.paid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unpaid</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(paidVsUnpaid.unpaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <PieChart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-xl font-bold">{categorySpending.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categorySpending.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No data for this month</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bills This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {categorySpending.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No data for this month</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categorySpending.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `₨${v / 1000}k`} />
                    <YAxis dataKey="category" type="category" width={100} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal vs Business Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Personal</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(personalVsBusiness.personal)}</p>
              <div className="mt-2 h-2 bg-primary/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${personalVsBusiness.personal + personalVsBusiness.business > 0
                      ? (personalVsBusiness.personal / (personalVsBusiness.personal + personalVsBusiness.business)) * 100
                      : 50}%`
                  }}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Business</p>
              <p className="text-3xl font-bold text-secondary">{formatCurrency(personalVsBusiness.business)}</p>
              <div className="mt-2 h-2 bg-secondary/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary"
                  style={{
                    width: `${personalVsBusiness.personal + personalVsBusiness.business > 0
                      ? (personalVsBusiness.business / (personalVsBusiness.personal + personalVsBusiness.business)) * 100
                      : 50}%`
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credit Card Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No credit cards</p>
          ) : (
            <div className="space-y-4">
              {cards.map((card: any) => {
                const utilization = card.creditLimit > 0
                  ? (card.currentOutstanding / card.creditLimit) * 100
                  : 0;
                return (
                  <div key={card.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{card.bankName} - {card.cardName}</p>
                      <p className="text-sm text-muted-foreground">•••• {card.lastFourDigits}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(card.currentOutstanding)}</p>
                      <p className="text-sm text-muted-foreground">{utilization.toFixed(1)}% used</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
