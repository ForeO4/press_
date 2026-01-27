import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.describe('Home Page', () => {
    test('displays Press! logo and branding', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByText('Press!')).toBeVisible();
    });

    test('has navigation links', async ({ page }) => {
      await page.goto('/');

      // Should have some form of navigation
      const nav = page.locator('nav, header');
      await expect(nav.first()).toBeVisible();
    });

    test('is responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Page should still be functional on mobile
      await expect(page.getByText('Press!')).toBeVisible();
    });
  });

  test.describe('Bottom Navigation (Event Pages)', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a demo event page
      await page.goto('/event/demo-event');
    });

    test('displays all navigation tabs', async ({ page }) => {
      // Check for bottom nav tabs
      await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /games/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /feed/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /board/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /settle/i })).toBeVisible();
    });

    test('can navigate to games page', async ({ page }) => {
      await page.getByRole('link', { name: /games/i }).click();

      await expect(page).toHaveURL(/\/event\/demo-event\/games/);
    });

    test('can navigate to feed page', async ({ page }) => {
      await page.getByRole('link', { name: /feed/i }).click();

      await expect(page).toHaveURL(/\/event\/demo-event\/feed/);
    });

    test('can navigate to leaderboard page', async ({ page }) => {
      await page.getByRole('link', { name: /board/i }).click();

      await expect(page).toHaveURL(/\/event\/demo-event\/leaderboard/);
    });

    test('can navigate to settlement page', async ({ page }) => {
      await page.getByRole('link', { name: /settle/i }).click();

      await expect(page).toHaveURL(/\/event\/demo-event\/settlement/);
    });

    test('highlights active tab', async ({ page }) => {
      await page.goto('/event/demo-event/games');

      const gamesLink = page.getByRole('link', { name: /games/i });
      await expect(gamesLink).toHaveClass(/text-primary/);
    });
  });
});

test.describe('Theme Toggle', () => {
  test('can toggle between light and dark mode', async ({ page }) => {
    await page.goto('/');

    // Look for theme toggle button
    const themeToggle = page.getByRole('button', { name: /theme|dark|light|toggle/i });

    if (await themeToggle.isVisible()) {
      // Get initial state
      const html = page.locator('html');
      const initialClass = await html.getAttribute('class');

      // Click to toggle
      await themeToggle.click();

      // Wait for theme change
      await page.waitForTimeout(300);

      // Verify class changed
      const newClass = await html.getAttribute('class');

      // Either class should include 'dark' or not, and should be different
      const wasToggled = initialClass !== newClass;
      expect(wasToggled).toBe(true);
    }
  });
});
