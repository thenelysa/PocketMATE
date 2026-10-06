'use client';
import { useState } from 'react';
import { ScanLine, FileCheck2 } from 'lucide-react';
import { Button, DatePicker } from '@/components/ui';
import { useCreateBill } from '@/features/bills/hooks';
import { useCurrency } from '@/features/preferences/hooks';
import { parseBillText } from '../imports';
import { readDocument } from '../scan';
export function BillScanner() {
  const create = useCreateBill(), currency = useCurrency();
  const [text,setText]=useState(''),[progress,setProgress]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  const [draft,setDraft]=useState({name:'',provider:'',amount:'',dueDate:''});
  async function scan(file?: File) {
    if (!file) return;setBusy(true);setError('');setSaved(false);setText('');
    try { const result=await readDocument(file,setProgress);setText(result);setDraft(parseBillText(result));if(!result.trim()) setError('No text was found. Try a sharper photo or enter the details below.'); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not read this document.'); }
    finally { setBusy(false);setProgress(''); }
  }
  return <div className="grid lg:grid-cols-2 gap-6"><section className="studio-card"><p className="eyebrow">LESS TYPING, MORE LIVING</p><h2 className="studio-title mt-3">From paper to your pocket.</h2><p className="text-muted text-sm mt-3">Pick a bill. We’ll read the text and suggest its details for you to check.</p><label className={`studio-upload ${busy?'opacity-50':''}`}><ScanLine size={42} strokeWidth={1.2}/><strong>{busy ? 'Reading your document…':'Choose a photo or PDF'}</strong><span>PNG, JPEG, WebP or PDF · 15 MB · up to 5 pages</span><input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" disabled={busy} onChange={event => void scan(event.target.files?.[0])}/></label><p className="text-xs text-muted">Documents are read on your device. OCR downloads its English recognition files on first use. Only the details you approve are saved.</p>{busy && <p className="mt-4 text-sm" role="status">{progress}</p>}{error && <p role="alert" className="text-red-700 mt-4">{error}</p>}<details className="mt-5"><summary className="text-sm cursor-pointer">Paste or review extracted text</summary><textarea className="studio-textarea mt-3" rows={8} value={text} onChange={event=>setText(event.target.value)} aria-label="Bill text"/><Button className="mt-3" variant="outline" onClick={()=>{setDraft(parseBillText(text));setSaved(false);}}>Read this text</Button></details></section>
    <form className="studio-card space-y-4" onSubmit={async event=>{event.preventDefault();setError('');try { await create.mutateAsync({name:draft.name,provider:draft.provider||null,amount:Number(draft.amount),dueDate:new Date(draft.dueDate).toISOString(),category:'Other',recurrence:'One-time',notes:null,isBusiness:false,status:'UNPAID',paidAmount:0,paymentDate:null});setSaved(true); } catch(error){setError(error instanceof Error?error.message:'Could not save bill');} }}>
      <p className="eyebrow">REVIEW BEFORE SAVING</p><h2 className="studio-title">Does this look right?</h2><p className="text-xs text-muted">Check the amount and date against your bill. Ambiguous dates are left blank. Amounts are in {currency}; no currency conversion is performed.</p>
      {(['name','provider','amount'] as const).map(key=><label key={key} className="studio-label">{key==='name'?'Bill name':key==='provider'?'Provider':`Amount (${currency})`}<input required={key!=='provider'} type={key==='amount'?'number':'text'} min={key==='amount'?'0.01':undefined} step={key==='amount'?'0.01':undefined} value={draft[key]} onChange={event=>{setDraft({...draft,[key]:event.target.value});setSaved(false);}}/></label>)}
      <label className="studio-label">Due date<DatePicker label="Due date" id="scan-due" value={draft.dueDate} required onChange={value=>{setDraft({...draft,dueDate:value});setSaved(false);}}/></label>
      <Button disabled={busy||create.isPending||saved} type="submit"><FileCheck2 size={17}/>{saved?'Saved to your bills':create.isPending?'Saving…':'Confirm and save bill'}</Button>{saved&&<p role="status" className="text-sm text-teal">Your bill is now in Bills and the planner.</p>}
    </form></div>;
}
