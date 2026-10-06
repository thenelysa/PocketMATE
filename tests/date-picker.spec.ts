import { test, expect } from '@playwright/test';

for (const width of [390, 834, 1440]) {
  test(`date picker is usable at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await context.addInitScript(() => localStorage.setItem('pocketmate_user', JSON.stringify({ sub: 'calendar-test', name: 'Test User', email: 'test@example.com', picture: '' })));
    await page.route('**/api/**', route => route.fulfill({ json: new URL(route.request().url()).pathname === '/api/auth' ? { sub: 'delete-test', name: 'Test User', email: 'test@example.com', picture: '' } : [] }));
    await page.goto('/bills');
    await page.getByRole('button', { name: 'Add Bill', exact: true }).click();
    const input = page.getByLabel('Due Date *');
    await input.fill('2028-02-28');
    const trigger = page.getByRole('button', { name: 'Open calendar for Due date' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Choose due date' });
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await expect(dialog.getByRole('button', { name: 'Monday, February 28, 2028' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByRole('button', { name: 'Tuesday, February 29, 2028' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('2028-02-29');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await dialog.getByLabel('Calendar month').selectOption('11');
    await dialog.getByLabel('Calendar year').selectOption('2029');
    await dialog.getByRole('button', { name: 'Next month' }).click();
    await expect(dialog.getByLabel('Calendar month')).toHaveValue('0');
    await expect(dialog.getByLabel('Calendar year')).toHaveValue('2030');
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('2028-02-29');
    await trigger.click();
    await dialog.getByRole('button', { name: 'Tomorrow', exact: true }).click();
    const tomorrow = await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; });
    await expect(input).toHaveValue(tomorrow);
    await page.goto('/reminders');
    await page.getByRole('button', { name: 'Add Reminder', exact: true }).click();
    await page.getByRole('button', { name: 'Open calendar for Reminder date' }).click();
    await page.getByRole('dialog', { name: 'Choose reminder date' }).getByRole('button', { name: 'Tomorrow', exact: true }).click();
    await expect(page.getByLabel('Date *', { exact: true })).toHaveValue(tomorrow);
  });
}
