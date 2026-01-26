# Next Session - Deploy & Add Games

> **Last Updated:** 2025-01-26
> **Branch:** `feat/fully-baked-press` (default)
> **Status:** Ready for deployment

## Session Goals

1. **Deploy to Vercel** - Set up and deploy production
2. **Add Games** - Start E2.1 Match Play

## Deployment Steps

1. Run `vercel` CLI or link repo in Vercel dashboard
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy and verify demo at `/event/demo-event/scorecard`

## What's Complete

- E1.1 Authentication (Supabase Auth)
- E1.2 Event Management (CRUD)
- E1.3 Scoring (mobile scorecard, realtime sync)
- Dark theme support
- Demo mode (works with Supabase configured)

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
