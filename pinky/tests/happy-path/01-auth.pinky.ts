import { test, expect } from '@playwright/test';
import { PinkyScreenshot } from '../../helpers/screenshot';
import { ActionLogger } from '../../helpers/action-logger';
import { TEST_USER } from '../../helpers/auth';

/**
 * Happy Path: Authentication Flow
 *
 * Tests user authentication with Supabase.
 *
 * Note: Tests that need unauthenticated state use test.use({ storageState: { cookies: [], origins: [] } })
 * to override the default authenticated storageState from config.
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

  // Use empty storageState for tests that need unauthenticated state
  test.describe('Unauthenticated flows', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

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
        const emailInput = page.locator('input[type="email"]');
        await emailInput.clear();
        await emailInput.pressSequentially(TEST_USER.email, { delay: 10 });
      });

      await logger.action('Fill password', async () => {
        const passwordInput = page.locator('input[type="password"]');
        await passwordInput.clear();
        await passwordInput.pressSequentially(TEST_USER.password, { delay: 10 });
      });

      // Small delay to ensure React state is fully updated
      await page.waitForTimeout(100);

      await screenshot.capture('02-credentials-filled');

      await logger.action('Submit login form', async () => {
        await page.click('button[type="submit"]');
      });

      // Wait for either redirect OR error message
      await page.waitForTimeout(500);

      await logger.action('Wait for redirect', async () => {
        await page.waitForURL('**/app**', { timeout: 15000 });
      });

      await screenshot.capture('03-logged-in');

      await logger.action('Verify app page', async () => {
        await expect(page).toHaveURL(/\/app/);
      });

      logger.summary();
    });
  });

  // These tests use the default authenticated storageState
  test('logged in user can access events', async ({ page }) => {
    // Already logged in via storageState - no need to call loginAsTestUser

    await screenshot.capture('01-logged-in');

    // Try to access events
    await logger.action('Navigate to app', async () => {
      await page.goto('/app');
      await page.waitForLoadState('domcontentloaded');
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
    // Already logged in via storageState - no need to call loginAsTestUser

    await screenshot.capture('01-logged-in');

    await logger.action('Navigate to demo event', async () => {
      await page.goto('/event/demo-event');
      await page.waitForLoadState('domcontentloaded');
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
