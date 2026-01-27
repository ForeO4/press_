# Next Session - MVP Testing

> **Last Updated:** 2026-01-27
> **Branch:** `main`
> **Status:** Ready for MVP testing - improved templates committed

## What Was Done This Session

1. **Improved MVP Testing Template** (`docs/testing/MVP_QUICK_TEST.md`)
   - Added Test Info table (Test Run ID, Build/Commit, Environment, Browser)
   - Added Test Flow diagram showing dependencies
   - Added "Requires:" prerequisites to each step
   - Added Summary table with Status and Blocked By columns
   - Added severity levels to Issues table
   - Added Console Errors and Sign-Off sections
   - Removed `_______________` blanks, replaced with clean tables

2. **Added Press Rules Documentation** (`docs/press-rules/`)
   - Domain model, handicap engine, contest schema
   - Results posting contract, MVP contests, test vectors

3. **Added Comprehensive Testing Checklist** (`docs/MVP_TEST_WORD.md`)
   - 12-section full manual testing guide
   - Copy to Word for screenshot-friendly testing

## Testing Quick Start

1. Open `docs/testing/mvp-test-2026-01-27.md`
2. Copy content to Word, save as `.docx`
3. Test at https://press-4qf0.onrender.com/
4. Fill checkboxes, paste screenshots, note issues

### How to Fill In Template

| Element | How to Mark |
|---------|-------------|
| Checkboxes | `[x]` = done, `[ ]` = not done |
| Pass/Fail | `[x] Pass  [ ] Fail` |
| Status | `Pass` / `Fail` / `Blocked` |
| Issues | Description + Severity + Repro Steps |
| Console | Paste red errors from F12 → Console |

## Test Flow (Dependencies)

```
1. Sign In ──→ 2. Create Event ──→ 3. Invite Player
                        │
                        └──→ 4. Create Game ──→ 5. Enter Scores
```

If Step 1 fails, mark Steps 2-5 as **Blocked**.

## Critical Fixes to Verify

| Fix | What to Test |
|-----|--------------|
| Sign-in prompt | "Select a user" visible in mock mode |
| RLS policy | Event creation completes (no silent fail) |
| Manual course | "Enter course manually" link works |

## After Testing

### If ALL PASS
- Push commits to origin
- Move to E3.1 Gator Bucks or E4.1 Event Feed

### If Issues Found
- Document in Issues table with severity
- Blockers = fix before continuing
- High/Medium/Low = add to backlog

## Next Features (Priority Order)

1. **E3.1 Gator Bucks** - Full ledger with transaction history
2. **E4.1 Event Feed** - Social posts and comments
3. **Course API Integration** - Real course data
4. **Player Profile Setup** - Full onboarding with handicap
5. **Automatic Presses** - Auto-press at 2-down rule

## Key Files

| File | Purpose |
|------|---------|
| `docs/testing/MVP_QUICK_TEST.md` | Quick test template |
| `docs/testing/mvp-test-2026-01-27.md` | Today's test file |
| `docs/MVP_TEST_WORD.md` | Full 12-section checklist |
| `docs/press-rules/` | Game rules documentation |

## Quick Commands

```bash
# Start dev server
npm run dev

# Clear cache if issues
rm -rf .next && npm run dev

# Check git status
git status

# Push when ready
git push origin main
```

## Commits Ready to Push

```
dc28f6e docs: Add comprehensive testing templates and press rules documentation
7e4d292 docs: Improve MVP testing template with trackability and dependencies
```

Run `git push origin main` after testing passes.
