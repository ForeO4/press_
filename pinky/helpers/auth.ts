import { Page } from '@playwright/test';

/**
 * Test user credentials for Pinky tests
 *
 * Set these in your environment or .env.local:
 *   PINKY_TEST_EMAIL=your-test-email@example.com
 *   PINKY_TEST_PASSWORD=your-test-password
 *
 * The user must exist in Supabase with email confirmed.
 */
export const TEST_USER = {
  email: process.env.PINKY_TEST_EMAIL || '',
  password: process.env.PINKY_TEST_PASSWORD || '',
};

/**
 * Log in as the test user
 * Call this at the start of tests that need authentication
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  // Navigate to login page
  await page.goto('/auth/login');

  // Wait for login form to be ready
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  // Fill in credentials
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to /app (successful login)
  await page.waitForURL('**/app**', { timeout: 15000 });
}

/**
 * Check if user is already logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check if we're on the app page or can access it
  const currentUrl = page.url();
  return currentUrl.includes('/app') || currentUrl.includes('/event/');
}

/**
 * Ensure user is logged in, login if not
 */
export async function ensureLoggedIn(page: Page): Promise<void> {
  // Try to go to app page
  await page.goto('/app');

  // Check if we got redirected to login
  const currentUrl = page.url();
  if (currentUrl.includes('/auth/login')) {
    await loginAsTestUser(page);
  }
}

/**
 * Log out the current user
 */
export async function logout(page: Page): Promise<void> {
  // Navigate to a page with logout capability
  await page.goto('/app');

  // Look for logout button/link
  const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL('**/auth/login**', { timeout: 10000 });
  }
}
