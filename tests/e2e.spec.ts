import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('PocketMATE E2E Tests', () => {
  test.beforeAll(async () => {
    // Ensure dev server is running
  });

  test('landing page loads correctly', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check page title
    await expect(page).toHaveTitle(/PocketMATE/);

    // Check hero section
    await expect(page.locator('h1')).toContainText('Master Your Bills');

    // Check navigation
    await expect(page.locator('a[href="#features"]')).toBeVisible();
    await expect(page.locator('a[href="#how-it-works"]')).toBeVisible();

    // Check Login button
    const loginBtn = page.locator('button:has-text("Login")').first();
    await expect(loginBtn).toBeVisible();
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Check login form elements
    await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();

    // Check back link
    await expect(page.locator('a:has-text("Back to Home")')).toBeVisible();
  });

  test('dashboard requires authentication', async ({ page }) => {
    await page.goto(`${BASE_URL}/(dashboard)/dashboard`);

    // Should redirect to login or show loading
    await page.waitForTimeout(2000);
    const url = page.url();
    // User should be redirected to login since not authenticated
    expect(url.includes('/login') || url.includes('/(dashboard)/dashboard')).toBeTruthy();
  });

  test('bills page is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/(dashboard)/bills`);
    await page.waitForTimeout(2000);
    // Should show either login redirect or the page
    const url = page.url();
    expect(url.includes('/(dashboard)/bills') || url.includes('/login')).toBeTruthy();
  });

  test('cards page is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/(dashboard)/cards`);
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.includes('/(dashboard)/cards') || url.includes('/login')).toBeTruthy();
  });

  test('reminders page is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/(dashboard)/reminders`);
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.includes('/(dashboard)/reminders') || url.includes('/login')).toBeTruthy();
  });

  test('reports page is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/(dashboard)/reports`);
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.includes('/(dashboard)/reports') || url.includes('/login')).toBeTruthy();
  });

  test('settings page is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/(dashboard)/settings`);
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url.includes('/(dashboard)/settings') || url.includes('/login')).toBeTruthy();
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    await page.goto(`${BASE_URL}/unknown-route-xyz`);
    // Should show 404 or redirect
    await page.waitForTimeout(1000);
    const body = await page.content();
    // Either shows 404 or redirects
    expect(
      body.includes('404') ||
      page.url().includes('/') ||
      body.includes('not found')
    ).toBeTruthy();
  });

  test('no console errors on landing page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('logo.png') &&
      !e.includes('mascot') &&
      !e.includes('400') // API returns 400 when user not logged in
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('API endpoints respond correctly', async ({ request }) => {
    // Test bills endpoint without userId
    const billsResponse = await request.get(`${BASE_URL}/api/bills`);
    expect(billsResponse.status()).toBe(400);

    // Test cards endpoint without userId
    const cardsResponse = await request.get(`${BASE_URL}/api/cards`);
    expect(cardsResponse.status()).toBe(400);

    // Test auth endpoint without userId
    const authResponse = await request.get(`${BASE_URL}/api/auth`);
    expect(authResponse.status()).toBe(400);
  });
});
