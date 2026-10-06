'use client';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Mascot } from '@/components/mascot';
import { useBills } from '@/features/bills/hooks';
import { useCards } from '@/features/cards/hooks';
import { useCurrency } from '@/features/preferences/hooks';
import { money } from '@/lib/format';
import { useStudio } from '../hooks';
import { dateKey, detectSubscriptions, forecast } from '../calculations';
export function PipInsight() {
  const bills=useBills(),cards=useCards(),plan=useStudio(),currency=useCurrency();
  if(bills.isError||cards.isError||plan.isError||!bills.data||!cards.data||!plan.data)return null;
  const overdue=bills.data.filter(bill=>bill.status!=='PAID'&&bill.dueDate.slice(0,10)<dateKey(new Date()));
  const increase=detectSubscriptions(plan.data.transactions).find(item=>item.increase>0);
  const flow=forecast(plan.data,bills.data,cards.data);
  const insight=overdue.length?{title:`Let’s clear ${overdue.length} overdue ${overdue.length===1?'bill':'bills'}.`,text:`Start with ${overdue[0].name}. A small action can make the rest feel lighter.`,href:'/bills',action:'Review bills'}:increase?{title:`${increase.merchant} looks a little pricier.`,text:`Its last charge rose by ${money(increase.increase,currency)}. It may be worth checking your plan.`,href:'/studio',action:'Review subscriptions'}:plan.data.version===0?{title:'Give your next payday a little direction.',text:'Add your cash balance and payday to see what’s coming, all in one place.',href:'/studio',action:'Build my plan'}:flow.lowest<plan.data.reserve?{title:'There’s a tight spot ahead.',text:`Your entered plan dips below your buffer. Try the planner to see which dates need attention.`,href:'/studio',action:'Explore my plan'}:{title:'A little room to breathe.',text:`Your entered 60-day plan has ${money(flow.room,currency)} above your buffer at its lowest point.`,href:'/studio',action:'See the forecast'};
  return <section className="pip-insight"><Mascot className="pip-insight-mascot"/><div><p className="eyebrow">A NOTE FROM PIP</p><h2 className="studio-title mt-2">{insight.title}</h2><p className="text-sm text-muted mt-2 max-w-xl">{insight.text}</p><Link href={insight.href} className="text-link mt-3">{insight.action}<ArrowUpRight size={16}/></Link></div></section>;
}
