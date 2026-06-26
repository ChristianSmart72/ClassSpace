import { test, expect } from '@playwright/test';
import { nanoid } from 'nanoid';

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
  await page.goto('http://localhost:5000/');
  
  // Verify landing page loads with brand
  await expect(page.locator('text=ClassSpace')).toBeVisible();
  
  // In mobile view, "Get Started" is "Create a Space — Free →"
  // And "Sign in" is at the bottom
  await expect(page.locator('text=Create a Space — Free →')).toBeVisible();
  await expect(page.locator('text=Sign in')).toBeVisible();
  
  // Verify hero section
  await expect(page.locator('h1:has-text("Your class.")')).toBeVisible();

  // Flow 2: Sign Up
  await page.click('text=Create a Space — Free →');
  await expect(page).toHaveURL(/.*register/);
  await expect(page.locator('h1:has-text("Join ClassSpace")')).toBeVisible();

  await page.fill('input[placeholder="Your name"]', testName);
  await page.fill('input[placeholder="you@uniben.edu"]', testEmail);
  await page.fill('input[placeholder="Min 6 characters"]', testPassword);
  await page.click('button[type="submit"]');

  // Verify redirected to main app (home)
  // Since it's a new user, it might go to /setup or /home with "No space yet"
  await page.waitForURL(/.*home|.*setup/);
  
  // Flow 3: View Spaces/Home
  // For a new user, they might see "No space yet"
  if (page.url().includes('home')) {
    await expect(page.locator('text=Home')).toBeVisible();
  } else if (page.url().includes('setup')) {
    await expect(page.locator('text=Setup your Space')).toBeVisible();
  }

  // Flow 4: Sign Out and Sign In
  // Navigate to profile if not already there
  await page.click('text=👤'); // Profile icon in BottomNav
  await expect(page).toHaveURL(/.*profile/);
  
  await page.click('text=Sign Out');
  await page.waitForURL('http://localhost:5000/');

  // Sign in back
  await page.click('text=Sign in');
  await page.waitForURL(/.*login/);
  
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/.*home|.*setup/);
  await expect(page.locator(`text=👋`)).toBeVisible(); // Greeting emoji
});
