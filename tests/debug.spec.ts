import { test, expect } from '@playwright/test';

test('a localStorage profile alone does not authenticate the dashboard', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pocketmate_user', JSON.stringify({ sub: 'forged', name: 'Forged', email: 'forged@example.com', picture: '' })));
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welcome home.' })).toBeVisible();
});
