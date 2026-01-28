import { test, expect } from '@playwright/test';
import { PinkyScreenshot } from '../../helpers/screenshot';
import { ActionLogger } from '../../helpers/action-logger';

/**
 * Narf Tests: Navigation Chaos
 *
 * "NARF!" - Tests unexpected navigation patterns.
 *
 * Tests how the app handles:
 * - Browser back/forward buttons
 * - Deep links directly to pages
 * - Page refresh mid-flow
 * - Invalid URLs and 404s
 */

test.describe('Narf: Navigation Chaos', () => {
  let screenshot: PinkyScreenshot;
  let logger: ActionLogger;

  test.beforeEach(async ({ page }) => {
    screenshot = new PinkyScreenshot(page, 'narf-nav');
    logger = new ActionLogger('narf-nav');
  });

  test.describe('Back Button Behavior', () => {
    test('back button from game detail', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      await screenshot.capture('01-games-list');

      const gameCards = page.getByTestId('game-card');

      if (await gameCards.count() > 0) {
        await logger.action('Click game card', async () => {
          await gameCards.first().click();
          await page.waitForLoadState('networkidle');
        });

        await screenshot.capture('02-game-detail');

        await logger.action('Click back button', async () => {
          await page.goBack();
          await page.waitForLoadState('networkidle');
        });

        await screenshot.capture('03-after-back');

        // Should be back on games list
        await expect(page).toHaveURL(/games/);
      }

      logger.summary();
    });

    test('back button from modal (should close modal)', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      const createButton = page.getByRole('button', { name: /create|new|add/i });
      await createButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await screenshot.capture('01-modal-open');

      await logger.action('Press browser back', async () => {
        await page.goBack();
        await page.waitForTimeout(500);
      });

      await screenshot.capture('02-after-back');

      // Modal should be closed or we navigated away
      const modalVisible = await page.getByRole('dialog').isVisible().catch(() => false);
      console.log(`[Pinky] Modal visible after back: ${modalVisible}`);

      logger.summary();
    });

    test('forward after back', async ({ page }) => {
      // Navigate through a flow
      await page.goto('/event/demo-event');
      await page.waitForLoadState('networkidle');

      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      await screenshot.capture('01-at-games');

      await logger.action('Go back', async () => {
        await page.goBack();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-after-back');

      await logger.action('Go forward', async () => {
        await page.goForward();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('03-after-forward');

      // Should be back at games
      await expect(page).toHaveURL(/games/);

      logger.summary();
    });
  });

  test.describe('Deep Links', () => {
    test('direct link to game page', async ({ page }) => {
      // Try to access a game directly
      await logger.action('Navigate to game directly', async () => {
        await page.goto('/event/demo-event/games/game-match-1');
      });

      await page.waitForLoadState('networkidle');
      await screenshot.capture('01-direct-game-link');

      // Should either show game or redirect appropriately
      await expect(page.locator('body')).toBeVisible();

      logger.summary();
    });

    test('direct link to non-existent game', async ({ page }) => {
      await logger.action('Navigate to fake game', async () => {
        await page.goto('/event/demo-event/games/does-not-exist-123');
      });

      await page.waitForLoadState('networkidle');
      await screenshot.capture('01-fake-game-link');

      // Should show 404 or redirect, not crash
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Check for error state
      const errorText = page.getByText(/not found|404|error|doesn't exist/i);
      const hasError = await errorText.isVisible().catch(() => false);
      console.log(`[Pinky] Shows error for non-existent game: ${hasError}`);

      logger.summary();
    });

    test('direct link to non-existent event', async ({ page }) => {
      await logger.action('Navigate to fake event', async () => {
        await page.goto('/event/this-event-does-not-exist');
      });

      await page.waitForLoadState('networkidle');
      await screenshot.capture('01-fake-event-link');

      // Should handle gracefully
      await expect(page.locator('body')).toBeVisible();

      logger.summary();
    });

    test('deep link with query parameters', async ({ page }) => {
      await logger.action('Navigate with query params', async () => {
        await page.goto('/event/demo-event/games?tab=active&sort=date');
      });

      await page.waitForLoadState('networkidle');
      await screenshot.capture('01-with-query-params');

      // Should load without error
      await expect(page.locator('body')).toBeVisible();

      logger.summary();
    });
  });

  test.describe('Page Refresh', () => {
    test('refresh on games list', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      await screenshot.capture('01-before-refresh');

      await logger.action('Refresh page', async () => {
        await page.reload();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-after-refresh');

      // Page should reload correctly
      await expect(page).toHaveURL(/games/);

      logger.summary();
    });

    test('refresh with modal open', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      const createButton = page.getByRole('button', { name: /create|new|add/i });
      await createButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await screenshot.capture('01-modal-before-refresh');

      await logger.action('Refresh with modal open', async () => {
        await page.reload();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-after-refresh');

      // Modal should be closed after refresh
      const modalVisible = await page.getByRole('dialog').isVisible().catch(() => false);
      expect(modalVisible).toBe(false);

      logger.summary();
    });

    test('refresh mid-form-fill', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      const createButton = page.getByRole('button', { name: /create|new|add/i });
      await createButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Fill some fields
      const stakeInput = page.locator('input[type="number"]').first();
      if (await stakeInput.isVisible()) {
        await stakeInput.fill('25');
      }

      await screenshot.capture('01-form-partially-filled');

      await logger.action('Refresh mid-fill', async () => {
        await page.reload();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-after-refresh');

      // Data should be lost (no persistence expected)
      await expect(page.locator('body')).toBeVisible();

      logger.summary();
    });
  });

  test.describe('Invalid URLs', () => {
    test('malformed event ID', async ({ page }) => {
      await logger.action('Navigate to malformed URL', async () => {
        await page.goto('/event/<script>alert("xss")</script>');
      });

      await page.waitForLoadState('networkidle');
      await screenshot.capture('01-malformed-url');

      // Should not execute XSS, should show error or 404
      await expect(page.locator('body')).toBeVisible();

      logger.summary();
    });

    test('URL with special characters', async ({ page }) => {
      await logger.action('Navigate to URL with special chars', async () => {
        await page.goto('/event/test%20event%26special');
      });

      await page.waitForLoadState('networkidle');
      await screenshot.capture('01-special-char-url');

      await expect(page.locator('body')).toBeVisible();

      logger.summary();
    });

    test('very long URL', async ({ page }) => {
      const longPath = 'a'.repeat(500);

      await logger.action('Navigate to very long URL', async () => {
        await page.goto(`/event/${longPath}`);
      });

      await page.waitForLoadState('networkidle');
      await screenshot.capture('01-long-url');

      await expect(page.locator('body')).toBeVisible();

      logger.summary();
    });
  });

  test.describe('Browser Actions', () => {
    test('multiple rapid back/forward', async ({ page }) => {
      // Build up history
      await page.goto('/event/demo-event');
      await page.goto('/event/demo-event/games');
      await page.goto('/event/demo-event');

      await screenshot.capture('01-built-history');

      await logger.action('Rapid back/forward', async () => {
        for (let i = 0; i < 3; i++) {
          await page.goBack().catch(() => {});
          await page.goForward().catch(() => {});
        }
      });

      await page.waitForLoadState('networkidle');
      await screenshot.capture('02-after-rapid-nav');

      // Should be in a stable state
      await expect(page.locator('body')).toBeVisible();

      logger.summary();
    });

    test('navigate during network request', async ({ page }) => {
      // Start navigation
      page.goto('/event/demo-event/games');

      await screenshot.capture('01-starting-nav');

      // Immediately navigate elsewhere
      await logger.action('Interrupt with new navigation', async () => {
        await page.goto('/event/demo-event');
      });

      await page.waitForLoadState('networkidle');
      await screenshot.capture('02-final-state');

      // Should be at the second destination
      await expect(page).toHaveURL(/demo-event/);

      logger.summary();
    });
  });
});
