import { test, expect } from '@playwright/test';

const examples = [
  { resource: 'reminders', name: 'Water reminder', title: 'Delete reminder', trigger: 'Delete reminder Water reminder', item: { id: 'test-item', title: 'Water reminder', remindAt: '2099-01-01T10:00:00Z', isSent: false } },
  { resource: 'bills', name: 'Water bill', title: 'Delete bill', trigger: 'Delete Water bill', item: { id: 'test-item', name: 'Water bill', amount: 25, dueDate: '2099-01-01T10:00:00Z', status: 'UNPAID', category: 'Utilities' } },
  { resource: 'cards', name: 'Test Bank', title: 'Delete card', trigger: 'Delete Test Bank card', item: { id: 'test-item', bankName: 'Test Bank', creditLimit: 1000, currentOutstanding: 25, minimumPayment: 10, annualInterestRate: 10 } },
];

test.beforeEach(async ({ context, page }) => {
  await context.addInitScript(() => localStorage.setItem('pocketmate_user', JSON.stringify({ sub: 'delete-test', name: 'Test User', email: 'test@example.com', picture: '' })));
  await page.route('**/api/**', route => route.fulfill({ json: new URL(route.request().url()).pathname === '/api/auth' ? { sub: 'delete-test', name: 'Test User', email: 'test@example.com', picture: '' } : [] }));
});

for (const example of examples) {
  test(`${example.resource}: confirmation is required and Cancel/Escape preserve the item`, async ({ page }) => {
    let deleted = false;
    let deletes = 0;
    await page.route(`**/api/${example.resource}**`, async route => {
      if (route.request().method() === 'DELETE') { deleted = true; deletes++; await route.fulfill({ json: { id: 'test-item' } }); }
      else await route.fulfill({ json: deleted ? [] : [example.item] });
    });
    await page.goto(`/${example.resource}`);
    const trigger = page.getByRole('button', { name: example.trigger, exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: example.title, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(example.name);
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    expect(deletes).toBe(0);
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    expect(deletes).toBe(0);
    await trigger.click();
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(trigger).not.toBeVisible();
    expect(deletes).toBe(1);
  });
}

test('failed deletion keeps the dialog open for retry and blocks repeat submissions', async ({ page }) => {
  let attempts = 0;
  let release: (() => void) | undefined;
  await page.route('**/api/reminders**', async route => {
    if (route.request().method() !== 'DELETE') { await route.fulfill({ json: [examples[0].item] }); return; }
    attempts++;
    await new Promise<void>(resolve => { release = resolve; });
    await route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'Deletion failed. Try again.' } } });
  });
  await page.goto('/reminders');
  await page.getByRole('button', { name: examples[0].trigger, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await expect.poll(() => attempts).toBe(1);
  release?.();
  await expect(dialog.getByRole('alert')).toHaveText('Deletion failed. Try again.');
  await expect(dialog.getByRole('button', { name: 'Delete', exact: true })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('button', { name: examples[0].trigger, exact: true })).toBeVisible();
});
