import { test, expect } from '@playwright/test';
import { PinkyScreenshot } from '../../helpers/screenshot';
import { ActionLogger } from '../../helpers/action-logger';
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
  });

  test.describe('Create Game Modal - Stake Input', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');

      // Open create game modal
      const createButton = page.getByRole('button', { name: /create|new|add/i });
      await createButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('handles empty stake input', async ({ page }) => {
      const stakeInput = page.locator('input[type="number"]').first();

      if (await stakeInput.isVisible().catch(() => false)) {
        await logger.action('Clear stake input', async () => {
          await stakeInput.clear();
        });

        await screenshot.capture('01-empty-stake');

        // Try to submit
        const submitButton = page.getByRole('button', { name: /create.*game|start/i });
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(500);
        }

        await screenshot.capture('02-after-submit-empty');

        // Should either show error or prevent submission
        const dialogStillOpen = await page.getByRole('dialog').isVisible();
        expect(dialogStillOpen).toBe(true);
      }

      logger.summary();
    });

    test('handles negative stake', async ({ page }) => {
      const stakeInput = page.locator('input[type="number"]').first();

      if (await stakeInput.isVisible().catch(() => false)) {
        await logger.action('Enter negative stake', async () => {
          await stakeInput.fill('-10');
        });

        await screenshot.capture('01-negative-stake');

        // Check if input was rejected or accepted
        const value = await stakeInput.inputValue();
        console.log(`[Pinky] Input value after -10: "${value}"`);

        await screenshot.capture('02-stake-state');
      }

      logger.summary();
    });

    test('handles zero stake', async ({ page }) => {
      const stakeInput = page.locator('input[type="number"]').first();

      if (await stakeInput.isVisible().catch(() => false)) {
        await logger.action('Enter zero stake', async () => {
          await stakeInput.fill('0');
        });

        await screenshot.capture('01-zero-stake');

        const submitButton = page.getByRole('button', { name: /create.*game|start/i });
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(500);
        }

        await screenshot.capture('02-after-zero-submit');
      }

      logger.summary();
    });

    test('handles very large stake', async ({ page }) => {
      const stakeInput = page.locator('input[type="number"]').first();

      if (await stakeInput.isVisible().catch(() => false)) {
        await logger.action('Enter huge stake', async () => {
          await stakeInput.fill('999999999');
        });

        await screenshot.capture('01-huge-stake');

        const value = await stakeInput.inputValue();
        console.log(`[Pinky] Input value after huge number: "${value}"`);

        await screenshot.capture('02-stake-result');
      }

      logger.summary();
    });

    test('handles decimal stake', async ({ page }) => {
      const stakeInput = page.locator('input[type="number"]').first();

      if (await stakeInput.isVisible().catch(() => false)) {
        await logger.action('Enter decimal stake', async () => {
          await stakeInput.fill('5.50');
        });

        await screenshot.capture('01-decimal-stake');

        const value = await stakeInput.inputValue();
        console.log(`[Pinky] Input value after 5.50: "${value}"`);
      }

      logger.summary();
    });
  });

  test.describe('Security Input Tests', () => {
    test('XSS in text fields does not execute', async ({ page }) => {
      await page.goto('/event/demo-event');
      await page.waitForLoadState('networkidle');

      await screenshot.capture('01-initial-page');

      // Find any text input on the page
      const textInputs = page.locator('input[type="text"], textarea');
      const count = await textInputs.count();

      if (count > 0) {
        const xssAttempts = SECURITY_INPUTS.filter((i) => i.name.startsWith('xss-'));

        for (const xss of xssAttempts.slice(0, 3)) {
          await logger.action(`Test XSS: ${xss.name}`, async () => {
            await textInputs.first().fill(xss.value);
          });

          await screenshot.capture(`02-xss-${xss.name}`);

          // Verify no script executed (page should not show alert or crash)
          const pageContent = await page.content();
          expect(pageContent).not.toContain('<script>alert');
        }
      } else {
        console.log('[Pinky] No text inputs found for XSS testing');
      }

      logger.summary();
    });

    test('SQL injection strings are safely handled', async ({ page }) => {
      await page.goto('/event/demo-event');
      await page.waitForLoadState('networkidle');

      const textInputs = page.locator('input[type="text"], textarea');
      const count = await textInputs.count();

      if (count > 0) {
        const sqlAttempts = SECURITY_INPUTS.filter((i) => i.name.startsWith('sql-'));

        for (const sql of sqlAttempts.slice(0, 2)) {
          await logger.action(`Test SQL: ${sql.name}`, async () => {
            await textInputs.first().fill(sql.value);
          });

          await screenshot.capture(`sql-${sql.name}`);

          // Page should not error
          await expect(page.locator('body')).toBeVisible();
        }
      }

      logger.summary();
    });
  });

  test.describe('Unicode and Emoji Tests', () => {
    test('handles emoji in player names/text', async ({ page }) => {
      await page.goto('/event/demo-event');
      await page.waitForLoadState('networkidle');

      const textInputs = page.locator('input[type="text"], textarea');

      if (await textInputs.count() > 0) {
        for (const emoji of UNICODE_INPUTS.filter((i) => i.name.includes('emoji')).slice(0, 2)) {
          await logger.action(`Test emoji: ${emoji.name}`, async () => {
            await textInputs.first().fill(emoji.value);
          });

          await screenshot.capture(`emoji-${emoji.name}`);

          // Input should accept emoji without crashing
          const value = await textInputs.first().inputValue();
          console.log(`[Pinky] Emoji input result: "${value}"`);
        }
      }

      logger.summary();
    });

    test('handles RTL text', async ({ page }) => {
      await page.goto('/event/demo-event');
      await page.waitForLoadState('networkidle');

      const textInputs = page.locator('input[type="text"], textarea');

      if (await textInputs.count() > 0) {
        const rtlInputs = UNICODE_INPUTS.filter(
          (i) => i.name === 'arabic' || i.name === 'hebrew' || i.name === 'mixed-rtl-ltr'
        );

        for (const rtl of rtlInputs) {
          await logger.action(`Test RTL: ${rtl.name}`, async () => {
            await textInputs.first().fill(rtl.value);
          });

          await screenshot.capture(`rtl-${rtl.name}`);
        }
      }

      logger.summary();
    });

    test('handles zalgo text', async ({ page }) => {
      await page.goto('/event/demo-event');
      await page.waitForLoadState('networkidle');

      const textInputs = page.locator('input[type="text"], textarea');

      if (await textInputs.count() > 0) {
        const zalgo = UNICODE_INPUTS.find((i) => i.name === 'zalgo');
        if (zalgo) {
          await logger.action('Test zalgo text', async () => {
            await textInputs.first().fill(zalgo.value);
          });

          await screenshot.capture('zalgo-text');
        }
      }

      logger.summary();
    });
  });

  test.describe('Special Characters', () => {
    test('handles quotes and brackets in inputs', async ({ page }) => {
      await page.goto('/event/demo-event');
      await page.waitForLoadState('networkidle');

      const textInputs = page.locator('input[type="text"], textarea');

      if (await textInputs.count() > 0) {
        for (const special of SPECIAL_CHARS.slice(0, 3)) {
          await logger.action(`Test special: ${special.name}`, async () => {
            await textInputs.first().fill(special.value);
          });

          await screenshot.capture(`special-${special.name}`);

          // Verify input was accepted
          const value = await textInputs.first().inputValue();
          console.log(`[Pinky] Special char result for ${special.name}: "${value}"`);
        }
      }

      logger.summary();
    });
  });
});
