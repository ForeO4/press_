# Pinky Test Suite

> "Gee, Brain, what do you want to do tonight?"
> "The same thing we do every night, Pinky - try to test the app!"

Pinky is a naive user simulation test suite that captures screenshots at every step and runs chaos tests to find edge cases.

## Quick Start

```bash
# Run all Pinky tests
npm run cycle:pinky

# Run with browser visible
npm run cycle:pinky:headed

# Generate report after tests
npm run cycle:report

# Run the full Brain + Pinky cycle
npm run cycle:full
```

## Viewing Reports

After running tests:

1. **HTML Report**: Open `pinky/html-report/index.html` in your browser
2. **Markdown Report**: Check `pinky/PINKY_REPORT.md` for AI-actionable summary
3. **Raw JSON**: Check `pinky/results/pinky-results.json` for programmatic access

## Test Structure

```
pinky/
├── tests/
│   ├── happy-path/          # Naive user flows
│   │   ├── 01-auth.pinky.ts
│   │   ├── 02-event.pinky.ts
│   │   ├── 03-game.pinky.ts
│   │   ├── 04-scoring.pinky.ts
│   │   └── 05-settlement.pinky.ts
│   └── narf/                # Chaos tests ("Narf!")
│       ├── input-chaos.pinky.ts
│       ├── timing-chaos.pinky.ts
│       └── navigation-chaos.pinky.ts
├── fixtures/
│   ├── test-users.ts        # Test user personas
│   └── chaos-inputs.ts      # Chaos data (XSS, SQL, unicode, etc.)
├── helpers/
│   ├── screenshot.ts        # Screenshot utility with metadata
│   └── action-logger.ts     # Action timing and logging
└── pinky.config.ts          # Playwright configuration
```

## Adding New Tests

### Happy Path Test

```typescript
import { test, expect } from '@playwright/test';
import { PinkyScreenshot } from '../helpers/screenshot';
import { ActionLogger } from '../helpers/action-logger';

test.describe('My Feature', () => {
  test('user can do something', async ({ page }) => {
    const screenshot = new PinkyScreenshot(page, 'my-feature');
    const logger = new ActionLogger('my-feature');

    await screenshot.capture('01-start');

    await logger.action('Click button', async () => {
      await page.click('button');
    });

    await screenshot.capture('02-result');

    logger.summary();
  });
});
```

### Narf (Chaos) Test

```typescript
import { test, expect } from '@playwright/test';
import { CHAOS_INPUTS } from '../fixtures/chaos-inputs';

test.describe('Chaos: My Feature', () => {
  for (const input of CHAOS_INPUTS.strings) {
    test(`handles chaos input: ${input.name}`, async ({ page }) => {
      await page.fill('input', input.value);
      // Assert no crash, proper validation, etc.
    });
  }
});
```

## Troubleshooting

### Tests timing out
- Increase timeout in `pinky.config.ts`
- Check if dev server is running (`npm run dev`)
- Check network tab for slow requests

### Screenshots not capturing
- Ensure `screenshot: 'on'` in config
- Check `pinky/results/` directory exists
- Look for errors in test output

### "Element not found" errors
- Add `await page.waitForLoadState('networkidle')`
- Use more specific selectors
- Check if element is in shadow DOM

### Flaky tests
- Increase `actionTimeout` in config
- Add explicit waits before assertions
- Check for race conditions with network requests
