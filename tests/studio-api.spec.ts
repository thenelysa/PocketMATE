import { test, expect, request as http, type APIRequestContext } from '@playwright/test';
import { randomBytes, createHash } from 'node:crypto';
import { prisma } from '../src/lib/db';
// This suite must only run against the explicitly selected, empty development branch.
test.describe('Studio database integration',()=>{
  test.skip(!process.env.STUDIO_TEST_URL || !process.env.DATABASE_URL?.includes('ep-restless-breeze-axovmo6p'), 'Requires isolated Money Studio branch');
  let owner:APIRequestContext,guest:APIRequestContext,stranger:APIRequestContext;
  const ids=[`studio-owner-${randomBytes(8).toString('hex')}`,`studio-guest-${randomBytes(8).toString('hex')}`,`studio-stranger-${randomBytes(8).toString('hex')}`];
  let householdId:string;
  test.beforeAll(async()=>{
    const clients=[];
    for(const id of ids){const token=randomBytes(32).toString('base64url');await prisma.user.create({data:{id,email:`${id}@example.invalid`,name:id}});await prisma.session.create({data:{userId:id,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+3600000)}});clients.push(await http.newContext({baseURL:process.env.STUDIO_TEST_URL,extraHTTPHeaders:{cookie:`pocketmate_session=${token}`}}));}
    [owner,guest,stranger]=clients;
  });
  test.afterAll(async()=>{if(!owner)return;if(householdId)await prisma.household.deleteMany({where:{id:householdId}});await prisma.user.deleteMany({where:{id:{in:ids}}});await Promise.all([owner.dispose(),guest.dispose(),stranger.dispose()]);await prisma.$disconnect();});
  test('ownership, plan conflicts, payment accounting, invitation and reimbursement permissions',async()=>{
    test.setTimeout(90000);
    const noSession=await http.newContext({baseURL:process.env.STUDIO_TEST_URL});
    expect((await noSession.get('/api/bills?userId='+ids[0])).status()).toBe(401);
    expect((await noSession.post('/api/auth',{data:{sub:ids[0],email:`${ids[0]}@example.invalid`}})).status()).toBe(400);
    await noSession.dispose();
    expect((await owner.get('/api/studio')).status()).toBe(200);
    const draft={balance:2000,income:3000,reserve:200,dailySpending:10,cadence:30,nextPayday:'2027-01-20',version:0};
    expect((await owner.put('/api/studio',{data:draft})).status()).toBe(200);
    expect((await owner.put('/api/studio',{data:draft})).status()).toBe(409);
    const created=await owner.post('/api/bills',{data:{userId:ids[1],name:'Test electricity',amount:100,dueDate:'2027-01-01',status:'UNPAID'}});expect(created.status()).toBe(201);
    const bill=await created.json();expect(bill.userId).toBe(ids[0]);
    expect((await guest.put('/api/bills',{data:{id:bill.id,status:'PAID'}})).status()).toBe(404);
    expect((await guest.delete('/api/bills?id='+bill.id)).status()).toBe(404);
    expect(await (await guest.get('/api/bills?userId='+ids[0])).json()).toEqual([]);
    expect((await owner.put('/api/bills',{data:{id:bill.id,status:'PAID'}})).status()).toBe(200);
    expect((await owner.put('/api/bills',{data:{id:bill.id,status:'PAID'}})).status()).toBe(200);
    expect((await (await owner.get('/api/studio')).json()).balance).toBe(1900);
    expect(await prisma.billPayment.count({where:{billId:bill.id}})).toBe(1);
    const house=await owner.post('/api/households',{data:{action:'create',name:'Test Home'}});expect(house.status()).toBe(201);householdId=(await house.json()).id;
    const invite=await owner.post('/api/households',{data:{action:'invite',householdId}});const code=(await invite.json()).inviteCode;expect(code).toBeTruthy();
    expect((await guest.post('/api/households',{data:{action:'join',code}})).status()).toBe(200);
    expect((await stranger.post('/api/households',{data:{action:'expense',householdId,name:'Stolen',amount:10,dueDate:'2027-01-01',payerId:ids[0]}})).status()).toBe(401);
    expect((await owner.post('/api/households',{data:{action:'expense',householdId,name:'Shared internet',amount:10.01,dueDate:'2027-01-01',payerId:ids[0]}})).status()).toBe(201);
    const houses=await (await guest.get('/api/households')).json();const expense=houses[0].expenses[0];expect(expense.shares.reduce((sum:number,row:{amount:number})=>sum+Math.round(row.amount*100),0)).toBe(1001);expect(houses[0].inviteHash).toBeUndefined();
    expect(await (await stranger.get('/api/households')).json()).toEqual([]);
    expect((await guest.post('/api/households',{data:{action:'paid',householdId,expenseId:expense.id}})).status()).toBe(401);
    expect((await owner.post('/api/households',{data:{action:'paid',householdId,expenseId:expense.id}})).status()).toBe(200);
    expect((await guest.post('/api/households',{data:{action:'settle',householdId,expenseId:expense.id,memberId:ids[1]}})).status()).toBe(401);
    expect((await owner.post('/api/households',{data:{action:'settle',householdId,expenseId:expense.id,memberId:ids[1]}})).status()).toBe(200);
    expect((await owner.post('/api/households',{headers:{origin:'https://untrusted.example'},data:{action:'create',name:'Cross site'}})).status()).toBe(401);
  });
});
