# Next Session - Deployment

> **Last Updated:** 2025-01-26
> **Branch:** `feat/fully-baked-press` (default)
> **Status:** Nassau + Real Handicaps complete, ready for deployment

## Session Goals

1. **Deploy to Vercel** - Production deployment
2. **E3.1 Alligator Teeth** - Full ledger with transaction history
3. **E4.1 Event Feed** - Social posts and comments

## What's Complete

### Core Features
- E1.1 Authentication (Supabase Auth)
- E1.2 Event Management (CRUD)
- E1.3 Scoring (mobile scorecard, realtime sync)
- E2.1 Match Play (hole-by-hole tracking)
- **E2.2 Nassau** - Front 9 / Back 9 / Overall (3 bets)
- E2.4 Presses (basic press working)
- **Real Handicap System** - Database lookups, course handicap calculation
- Dark theme support
- Demo mode (works with Supabase configured)

### Games System
- Game creation modal (type, stake, players)
- Redesigned GameCard with match status borders
- GamesList with Active/Recent sections
- Press creation flow with 1x-4x multipliers
- **Game Detail Page** with full scorecard
- **Nassau 3-box settlement display**

### Scorecard Features (Augusta Theme)
- **Augusta Green & Gold theme** - Premium golf aesthetic
  - Player A: Emerald (forest green)
  - Player B: Amber (gold)
  - Emerald/amber status colors based on who leads
  - Golden circle winner highlights
  - Emerald section headers, amber press rows
- **Handicap stroke dots** (pops) on relevant holes
- **Gross/net score display** (e.g., "5/4")
- **Player handicaps** shown next to names (from database)
- **Yardage row** in scorecard header
- **Match Stats box** with status, holes won, summary
  - **Nassau: Front 9 / Back 9 / Overall status**
- Press rows for child games
- Full light/dark mode support

### Handicap System
- `HandicapProfile` - User's handicap index + GHIN number
- `HandicapSnapshot` - Frozen handicap for event duration
- `calculateCourseHandicap()` - Index × (Slope / 113)
- Database tables: `handicap_profiles`, `handicap_snapshots`
- Service layer with mock data support

## Immediate Next Tasks

### 1. Deploy to Vercel
Production deployment checklist:
- [ ] Configure environment variables
- [ ] Set up Supabase production project
- [ ] Enable RLS policies
- [ ] Test authentication flow
- [ ] Configure custom domain (optional)

### 2. E3.1 Alligator Teeth Ledger
Full teeth tracking system:
- Ledger entries with transaction history
- Balance display per user per event
- Settlement entries create ledger entries
- Event-level settlement summary

### 3. E4.1 Event Feed
Social features:
- Posts and comments
- System-generated game updates
- Media attachments via R2

## Key Files

| File | Purpose |
|------|---------|
| `src/components/games/GameScorecard.tsx` | Scorecard with handicap dots, Nassau stats |
| `src/components/games/SettleGameModal.tsx` | 3-box Nassau settlement display |
| `src/lib/domain/settlement/computeSettlement.ts` | Nassau + Match Play settlement |
| `src/lib/services/handicaps.ts` | Handicap profile/snapshot service |
| `src/types/index.ts` | HandicapProfile, HandicapSnapshot types |
| `src/app/event/[eventId]/games/[gameId]/page.tsx` | Game detail with real handicaps |

## Technical Notes

### Nassau Settlement
```typescript
// 3 separate bets computed
const nassauSettlement = computeNassauSettlement(game, playerAId, playerBId, ...);
// Returns: { front9, back9, overall } - each can be null (tied)
```

### Course Handicap Calculation
```typescript
// Formula: Handicap Index × (Slope / 113)
const courseHandicap = Math.round(handicapIndex * (slope / 113));
```

### Handicap Snapshots (Demo Mode)
- user-1: 12.4 index → 14 course handicap (slope 131)
- user-2: 8.2 index → 10 course handicap
- user-3: 15.8 index → 18 course handicap
- user-4: 5.1 index → 6 course handicap

## Backlog Features

Priority order:
1. **Deploy to Vercel** - Production deployment
2. **Player Profile Setup** - Full player onboarding when adding to game
   - Required: Name, email (for auth linking)
   - Handicap: GHIN number (optional), handicap index
   - Optional: Phone number, profile photo
   - Auto-create handicap profile when player is added
   - Link to existing user account if email matches
   - Consider: nickname/display name, home course, tee preference
3. **E3.1 Alligator Teeth** - Full ledger with transaction history
4. **E4.1 Event Feed** - Social posts and comments
5. **Automatic Presses** - Auto-press at 2-down rule
6. **Tags System** - Game/event tagging for AI synopses
7. **E2.3 Skins** - Skins game type

## Quick Start Commands

```bash
# Start dev server
npm run dev

# Clear cache if issues
rm -rf .next && npm run dev

# Run tests
npm test
```
