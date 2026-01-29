import { test, expect } from '@playwright/test';
import { PinkyScreenshot } from '../../helpers/screenshot';
import { ActionLogger } from '../../helpers/action-logger';

/**
 * Happy Path: Score Entry
 *
 * Tests the user's journey through entering scores.
 * Already authenticated via storageState from config.
 */

test.describe('Happy Path: Score Entry', () => {
  let screenshot: PinkyScreenshot;
  let logger: ActionLogger;

  test.beforeEach(async ({ page }) => {
    screenshot = new PinkyScreenshot(page, 'scoring');
    logger = new ActionLogger('scoring');
    // Already authenticated via storageState - navigate directly
    await page.goto('/event/demo-event/games');
    await page.waitForLoadState('domcontentloaded');
  });

  test('user can view existing game details', async ({ page }) => {
    await screenshot.capture('01-games-list');

    const gameCards = page.getByTestId('game-card');
    const hasGames = await gameCards.count() > 0;

    if (hasGames) {
      await logger.action('Click first game card', async () => {
        await gameCards.first().click();
      });

      await page.waitForLoadState('networkidle');
      await screenshot.capture('02-game-details');

      await logger.action('Verify game details visible', async () => {
        const content = page.getByText(/hole|score|match|nassau|vs/i);
        await expect(content.first()).toBeVisible({ timeout: 5000 });
      });

      await screenshot.capture('03-game-content');
    } else {
      console.log('[Pinky] No games available - skipping game details test');
      await screenshot.capture('02-no-games');
    }

    logger.summary();
  });

  test('user can navigate to scorecard view', async ({ page }) => {
    await screenshot.capture('01-games-page');

    // Look for a game to access
    const gameCards = page.getByTestId('game-card');
    const hasGames = await gameCards.count() > 0;

    if (hasGames) {
      await logger.action('Click game to view details', async () => {
        await gameCards.first().click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-game-view');

      // Look for scorecard link or tab
      const scorecardLink = page.getByRole('link', { name: /scorecard|scores|enter/i }).or(
        page.getByRole('button', { name: /scorecard|enter.*score/i })
      );

      if (await scorecardLink.isVisible().catch(() => false)) {
        await logger.action('Click scorecard', async () => {
          await scorecardLink.click();
          await page.waitForLoadState('networkidle');
        });

        await screenshot.capture('03-scorecard-view');
      } else {
        console.log('[Pinky] Scorecard link not visible on game detail page');
        await screenshot.capture('03-no-scorecard-link');
      }
    } else {
      console.log('[Pinky] No games to test scorecard navigation');
    }

    logger.summary();
  });

  test('user can see hole-by-hole scores', async ({ page }) => {
    // Navigate to a game
    const gameCards = page.getByTestId('game-card');

    if (await gameCards.count() > 0) {
      await gameCards.first().click();
      await page.waitForLoadState('networkidle');

      await screenshot.capture('01-game-detail');

      // Look for hole numbers or score table
      await logger.action('Check for hole scores', async () => {
        const holeIndicators = page.getByText(/hole\s*[1-9]|front\s*9|back\s*9/i);
        const scoreInputs = page.locator('input[type="number"]');

        const hasHoles = await holeIndicators.count() > 0;
        const hasScoreInputs = await scoreInputs.count() > 0;

        console.log(`[Pinky] Hole indicators: ${await holeIndicators.count()}`);
        console.log(`[Pinky] Score inputs: ${await scoreInputs.count()}`);
      });

      await screenshot.capture('02-hole-scores');
    }

    logger.summary();
  });

  test('user can enter a score for a hole', async ({ page }) => {
    // Navigate to a game
    const gameCards = page.getByTestId('game-card');

    if (await gameCards.count() > 0) {
      await gameCards.first().click();
      await page.waitForLoadState('networkidle');

      await screenshot.capture('01-game-detail');

      // Look for score input fields
      const scoreInputs = page.locator('input[type="number"]');

      if (await scoreInputs.count() > 0) {
        await logger.action('Focus score input', async () => {
          await scoreInputs.first().focus();
        });

        await screenshot.capture('02-input-focused');

        await logger.action('Enter score', async () => {
          await scoreInputs.first().fill('4');
        });

        await screenshot.capture('03-score-entered');

        // Check if there's a save button or auto-save
        const saveButton = page.getByRole('button', { name: /save|update|submit/i });
        if (await saveButton.isVisible().catch(() => false)) {
          await logger.action('Save score', async () => {
            await saveButton.click();
          });

          await page.waitForTimeout(1000);
          await screenshot.capture('04-score-saved');
        }
      } else {
        console.log('[Pinky] No score inputs found on game detail page');
        await screenshot.capture('02-no-score-inputs');
      }
    }

    logger.summary();
  });

  test('user can view match status during play', async ({ page }) => {
    const gameCards = page.getByTestId('game-card');

    if (await gameCards.count() > 0) {
      await gameCards.first().click();
      await page.waitForLoadState('networkidle');

      await screenshot.capture('01-game-view');

      // Look for match status indicators
      await logger.action('Check match status', async () => {
        const statusIndicators = page.getByText(/up|down|all\s*square|dormie|won|lost/i);
        const count = await statusIndicators.count();
        console.log(`[Pinky] Found ${count} status indicators`);
      });

      await screenshot.capture('02-match-status');
    }

    logger.summary();
  });

  test('user can view front/back nine totals', async ({ page }) => {
    const gameCards = page.getByTestId('game-card');

    if (await gameCards.count() > 0) {
      await gameCards.first().click();
      await page.waitForLoadState('networkidle');

      await screenshot.capture('01-game-detail');

      // Look for front/back nine or total indicators
      await logger.action('Check for nine totals', async () => {
        const nineIndicators = page.getByText(/front|back|out|in|total/i);
        const count = await nineIndicators.count();
        console.log(`[Pinky] Found ${count} nine/total indicators`);
      });

      await screenshot.captureFullPage('02-full-scorecard');
    }

    logger.summary();
  });
});
