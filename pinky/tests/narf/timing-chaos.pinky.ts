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
 *
 * Already authenticated via storageState from config.
 */

test.describe('Narf: Timing Chaos', () => {
  let screenshot: PinkyScreenshot;
  let logger: ActionLogger;

  test.beforeEach(async ({ page }) => {
    screenshot = new PinkyScreenshot(page, 'narf-timing');
    logger = new ActionLogger('narf-timing');
    // Already authenticated via storageState
  });

  test.describe('Double-Click Prevention', () => {
    test('double-clicking Create Game button', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      // Click "New Game" button to expand the form first
      const newGameButton = page.getByRole('button', { name: 'New Game' });
      if (await newGameButton.isVisible()) {
        await newGameButton.click();
        await page.waitForTimeout(500);
      }

      await screenshot.capture('01-games-page');

      // The Create Game button is inline, not a modal trigger
      const createButton = page.getByRole('button', { name: 'Create Game' });

      await logger.action('Double-click Create Game button', async () => {
        // Scroll into view to avoid bottom nav bar blocking
        await createButton.scrollIntoViewIfNeeded();
        await createButton.dblclick();
      });

      await page.waitForTimeout(500);
      await screenshot.capture('02-after-double-click');

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
      console.log(`[Pinky] Page still functional after double-click`);

      logger.summary();
    });

    test('rapid clicks on Create Game button', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      // Click "New Game" button to expand the form first
      const newGameButton = page.getByRole('button', { name: 'New Game' });
      if (await newGameButton.isVisible()) {
        await newGameButton.click();
        await page.waitForTimeout(500);
      }

      await screenshot.capture('01-games-page');

      // The form is inline on the page
      const submitButton = page.getByRole('button', { name: 'Create Game' });

      await logger.action('Rapid click Create Game (5x)', async () => {
        // Scroll into view to avoid bottom nav bar blocking
        await submitButton.scrollIntoViewIfNeeded();
        // Click rapidly 5 times
        for (let i = 0; i < 5; i++) {
          await submitButton.click({ delay: 50 }).catch(() => {});
        }
      });

      await page.waitForTimeout(1000);
      await screenshot.capture('02-after-rapid-submit');

      // Check for error messages or duplicate creation
      const errors = page.getByText(/error|failed|duplicate/i);
      const errorCount = await errors.count();
      console.log(`[Pinky] Error count after rapid submit: ${errorCount}`);

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();

      logger.summary();
    });

    test('double-click on game card', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      // Look for game links (Continue buttons)
      const gameLinks = page.getByRole('link', { name: 'Continue' });

      if (await gameLinks.count() > 0) {
        await screenshot.capture('01-games-list');

        await logger.action('Double-click game link', async () => {
          await gameLinks.first().dblclick();
        });

        await page.waitForTimeout(500);
        await screenshot.capture('02-after-double-click');

        // Should navigate once, not break
        await expect(page.locator('body')).toBeVisible();
      } else {
        console.log('[Pinky] No game links found to test');
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

    test('form submission during typing', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      // Click "New Game" button to expand the form first
      const newGameButton = page.getByRole('button', { name: 'New Game' });
      if (await newGameButton.isVisible()) {
        await newGameButton.click();
        await page.waitForTimeout(500);
      }

      await screenshot.capture('01-games-page');

      // The form is inline on the page
      const stakeInput = page.getByRole('textbox', { name: 'Stake' });
      const submitButton = page.getByRole('button', { name: 'Create Game' });

      await logger.action('Quick fill and submit', async () => {
        // Clear and start typing
        await stakeInput.clear();
        await stakeInput.pressSequentially('15', { delay: 50 });

        // Scroll into view to avoid bottom nav bar blocking
        await submitButton.scrollIntoViewIfNeeded();
        // Immediately try to submit while typing
        await submitButton.click();
      });

      await page.waitForTimeout(500);
      await screenshot.capture('02-after-quick-submit');

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();

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
    test('clicking multiple buttons rapidly', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      await screenshot.capture('01-games-page');

      // Get all buttons on the page
      const buttons = page.getByRole('button');
      const buttonCount = await buttons.count();

      await logger.action('Click multiple buttons rapidly', async () => {
        // Click first few buttons rapidly
        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          await buttons.nth(i).click({ timeout: 500 }).catch(() => {});
        }
      });

      await page.waitForTimeout(300);
      await screenshot.capture('02-after-rapid-clicks');

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
      console.log(`[Pinky] Page functional after rapid button clicks`);

      logger.summary();
    });

    test('typing while interacting with dropdown', async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      // The inline form has comboboxes for player selection
      const comboboxes = page.getByRole('combobox');

      if (await comboboxes.count() > 0) {
        await screenshot.capture('01-form-with-dropdowns');

        await logger.action('Interact with dropdown while typing', async () => {
          // Focus on the first combobox
          await comboboxes.first().focus();

          // Start typing while dropdown might be opening
          await page.keyboard.type('Alex', { delay: 50 });
        });

        await page.waitForTimeout(300);
        await screenshot.capture('02-after-type-during-dropdown');
      } else {
        console.log('[Pinky] No comboboxes found');
      }

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();

      logger.summary();
    });
  });
});
