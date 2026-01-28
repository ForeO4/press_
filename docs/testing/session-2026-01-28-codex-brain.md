# Testing Session - January 28, 2026
## Codex Brain Integration & Production Testing

---

## What's New

### Codex Brain Integration
OpenAI-powered test analysis to save ~85% on Opus tokens:
- Analyzes test failures automatically
- Reads screenshots for visual context
- Identifies failure patterns
- Suggests fixes as diffs

**Files added:**
- `pinky/codex/` - Analysis modules
- `pinky/scripts/codex-brain.ts` - CLI script

---

## Quick Start

### 1. Run Tests Against Production
```bash
npm run cycle:pinky
```
Tests now target: `https://press-4qf0.onrender.com`

### 2. Quick Analysis (No API)
```bash
npm run cycle:brain:codex:quick
```
Shows pass/fail counts and error patterns without using OpenAI.

### 3. Full Codex Analysis
```bash
npm run cycle:brain:codex
```
Requires `OPENAI_API_KEY` in `.env.local` with billing credits.
Generates: `pinky/results/brain-report.md`

---

## Environment Setup

### .env.local (already configured)
```
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Test credentials (required for Pinky)
PINKY_TEST_EMAIL=<your-test-email>
PINKY_TEST_PASSWORD=<your-test-password>

# Codex Brain (needs billing credits)
OPENAI_API_KEY=sk-...
```

### Render (production) - NO test keys needed
Only Supabase credentials required on Render.

---

## Expected Test Results

Current state (from last run):
- **65 passed** / **81 failed**
- Primary failure pattern: **Timeout (80 tests)**
- Root cause: Login redirect timing issues

---

## Workflow

```
┌─────────────────────────────────────────────┐
│ 1. npm run cycle:pinky                      │
│    (Run Playwright tests against Render)    │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│ 2. npm run cycle:brain:codex:quick          │
│    (Quick analysis - see patterns)          │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│ 3. npm run cycle:brain:codex                │
│    (Full AI analysis if needed)             │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│ 4. Review pinky/results/brain-report.md     │
│    (Apply suggested fixes)                  │
└─────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `pinky/pinky.config.ts` | Playwright config (baseURL = Render) |
| `pinky/results/pinky-results.json` | Raw test results |
| `pinky/results/brain-report.md` | Codex analysis report |
| `pinky/html-report/` | Visual HTML report |

---

## Troubleshooting

### Tests timing out?
- Render may be cold-starting (first request slow)
- Run a quick manual check: visit https://press-4qf0.onrender.com
- Timeouts already increased for remote server

### Codex 429 error?
- OpenAI API key needs billing credits
- Use `--quick` mode for free pattern analysis

### Login failures?
- Verify test user exists in Supabase with confirmed email
- Check credentials in `.env.local`

---

## Fixes Applied

### Login Test - pressSequentially Fix (2026-01-28)

**Problem:** Test "user can log in with valid credentials" failed with "Invalid login credentials" even though credentials work manually.

**Root Cause:** The test used `page.fill()` which doesn't properly trigger React's `onChange` handlers on controlled inputs. React state remained empty when form submitted.

**Fix Applied:** Updated `pinky/tests/happy-path/01-auth.pinky.ts` lines 63-73 to use `pressSequentially`:

```typescript
// Before (broken)
await page.fill('input[type="email"]', TEST_USER.email);

// After (fixed)
const emailInput = page.locator('input[type="email"]');
await emailInput.clear();
await emailInput.pressSequentially(TEST_USER.email, { delay: 10 });
```

**Status:** Code fix verified working - form fields are now filled correctly (confirmed via error-context.md showing actual values in fields).

**Remaining Issue:** Supabase returns "Invalid login credentials" for the test user. This is a credential/environment issue, not a code issue. Verify:
1. Test user `tartarusveil@gmail.com` exists in **production** Supabase (not just local)
2. Password matches exactly: `0P769Pinky123$`
3. Email is confirmed in Supabase

---

## Next Steps

1. Verify test user exists in production Supabase with confirmed email
2. Run `npm run cycle:pinky` against production
3. Review results with `npm run cycle:brain:codex:quick`
4. Iterate until green

---

*"The same thing we do every night, Pinky..."*
