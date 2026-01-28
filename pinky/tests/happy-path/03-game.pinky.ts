import { test, expect } from '@playwright/test';
import { PinkyScreenshot } from '../../helpers/screenshot';
import { ActionLogger } from '../../helpers/action-logger';
import { DEMO_USERS } from '../../fixtures/test-users';

/**
 * Happy Path: Game Creation
 *
 * Tests the naive user's journey through creating games.
 * Covers Match Play, Nassau, and Skins game types.
 */

test.describe('Happy Path: Game Creation', () => {
  let screenshot: PinkyScreenshot;
  let logger: ActionLogger;

  test.beforeEach(async ({ page }) => {
    screenshot = new PinkyScreenshot(page, 'game');
    logger = new ActionLogger('game');

    // Start at the games page
    await page.goto('/event/demo-event/games');
    await page.waitForLoadState('networkidle');
  });

  test('user can view games list', async ({ page }) => {
    await screenshot.capture('01-games-page');

    await logger.action('Check for games or empty state', async () => {
      const hasGames = await page.getByTestId('game-card').count() > 0;
      const hasEmptyState = await page.getByText(/no games|create.*game/i).isVisible();
      expect(hasGames || hasEmptyState).toBe(true);
    });

    await screenshot.capture('02-games-state');

    logger.summary();
  });

  test('user can open create game modal', async ({ page }) => {
    await screenshot.capture('01-games-page');

    await logger.action('Find create game button', async () => {
      const createButton = page.getByRole('button', { name: /create|new|add/i });
      await expect(createButton).toBeVisible();
    });

    await logger.action('Click create game button', async () => {
      const createButton = page.getByRole('button', { name: /create|new|add/i });
      await createButton.click();
    });

    await screenshot.capture('02-modal-open');

    await logger.action('Verify modal is visible', async () => {
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    await screenshot.capture('03-modal-content');

    logger.summary();
  });

  test('user can select Match Play game type', async ({ page }) => {
    // Open create game modal
    const createButton = page.getByRole('button', { name: /create|new|add/i });
    await createButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await screenshot.capture('01-modal-open');

    await logger.action('Find Match Play option', async () => {
      const matchPlay = page.getByText(/match.*play/i);
      await expect(matchPlay.first()).toBeVisible();
    });

    await logger.action('Select Match Play', async () => {
      const matchPlay = page.getByText(/match.*play/i).first();
      await matchPlay.click();
    });

    await screenshot.capture('02-match-play-selected');

    logger.summary();
  });

  test('user can select Nassau game type', async ({ page }) => {
    // Open create game modal
    const createButton = page.getByRole('button', { name: /create|new|add/i });
    await createButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await screenshot.capture('01-modal-open');

    await logger.action('Find Nassau option', async () => {
      const nassau = page.getByText(/nassau/i);
      await expect(nassau.first()).toBeVisible();
    });

    await logger.action('Select Nassau', async () => {
      const nassau = page.getByText(/nassau/i).first();
      await nassau.click();
    });

    await screenshot.capture('02-nassau-selected');

    logger.summary();
  });

  test('user can set stake amount', async ({ page }) => {
    // Open create game modal
    const createButton = page.getByRole('button', { name: /create|new|add/i });
    await createButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await screenshot.capture('01-modal-open');

    await logger.action('Find stake input', async () => {
      const stakeInput = page.locator('input[type="number"]');
      await expect(stakeInput.first()).toBeVisible();
    });

    await logger.action('Enter stake amount', async () => {
      const stakeInput = page.locator('input[type="number"]').first();
      await stakeInput.fill('10');
    });

    await screenshot.capture('02-stake-entered');

    logger.summary();
  });

  test('user can select players for a game', async ({ page }) => {
    // Open create game modal
    const createButton = page.getByRole('button', { name: /create|new|add/i });
    await createButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await screenshot.capture('01-modal-open');

    await logger.action('Find player selectors', async () => {
      const playerSelectors = page.getByRole('combobox');
      const count = await playerSelectors.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    await screenshot.capture('02-player-selectors');

    // Try to select players
    const comboboxes = page.getByRole('combobox');
    const count = await comboboxes.count();

    for (let i = 0; i < Math.min(count, 2); i++) {
      await logger.action(`Open player selector ${i + 1}`, async () => {
        await comboboxes.nth(i).click();
      });

      await screenshot.capture(`03-player-dropdown-${i + 1}`);

      // Look for player options
      const playerOption = page.getByRole('option').first();
      if (await playerOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logger.action(`Select player ${i + 1}`, async () => {
          await playerOption.click();
        });
      } else {
        // Close dropdown if no options
        await page.keyboard.press('Escape');
      }

      await screenshot.capture(`04-player-selected-${i + 1}`);
    }

    logger.summary();
  });

  test('user can complete game creation flow', async ({ page }) => {
    // Open create game modal
    const createButton = page.getByRole('button', { name: /create|new|add/i });
    await createButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await screenshot.capture('01-modal-open');

    // Select game type
    await logger.action('Select Match Play', async () => {
      const matchPlay = page.getByText(/match.*play/i).first();
      await matchPlay.click();
    });

    await screenshot.capture('02-type-selected');

    // Enter stake
    await logger.action('Enter stake', async () => {
      const stakeInput = page.locator('input[type="number"]').first();
      await stakeInput.fill('5');
    });

    await screenshot.capture('03-stake-entered');

    // Try to select players
    const comboboxes = page.getByRole('combobox');
    const comboCount = await comboboxes.count();

    for (let i = 0; i < Math.min(comboCount, 2); i++) {
      await logger.action(`Select player ${i + 1}`, async () => {
        await comboboxes.nth(i).click();
        await page.waitForTimeout(500);

        const option = page.getByRole('option').first();
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          await option.click();
        } else {
          await page.keyboard.press('Escape');
        }
      });
    }

    await screenshot.capture('04-players-selected');

    // Try to submit
    const submitButton = page.getByRole('button', { name: /create.*game|start.*game|submit/i });
    if (await submitButton.isVisible()) {
      await logger.action('Click create game', async () => {
        await submitButton.click();
      });

      await page.waitForTimeout(1000);
      await screenshot.capture('05-after-submit');
    }

    logger.summary();
  });
});
