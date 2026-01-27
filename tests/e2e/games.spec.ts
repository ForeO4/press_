import { test, expect } from '@playwright/test';

test.describe('Games Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/event/demo-event/games');
  });

  test('displays games list or empty state', async ({ page }) => {
    // Should show either games or an empty state message
    const hasGames = await page.getByTestId('game-card').count() > 0;
    const hasEmptyState = await page.getByText(/no games|create.*game|start.*game/i).isVisible();

    expect(hasGames || hasEmptyState).toBe(true);
  });

  test('shows create game button', async ({ page }) => {
    // Look for create game button
    const createButton = page.getByRole('button', { name: /create|new|add/i });
    await expect(createButton).toBeVisible();
  });

  test('can open create game modal', async ({ page }) => {
    // Click create game button
    const createButton = page.getByRole('button', { name: /create|new|add/i });
    await createButton.click();

    // Modal should appear
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test.describe('Create Game Modal', () => {
    test.beforeEach(async ({ page }) => {
      // Open create game modal
      const createButton = page.getByRole('button', { name: /create|new|add/i });
      await createButton.click();
    });

    test('shows game type options', async ({ page }) => {
      // Should show Match Play and Nassau options
      await expect(page.getByText(/match.*play/i)).toBeVisible();
      await expect(page.getByText(/nassau/i)).toBeVisible();
    });

    test('shows stake input', async ({ page }) => {
      // Should have stake/bet amount input
      const stakeInput = page.locator('input[type="number"]');
      await expect(stakeInput.first()).toBeVisible();
    });

    test('shows player selection', async ({ page }) => {
      // Should show player selection dropdowns or buttons
      const playerSelectors = page.getByRole('combobox');
      const count = await playerSelectors.count();

      // Should have at least 2 player selection areas
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('can close modal', async ({ page }) => {
      // Find and click close/cancel button
      const closeButton = page.getByRole('button', { name: /close|cancel|x/i });
      await closeButton.click();

      // Modal should be closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('validates required fields', async ({ page }) => {
      // Try to create without selecting players
      const submitButton = page.getByRole('button', { name: /create.*game|start.*game/i });

      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should show validation error or keep modal open
        await expect(page.getByRole('dialog')).toBeVisible();
      }
    });
  });
});

test.describe('Game Detail Page', () => {
  test('shows game information when accessing a game', async ({ page }) => {
    // First go to games list
    await page.goto('/event/demo-event/games');

    // If there are games, click the first one
    const gameCards = page.getByTestId('game-card');
    const hasGames = await gameCards.count() > 0;

    if (hasGames) {
      await gameCards.first().click();

      // Should show game detail page with score information
      await expect(page.getByText(/hole|score|match|nassau/i)).toBeVisible();
    }
  });
});

test.describe('Scorecard Entry', () => {
  test('can access scorecard page', async ({ page }) => {
    // Navigate to a game's scorecard
    await page.goto('/event/demo-event/games');

    // Look for a game card or create one
    const gameCards = page.getByTestId('game-card');

    if (await gameCards.count() > 0) {
      await gameCards.first().click();

      // Should be on game detail page
      await expect(page.getByText(/score|hole/i)).toBeVisible();
    }
  });
});
