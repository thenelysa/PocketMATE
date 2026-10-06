import { test, expect } from '@playwright/test';

test('landing page and sign-in navigation work', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/PocketMATE/);
  await expect(page.locator('h1')).toHaveText('Your bills, sorted.Your mind, clearer.');
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welcome home.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
});
for (const route of ['dashboard','bills','cards','reminders','reports','settings','studio']) {
  test(`${route} requires a verified session`, async ({ page }) => {
    await page.goto('/' + route);
    await expect(page).toHaveURL(/\/login$/);
  });
}
test('unknown route shows a real 404', async ({ page }) => {
  const response = await page.goto('/unknown-route-xyz');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});
test('all private APIs reject unauthenticated requests', async ({ request }) => {
  for (const resource of ['bills','cards','reminders','auth','studio','households']) {
    const response = await request.get(`/api/${resource}?userId=someone-else`);
    expect(response.status()).toBe(401);
  }
});
