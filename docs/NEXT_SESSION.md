# Next Session - Deployment & Features

> **Last Updated:** 2025-01-26
> **Branch:** `feat/fully-baked-press`
> **Status:** Ready for PR

## Session Goals

1. **Create PR** - Merge `feat/fully-baked-press` to main
2. **Deploy** - Push to production (Vercel)
3. **Add Games** - E2.x Match Play, Nassau, Presses

## What's Ready

- E1.1 Authentication (Supabase Auth)
- E1.2 Event Management (CRUD)
- E1.3 Scoring (mobile scorecard, demo mode)
- Dark theme support
- Demo mode works with Supabase configured

## Recent Commits

- `0d77a46` - fix: Enable demo mode to work alongside Supabase
- `bd29e2c` - chore: Remove debug console.log statements
- `5d22eb3` - docs: Add scorecard store, services documentation
- `f021d7f` - feat: Wire scorecard tee sets to store
- `87de312` - feat: Implement scorecard components

## PR Checklist

- [ ] Run `npm run build` - verify no errors
- [ ] Run `npm run lint` - verify no warnings
- [ ] Test demo scorecard at `/event/demo-event/scorecard`
- [ ] Create PR with description
- [ ] Merge and deploy

## Next Features (Priority Order)

1. **E2.1 Match Play** - Head-to-head hole tracking
2. **E2.2 Nassau** - Front/back/total bets
3. **E2.4 Presses** - Mid-round press creation
4. **E3.1 Alligator Teeth** - Currency ledger

## Key Files

| File | Purpose |
|------|---------|
| `src/stores/scorecardStore.ts` | Scorecard state + persistence |
| `src/lib/services/scores.ts` | Score CRUD service |
| `src/lib/services/courses.ts` | Course/tee data |
| `src/components/scorecard/` | Scorecard UI components |

## Quick Links

- [Session Log](./SESSION_LOG.md) - Recent session history
- [Tech Debt](./TECH_DEBT.md) - Known issues to address
- [AI Context](./AI_CONTEXT.md) - Project overview for Claude
- [Epics](./08-backlog/epics.md) - Feature backlog
