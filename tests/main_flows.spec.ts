import { test, expect } from '@playwright/test';
import { nanoid } from 'nanoid';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000';

test.use({
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
});

test('Main flows of ClassSpace', async ({ page }) => {
  const id = nanoid(6);
  const testName = `User${id}`;
  const testEmail = `${id}@test.com`;
  const testPassword = 'TestPass123';

  // Flow 1: Landing Page
  await page.goto(BASE_URL + '/');

  await expect(page.locator('text=ClassSpace').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Create a Space/ }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Sign in/ }).first()).toBeVisible();
  await expect(page.locator('h1:has-text("Your class.")').first()).toBeVisible();

  // Flow 2: Sign Up
  await page.getByRole('link', { name: /Create a Space/ }).first().click();
  await expect(page).toHaveURL(/.*register/);
  await expect(page.locator('h1:has-text("Create your account")')).toBeVisible();

  await page.fill('input[placeholder="Your name"]', testName);
  await page.fill('input[placeholder="you@student.edu"]', testEmail);
  await page.fill('input[placeholder="Min 6 characters"]', testPassword);
  await page.click('button[type="submit"]');

  // New user with no space lands on /home (empty state) — or /setup if redirected
  await page.waitForURL(/.*home|.*setup/);
  if (page.url().includes('setup')) {
    await expect(page.locator('text=Set up your space')).toBeVisible();
  } else {
    await expect(page.locator('h3:has-text("No space yet")')).toBeVisible();
  }

  // Flow 3: Sign Out from Profile
  await page.getByRole('navigation').getByRole('link', { name: /Profile/ }).click();
  await expect(page).toHaveURL(/.*profile/);
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await page.waitForURL(BASE_URL + '/');

  // Flow 4: Sign In
  await page.getByRole('link', { name: /Sign in/ }).first().click();
  await expect(page).toHaveURL(/.*login/);
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*home|.*setup/);
  if (page.url().includes('home')) {
    await expect(page.locator('h3:has-text("No space yet")')).toBeVisible();
  }
});
