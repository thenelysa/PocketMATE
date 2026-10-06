'use client';
import { useState } from 'react';
import { Repeat2, Upload, ArrowUpRight } from 'lucide-react';
import { Button, DeleteDialog } from '@/components/ui';
import { useCreateBill } from '@/features/bills/hooks';
import { useCreateReminder } from '@/features/reminders/hooks';
import { useCurrency } from '@/features/preferences/hooks';
import { money } from '@/lib/format';
import { detectSubscriptions } from '../calculations';
import { parseStatement } from '../imports';
import { useSavePlan } from '../hooks';
import type { StatementRow, StudioPlan } from '../types';
export function Subscriptions({ plan }: { plan: StudioPlan }) {
  const save = useSavePlan(), createBill=useCreateBill(), reminder=useCreateReminder(), currency=useCurrency();
  const [preview,setPreview]=useState<StatementRow[]|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[clear,setClear]=useState(false);
  const suspects=detectSubscriptions(plan.transactions), annual=suspects.reduce((sum,item)=>sum+item.amount*(item.interval==='weekly'?52:item.interval==='monthly'?12:1),0);
  const importedIds=new Set(plan.transactions.map(row=>row.id));
  const additions=preview?.filter(row=>!importedIds.has(row.id))||[];
  async function read(file?:File) { if(!file)return;setError('');setNotice('');try {if(file.size>3*1024*1024)throw new Error('Choose a CSV under 3 MB.');setPreview(parseStatement(await file.text()));} catch(error){setError(error instanceof Error?error.message:'Could not read CSV');} }
  async function track(item:typeof suspects[number], asReminder=false) {
    setError('');setNotice('');
    try {
      if(asReminder){const date=new Date(`${item.nextDate}T09:00:00`);if(date.getTime()<=new Date().getTime())throw new Error('This estimated renewal is in the past. Import a recent statement before setting a reminder.');await reminder.mutateAsync({type:'SUBSCRIPTION',title:`Review ${item.merchant} renewal`,message:`Estimated renewal: ${money(item.amount,currency)}. Check with the provider.`,remindAt:date.toISOString(),referenceId:null,referenceType:null,isSent:false});}
      else await createBill.mutateAsync({name:item.merchant,provider:item.merchant,amount:item.amount,dueDate:new Date(`${item.nextDate}T12:00:00`).toISOString(),category:'Subscription',recurrence:item.interval[0].toUpperCase()+item.interval.slice(1),notes:'Estimated from imported statement. Confirm renewal with provider.',isBusiness:false,status:'UNPAID',paidAmount:0,paymentDate:null});
      setNotice(asReminder?'Renewal reminder created.':'Subscription added to Bills.');
    }catch(error){setError(error instanceof Error?error.message:'Could not save');}
  }
  return <div className="space-y-6">
    {clear&&<DeleteDialog title="Clear imported transactions" itemName="all imported statement rows" onClose={()=>setClear(false)} onConfirm={async()=>{await save.mutateAsync({transactions:[],version:plan.version});setClear(false);}}/>}
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6"><div className="studio-card"><p className="eyebrow">FIND THE LITTLE REPEATS</p><h2 className="studio-title mt-3">What’s quietly renewing?</h2><p className="text-sm text-muted mt-3">Import statement history to spot recurring merchants and recent price changes. Two or more charges are needed.</p><label className="studio-upload !py-6"><Upload size={26}/><strong>Import statement CSV</strong><span>date, merchant, amount · YYYY-MM-DD · positive amounts are spending</span><input type="file" accept=".csv,text/csv" onChange={event=>void read(event.target.files?.[0])}/></label><a download="statement-template.csv" href="data:text/csv;charset=utf-8,date%2Cmerchant%2Camount%0A2026-08-01%2CExample%20subscription%2C10.00%0A2026-09-01%2CExample%20subscription%2C12.00" className="text-sm underline">Download CSV format example</a><p className="text-xs text-muted mt-3">Import only {currency} transactions. No bank connection or automatic cancellation. Detection is an estimate.</p></div><div className="studio-card studio-forecast flex flex-col justify-center"><Repeat2 size={28}/><p className="eyebrow mt-6">ESTIMATED YEARLY REPEATS</p><strong className="studio-big-number">{money(annual,currency)}</strong><p className="text-sm text-muted">{suspects.length} possible subscriptions across {plan.transactions.length} imported transactions.</p></div></div>
    {error&&<p role="alert" className="studio-error">{error}</p>}{notice&&<p role="status" className="studio-verdict">{notice}</p>}
    {preview&&<section className="studio-card"><h3 className="font-semibold">Review your import</h3><p className="text-sm text-muted mt-2">{additions.length} new rows · {preview.length-additions.length} already imported. Importing does not change your cash balance.</p><div className="overflow-auto max-h-64 my-4"><table className="w-full text-sm text-left"><thead><tr><th>Date</th><th>Merchant</th><th>Amount</th></tr></thead><tbody>{preview.slice(0,100).map(row=><tr key={row.id}><td className="py-2 pr-4 whitespace-nowrap">{row.date}</td><td className="pr-4">{row.merchant}</td><td>{money(row.amount,currency)}</td></tr>)}</tbody></table></div>{preview.length>100&&<p className="text-xs text-muted mb-3">Showing the first 100 rows.</p>}<div className="flex gap-3"><Button disabled={!additions.length||save.isPending} onClick={async()=>{try{await save.mutateAsync({transactions:[...plan.transactions,...additions],version:plan.version});setPreview(null);setNotice('Statement imported.');}catch(error){setError(error instanceof Error?error.message:'Import failed');}}}>Confirm import</Button><Button variant="ghost" onClick={()=>setPreview(null)}>Cancel</Button></div></section>}
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{suspects.map(item=><article key={item.merchant} className="studio-card"><div className="flex justify-between gap-3"><span className="studio-chip">Possible {item.interval}</span><ArrowUpRight size={18}/></div><h3 className="text-xl font-semibold mt-5 break-words">{item.merchant}</h3><p className="text-3xl font-semibold mt-3">{money(item.amount,currency)}</p>{item.increase>0&&<p className="text-sm text-red-700 mt-2">Up {money(item.increase,currency)} since the previous charge</p>}<p className="text-xs text-muted mt-4">Estimated next charge: {item.nextDate}<br/>{item.count} matching charges found.</p><div className="flex flex-wrap gap-2 mt-5"><Button size="sm" disabled={createBill.isPending} onClick={()=>void track(item)}>Track as bill</Button><Button size="sm" variant="outline" disabled={reminder.isPending} onClick={()=>void track(item,true)}>Remind me</Button></div></article>)}</div>
    {!suspects.length&&<div className="studio-card text-center py-10"><Repeat2 className="mx-auto mb-3"/><h3 className="font-semibold">No repeating pattern yet.</h3><p className="text-sm text-muted mt-2">Try two or three months of statement history. Single charges won’t be labeled as subscriptions.</p></div>}
    {plan.transactions.length>0&&<button className="text-sm text-red-700 underline" onClick={()=>setClear(true)}>Clear imported statement data</button>}
  </div>;
}
