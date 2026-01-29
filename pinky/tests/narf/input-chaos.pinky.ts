import { test, expect } from '@playwright/test';
import { PinkyScreenshot } from '../../helpers/screenshot';
import { ActionLogger } from '../../helpers/action-logger';
import { loginAsTestUser } from '../../helpers/auth';
import {
  CHAOS_INPUTS,
  EMPTY_INPUTS,
  BOUNDARY_NUMBERS,
  SPECIAL_CHARS,
  SECURITY_INPUTS,
  UNICODE_INPUTS,
} from '../../fixtures/chaos-inputs';

/**
 * Narf Tests: Input Chaos
 *
 * "NARF!" - Tests that break the mold with unexpected inputs.
 *
 * Tests how the app handles:
 * - Blank and whitespace inputs
 * - XSS and SQL injection attempts
 * - Unicode, emojis, and special characters
 * - Boundary numbers and invalid values
 */

test.describe('Narf: Input Chaos', () => {
  let screenshot: PinkyScreenshot;
  let logger: ActionLogger;

  test.beforeEach(async ({ page }) => {
    screenshot = new PinkyScreenshot(page, 'narf-input');
    logger = new ActionLogger('narf-input');

    // Login before accessing protected pages
    await loginAsTestUser(page);
  });

  test.describe('Create Game Form - Stake Input', () => {
    // The create game form appears after clicking "New Game" button
    test.beforeEach(async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      // Click "New Game" button to expand/show the create game form
      const newGameButton = page.getByRole('button', { name: 'New Game' });
      if (await newGameButton.isVisible()) {
        await newGameButton.click();
        await page.waitForTimeout(500);
      }

      // Wait for the create game form to appear
      await expect(page.getByRole('heading', { name: 'Create Game' })).toBeVisible({ timeout: 5000 });
    });

    test('handles empty stake input', async ({ page }) => {
      const stakeInput = page.getByRole('textbox', { name: 'Stake' });

      await logger.action('Clear stake input', async () => {
        await stakeInput.clear();
      });

      await screenshot.capture('01-empty-stake');

      // Try to submit with empty stake
      const submitButton = page.getByRole('button', { name: 'Create Game' });
      await logger.action('Click Create Game with empty stake', async () => {
        // Scroll into view to avoid bottom nav bar blocking on mobile
        await submitButton.scrollIntoViewIfNeeded();
        await submitButton.click();
        await page.waitForTimeout(500);
      });

      await screenshot.capture('02-after-submit-empty');

      // Page should remain functional (either form stays or game is created)
      await expect(page.locator('body')).toBeVisible();
      console.log(`[Pinky] Current URL after empty stake submit: ${page.url()}`);

      logger.summary();
    });

    test('handles negative stake', async ({ page }) => {
      const stakeInput = page.getByRole('textbox', { name: 'Stake' });

      await logger.action('Enter negative stake', async () => {
        await stakeInput.clear();
        await stakeInput.fill('-10');
      });

      await screenshot.capture('01-negative-stake');

      // Check if input was rejected or accepted
      const value = await stakeInput.inputValue();
      console.log(`[Pinky] Input value after -10: "${value}"`);

      await screenshot.capture('02-stake-state');

      logger.summary();
    });

    test('handles zero stake', async ({ page }) => {
      const stakeInput = page.getByRole('textbox', { name: 'Stake' });

      await logger.action('Enter zero stake', async () => {
        await stakeInput.clear();
        await stakeInput.fill('0');
      });

      await screenshot.capture('01-zero-stake');

      const submitButton = page.getByRole('button', { name: 'Create Game' });
      await logger.action('Click Create Game with zero stake', async () => {
        // Scroll into view to avoid bottom nav bar blocking on mobile
        await submitButton.scrollIntoViewIfNeeded();
        await submitButton.click();
        await page.waitForTimeout(500);
      });

      await screenshot.capture('02-after-zero-submit');

      logger.summary();
    });

    test('handles very large stake', async ({ page }) => {
      const stakeInput = page.getByRole('textbox', { name: 'Stake' });

      await logger.action('Enter huge stake', async () => {
        await stakeInput.clear();
        await stakeInput.fill('999999999');
      });

      await screenshot.capture('01-huge-stake');

      const value = await stakeInput.inputValue();
      console.log(`[Pinky] Input value after huge number: "${value}"`);

      await screenshot.capture('02-stake-result');

      logger.summary();
    });

    test('handles decimal stake', async ({ page }) => {
      const stakeInput = page.getByRole('textbox', { name: 'Stake' });

      await logger.action('Enter decimal stake', async () => {
        await stakeInput.clear();
        await stakeInput.fill('5.50');
      });

      await screenshot.capture('01-decimal-stake');

      const value = await stakeInput.inputValue();
      console.log(`[Pinky] Input value after 5.50: "${value}"`);

      logger.summary();
    });
  });

  test.describe('Security Input Tests', () => {
    // These tests need the form expanded first
    test.beforeEach(async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      // Click "New Game" button to expand the form
      const newGameButton = page.getByRole('button', { name: 'New Game' });
      if (await newGameButton.isVisible()) {
        await newGameButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('XSS in text fields does not execute', async ({ page }) => {
      await screenshot.capture('01-initial-page');

      // Use the stake input for XSS testing
      const stakeInput = page.getByRole('textbox', { name: 'Stake' });

      const xssAttempts = SECURITY_INPUTS.filter((i) => i.name.startsWith('xss-'));

      for (const xss of xssAttempts.slice(0, 3)) {
        await logger.action(`Test XSS: ${xss.name}`, async () => {
          await stakeInput.clear();
          await stakeInput.fill(xss.value);
        });

        await screenshot.capture(`02-xss-${xss.name}`);

        // Verify no script executed (page should not show alert or crash)
        const pageContent = await page.content();
        expect(pageContent).not.toContain('<script>alert');
      }

      logger.summary();
    });

    test('SQL injection strings are safely handled', async ({ page }) => {
      // Use the stake input for SQL injection testing
      const stakeInput = page.getByRole('textbox', { name: 'Stake' });

      const sqlAttempts = SECURITY_INPUTS.filter((i) => i.name.startsWith('sql-'));

      for (const sql of sqlAttempts.slice(0, 2)) {
        await logger.action(`Test SQL: ${sql.name}`, async () => {
          await stakeInput.clear();
          await stakeInput.fill(sql.value);
        });

        await screenshot.capture(`sql-${sql.name}`);

        // Page should not error
        await expect(page.locator('body')).toBeVisible();
      }

      logger.summary();
    });
  });

  test.describe('Unicode and Emoji Tests', () => {
    // These tests need the form expanded first
    test.beforeEach(async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      // Click "New Game" button to expand the form
      const newGameButton = page.getByRole('button', { name: 'New Game' });
      if (await newGameButton.isVisible()) {
        await newGameButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('handles emoji in player names/text', async ({ page }) => {
      // Use the stake input for emoji testing
      const stakeInput = page.getByRole('textbox', { name: 'Stake' });

      for (const emoji of UNICODE_INPUTS.filter((i) => i.name.includes('emoji')).slice(0, 2)) {
        await logger.action(`Test emoji: ${emoji.name}`, async () => {
          await stakeInput.clear();
          await stakeInput.fill(emoji.value);
        });

        await screenshot.capture(`emoji-${emoji.name}`);

        // Input should accept emoji without crashing
        const value = await stakeInput.inputValue();
        console.log(`[Pinky] Emoji input result: "${value}"`);
      }

      logger.summary();
    });

    test('handles RTL text', async ({ page }) => {
      // Use the stake input for RTL testing
      const stakeInput = page.getByRole('textbox', { name: 'Stake' });

      const rtlInputs = UNICODE_INPUTS.filter(
        (i) => i.name === 'arabic' || i.name === 'hebrew' || i.name === 'mixed-rtl-ltr'
      );

      for (const rtl of rtlInputs) {
        await logger.action(`Test RTL: ${rtl.name}`, async () => {
          await stakeInput.clear();
          await stakeInput.fill(rtl.value);
        });

        await screenshot.capture(`rtl-${rtl.name}`);
      }

      logger.summary();
    });

    test('handles zalgo text', async ({ page }) => {
      // Use the stake input for zalgo testing
      const stakeInput = page.getByRole('textbox', { name: 'Stake' });

      const zalgo = UNICODE_INPUTS.find((i) => i.name === 'zalgo');
      if (zalgo) {
        await logger.action('Test zalgo text', async () => {
          await stakeInput.clear();
          await stakeInput.fill(zalgo.value);
        });

        await screenshot.capture('zalgo-text');
      }

      logger.summary();
    });
  });

  test.describe('Special Characters', () => {
    // These tests need the form expanded first
    test.beforeEach(async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      // Click "New Game" button to expand the form
      const newGameButton = page.getByRole('button', { name: 'New Game' });
      if (await newGameButton.isVisible()) {
        await newGameButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('handles quotes and brackets in inputs', async ({ page }) => {
      // Use the stake input for special character testing
      const stakeInput = page.getByRole('textbox', { name: 'Stake' });

      for (const special of SPECIAL_CHARS.slice(0, 3)) {
        await logger.action(`Test special: ${special.name}`, async () => {
          await stakeInput.clear();
          await stakeInput.fill(special.value);
        });

        await screenshot.capture(`special-${special.name}`);

        // Verify input was accepted
        const value = await stakeInput.inputValue();
        console.log(`[Pinky] Special char result for ${special.name}: "${value}"`);
      }

      logger.summary();
    });
  });
});
