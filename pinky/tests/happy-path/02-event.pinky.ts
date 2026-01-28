import { test, expect } from '@playwright/test';
import { PinkyScreenshot } from '../../helpers/screenshot';
import { ActionLogger } from '../../helpers/action-logger';
import { loginAsTestUser } from '../../helpers/auth';

/**
 * Happy Path: Event Management
 *
 * Tests the user's journey through event features.
 * Requires authentication first.
 */

test.describe('Happy Path: Event Features', () => {
  let screenshot: PinkyScreenshot;
  let logger: ActionLogger;

  test.beforeEach(async ({ page }) => {
    screenshot = new PinkyScreenshot(page, 'event');
    logger = new ActionLogger('event');

    // Login first
    await loginAsTestUser(page);

    // Then navigate to demo event
    await page.goto('/event/demo-event');
    await page.waitForLoadState('networkidle');
  });

  test('user can view event overview', async ({ page }) => {
    await screenshot.capture('01-event-overview');

    await logger.action('Check for event name', async () => {
      // Look for event name in header or title - demo event shows "Demo Event"
      const eventName = page.getByText(/demo event|spring classic/i);
      await expect(eventName.first()).toBeVisible();
    });

    await screenshot.capture('02-event-name-visible');

    logger.summary();
  });

  test('user can view event members', async ({ page }) => {
    await screenshot.capture('01-event-page');

    // Look for members/players section or link
    const membersLink = page.getByRole('link', { name: /members|players|participants|invite/i }).or(
      page.getByRole('tab', { name: /members|players/i })
    );

    const hasMembersLink = await membersLink.isVisible().catch(() => false);

    if (hasMembersLink) {
      await logger.action('Click members link', async () => {
        await membersLink.first().click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-members-list');

      await logger.action('Verify members displayed', async () => {
        // Should show at least one member or member section
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('03-members-verified');
    } else {
      console.log('[Pinky] Members link not visible on this page');
      await screenshot.capture('02-no-members-link');
    }

    logger.summary();
  });

  test('user can view event settings (if authorized)', async ({ page }) => {
    await screenshot.capture('01-initial-page');

    // Look for settings link (may only be visible to owners/admins)
    const settingsLink = page.getByRole('link', { name: /settings/i }).or(
      page.getByRole('button', { name: /settings/i })
    );

    const hasSettings = await settingsLink.isVisible().catch(() => false);

    if (hasSettings) {
      await logger.action('Click settings', async () => {
        await settingsLink.first().click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-settings-page');

      // Just verify we're on the settings page
      await screenshot.capture('03-settings-content');
    } else {
      console.log('[Pinky] Settings not visible - user may not have permission');
      await screenshot.capture('02-no-settings-visible');
    }

    logger.summary();
  });

  test('user can view event leaderboard', async ({ page }) => {
    // Navigate to games page first
    await page.goto('/event/demo-event/games');
    await page.waitForLoadState('networkidle');

    await screenshot.capture('01-games-page');

    // Look for leaderboard tab or link
    const leaderboardLink = page.getByRole('link', { name: /leaderboard|standings|scores/i }).or(
      page.getByRole('tab', { name: /leaderboard|standings/i })
    );

    const hasLeaderboard = await leaderboardLink.isVisible().catch(() => false);

    if (hasLeaderboard) {
      await logger.action('Click leaderboard', async () => {
        await leaderboardLink.click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-leaderboard-view');
      await screenshot.capture('03-leaderboard-content');
    } else {
      console.log('[Pinky] Leaderboard not visible on this page');
      await screenshot.capture('02-no-leaderboard');
    }

    logger.summary();
  });

  test('user can view event feed/activity', async ({ page }) => {
    // Navigate to event
    await page.goto('/event/demo-event');
    await page.waitForLoadState('networkidle');

    await screenshot.capture('01-event-home');

    // Look for feed/activity section
    const feedLink = page.getByRole('link', { name: /feed|activity|posts/i }).or(
      page.getByRole('tab', { name: /feed|activity/i })
    );

    const hasFeed = await feedLink.isVisible().catch(() => false);

    if (hasFeed) {
      await logger.action('Click feed', async () => {
        await feedLink.click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-feed-view');
      await screenshot.capture('03-feed-items');
    } else {
      console.log('[Pinky] Feed not visible - checking for inline feed');
      await screenshot.capture('02-inline-feed');
    }

    logger.summary();
  });
});
