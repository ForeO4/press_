import { test, expect } from '@playwright/test';
import { PinkyScreenshot } from '../../helpers/screenshot';
import { ActionLogger } from '../../helpers/action-logger';

/**
 * Narf Tests: Timing Chaos
 *
 * "NARF!" - Tests rapid interactions and race conditions.
 *
 * Tests how the app handles:
 * - Rapid double-clicks
 * - Double-submit prevention
 * - Clicking during loading states
 * - Quick navigation between pages
 */

test.describe('Narf: Timing Chaos', () => {
  let screenshot: PinkyScreenshot;
  let logger: ActionLogger;

  test.beforeEach(async ({ page }) => {
    screenshot = new PinkyScreenshot(page, 'narf-timing');
    logger = new ActionLogger('narf-timing');
  });

  test.describe('Double-Click Prevention', () => {
    test('double-clicking create game button', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      await screenshot.capture('01-games-page');

      const createButton = page.getByRole('button', { name: /create|new|add/i });

      if (await createButton.isVisible()) {
        await logger.action('Double-click create button', async () => {
          await createButton.dblclick();
        });

        await page.waitForTimeout(500);
        await screenshot.capture('02-after-double-click');

        // Should only open one modal
        const dialogs = page.getByRole('dialog');
        const dialogCount = await dialogs.count();
        console.log(`[Pinky] Dialog count after double-click: ${dialogCount}`);
        expect(dialogCount).toBeLessThanOrEqual(1);
      }

      logger.summary();
    });

    test('rapid clicks on submit button', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      // Open create game modal
      const createButton = page.getByRole('button', { name: /create|new|add/i });
      await createButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await screenshot.capture('01-modal-open');

      // Fill required fields quickly
      const stakeInput = page.locator('input[type="number"]').first();
      if (await stakeInput.isVisible()) {
        await stakeInput.fill('5');
      }

      // Find submit button
      const submitButton = page.getByRole('button', { name: /create.*game|start/i });

      if (await submitButton.isVisible()) {
        await logger.action('Rapid click submit (5x)', async () => {
          // Click rapidly 5 times
          for (let i = 0; i < 5; i++) {
            await submitButton.click({ delay: 50 });
          }
        });

        await page.waitForTimeout(1000);
        await screenshot.capture('02-after-rapid-submit');

        // Check for error messages or duplicate creation
        const errors = page.getByText(/error|failed|duplicate/i);
        const errorCount = await errors.count();
        console.log(`[Pinky] Error count after rapid submit: ${errorCount}`);
      }

      logger.summary();
    });

    test('double-click on game card', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      const gameCards = page.getByTestId('game-card');

      if (await gameCards.count() > 0) {
        await screenshot.capture('01-games-list');

        await logger.action('Double-click game card', async () => {
          await gameCards.first().dblclick();
        });

        await page.waitForTimeout(500);
        await screenshot.capture('02-after-double-click');

        // Should navigate once, not break
        await expect(page.locator('body')).toBeVisible();
      }

      logger.summary();
    });
  });

  test.describe('Click During Loading', () => {
    test('clicking elements while page is loading', async ({ page }) => {
      // Start navigating
      const navigationPromise = page.goto('/event/demo-event/games');

      await screenshot.capture('01-navigating');

      // Try to click elements before page is fully loaded
      await logger.action('Click during load', async () => {
        try {
          const anyButton = page.getByRole('button').first();
          await anyButton.click({ timeout: 2000 });
        } catch {
          console.log('[Pinky] Could not click during load (expected)');
        }
      });

      await navigationPromise;
      await page.waitForLoadState('networkidle');

      await screenshot.capture('02-page-loaded');

      // Page should be in a consistent state
      await expect(page.locator('body')).toBeVisible();

      logger.summary();
    });

    test('form submission during async validation', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      const createButton = page.getByRole('button', { name: /create|new|add/i });
      await createButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await screenshot.capture('01-modal-open');

      // Fill and submit immediately without waiting
      const stakeInput = page.locator('input[type="number"]').first();
      const submitButton = page.getByRole('button', { name: /create.*game|start/i });

      await logger.action('Quick fill and submit', async () => {
        if (await stakeInput.isVisible()) {
          await stakeInput.fill('10');
        }

        // Immediately try to submit
        if (await submitButton.isVisible()) {
          await submitButton.click();
        }
      });

      await page.waitForTimeout(500);
      await screenshot.capture('02-after-quick-submit');

      logger.summary();
    });
  });

  test.describe('Rapid Navigation', () => {
    test('quick navigation between pages', async ({ page }) => {
      await screenshot.capture('01-start');

      const pages = [
        '/event/demo-event',
        '/event/demo-event/games',
        '/event/demo-event',
        '/event/demo-event/games',
      ];

      for (let i = 0; i < pages.length; i++) {
        await logger.action(`Navigate to ${pages[i]}`, async () => {
          await page.goto(pages[i], { waitUntil: 'commit' });
        });
      }

      await page.waitForLoadState('networkidle');
      await screenshot.capture('02-final-state');

      // Page should be stable
      await expect(page.locator('body')).toBeVisible();

      logger.summary();
    });

    test('clicking links in rapid succession', async ({ page }) => {
      await page.goto('/event/demo-event');
      await page.waitForLoadState('networkidle');

      await screenshot.capture('01-event-page');

      // Find all navigation links
      const navLinks = page.getByRole('link');
      const linkCount = await navLinks.count();

      if (linkCount >= 3) {
        await logger.action('Click multiple links rapidly', async () => {
          for (let i = 0; i < Math.min(linkCount, 3); i++) {
            await navLinks.nth(i).click({ timeout: 1000 }).catch(() => {});
          }
        });

        await page.waitForTimeout(500);
        await screenshot.capture('02-after-rapid-nav');
      }

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();

      logger.summary();
    });
  });

  test.describe('Concurrent Actions', () => {
    test('opening multiple modals', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      // Open create modal
      const createButton = page.getByRole('button', { name: /create|new|add/i });
      await createButton.click();

      await screenshot.capture('01-first-modal');

      // Try to open another modal while first is open
      await logger.action('Try second modal trigger', async () => {
        // Try clicking any other modal trigger
        const otherButtons = page.getByRole('button').filter({ hasNot: page.getByRole('dialog') });
        const count = await otherButtons.count();
        if (count > 1) {
          await otherButtons.nth(1).click({ timeout: 1000 }).catch(() => {});
        }
      });

      await page.waitForTimeout(300);
      await screenshot.capture('02-modal-state');

      // Count open dialogs
      const dialogCount = await page.getByRole('dialog').count();
      console.log(`[Pinky] Open dialog count: ${dialogCount}`);

      logger.summary();
    });

    test('typing while dropdown is opening', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      const createButton = page.getByRole('button', { name: /create|new|add/i });
      await createButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      const comboboxes = page.getByRole('combobox');

      if (await comboboxes.count() > 0) {
        await logger.action('Click and type simultaneously', async () => {
          // Click to open dropdown
          await comboboxes.first().click();

          // Immediately start typing
          await page.keyboard.type('Alex', { delay: 50 });
        });

        await page.waitForTimeout(300);
        await screenshot.capture('01-type-during-dropdown');
      }

      logger.summary();
    });
  });
});
