import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup for Pinky Tests
 *
 * This runs ONCE before all tests to warm up the Render server.
 * Render has cold starts that can take 45-120 seconds - we handle that here
 * so individual tests don't timeout waiting for the server.
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'https://press-4qf0.onrender.com';

  console.log('\n🧠 Pinky Global Setup: Warming up server...');
  console.log(`   Target: ${baseURL}`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Attempt to reach the login page with a generous timeout for cold starts
    console.log('   Attempting to reach login page (120s timeout for cold start)...');

    const startTime = Date.now();
    await page.goto(`${baseURL}/auth/login`, {
      timeout: 120000, // 2 minutes for cold start
      waitUntil: 'domcontentloaded',
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ✅ Server is warm! (responded in ${elapsed}s)`);

    // Verify login form is present
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('   ✅ Login form verified\n');

  } catch (error) {
    console.error('   ❌ Failed to warm up server:', error);
    console.error('   Tests may experience timeouts.\n');
    // Don't throw - let tests attempt to run anyway
  } finally {
    await browser.close();
  }
}

export default globalSetup;
