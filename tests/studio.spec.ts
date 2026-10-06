import { test, expect } from '@playwright/test';
const user={sub:'studio-test',name:'Studio Tester',email:'studio@example.com',picture:''};
const initialPlan={userId:user.sub,balance:2000,balanceDate:'2026-10-06',income:3000,nextPayday:'2026-10-20',cadence:30,reserve:300,dailySpending:10,transactions:[],version:1};
test.beforeEach(async({page})=>{
  await page.route('**/api/**',route=>{const path=new URL(route.request().url()).pathname;return route.fulfill({json:path==='/api/auth'?user:path==='/api/studio'?initialPlan:[]});});
});
for(const width of [390,834,1440]) test(`Money Studio is accessible at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/studio');
  await expect(page.getByRole('heading',{name:'Make room for what’s next.'})).toBeVisible();
  await expect(page.getByRole('img',{name:/60-day cash forecast/})).toBeVisible();
  await page.getByRole('button',{name:'Table view'}).click();await expect(page.getByRole('table',{name:'Daily projected balances'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:`output/studio-${width}.png`,fullPage:true});
  await page.getByRole('tab',{name:'Your story'}).click();await expect(page.getByRole('region',{name:'Monthly recap'})).toBeVisible();
  await page.getByRole('button',{name:'Next recap page'}).click();await expect(page.getByText('One less thing to think about.')).toBeVisible();
});
test('planner saves values and purchase scenarios change the forecast',async({page})=>{
  let saved=false;
  await page.route('**/api/studio',async route=>{if(route.request().method()==='PUT'){const body=route.request().postDataJSON();expect(body.balance).toBe(4000);saved=true;await route.fulfill({json:{...initialPlan,...body,version:2}});}else await route.fulfill({json:initialPlan});});
  await page.goto('/studio');await page.getByLabel('Cash available today').fill('4000');await page.getByRole('button',{name:'Save my starting point'}).click();await expect.poll(()=>saved).toBe(true);
  await page.getByLabel('Purchase amount (USD)').fill('99999');await expect(page.getByRole('status').filter({hasText:'below your buffer'})).toContainText('below your buffer');
  await page.getByRole('button',{name:'Reset scenario'}).click();await expect(page.getByLabel('Purchase amount (USD)')).toHaveValue('0');
});
test('scan text requires review and saves approved fields',async({page})=>{
  let payload:Record<string,unknown>|undefined;
  await page.route('**/api/bills',async route=>{payload=route.request().postDataJSON();await route.fulfill({json:{id:'scan-result',...payload}});});
  await page.goto('/studio');await page.getByRole('tab',{name:'Scan a bill'}).click();
  await page.getByText('Paste or review extracted text').click();await page.getByLabel('Bill text').fill('Acme Energy\nTotal due: $85.20\nDue date: 2027-01-25');await page.getByRole('button',{name:'Read this text'}).click();
  await expect(page.getByLabel('Amount (USD)',{exact:true})).toHaveValue('85.20');expect(payload).toBeUndefined();
  await page.getByRole('button',{name:'Confirm and save bill'}).click();await expect(page.getByRole('status')).toContainText('Your bill is now in Bills');expect(payload?.name).toBe('Acme Energy bill');
});
test('statement import detects an increase and skips duplicates',async({page})=>{
  let plan={...initialPlan,transactions:[] as unknown[],version:1};
  await page.route('**/api/studio',async route=>{if(route.request().method()==='PUT')plan={...plan,...route.request().postDataJSON(),version:plan.version+1};await route.fulfill({json:plan});});
  await page.goto('/studio');await page.getByRole('tab',{name:'Subscriptions'}).click();
  const file={name:'statement.csv',mimeType:'text/csv',buffer:Buffer.from('date,merchant,amount\n2026-08-01,Stream,10\n2026-09-01,Stream,12')};
  await page.locator('input[type=file]').setInputFiles(file);await expect(page.getByText('2 new rows',{exact:false})).toBeVisible();await page.getByRole('button',{name:'Confirm import'}).click();
  await expect(page.getByText('Up $2.00 since the previous charge')).toBeVisible();
  await page.locator('input[type=file]').setInputFiles(file);await expect(page.getByText('0 new rows',{exact:false})).toBeVisible();await expect(page.getByRole('button',{name:'Confirm import'})).toBeDisabled();
});
test('command bar confirms natural-language bills and restores focus on Escape',async({page})=>{
  let created=false;await page.route('**/api/bills',async route=>{expect(route.request().postDataJSON().name).toBe('Internet');created=true;await route.fulfill({json:{id:'command-bill'}});});
  await page.goto('/studio');const trigger=page.getByRole('button',{name:'Open quick commands'});await trigger.click();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
  await page.keyboard.press('Control+k');await page.getByPlaceholder('Add Internet 120 due tomorrow').fill('Add Internet 120 due tomorrow');expect(created).toBe(false);await page.getByRole('button',{name:'Confirm and add bill'}).click();await expect(page).toHaveURL(/\/bills$/);expect(created).toBe(true);
});
test('PDF text is extracted locally for review',async({page,browser})=>{
  test.setTimeout(60000);
  const document=await browser.newPage();await document.setContent('<h1>Acme Energy</h1><p>Total due: $85.20</p><p>Due date: 2027-01-25</p>');const pdf=await document.pdf();await document.close();
  await page.goto('/studio');await page.getByRole('tab',{name:'Scan a bill'}).click();await page.locator('input[type=file]').setInputFiles({name:'bill.pdf',mimeType:'application/pdf',buffer:pdf});
  await expect(page.getByLabel('Bill name',{exact:true})).toHaveValue('Acme Energy bill',{timeout:45000});await expect(page.getByLabel('Amount (USD)',{exact:true})).toHaveValue('85.20');
});
test('image OCR suggests bill details before saving',async({page,browser})=>{
  test.setTimeout(120000);
  const document=await browser.newPage({viewport:{width:900,height:450}});
  await document.setContent('<div style="padding:40px;background:white;color:black;font:32px Arial;line-height:2"><b>Acme Energy</b><br>Total due: $85.20<br>Due date: 2027-01-25</div>');
  const png=await document.screenshot();await document.close();
  await page.goto('/studio');await page.getByRole('tab',{name:'Scan a bill'}).click();await page.locator('input[type=file]').setInputFiles({name:'bill.png',mimeType:'image/png',buffer:png});
  await expect(page.getByLabel('Amount (USD)',{exact:true})).toHaveValue('85.20',{timeout:100000});
  await expect(page.getByRole('button',{name:'Confirm and save bill'})).toBeEnabled();
});
test('successful payment displays a receipt only after the save',async({page})=>{
  let paid=false;
  const bill={id:'receipt-bill',userId:user.sub,name:'Internet',amount:120,paidAmount:0,dueDate:'2027-01-25',status:'UNPAID',category:'Internet'};
  await page.route('**/api/bills**',async route=>{if(route.request().method()==='PUT'){paid=true;await route.fulfill({json:{...bill,status:'PAID',paidAmount:120,paymentDate:'2026-10-06T12:00:00Z'}});}else await route.fulfill({json:[{...bill,status:paid?'PAID':'UNPAID'}]});});
  await page.goto('/bills');await page.getByRole('button',{name:'Mark Internet as paid'}).click();
  await expect(page.getByRole('dialog',{name:'One less thing on your mind.'})).toBeVisible();expect(paid).toBe(true);
  await expect(page.getByText('RECORDED AS PAID',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Lovely. Keep going.'}).click();await expect(page.getByRole('dialog')).not.toBeVisible();
});
