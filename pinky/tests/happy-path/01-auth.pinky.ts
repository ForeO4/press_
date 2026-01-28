import { test, expect } from '@playwright/test';
import { PinkyScreenshot } from '../../helpers/screenshot';
import { ActionLogger } from '../../helpers/action-logger';
import { loginAsTestUser, TEST_USER } from '../../helpers/auth';

/**
 * Happy Path: Authentication Flow
 *
 * Tests user authentication with Supabase.
 * Requires test user to be created in Supabase Dashboard:
 * - Email: pinky@test.press
 * - Password: PinkyTest123!
 */

test.describe('Happy Path: Authentication', () => {
  let screenshot: PinkyScreenshot;
  let logger: ActionLogger;

  test.beforeEach(async ({ page }) => {
    screenshot = new PinkyScreenshot(page, 'auth');
    logger = new ActionLogger('auth');
  });

  test('user can see the landing page', async ({ page }) => {
    await logger.action('Navigate to home', async () => {
      await page.goto('/');
    });

    await screenshot.capture('01-home-page');

    await logger.action('Verify page loaded', async () => {
      await expect(page).toHaveURL('/');
    });

    logger.summary();
  });

  test('user can see the login page', async ({ page }) => {
    await logger.action('Navigate to login', async () => {
      await page.goto('/auth/login');
    });

    await screenshot.capture('01-login-page');

    await logger.action('Verify login form', async () => {
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    await screenshot.capture('02-login-form');

    logger.summary();
  });

  test('user can log in with valid credentials', async ({ page }) => {
    await logger.action('Navigate to login', async () => {
      await page.goto('/auth/login');
    });

    await screenshot.capture('01-before-login');

    await logger.action('Fill email', async () => {
      await page.fill('input[type="email"]', TEST_USER.email);
    });

    await logger.action('Fill password', async () => {
      await page.fill('input[type="password"]', TEST_USER.password);
    });

    await screenshot.capture('02-credentials-filled');

    await logger.action('Submit login form', async () => {
      await page.click('button[type="submit"]');
    });

    await logger.action('Wait for redirect', async () => {
      await page.waitForURL('**/app**', { timeout: 15000 });
    });

    await screenshot.capture('03-logged-in');

    await logger.action('Verify app page', async () => {
      await expect(page).toHaveURL(/\/app/);
    });

    logger.summary();
  });

  test('logged in user can access events', async ({ page }) => {
    // Login first
    await logger.action('Login as test user', async () => {
      await loginAsTestUser(page);
    });

    await screenshot.capture('01-logged-in');

    // Try to create or access an event
    await logger.action('Navigate to app', async () => {
      await page.goto('/app');
      await page.waitForLoadState('networkidle');
    });

    await screenshot.capture('02-app-page');

    // Look for create event button or existing events
    const createButton = page.getByRole('button', { name: /create.*event|new.*event/i });
    const hasCreateButton = await createButton.isVisible().catch(() => false);

    if (hasCreateButton) {
      await screenshot.capture('03-can-create-event');
      console.log('[Pinky] Create event button visible');
    } else {
      console.log('[Pinky] No create event button - checking for existing events');
      await screenshot.capture('03-events-list');
    }

    logger.summary();
  });

  test('logged in user can access demo event', async ({ page }) => {
    // Login first
    await logger.action('Login as test user', async () => {
      await loginAsTestUser(page);
    });

    await screenshot.capture('01-logged-in');

    await logger.action('Navigate to demo event', async () => {
      await page.goto('/event/demo-event');
      await page.waitForLoadState('networkidle');
    });

    await screenshot.capture('02-demo-event');

    // Should not be redirected to login
    await logger.action('Verify not on login page', async () => {
      const url = page.url();
      expect(url).not.toContain('/auth/login');
    });

    logger.summary();
  });
});
