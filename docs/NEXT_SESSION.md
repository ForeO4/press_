# Next Session - Production Testing

> **Last Updated:** 2026-01-27
> **Branch:** `main`
> **Status:** Database schema applied, all bug fixes complete, ready for full MVP testing

## Session Status

- Database schema applied to Supabase (31 tables, all RLS policies)
- Bug fixes completed:
  - Fix 1: `threads_insert` RLS policy added (unblocks event creation)
  - Fix 2: Manual course input fallback (when course API fails)
  - Fix 3: Sign-in button visibility in mock mode
- Build verified passing
- Ready for production testing

## Testing Verification Steps

Before proceeding, verify these critical fixes work:

1. **Sign-in button** visible on landing page (or "Select user" prompt in mock mode)
2. **Event creation** works (via RPC with `threads_insert` policy)
3. **Course selection** - can enter course manually if API fails
4. **Invite button** accessible in event admin

## Testing Documentation

- `docs/MVP_QUICK_TEST.md` - Quick checklist for fast verification
- `docs/MVP_TESTING_CHECKLIST.md` - Full detailed checklist

## Session Goals

1. **Production Testing** - Verify all MVP features work
2. **E3.1 Gator Bucks** - Full ledger with transaction history
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
  - **Nassau: Front 9 / Back 9 / Overall status with gross scores**
- Press rows for child games
- Full light/dark mode support

### Score Entry UX
- Number pad with clear flow
- **"Enter → [Next Player]"** button shows progression
- **"Save & Next Hole"** on last player
- Auto-advance through players

### Handicap System
- `HandicapProfile` - User's handicap index + GHIN number
- `HandicapSnapshot` - Frozen handicap for event duration
- `calculateCourseHandicap()` - Index × (Slope / 113)
- Database tables: `handicap_profiles`, `handicap_snapshots`
- Service layer with mock data support

## Immediate Next Tasks

### 1. Production Testing
Run through testing checklists to verify MVP features:
- [ ] Complete `docs/MVP_QUICK_TEST.md` checklist
- [ ] Verify sign-in, event creation, and invite flows
- [ ] Test on mobile device
- [ ] Document any issues found

### 2. E3.1 Gator Bucks Ledger
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

## Backlog Items from Testing

UX improvements identified during MVP testing:

1. **Game types: radio buttons instead of checkboxes** - Single selection
2. **Gator Bucks input: fix can't delete to 0** - Input validation issue
3. **Rename "Allowed Game Types" to "Games"** - Simpler label
4. **Rename "Auto press" to "Game Settings"** - Clearer naming
5. **Add "Edit" button on review screen** - Allow going back to edit
6. ~~**Course API integration**~~ - Manual input fallback now available

## Backlog Features

Priority order:
1. **Course API Integration** - Real course data (high priority)
2. **Player Profile Setup** - Full player onboarding when adding to game
   - Required: Name, email (for auth linking)
   - Handicap: GHIN number (optional), handicap index
   - Optional: Phone number, profile photo
   - Auto-create handicap profile when player is added
   - Link to existing user account if email matches
   - Consider: nickname/display name, home course, tee preference
3. **Team/Group Names** - Community/group management
   - Team names for Nassau (e.g., "Team Mike" vs "Team Alex")
   - Community/group concept (a group of regular players)
   - Group settings: who can manage, invite players, set defaults
   - Display team names instead of player names in shared views
   - Consider: group handicap calculations, recurring events
4. **E3.1 Gator Bucks** - Full ledger with transaction history
5. **E4.1 Event Feed** - Social posts and comments
6. **Automatic Presses** - Auto-press at 2-down rule
7. **Tags System** - Game/event tagging for AI synopses
8. **E2.3 Skins** - Skins game type

## Quick Start Commands

```bash
# Start dev server
npm run dev

# Clear cache if issues
rm -rf .next && npm run dev

# Run tests
npm test
```
