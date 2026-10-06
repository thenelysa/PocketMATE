'use client';
import { useEffect, useState } from 'react';
import { Mascot } from '@/components/mascot';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui';
import { useCurrency } from '@/features/preferences/hooks';
import { money } from '@/lib/format';
import type { Bill } from '@/features/bills/types';
export function PaymentReceipt() {
  const [bill,setBill]=useState<Bill|null>(null),currency=useCurrency();
  useEffect(()=>{const listener=(event:Event)=>setBill((event as CustomEvent<Bill>).detail);window.addEventListener('pocketmate-paid',listener);return()=>window.removeEventListener('pocketmate-paid',listener);},[]);
  return bill?<Modal title="One less thing on your mind." onClose={()=>setBill(null)}><div className="studio-receipt"><span className="studio-stamp">RECORDED AS PAID</span><Mascot className="receipt-mascot"/><p className="eyebrow mt-2">YOUR LITTLE WIN</p><h3 className="text-2xl font-semibold mt-3">{bill.name}</h3><strong className="studio-big-number">{money(bill.paidAmount||bill.amount,currency)}</strong><p className="text-xs text-muted">{bill.paymentDate?.slice(0,10)} · {bill.id.slice(0,8).toUpperCase()}</p><p className="text-sm my-5">Payment recorded. Any saved cash plan has been updated too.</p><p className="text-xs text-muted mb-5">PocketMATE records payments; it does not transfer money or verify bank settlement.</p><Button onClick={()=>setBill(null)}>Lovely. Keep going.</Button></div></Modal>:null;
}
