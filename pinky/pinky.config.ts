import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load Pinky test credentials
dotenv.config({ path: path.resolve(__dirname, '../.env.pinky') });

/**
 * Pinky Test Suite Configuration
 *
 * "The same thing we do every night, Pinky - try to test the app!"
 *
 * This configuration extends the base Playwright config with:
 * - Always-on screenshots and traces for debugging
 * - JSON + HTML reporters for report generation
 * - Desktop Chrome + iPhone 12 projects for coverage
 * - Separate output directories from main e2e tests
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.pinky.ts',

  /* Run tests in parallel for speed */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests once to catch flaky behavior */
  retries: process.env.CI ? 2 : 1,

  /* Limit workers for predictable ordering */
  workers: process.env.CI ? 1 : 2,

  /* Output directories */
  outputDir: './results',

  /* Multiple reporters for comprehensive output */
  reporter: [
    ['list'],
    ['json', { outputFile: './results/pinky-results.json' }],
    ['html', { outputFolder: './html-report', open: 'never' }],
  ],

  /* Shared settings for all projects */
  use: {
    /* Base URL for the app */
    baseURL: 'https://press-4qf0.onrender.com',

    /* ALWAYS capture screenshots - the essence of Pinky testing */
    screenshot: 'on',

    /* ALWAYS capture traces for debugging */
    trace: 'on',

    /* Video on first retry to catch flaky tests */
    video: 'on-first-retry',

    /* Timeouts adjusted for remote server */
    actionTimeout: 20000,
    navigationTimeout: 45000,
  },

  /* Test timeout - generous for complex flows */
  timeout: 60000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 10000,
  },

  /* Configure projects for key device coverage */
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'iPhone 12',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],

  /* Web server disabled - testing against production Render URL */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
});
