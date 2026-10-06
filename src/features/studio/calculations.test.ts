import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forecast, splitCents, detectSubscriptions } from './calculations';
import { parseBillText, parseStatement } from './imports';
import { parseQuickBill } from './commands';
import type { Bill } from '@/features/bills/types';
import type { CreditCard } from '@/features/cards/types';
import type { StudioPlan } from './types';
const plan:StudioPlan={userId:'test',balance:1000,balanceDate:'2028-01-01',income:0,nextPayday:null,cadence:30,reserve:100,dailySpending:0,transactions:[],version:0};
const bill=(extra:Partial<Bill>):Bill=>({id:'bill',userId:'test',name:'Rent',amount:100,dueDate:'2028-01-31T12:00:00Z',provider:null,category:'Rent',recurrence:'Monthly',status:'UNPAID',paidAmount:0,paymentDate:null,isBusiness:false,notes:null,createdAt:'2028-01-01',updatedAt:'2028-01-01',...extra});
test('recurrence clamps to leap month end without drifting March dates',()=>{
 const flow=forecast(plan,[bill({})],[],{},new Date(2028,0,1));
 assert.deepEqual(flow.events.map(row=>row.date),['2028-01-31','2028-02-29']);
 assert.equal(flow.endBalance,800);
});
test('partial amount is subtracted once and future recurrence uses the full bill',()=>{
 const flow=forecast(plan,[bill({paidAmount:40})],[],{},new Date(2028,0,1));
 assert.equal(flow.endBalance,840);
 const paid=forecast(plan,[bill({status:'PAID',paidAmount:100})],[],{},new Date(2028,0,1));
 assert.equal(paid.endBalance,900);
});
test('same-day outflows precede salary and a purchase reduces headroom',()=>{
 const flow=forecast({...plan,balance:50,income:1000,nextPayday:'2028-01-01'},[bill({dueDate:'2028-01-01',recurrence:'One-time'})],[],{purchase:20},new Date(2028,0,1));
 assert.equal(flow.lowest,-70); assert.equal(flow.room,0);
});
test('card repayments clamp day 31 to February and never exceed outstanding',()=>{
 const card={bankName:'Bank',cardStatus:'ACTIVE',currentOutstanding:150,minimumPayment:100,paymentDueDate:31} as CreditCard;
 const flow=forecast(plan,[],[card],{},new Date(2028,1,1));
 assert.deepEqual(flow.events.map(row=>[row.date,row.amount]),[['2028-02-29',-10000],['2028-03-31',-5000]]);
});
test('split amounts preserve every cent',()=>{
 assert.deepEqual(splitCents(10,['a','b','c']).map(row=>row.amount),[3.34,3.33,3.33]);
});
test('CSV supports quotes, identical charges, and stable re-import identities',()=>{
 const csv='date,description,amount\r\n2026-09-01,"Shop, Ltd","1,200.50"\r\n2026-09-01,"Shop, Ltd","1,200.50"';
 const rows=parseStatement(csv); assert.equal(rows[0].amount,1200.50);assert.notEqual(rows[0].id,rows[1].id);assert.deepEqual(rows,parseStatement(csv));
 assert.throws(()=>parseStatement('date,merchant,amount\n2026-02-31,Shop,10'));
});
test('detects monthly price changes but excludes single and irregular charges',()=>{
 const rows=parseStatement('date,merchant,amount\n2026-08-01,Stream,10\n2026-09-01,Stream,12\n2026-09-01,Shop,20\n2026-09-03,Shop,20');
 const found=detectSubscriptions(rows);assert.equal(found.length,1);assert.equal(found[0].increase,2);assert.equal(found[0].nextDate,'2026-10-01');
});
test('bill scan leaves ambiguous numeric dates blank',()=>{
 assert.deepEqual(parseBillText('Acme Electric\nTotal due: $1,234.56\nDue date: 2026-11-09'),{provider:'Acme Electric',name:'Acme Electric bill',amount:'1234.56',dueDate:'2026-11-09'});
 assert.equal(parseBillText('Acme\nDue date: 01/02/2026').dueDate,'');
});
test('quick add rejects invalid dates and parses relative dates',()=>{
 assert.equal(parseQuickBill('add Internet 120 due tomorrow',new Date(2026,9,6))?.dueDate,'2026-10-07');
 assert.equal(parseQuickBill('add Internet 120 due 2026-02-31'),null);
});
