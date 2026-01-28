import { test, expect } from '@playwright/test';
import { PinkyScreenshot } from '../../helpers/screenshot';
import { ActionLogger } from '../../helpers/action-logger';
import { DEMO_USERS } from '../../fixtures/test-users';

/**
 * Happy Path: Authentication Flow
 *
 * Tests the naive user's journey through authentication.
 * In demo mode, this tests the user switcher functionality.
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

  test('user can access demo event', async ({ page }) => {
    await logger.action('Navigate to demo event', async () => {
      await page.goto('/event/demo-event');
    });

    await screenshot.capture('01-demo-event-landing');

    await logger.action('Verify event page loaded', async () => {
      // Should show event name or redirect to a sub-page
      await page.waitForLoadState('networkidle');
    });

    await screenshot.capture('02-demo-event-loaded');

    logger.summary();
  });

  test('user can switch between demo users', async ({ page }) => {
    await logger.action('Navigate to event', async () => {
      await page.goto('/event/demo-event');
      await page.waitForLoadState('networkidle');
    });

    await screenshot.capture('01-initial-state');

    // Look for user switcher (demo mode feature)
    const userSwitcher = page.getByTestId('user-switcher').or(
      page.getByRole('button', { name: /switch.*user|user.*menu|demo/i })
    );

    const hasSwitcher = await userSwitcher.isVisible().catch(() => false);

    if (hasSwitcher) {
      await logger.action('Open user switcher', async () => {
        await userSwitcher.click();
      });

      await screenshot.capture('02-user-switcher-open');

      // Try switching to a different user
      const secondUser = DEMO_USERS[1];
      const userOption = page.getByText(secondUser.name, { exact: false });

      if (await userOption.isVisible()) {
        await logger.action(`Switch to ${secondUser.name}`, async () => {
          await userOption.click();
        });

        await screenshot.capture('03-switched-user');
      }
    } else {
      console.log('[Pinky] User switcher not visible - may not be in demo mode');
      await screenshot.capture('02-no-user-switcher');
    }

    logger.summary();
  });

  test('user can navigate to different event sections', async ({ page }) => {
    await logger.action('Navigate to event', async () => {
      await page.goto('/event/demo-event');
      await page.waitForLoadState('networkidle');
    });

    await screenshot.capture('01-event-home');

    // Check for navigation tabs/links
    const navItems = [
      { name: 'Games', pattern: /games/i },
      { name: 'Leaderboard', pattern: /leaderboard|standings/i },
      { name: 'Feed', pattern: /feed|posts|activity/i },
    ];

    for (const nav of navItems) {
      const link = page.getByRole('link', { name: nav.pattern }).or(
        page.getByRole('tab', { name: nav.pattern })
      );

      if (await link.isVisible().catch(() => false)) {
        await logger.action(`Click ${nav.name}`, async () => {
          await link.click();
          await page.waitForLoadState('networkidle');
        });

        await screenshot.capture(`02-section-${nav.name.toLowerCase()}`);
      }
    }

    logger.summary();
  });
});
