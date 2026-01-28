import { test, expect } from '@playwright/test';
import { PinkyScreenshot } from '../../helpers/screenshot';
import { ActionLogger } from '../../helpers/action-logger';

/**
 * Happy Path: Settlement Flow
 *
 * Tests the naive user's journey through settling bets.
 */

test.describe('Happy Path: Settlement', () => {
  let screenshot: PinkyScreenshot;
  let logger: ActionLogger;

  test.beforeEach(async ({ page }) => {
    screenshot = new PinkyScreenshot(page, 'settlement');
    logger = new ActionLogger('settlement');

    // Start at the event
    await page.goto('/event/demo-event');
    await page.waitForLoadState('networkidle');
  });

  test('user can view Gator Bucks balance', async ({ page }) => {
    await screenshot.capture('01-event-page');

    // Look for balance display
    await logger.action('Find balance display', async () => {
      const balanceText = page.getByText(/bucks|balance|teeth|\$/i);
      const count = await balanceText.count();
      console.log(`[Pinky] Found ${count} balance-related elements`);
    });

    await screenshot.capture('02-balance-area');

    logger.summary();
  });

  test('user can access settlement page', async ({ page }) => {
    await screenshot.capture('01-event-home');

    // Look for settlement link
    const settlementLink = page.getByRole('link', { name: /settle|settlement|pay|collect/i }).or(
      page.getByRole('tab', { name: /settle/i })
    );

    if (await settlementLink.isVisible().catch(() => false)) {
      await logger.action('Click settlement link', async () => {
        await settlementLink.click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-settlement-page');

      await logger.action('Verify settlement content', async () => {
        const content = page.getByText(/settle|owed|owes|pay|collect/i);
        await expect(content.first()).toBeVisible({ timeout: 5000 });
      });

      await screenshot.capture('03-settlement-content');
    } else {
      // Settlement might be in games area
      await page.goto('/event/demo-event/games');
      await page.waitForLoadState('networkidle');
      await screenshot.capture('02-games-for-settlement');
    }

    logger.summary();
  });

  test('user can view pending settlements', async ({ page }) => {
    // Navigate to games to find settlements
    await page.goto('/event/demo-event/games');
    await page.waitForLoadState('networkidle');

    await screenshot.capture('01-games-page');

    // Look for settlement indicators
    await logger.action('Check for pending settlements', async () => {
      const pendingText = page.getByText(/pending|unsettled|owed|collect/i);
      const count = await pendingText.count();
      console.log(`[Pinky] Found ${count} settlement-related elements`);
    });

    await screenshot.capture('02-settlement-status');

    logger.summary();
  });

  test('user can complete a settlement', async ({ page }) => {
    // Look for settlement action in games
    await page.goto('/event/demo-event/games');
    await page.waitForLoadState('networkidle');

    await screenshot.capture('01-games-page');

    // Look for settle button
    const settleButton = page.getByRole('button', { name: /settle|mark.*paid|confirm.*payment/i });

    if (await settleButton.isVisible().catch(() => false)) {
      await logger.action('Click settle button', async () => {
        await settleButton.click();
      });

      await screenshot.capture('02-settle-modal');

      // Look for confirmation
      const confirmButton = page.getByRole('button', { name: /confirm|yes|ok/i });
      if (await confirmButton.isVisible().catch(() => false)) {
        await logger.action('Confirm settlement', async () => {
          await confirmButton.click();
        });

        await page.waitForTimeout(1000);
        await screenshot.capture('03-settlement-confirmed');
      }
    } else {
      console.log('[Pinky] No settle button visible - may not have pending settlements');
      await screenshot.capture('02-no-settle-button');
    }

    logger.summary();
  });

  test('user can see game results after completion', async ({ page }) => {
    await page.goto('/event/demo-event/games');
    await page.waitForLoadState('networkidle');

    await screenshot.capture('01-games-list');

    const gameCards = page.getByTestId('game-card');

    if (await gameCards.count() > 0) {
      await logger.action('Check game for results', async () => {
        await gameCards.first().click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-game-detail');

      // Look for result indicators
      await logger.action('Check for results', async () => {
        const resultText = page.getByText(/won|lost|tie|result|final|complete/i);
        const count = await resultText.count();
        console.log(`[Pinky] Found ${count} result indicators`);
      });

      await screenshot.capture('03-game-results');
    }

    logger.summary();
  });

  test('user can view settlement history', async ({ page }) => {
    await screenshot.capture('01-event-page');

    // Look for history or completed settlements
    const historyLink = page.getByRole('link', { name: /history|completed|past/i }).or(
      page.getByRole('tab', { name: /history/i })
    );

    if (await historyLink.isVisible().catch(() => false)) {
      await logger.action('Click history link', async () => {
        await historyLink.click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-history-page');
    } else {
      // Check for inline history on current page
      const historySection = page.getByText(/history|completed|settled/i);
      if (await historySection.isVisible().catch(() => false)) {
        await screenshot.capture('02-inline-history');
      } else {
        console.log('[Pinky] History section not visible');
        await screenshot.capture('02-no-history');
      }
    }

    logger.summary();
  });
});
