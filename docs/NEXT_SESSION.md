# Next Session - Deployment & Nassau

> **Last Updated:** 2025-01-26
> **Branch:** `feat/fully-baked-press` (default)
> **Status:** Augusta theme complete, documentation updated, ready for deployment

## Session Goals

1. **Deploy to Vercel** - Production deployment
2. **E2.2 Nassau** - Implement Nassau game type
3. **Real Handicap System** - Replace mock handicaps with user data

## What's Complete

### Core Features
- E1.1 Authentication (Supabase Auth)
- E1.2 Event Management (CRUD)
- E1.3 Scoring (mobile scorecard, realtime sync)
- E2.1 Match Play (hole-by-hole tracking)
- E2.4 Presses (basic press working)
- Dark theme support
- Demo mode (works with Supabase configured)

### Games System
- Game creation modal (type, stake, players)
- Redesigned GameCard with match status borders
- GamesList with Active/Recent sections
- Press creation flow with 1x-4x multipliers
- **Game Detail Page** with full scorecard

### Scorecard Features (Augusta Theme)
- **Augusta Green & Gold theme** - Premium golf aesthetic
  - Player A: Emerald (forest green)
  - Player B: Amber (gold)
  - Emerald/amber status colors based on who leads
  - Golden circle winner highlights
  - Emerald section headers, amber press rows
- **Handicap stroke dots** (pops) on relevant holes
- **Gross/net score display** (e.g., "5/4")
- **Player handicaps** shown next to names
- **Yardage row** in scorecard header
- **Match Stats box** with status, holes won, summary
- Press rows for child games
- Full light/dark mode support

## Immediate Next Tasks

### 1. Deploy to Vercel
Production deployment checklist:
- [ ] Configure environment variables
- [ ] Set up Supabase production project
- [ ] Enable RLS policies
- [ ] Test authentication flow
- [ ] Configure custom domain (optional)

### 2. E2.2 Nassau Game Type
Nassau = 3 match play bets in one:
- Front 9 (holes 1-9)
- Back 9 (holes 10-18)
- Overall 18

**Implementation needs:**
- Settlement calculation for Nassau (3 separate results)
- UI to show front/back/overall status in stats box
- End Game modal update for Nassau (3 settlements)

### 3. Real Handicap System
Replace mock handicaps with real data:
- Add handicap field to user profiles
- Add course handicap to game participants
- Calculate playing handicap based on tee/course rating

## Key Files

| File | Purpose |
|------|---------|
| `src/components/games/GameScorecard.tsx` | Scorecard with handicap dots, yardage, stats |
| `src/components/games/PressButton.tsx` | Flame + "Press!" button |
| `src/components/games/ScoreEntry.tsx` | Score entry with stroke indicator |
| `src/components/scorecard/ScoreEditorSheet.tsx` | Width-constrained score editor |
| `src/app/event/[eventId]/games/[gameId]/page.tsx` | Game detail page |
| `src/lib/domain/settlement/computeSettlement.ts` | Settlement calculation |

## Technical Notes

### Handicap Stroke Calculation
```typescript
const handicapDiff = Math.abs(playerAHandicap - playerBHandicap);
const playerAGetsStrokes = playerAHandicap > playerBHandicap;
// Player gets stroke on hole if: holeHandicap <= handicapDiff
```

### Mock Handicaps (Demo)
- Player A: 12 handicap
- Player B: 8 handicap
- Difference: 4 strokes on holes with handicap 1-4

## Backlog Features

Priority order:
1. **Deploy to Vercel** - Production deployment
2. **E2.2 Nassau** - Front/back/total bets (3 settlements per game)
3. **Real Handicaps** - User profile handicaps
4. **E3.1 Alligator Teeth** - Full ledger with transaction history
5. **E4.1 Event Feed** - Social posts and comments
6. **Automatic Presses** - Auto-press at 2-down rule
7. **Tags System** - Game/event tagging for AI synopses

## Quick Start Commands

```bash
# Start dev server
npm run dev

# Clear cache if issues
rm -rf .next && npm run dev

# Run tests
npm test
```
