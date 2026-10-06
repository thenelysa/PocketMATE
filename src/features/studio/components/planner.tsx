'use client';
import { useState } from 'react';
import { ArrowUpRight, Check, SlidersHorizontal } from 'lucide-react';
import { Button, DatePicker } from '@/components/ui';
import { useCurrency } from '@/features/preferences/hooks';
import type { Bill } from '@/features/bills/types';
import type { CreditCard } from '@/features/cards/types';
import { money } from '@/lib/format';
import { dateKey, forecast } from '../calculations';
import { useSavePlan } from '../hooks';
import type { StudioPlan } from '../types';
export function Planner({ plan, bills, cards }: { plan: StudioPlan; bills: Bill[]; cards: CreditCard[] }) {
  const save = useSavePlan(), currency = useCurrency();
  const [draft, setDraft] = useState({ balance: String(plan.balance), income: String(plan.income), reserve: String(plan.reserve), dailySpending: String(plan.dailySpending), cadence: plan.cadence, nextPayday: plan.nextPayday?.slice(0,10) || '', version: plan.version });
  const [purchase, setPurchase] = useState('0'), [shift, setShift] = useState(0), [extra, setExtra] = useState(0);
  const [view, setView] = useState<'chart'|'list'>('chart');
  // Keep editable amounts as text so clearing a field does not turn it back into 0.
  const numericDraft = { ...draft, balance: Number(draft.balance), income: Number(draft.income), reserve: Number(draft.reserve), dailySpending: Number(draft.dailySpending) };
  const effective = { ...plan, ...numericDraft };
  const base = forecast(effective, bills, cards), projection = forecast(effective, bills, cards, { purchase: Math.max(0, Number(purchase)), shift, cardExtra: extra });
  const values = projection.days.map(day => day.balance), min = Math.min(0, ...values), max = Math.max(1, ...values), range = max - min;
  const y = (value: number) => 160 - (value - min) / range * 130;
  const points = values.map((value,i) => `${20 + i * 9.3},${y(value)}`).join(' ');
  const paydays = base.events.filter(event => event.kind === 'income');
  const windows = [{date:dateKey(new Date()), name:'Available now'}, ...paydays.map(event => ({date:event.date,name:'Next paycheck'}))];
  return <div className="space-y-6">
    {plan.balanceDate.slice(0,10) !== dateKey(new Date()) && <p role="status" className="studio-verdict is-tight">Your balance was last entered on {plan.balanceDate.slice(0,10)}. Update it to today&apos;s cash balance before relying on this forecast.</p>}
    <div className="studio-planner-grid">
      <form className="studio-card space-y-4" onSubmit={event => { event.preventDefault(); save.mutate({...numericDraft, nextPayday: draft.nextPayday || null}); }}>
        <p className="eyebrow">01 / YOUR STARTING POINT</p><h2 className="studio-title">Give your money a plan.</h2>
        <div className="grid grid-cols-2 gap-3">{(['balance','income','reserve','dailySpending'] as const).map((key,i) => <label className="studio-label" key={key}>{['Cash available today','Take-home per payday','Keep-aside buffer','Daily living costs'][i]}<input required type="number" min={key === 'balance' ? '-999999999' : '0'} max="999999999" step="0.01" value={draft[key]} onChange={e => setDraft({...draft,[key]: e.target.value})}/></label>)}</div>
        <label className="studio-label">Next payday<DatePicker label="Next payday" value={draft.nextPayday} onChange={value => setDraft({...draft,nextPayday:value})} id="planner-payday" /></label>
        <label className="studio-label">Pay frequency<select value={draft.cadence} onChange={e => setDraft({...draft,cadence:Number(e.target.value)})}><option value={7}>Weekly</option><option value={14}>Every two weeks</option><option value={30}>Monthly</option></select></label>
        <Button disabled={save.isPending} type="submit"><Check size={16}/>{save.isPending ? 'Saving…' : 'Save my starting point'}</Button>
        {save.error && <p role="alert" className="text-red-700 text-sm">{save.error.message}</p>}
        <p className="text-xs text-muted">Enter today’s cash balance. This is a manual forecast, based on your saved bills and card payments.</p>
      </form>
      <div className="studio-card studio-forecast">
        <div className="flex justify-between gap-4"><p className="eyebrow">02 / THE NEXT 60 DAYS</p><button className="text-xs underline" onClick={() => setView(view === 'chart' ? 'list':'chart')}>{view === 'chart' ? 'Table view' : 'Chart view'}</button></div>
        <h2 className="studio-big-number">{money(projection.endBalance, currency)}</h2><p className="text-sm text-muted">projected at the end of your plan</p>
        {view === 'chart' ? <svg viewBox="0 0 600 195" role="img" aria-label={`60-day cash forecast. Lowest balance ${money(projection.lowest,currency)}. Ending balance ${money(projection.endBalance,currency)}.`} className="studio-chart"><defs><linearGradient id="flow-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#274B44" stopOpacity=".2"/><stop offset="1" stopColor="#274B44" stopOpacity="0"/></linearGradient></defs><path d={`M20,175 L${points.replaceAll(' ', ' L')} L578,175 Z`} fill="url(#flow-fill)"/><line x1="20" x2="578" y1={y(0)} y2={y(0)} stroke="#93a59c" strokeDasharray="4 4"/><polyline points={points} fill="none" stroke="#274B44" strokeWidth="3" strokeLinejoin="round"/><text x="20" y="193" fontSize="11" fill="#52695f">Today</text><text x="535" y="193" fontSize="11" fill="#52695f">Day 60</text></svg> : <div className="max-h-48 overflow-auto my-4"><table className="w-full text-sm"><caption className="sr-only">Daily projected balances</caption><thead><tr><th className="text-left">Date</th><th className="text-right">Balance</th></tr></thead><tbody>{projection.days.map(day => <tr key={day.date}><td>{day.date}</td><td className="text-right">{money(day.balance,currency)}</td></tr>)}</tbody></table></div>}
        <div className="studio-metrics"><div><span>Lowest point</span><strong className={projection.lowest < numericDraft.reserve ? 'text-red-700':''}>{money(projection.lowest,currency)}</strong></div><div><span>Room above your buffer</span><strong>{money(projection.room,currency)}</strong></div></div>
        <p className="text-xs text-muted mt-4">Recurring bills and minimum card payments are projected. Interest, unlisted spending, and household splits are excluded. Same-day expenses are counted before income.</p>
      </div>
    </div>
    <div className="grid xl:grid-cols-2 gap-6">
      <div className="studio-card space-y-4"><p className="eyebrow">03 / BEFORE YOU BUY</p><h2 className="studio-title">Can this fit?</h2><label className="studio-label">Purchase amount ({currency})<input type="number" min="0" max="999999999" step="0.01" value={purchase} onChange={e => setPurchase(e.target.value)}/></label><p role="status" className={`studio-verdict ${projection.lowest < numericDraft.reserve ? 'is-tight':''}`}>{projection.lowest >= numericDraft.reserve ? 'Your entered plan stays above your buffer.' : `This plan dips ${money(numericDraft.reserve - projection.lowest,currency)} below your buffer.`}</p><p className="text-xs text-muted">The purchase is simulated for today. Nothing is charged or added to your bills.</p></div>
      <div className="studio-card space-y-5"><p className="eyebrow flex items-center gap-2"><SlidersHorizontal size={15}/> 04 / TRY A WHAT-IF</p><h2 className="studio-title">Move the numbers around.</h2><label className="studio-label">Bill payment shift: {shift > 0 ? '+':''}{shift} days<input type="range" min="-14" max="14" value={shift} onChange={e => setShift(Number(e.target.value))}/></label><label className="studio-label">Extra monthly payment per card: {money(extra,currency)}<input type="range" min="0" max={Math.max(1000, numericDraft.income)} step="10" value={extra} onChange={e => setExtra(Number(e.target.value))}/></label><button className="text-sm underline" onClick={() => { setShift(0);setExtra(0);setPurchase('0'); }}>Reset scenario</button><p className="text-xs text-muted">Simulation only. Moving a payment does not change its actual due date or account for late fees.</p></div>
    </div>
    <section className="studio-card"><p className="eyebrow">05 / PAYDAY POCKETS</p><h2 className="studio-title mt-2">Every paycheck has a purpose.</h2><div className="studio-paydays mt-5">{windows.map((window,i) => { const next = windows[i+1]?.date || '9999'; const items = base.events.filter(event => event.amount < 0 && event.date >= window.date && event.date < next); return <div key={`${window.date}-${i}`} className="studio-pocket"><div className="flex justify-between"><span className="text-xs uppercase tracking-wide">{window.name}</span><ArrowUpRight size={17}/></div><h3 className="font-semibold mt-2">{window.date}</h3><p className="text-2xl mt-3 font-semibold">{money(-items.reduce((sum,item) => sum+item.amount,0)/100,currency)}</p><p className="text-xs text-muted mb-3">allocated before the next payday</p>{items.filter(item => item.kind !== 'spending').map((item,j) => <p className="flex justify-between gap-3 text-sm py-1" key={j}><span>{item.name}</span><span>{money(-item.amount/100,currency)}</span></p>)}{items.some(item => item.kind === 'spending') && <p className="text-xs text-muted mt-2">Includes everyday living costs.</p>}</div>; })}</div></section>
  </div>;
}
