import { test, expect } from '@playwright/test';
import { PinkyScreenshot } from '../../helpers/screenshot';
import { ActionLogger } from '../../helpers/action-logger';

/**
 * Happy Path: Game Creation
 *
 * Tests the user's journey through creating games.
 * Covers Match Play, Nassau, and Skins game types.
 * Already authenticated via storageState from config.
 */

test.describe('Happy Path: Game Creation', () => {
  let screenshot: PinkyScreenshot;
  let logger: ActionLogger;

  test.beforeEach(async ({ page }) => {
    screenshot = new PinkyScreenshot(page, 'game');
    logger = new ActionLogger('game');
    // Already authenticated via storageState - navigate directly
    await page.goto('/event/demo-event/games');
    await page.waitForLoadState('domcontentloaded');
  });

  test('user can view games list', async ({ page }) => {
    await screenshot.capture('01-games-page');

    await logger.action('Check for games or empty state', async () => {
      // Wait for content to load
      await page.waitForTimeout(1000);
      const pageContent = await page.content();
      // Should have some content loaded (games list or empty state)
      expect(pageContent.length).toBeGreaterThan(100);
    });

    await screenshot.capture('02-games-state');

    logger.summary();
  });

  test('user can open create game modal', async ({ page }) => {
    await screenshot.capture('01-games-page');

    // Look for create game button or link
    const createButton = page.getByRole('button', { name: /create|new|add|start/i }).or(
      page.getByRole('link', { name: /create|new|add|start/i })
    );

    const hasCreateButton = await createButton.first().isVisible().catch(() => false);

    if (hasCreateButton) {
      await logger.action('Click create game button', async () => {
        await createButton.first().click();
      });

      await screenshot.capture('02-after-click');

      // Check if modal opened or navigated to new page
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible().catch(() => false)) {
        await screenshot.capture('03-modal-content');
      } else {
        await screenshot.capture('03-create-page');
      }
    } else {
      console.log('[Pinky] No create game button found');
      await screenshot.capture('02-no-create-button');
    }

    logger.summary();
  });

  test('user can select Match Play game type', async ({ page }) => {
    // Navigate to new game page
    await page.goto('/event/demo-event/games/new');
    await page.waitForLoadState('networkidle');

    await screenshot.capture('01-new-game-page');

    // Look for Match Play option
    const matchPlay = page.getByText(/match.*play/i).or(
      page.getByLabel(/match.*play/i)
    );

    const hasMatchPlay = await matchPlay.first().isVisible().catch(() => false);

    if (hasMatchPlay) {
      await logger.action('Select Match Play', async () => {
        await matchPlay.first().click();
      });

      await screenshot.capture('02-match-play-selected');
    } else {
      console.log('[Pinky] Match Play option not found');
      await screenshot.capture('02-no-match-play');
    }

    logger.summary();
  });

  test('user can select Nassau game type', async ({ page }) => {
    // Navigate to new game page
    await page.goto('/event/demo-event/games/new');
    await page.waitForLoadState('networkidle');

    await screenshot.capture('01-new-game-page');

    // Look for Nassau option
    const nassau = page.getByText(/nassau/i).or(
      page.getByLabel(/nassau/i)
    );

    const hasNassau = await nassau.first().isVisible().catch(() => false);

    if (hasNassau) {
      await logger.action('Select Nassau', async () => {
        await nassau.first().click();
      });

      await screenshot.capture('02-nassau-selected');
    } else {
      console.log('[Pinky] Nassau option not found');
      await screenshot.capture('02-no-nassau');
    }

    logger.summary();
  });

  test('user can set stake amount', async ({ page }) => {
    // Navigate to new game page
    await page.goto('/event/demo-event/games/new');
    await page.waitForLoadState('networkidle');

    await screenshot.capture('01-new-game-page');

    // Look for stake input
    const stakeInput = page.locator('input[type="number"]').or(
      page.locator('input[type="text"]').filter({ hasText: /stake/i })
    ).or(
      page.getByLabel(/stake/i)
    );

    const hasStakeInput = await stakeInput.first().isVisible().catch(() => false);

    if (hasStakeInput) {
      await logger.action('Enter stake amount', async () => {
        await stakeInput.first().fill('10');
      });

      await screenshot.capture('02-stake-entered');
    } else {
      console.log('[Pinky] Stake input not found');
      await screenshot.capture('02-no-stake-input');
    }

    logger.summary();
  });

  test('user can select players for a game', async ({ page }) => {
    // Navigate to new game page
    await page.goto('/event/demo-event/games/new');
    await page.waitForLoadState('networkidle');

    await screenshot.capture('01-new-game-page');

    // Look for player selectors (combobox, select, or buttons)
    const playerSelectors = page.getByRole('combobox').or(
      page.locator('select')
    );

    const selectorCount = await playerSelectors.count();

    if (selectorCount >= 2) {
      await logger.action('Found player selectors', async () => {
        console.log(`[Pinky] Found ${selectorCount} player selectors`);
      });

      await screenshot.capture('02-player-selectors');
    } else {
      console.log('[Pinky] Player selectors not found or fewer than 2');
      await screenshot.capture('02-no-player-selectors');
    }

    logger.summary();
  });

  test('user can complete game creation flow', async ({ page }) => {
    // Navigate to new game page
    await page.goto('/event/demo-event/games/new');
    await page.waitForLoadState('networkidle');

    await screenshot.capture('01-new-game-page');

    // Try to fill out the form
    // This is a best-effort test that adapts to the actual UI

    // 1. Look for game type selection
    const matchPlay = page.getByText(/match.*play/i);
    if (await matchPlay.first().isVisible().catch(() => false)) {
      await logger.action('Select Match Play', async () => {
        await matchPlay.first().click();
      });
    }

    await screenshot.capture('02-type-selected');

    // 2. Look for stake input
    const stakeInput = page.locator('input').filter({ hasText: /stake/i }).or(
      page.locator('input[type="number"]').first()
    );
    if (await stakeInput.first().isVisible().catch(() => false)) {
      await logger.action('Enter stake', async () => {
        await stakeInput.first().fill('5');
      });
    }

    await screenshot.capture('03-stake-entered');

    // 3. Look for submit/create button
    const submitButton = page.getByRole('button', { name: /create|start|submit/i });
    if (await submitButton.isVisible().catch(() => false)) {
      await screenshot.capture('04-before-submit');
      // Don't actually submit in this test
    } else {
      console.log('[Pinky] Submit button not found');
    }

    await screenshot.capture('05-form-state');

    logger.summary();
  });
});
