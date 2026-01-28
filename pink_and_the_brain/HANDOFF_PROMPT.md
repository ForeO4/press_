# Next Session Handoff Prompt

Copy and paste this at the start of your next Claude Code session:

---

## Context: Pinky & Brain Testing Cycle Complete

The Press! golf app now has a complete automated testing infrastructure called **Pinky & Brain**.

### What Was Completed

1. **Test Infrastructure** (`pinky/`)
   - Playwright-based E2E test suite
   - Screenshot capture at every step
   - Chaos testing fixtures for security/edge cases

2. **Test Commands**
   ```bash
   npm run cycle:brain   # Lint + types + unit tests
   npm run cycle:pinky   # E2E tests with screenshots
   npm run cycle:report  # Generate markdown report
   npm run cycle:full    # All phases
   ```

3. **Tests Created**
   - 8 happy path tests (auth, event, game, scoring, settlement)
   - 3 narf chaos tests (input, timing, navigation)

4. **Documentation Updated**
   - `CYCLE_CONTRACT.md` - Full workflow reference
   - `pinky/README.md` - Quick start guide
   - `docs/09-dev/conventions.md` - Testing conventions
   - `docs/CONTRIBUTING.md` - PR checklist
   - `docs/09-dev/local-setup.md` - Setup instructions

### What's Ready to Run

```bash
# First, install Playwright browsers
npx playwright install

# Then run the full cycle
npm run cycle:full
```

### What to Do Next

1. **Run the full cycle** and review output:
   ```bash
   npm run cycle:full
   ```

2. **Fix any failures**:
   - Brain failures: Fix lint/type/unit test errors
   - Happy path failures: Critical - these must pass
   - Narf failures: Expected - document and triage

3. **Review the report**:
   - Check `pinky/PINKY_REPORT.md` for summary
   - Open `pinky/html-report/index.html` for details

4. **Commit the working state** once all happy paths pass

### Key Files

| File | Purpose |
|------|---------|
| `CYCLE_CONTRACT.md` | Complete workflow documentation |
| `pinky/pinky.config.ts` | Playwright configuration |
| `pinky/tests/happy-path/` | Core user flow tests |
| `pinky/tests/narf/` | Chaos/edge case tests |
| `scripts/pinky-report.mjs` | Report generator |

---

*End of handoff prompt*
