import { test, expect } from '@playwright/test';

const user = { sub: 'reminder-test', email: 'test@example.com', name: 'Reminder Tester', picture: '' };
const reminder = { id: 'reminder-1', userId: user.sub, type: 'BILL', title: 'Pay electricity', message: 'Check the bill', remindAt: new Date(Date.now() - 60000).toISOString(), isSent: false, referenceType: null, referenceId: null, createdAt: null };

test.beforeEach(async ({ context, page }) => {
  await context.addInitScript(u => localStorage.setItem('pocketmate_user', JSON.stringify(u)), user);
  await page.route('**/api/auth', route => route.fulfill({ json: user }));
  await page.route('**/api/studio', route => route.fulfill({ status: 503, json: { error: { code: 'INTERNAL_ERROR', message: 'No plan fixture' } } }));
  await page.route('**/api/bills?*', route => route.fulfill({ json: [] }));
  await page.route('**/api/cards?*', route => route.fulfill({ json: [] }));
});

test('bell shows due reminders and persists acknowledgement', async ({ page }) => {
  let isSent = false;
  await page.route('**/api/reminders**', async route => {
    if (route.request().method() === 'PUT') {
      expect(route.request().postDataJSON()).toEqual({ id: reminder.id, userId: user.sub });
      isSent = true;
    }
    await route.fulfill({ json: route.request().method() === 'PUT' ? { ...reminder, isSent } : [{ ...reminder, isSent }] });
  });
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Notifications, 1 due', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Notifications' })).toContainText('Pay electricity');
  await page.getByRole('button', { name: 'Mark done', exact: true }).click();
  await expect(page.getByText('No reminders due right now.')).toBeVisible();
  expect(isSent).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('region', { name: 'Notifications' })).not.toBeVisible();
});

test('a future reminder becomes due without navigating', async ({ page }) => {
  const now = new Date('2026-10-05T10:00:00Z');
  await page.clock.install({ time: now });
  await page.route('**/api/reminders**', route => route.fulfill({ json: [{ ...reminder, remindAt: new Date(now.getTime() + 60000).toISOString() }] }));
  await page.goto('/reminders');
  await expect(page.getByRole('button', { name: 'Notifications', exact: true })).toBeVisible();
  await page.clock.fastForward(61000);
  await expect(page.getByRole('button', { name: 'Notifications, 1 due', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('1 reminder is due');
});

test('failed reminder saves show errors and preserve the form', async ({ page }) => {
  await page.route('**/api/reminders**', route => route.request().method() === 'POST'
    ? route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'Could not save reminder' } } })
    : route.fulfill({ json: [] }));
  await page.goto('/reminders');
  await page.getByRole('button', { name: 'Add Reminder', exact: true }).click();
  await page.getByLabel('Title *').fill('Pay water');
  await page.getByLabel('Date *').fill('2099-01-01');
  await page.getByLabel('Time *').fill('10:00');
  await page.getByRole('button', { name: 'Create Reminder', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Could not save reminder' })).toHaveText('Could not save reminder');
  await expect(page.getByLabel('Title *')).toHaveValue('Pay water');
});

test('failed reminder fetch is not presented as an empty list', async ({ page }) => {
  await page.route('**/api/reminders**', route => route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'Unavailable' } } }));
  await page.goto('/reminders');
  await expect(page.getByRole('alert').filter({ hasText: 'Could not load reminders.' })).toContainText('Could not load reminders.');
  await expect(page.getByText('No reminders yet')).not.toBeVisible();
});

test('past reminder times are rejected before saving', async ({ page }) => {
  let creates = 0;
  await page.route('**/api/reminders**', route => { if (route.request().method() === 'POST') creates++; return route.fulfill({ json: [] }); });
  await page.goto('/reminders');
  await page.getByRole('button', { name: 'Add Reminder', exact: true }).click();
  await page.getByLabel('Title *').fill('Past reminder');
  await page.getByLabel('Date *').fill('2000-01-01');
  await page.getByLabel('Time *').fill('10:00');
  await page.getByRole('button', { name: 'Create Reminder', exact: true }).click();
  await expect(page.getByText('Choose a reminder date and time in the future.')).toBeVisible();
  expect(creates).toBe(0);
});

test('browser alerts are delivered once across reloads', async ({ context, page }) => {
  await context.addInitScript(() => {
    Object.defineProperty(window, 'Notification', { configurable: true, value: class {
      static permission = 'granted';
      constructor(title: string) { localStorage.setItem('test-notification-count', String(Number(localStorage.getItem('test-notification-count') || 0) + 1)); localStorage.setItem('test-notification-title', title); }
    } });
  });
  await page.route('**/api/reminders**', route => route.fulfill({ json: [reminder] }));
  await page.goto('/reminders');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('test-notification-title'))).toBe('Pay electricity');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Notifications, 1 due', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('test-notification-count'))).toBe('1');
});
