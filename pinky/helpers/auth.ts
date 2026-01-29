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
 * Storage state path for cached authentication
 */
export const AUTH_STATE_PATH = './results/.auth/user.json';

/**
 * Timeout constants (in milliseconds)
 */
export const TIMEOUTS = {
  NAVIGATION: 90000,      // 90s - generous for cold starts
  LOGIN_REDIRECT: 30000,  // 30s - wait for login redirect
  FORM_READY: 15000,      // 15s - wait for form elements
  ACTION: 10000,          // 10s - individual actions
};

/**
 * Delay helper for retry logic
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Warm up the server by hitting the login page
 * Call this before tests to ensure server is ready
 */
export async function warmUpServer(page: Page, baseURL?: string): Promise<boolean> {
  const url = baseURL || 'https://press-4qf0.onrender.com';
  console.log(`Warming up server: ${url}/auth/login`);

  try {
    await page.goto(`${url}/auth/login`, {
      timeout: TIMEOUTS.NAVIGATION,
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('input[type="email"]', { timeout: TIMEOUTS.FORM_READY });
    console.log('Server is warm and ready');
    return true;
  } catch (error) {
    console.error('Server warm-up failed:', error);
    return false;
  }
}

/**
 * Log in as the test user with retry logic
 *
 * Includes 3 attempts with 2-second delay between retries.
 * Uses increased timeouts to handle Render cold starts.
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  const maxAttempts = 3;
  const retryDelay = 2000; // 2 seconds between attempts

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Login attempt ${attempt}/${maxAttempts}...`);

      // Navigate to login page with generous timeout
      await page.goto('/auth/login', {
        timeout: TIMEOUTS.NAVIGATION,
        waitUntil: 'domcontentloaded',
      });

      // Wait for login form to be ready
      await page.waitForSelector('input[type="email"]', {
        timeout: TIMEOUTS.FORM_READY
      });

      // Fill in credentials - clear first, then type to trigger React onChange
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      await emailInput.clear();
      await emailInput.pressSequentially(TEST_USER.email, { delay: 10 });

      await passwordInput.clear();
      await passwordInput.pressSequentially(TEST_USER.password, { delay: 10 });

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect to /app (successful login) with increased timeout
      await page.waitForURL('**/app**', { timeout: TIMEOUTS.LOGIN_REDIRECT });

      console.log(`Login successful on attempt ${attempt}`);
      return; // Success - exit function

    } catch (error) {
      lastError = error as Error;
      console.error(`Login attempt ${attempt} failed:`, error);

      if (attempt < maxAttempts) {
        console.log(`Retrying in ${retryDelay}ms...`);
        await delay(retryDelay);
      }
    }
  }

  // All attempts failed
  throw new Error(
    `Login failed after ${maxAttempts} attempts. ` +
    `Last error: ${lastError?.message || 'Unknown error'}. ` +
    `Check that PINKY_TEST_EMAIL and PINKY_TEST_PASSWORD are set correctly.`
  );
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
  await page.goto('/app', {
    timeout: TIMEOUTS.NAVIGATION,
    waitUntil: 'domcontentloaded',
  });

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
  await page.goto('/app', {
    timeout: TIMEOUTS.NAVIGATION,
    waitUntil: 'domcontentloaded',
  });

  // Look for logout button/link
  const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL('**/auth/login**', { timeout: TIMEOUTS.LOGIN_REDIRECT });
  }
}
