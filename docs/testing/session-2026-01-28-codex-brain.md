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
PINKY_TEST_EMAIL=tartarusveil@gmail.com
PINKY_TEST_PASSWORD=0P769Pinky123$

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

## Next Steps

1. Run `npm run cycle:pinky` against production
2. Review results with `npm run cycle:brain:codex:quick`
3. Fix timeout issues (likely auth flow timing)
4. Iterate until green

---

*"The same thing we do every night, Pinky..."*
