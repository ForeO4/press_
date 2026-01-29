import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load Pinky test credentials
dotenv.config({ path: path.resolve(__dirname, '../.env.pinky') });

/**
 * Storage state path for cached authentication
 */
const AUTH_STATE_PATH = './results/.auth/user.json';

/**
 * Pinky Test Suite Configuration
 *
 * "The same thing we do every night, Pinky - try to test the app!"
 *
 * This configuration includes:
 * - Global setup to warm up Render server before tests
 * - Auth setup project that logs in once and caches session
 * - Increased timeouts for Render cold starts
 * - Always-on screenshots and traces for debugging
 * - JSON + HTML reporters for report generation
 * - Desktop Chrome + iPhone 12 projects for coverage
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.pinky.ts',

  /* Global setup to warm server before any tests run */
  globalSetup: './global-setup',

  /* Run tests in parallel for speed */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests - increased for flaky network conditions */
  retries: process.env.CI ? 3 : 2,

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

    /* Timeouts increased for Render cold starts */
    actionTimeout: 30000,      // 30s (was 20s)
    navigationTimeout: 90000,  // 90s (was 45s)
  },

  /* Test timeout - generous for complex flows + cold starts */
  timeout: 120000,  // 2 minutes (was 60s)

  /* Expect timeout for assertions */
  expect: {
    timeout: 15000,  // 15s (was 10s)
  },

  /* Configure projects for key device coverage */
  projects: [
    /* Setup project: Logs in once, saves session for all other tests */
    {
      name: 'setup',
      testDir: './',  // auth.setup.ts is in pinky root, not tests/
      testMatch: /auth\.setup\.ts/,
    },

    /* Desktop Chrome - depends on setup, reuses cached auth */
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        storageState: AUTH_STATE_PATH,
      },
      dependencies: ['setup'],
    },

    /* iPhone 12 - depends on setup, reuses cached auth */
    {
      name: 'iPhone 12',
      use: {
        ...devices['iPhone 12'],
        storageState: AUTH_STATE_PATH,
      },
      dependencies: ['setup'],
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
