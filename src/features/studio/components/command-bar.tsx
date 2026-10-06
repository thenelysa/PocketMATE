'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowUpRight, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui';
import { useBills, useCreateBill } from '@/features/bills/hooks';
import { useCurrency } from '@/features/preferences/hooks';
import { money } from '@/lib/format';
import { parseQuickBill } from '../commands';
export function CommandBar() {
  const [open,setOpen]=useState(false);
  useEffect(()=>{const listener=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setOpen(value=>!value);}};window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener);},[]);
  return <><button className="studio-search" onClick={()=>setOpen(true)} aria-label="Open quick commands"><Search size={17}/><span className="hidden sm:inline">Find or add anything</span><kbd className="hidden md:inline">Ctrl K</kbd></button>{open&&<Commands onClose={()=>setOpen(false)}/>}</>;
}
function Commands({onClose}:{onClose:()=>void}) {
  const [text,setText]=useState(''),[error,setError]=useState(''),create=useCreateBill(),bills=useBills(),router=useRouter(),currency=useCurrency();
  const draft=parseQuickBill(text),query=text.toLowerCase().replace(/^(?:find|show)\s+/,'').trim();
  const matches=(bills.data||[]).filter(bill=>query==='unpaid'?bill.status!=='PAID':bill.name.toLowerCase().includes(query)).slice(0,8);
  return <Modal title="A little shortcut." onClose={onClose}><label className="studio-label">Search, or type a bill<input data-autofocus value={text} onChange={event=>{setText(event.target.value);setError('');}} placeholder="Add Internet 120 due tomorrow"/></label><p className="text-xs text-muted mt-2">Try “unpaid”, a bill name, or “Add Rent 800 due 2026-11-01”.</p>
    {draft?<div className="studio-card mt-5"><p className="eyebrow">CHECK BEFORE ADDING</p><h3 className="text-xl font-semibold mt-3">{draft.name}</h3><p className="text-sm mt-2">{money(draft.amount,currency)} · Due {draft.dueDate} · One-time</p><Button className="mt-4" disabled={create.isPending} onClick={async()=>{try{await create.mutateAsync({...draft,dueDate:new Date(`${draft.dueDate}T12:00:00`).toISOString(),provider:null,category:'Other',recurrence:'One-time',status:'UNPAID',isBusiness:false,notes:null,paidAmount:0,paymentDate:null});onClose();router.push('/bills');}catch(error){setError(error instanceof Error?error.message:'Could not add bill');}}}><Plus size={16}/>Confirm and add bill</Button></div>:<div className="mt-5 space-y-1">{!text&&[['Money Studio','/studio'],['Bills','/bills'],['Reminders','/reminders'],['Credit cards','/cards']].map(([name,path])=><button key={path} className="studio-command-row" onClick={()=>{router.push(path);onClose();}}><span>{name}</span><ArrowUpRight size={17}/></button>)}{bills.isError?<p role="alert">Could not search your bills.</p>:matches.map(bill=><button className="studio-command-row" key={bill.id} onClick={()=>{router.push(`/bills?search=${encodeURIComponent(bill.name)}`);onClose();}}><span>{bill.name}<small className="block text-muted mt-1">{bill.status==='PAID'?'Paid':'Unpaid'} · {bill.dueDate.slice(0,10)}</small></span><strong>{money(bill.amount,currency)}</strong></button>)}{text&&!matches.length&&<p className="text-sm text-muted py-5">No matching bills. To add one, include a name, amount, and due date.</p>}</div>}{error&&<p role="alert" className="studio-error mt-3">{error}</p>}
  </Modal>;
}
