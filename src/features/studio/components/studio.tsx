'use client';
import { useState } from 'react';
import { CalendarRange, ScanLine, Users, Sparkles, Repeat2, BookOpen } from 'lucide-react';
import { useBills } from '@/features/bills/hooks';
import { useCards } from '@/features/cards/hooks';
import { useStudio } from '../hooks';
import { Planner } from './planner';
import { BillScanner } from './bill-scanner';
import { Subscriptions } from './subscriptions';
import { Household } from './household';
import { MonthlyStory } from './monthly-story';
const tabs = [{id:'plan', label:'Plan ahead', icon:CalendarRange}, {id:'scan',label:'Scan a bill',icon:ScanLine}, {id:'subscriptions',label:'Subscriptions',icon:Repeat2}, {id:'household',label:'Household',icon:Users}, {id:'story',label:'Your story',icon:BookOpen}];
export function Studio() {
  const [active, setActive] = useState('plan');
  const plan = useStudio(), bills = useBills(), cards = useCards();
  return <div className="studio space-y-7">
    <div className="studio-intro"><div><p className="eyebrow flex items-center gap-2"><Sparkles size={14}/> A LITTLE MORE POSSIBILITY</p><h1 className="dashboard-heading mt-3">Make room for what’s next.</h1><p className="text-muted mt-3 max-w-xl">Turn your everyday numbers into a plan you can actually use.</p></div><span className="studio-edition">THE MONEY STUDIO<br/><strong>01 — YOUR EVERYDAY, REIMAGINED</strong></span></div>
    <div className="studio-tabs" role="tablist" aria-label="Money Studio tools">{tabs.map(({ id, label, icon: Icon }) => <button key={id} id={`tab-${id}`} role="tab" aria-selected={active === id} aria-controls={`panel-${id}`} onClick={() => setActive(id)} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { const index = (tabs.findIndex(tab => tab.id === active) + (event.key === 'ArrowRight' ? 1 : 4)) % tabs.length; setActive(tabs[index].id); document.getElementById(`tab-${tabs[index].id}`)?.focus(); } }} tabIndex={active === id ? 0 : -1}><Icon size={17}/>{label}</button>)}</div>
    <section role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`}>
      {active === 'scan' ? <BillScanner/> : active === 'household' ? <Household/> : plan.isError || bills.isError || cards.isError ? <div role="alert" className="studio-card">Could not load your money tools. <button className="text-link" onClick={() => { void plan.refetch(); void bills.refetch(); void cards.refetch(); }}>Try again</button></div> : !plan.data || bills.isLoading || cards.isLoading ? <p role="status">Getting your numbers together…</p> : active === 'plan' ? <Planner key={plan.data.version} plan={plan.data} bills={bills.data || []} cards={cards.data || []}/> : active === 'subscriptions' ? <Subscriptions plan={plan.data}/> : <MonthlyStory bills={bills.data || []} cards={cards.data || []} transactions={plan.data.transactions}/>}
    </section>
  </div>;
}
