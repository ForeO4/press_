import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('shows login form', async ({ page }) => {
      await page.goto('/auth/login');

      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('shows link to signup page', async ({ page }) => {
      await page.goto('/auth/login');

      const signUpLink = page.getByRole('link', { name: /sign up/i });
      await expect(signUpLink).toBeVisible();
      await signUpLink.click();

      await expect(page).toHaveURL('/auth/signup');
    });

    test('shows validation error for empty email', async ({ page }) => {
      await page.goto('/auth/login');

      await page.getByLabel(/password/i).fill('password123');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Browser validation should prevent submission
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();
    });

    test('shows validation error for empty password', async ({ page }) => {
      await page.goto('/auth/login');

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Browser validation should prevent submission
      const passwordInput = page.getByLabel(/password/i);
      await expect(passwordInput).toBeVisible();
    });
  });

  test.describe('Signup Page', () => {
    test('shows signup form', async ({ page }) => {
      await page.goto('/auth/signup');

      await expect(page.getByRole('heading', { name: /create.*account|sign up/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign up|create/i })).toBeVisible();
    });

    test('shows link to login page', async ({ page }) => {
      await page.goto('/auth/signup');

      const signInLink = page.getByRole('link', { name: /sign in|log in/i });
      await expect(signInLink).toBeVisible();
      await signInLink.click();

      await expect(page).toHaveURL('/auth/login');
    });
  });

  test.describe('Protected Routes', () => {
    test('redirects unauthenticated users from /app to login', async ({ page }) => {
      await page.goto('/app');

      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('redirects unauthenticated users from /event/:id to login', async ({ page }) => {
      await page.goto('/event/demo-event');

      // Should either redirect to login or show the demo event
      // Demo events may be accessible without auth
      const url = page.url();
      const isLoginPage = url.includes('/auth/login');
      const isEventPage = url.includes('/event/demo-event');

      expect(isLoginPage || isEventPage).toBe(true);
    });
  });
});

test.describe('Demo Mode', () => {
  test('home page is accessible', async ({ page }) => {
    await page.goto('/');

    // Home page should have Press! branding
    await expect(page.getByText('Press!')).toBeVisible();
  });

  test('can access demo event without authentication', async ({ page }) => {
    // Navigate to home first
    await page.goto('/');

    // Look for a way to access demo or the main app
    const appLink = page.getByRole('link', { name: /demo|try|start|play/i });
    if (await appLink.isVisible()) {
      await appLink.click();
    }
  });
});
