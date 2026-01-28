# The Pinky & Brain Cycle - Workflow Contract

> "The same thing we do every night, Pinky - try to test the app!"

This document defines the automated testing feedback loop for the Press! golf app.

## Overview

The Pinky & Brain Cycle consists of three phases:

| Phase | Name | Purpose |
|-------|------|---------|
| 1 | **Brain** | Static analysis: lint, types, unit tests |
| 2 | **Pinky** | Dynamic analysis: E2E tests, screenshots, chaos |
| 3 | **Report** | Generate actionable markdown report |

## Commands

```bash
# Phase 1: Brain (static checks)
npm run cycle:brain

# Phase 2: Pinky (E2E tests)
npm run cycle:pinky

# Phase 2 with visible browser
npm run cycle:pinky:headed

# Phase 3: Generate report
npm run cycle:report

# Run all phases
npm run cycle:full
```

## Phase Details

### Phase 1: Brain 🧠

**Command:** `npm run cycle:brain`

**What it runs:**
1. ESLint (`npm run lint`)
2. TypeScript type checking (`tsc --noEmit`)
3. Vitest unit tests (`npm run test -- --run`)

**Exit criteria:**
- ✅ No lint errors
- ✅ No type errors
- ✅ All unit tests pass

**If Brain fails:**
- Fix lint errors first (often quick fixes)
- Fix type errors next
- Fix failing unit tests
- Do NOT proceed to Pinky until Brain passes

### Phase 2: Pinky 🐭

**Command:** `npm run cycle:pinky`

**What it runs:**
1. Starts dev server if not running
2. Executes Playwright tests from `pinky/tests/`
3. Captures screenshots at every step
4. Records traces for debugging
5. Outputs JSON + HTML reports

**Test categories:**
- **Happy Path**: Naive user flows (auth, event, game, scoring, settlement)
- **Narf (Chaos)**: Edge cases and breaking attempts

**Output:**
- `pinky/results/pinky-results.json` - Raw test results
- `pinky/results/screenshots/` - Step-by-step screenshots
- `pinky/html-report/` - Interactive HTML report

**Exit criteria:**
- ✅ All happy path tests pass
- ⚠️ Narf tests may fail (they're designed to find issues)

### Phase 3: Report 📊

**Command:** `npm run cycle:report`

**What it generates:**
- `pinky/PINKY_REPORT.md` - Actionable summary

**Report sections:**
1. Summary table (pass/fail/flaky counts)
2. Detailed failure analysis
3. Slow test identification
4. Flaky test detection
5. Screenshot index
6. Recommendations

## Branch Naming

When working on cycle improvements:

```
pinky/<feature>    # New Pinky tests or features
brain/<feature>    # New Brain checks
cycle/<feature>    # Cross-cutting changes
```

Examples:
- `pinky/add-skins-game-test`
- `brain/add-accessibility-checks`
- `cycle/improve-report-format`

## Definition of Done

### For a feature branch:
1. ✅ `npm run cycle:brain` passes
2. ✅ `npm run cycle:pinky` happy path tests pass
3. ✅ `npm run cycle:report` generates clean report
4. 📸 Screenshots reviewed for visual regressions

### For a release:
1. ✅ All above criteria met
2. ✅ Narf tests reviewed (failures analyzed, not ignored)
3. ✅ Report committed to repository

## Troubleshooting

### "Dev server not starting"
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill the process or use a different port
# Update baseURL in pinky/pinky.config.ts
```

### "Tests timing out"
```bash
# Increase timeout in pinky.config.ts
timeout: 120000  # 2 minutes

# Or run specific test with debug
npx playwright test pinky/tests/happy-path/01-auth.pinky.ts --debug
```

### "Screenshots not capturing"
```bash
# Ensure directory exists
mkdir -p pinky/results/screenshots

# Check for disk space issues
```

### "Flaky tests"
```bash
# Run specific test multiple times
npx playwright test <test-file> --repeat-each=5

# Check for race conditions:
# - Add explicit waits
# - Use more specific selectors
# - Check network request timing
```

### "Report generation fails"
```bash
# Ensure tests ran first
npm run cycle:pinky

# Check JSON output exists
cat pinky/results/pinky-results.json

# Run report with debug
node --inspect scripts/pinky-report.mjs
```

## Adding New Tests

### Happy Path Test

1. Create file: `pinky/tests/happy-path/XX-feature.pinky.ts`
2. Follow numbered naming convention
3. Use `PinkyScreenshot` helper
4. Capture screenshots at key steps

```typescript
import { test, expect } from '@playwright/test';
import { PinkyScreenshot } from '../../helpers/screenshot';
import { ActionLogger } from '../../helpers/action-logger';

test.describe('Happy Path: Feature', () => {
  let screenshot: PinkyScreenshot;
  let logger: ActionLogger;

  test.beforeEach(async ({ page }) => {
    screenshot = new PinkyScreenshot(page, 'feature');
    logger = new ActionLogger('feature');
  });

  test('user can do something', async ({ page }) => {
    await page.goto('/some-page');
    await screenshot.capture('01-initial');

    await logger.action('Click button', async () => {
      await page.click('button');
    });

    await screenshot.capture('02-after-click');
    logger.summary();
  });
});
```

### Narf (Chaos) Test

1. Create file: `pinky/tests/narf/type-chaos.pinky.ts`
2. Use chaos inputs from fixtures
3. Test edge cases aggressively

```typescript
import { test, expect } from '@playwright/test';
import { CHAOS_INPUTS } from '../../fixtures/chaos-inputs';

test.describe('Narf: Input Chaos', () => {
  test('handles XSS attempt', async ({ page }) => {
    await page.goto('/form');
    await page.fill('input', CHAOS_INPUTS.security[0].value);

    // Should not execute script
    await expect(page.locator('body')).toBeVisible();
  });
});
```

## CI/CD Integration

For GitHub Actions:

```yaml
jobs:
  cycle:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run Brain
        run: npm run cycle:brain

      - name: Run Pinky
        run: npm run cycle:pinky

      - name: Generate Report
        run: npm run cycle:report

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: pinky-report
          path: |
            pinky/PINKY_REPORT.md
            pinky/html-report/
            pinky/results/screenshots/
```

---

*"Are you pondering what I'm pondering, Pinky?"*
*"I think so, Brain, but if we run the tests, where will we put the screenshots?"*
