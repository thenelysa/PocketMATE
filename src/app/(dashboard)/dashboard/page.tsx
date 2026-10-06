'use client';

import { useCurrency } from '@/features/preferences/hooks';
import Link from 'next/link';
import { useAuth } from '@/features/auth/auth-context';
import { useBills } from '@/features/bills/hooks';
import { useCards } from '@/features/cards/hooks';
import { ArrowUpRight, Receipt, CreditCard, CheckCircle, Plus } from 'lucide-react';
import { PipInsight } from '@/features/studio/components/pip-insight';
import { Mascot } from '@/components/mascot';
import { money } from '@/lib/format';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: bills = [], isLoading: billsLoading, isError: billsError } = useBills();
  const { data: cards = [], isLoading: cardsLoading, isError: cardsError } = useCards();
  const currency = useCurrency();

  const paidBills = bills.filter(b => b.status === 'PAID').length;
  const unpaidBills = bills.filter(b => b.status === 'UNPAID');
  const totalDue = unpaidBills.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalCardDebt = cards.reduce((sum, c) => sum + Number(c.currentOutstanding || 0), 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingBills = unpaidBills.filter(b => {
    const diff = (new Date(b.dueDate).getTime() - today.getTime()) / 86400000;
    return diff >= 0 && diff < 7;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  if (billsLoading || cardsLoading) return <div role="status" className="py-20 text-center text-muted">Gathering your overview?</div>;
  if (billsError || cardsError) return <div role="alert" className="content-panel">Your overview couldn?t load. Please refresh to try again.</div>;

  return (
    <div className="space-y-7">
      <PipInsight />
      <div className="overview-intro">
        <div><p className="eyebrow text-muted mb-3">YOUR PERSONAL MONEY SPACE</p><h2 className="dashboard-heading">Welcome back, {user?.name?.split(' ')[0] || 'there'}.</h2><p className="text-muted text-sm mt-2">A little clarity for the day ahead.</p></div>
        <Link href="/bills" className="brand-button inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal px-4 py-2 font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"><Plus size={16} /> Manage bills</Link>
      </div>
      <div className="overview-grid">
        <section className="balance-panel">
          <p className="eyebrow">OUTSTANDING BILLS</p><p className="balance-number">{money(totalDue, currency)}</p>
          <p className="text-xs opacity-80">{unpaidBills.length} unpaid {unpaidBills.length === 1 ? 'bill' : 'bills'} to keep in view.</p>
          <Link href="/bills" className="inline-flex items-center gap-3 text-xs mt-5 underline underline-offset-4">View your bills <ArrowUpRight size={14} /></Link><Mascot />
        </section>
        <section className="stat-grid" aria-label="Account summary">
          {[['Bills tracked', bills.length], ['Bills paid', paidBills], ['Card balance', money(totalCardDebt, currency)], ['Cards in your pocket', cards.length]].map(([label, value]) => <div className="stat-cell" key={label}><p>{label}</p><strong>{value}</strong></div>)}
        </section>
      </div>
      <div className="overview-grid">
        <section className="content-panel">
          <div className="panel-heading"><div><p className="eyebrow text-muted mb-1">THE NEXT SEVEN DAYS</p><h3>Coming up</h3></div><Link href="/bills">All bills ?</Link></div>
          {upcomingBills.length === 0 ? <div className="empty-state"><CheckCircle size={30} strokeWidth={1.3} /><p>No bills due in the next seven days.</p><Link href="/bills" className="text-link">Review your bills <ArrowUpRight size={14} /></Link></div> : upcomingBills.map(bill => <div key={bill.id} className="dashboard-row"><div className="flex items-center gap-3"><span className="rounded-lg bg-mint p-3"><Receipt size={18} /></span><div><p className="font-semibold text-sm">{bill.name}</p><p className="text-muted text-xs mt-1">{bill.provider || 'Bill'}</p></div></div><div className="text-right shrink-0"><p className="font-semibold text-sm">{money(bill.amount, currency)}</p><p className="text-xs text-muted mt-1">{format(new Date(bill.dueDate), 'MMM d')}</p></div></div>)}
        </section>
        <section className="content-panel">
          <div className="panel-heading"><div><p className="eyebrow text-muted mb-1">ALL TOGETHER</p><h3>Your credit cards</h3></div><Link href="/cards">Manage ?</Link></div>
          {cards.length === 0 ? <div className="empty-state"><CreditCard size={30} strokeWidth={1.3} /><p>Your cards deserve a home, too.</p><Link href="/cards" className="text-link">Add your first card <Plus size={14} /></Link></div> : cards.map(card => <div key={card.id} className="dashboard-row"><div><p className="font-semibold text-sm">{card.bankName}</p><p className="text-xs text-muted mt-1">{card.cardName || 'Credit card'} ? Due day {card.paymentDueDate}</p><p className="text-xs text-muted mt-1">Limit {money(card.creditLimit, currency)}</p></div><span className="font-semibold text-sm">{money(card.currentOutstanding || 0, currency)}</span></div>)}
        </section>
      </div>
      <p className="text-xs text-muted text-center py-2">One small check-in. A little more peace of mind.</p>
    </div>
  );
}
