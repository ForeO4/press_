import { test as setup, expect } from '@playwright/test';
import { loginAsTestUser, AUTH_STATE_PATH, TEST_USER } from './helpers/auth';
import fs from 'fs';
import path from 'path';

/**
 * Authentication Setup for Pinky Tests
 *
 * This runs ONCE before all tests to:
 * 1. Log in as the test user
 * 2. Save the authenticated session to storage state
 * 3. Other tests reuse this cached session (no login per test)
 *
 * This dramatically speeds up tests and reduces flakiness
 * caused by repeated login attempts.
 */
setup('authenticate test user', async ({ page }) => {
  // Validate credentials are configured
  if (!TEST_USER.email || !TEST_USER.password) {
    throw new Error(
      'Missing test credentials! Set PINKY_TEST_EMAIL and PINKY_TEST_PASSWORD in .env.pinky'
    );
  }

  console.log('\n🔐 Auth Setup: Logging in as test user...');
  console.log(`   Email: ${TEST_USER.email}`);

  // Ensure auth directory exists
  const authDir = path.dirname(AUTH_STATE_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log(`   Created auth directory: ${authDir}`);
  }

  // Perform login
  await loginAsTestUser(page);

  // Verify we're logged in by checking for app content
  await expect(page).toHaveURL(/\/app/);
  console.log('   ✅ Login successful');

  // Save authenticated state
  await page.context().storageState({ path: AUTH_STATE_PATH });
  console.log(`   ✅ Session saved to ${AUTH_STATE_PATH}\n`);
});
