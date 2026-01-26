# Next Session - Settlement Flow

> **Last Updated:** 2025-01-26
> **Branch:** `feat/fully-baked-press` (default)
> **Status:** Game detail page complete, settlement modal next

## Session Goals

1. **Implement Settlement Modal** - Game settlement flow with teeth calculation
2. **Score Editing** - Enable score editing from game detail page

## What's Complete

### Core Features
- E1.1 Authentication (Supabase Auth)
- E1.2 Event Management (CRUD)
- E1.3 Scoring (mobile scorecard, realtime sync)
- Dark theme support
- Demo mode (works with Supabase configured)

### Design System
- Premium dark theme with glassmorphism
- Bottom navigation (Home, Scores, Games, Social)
- UI components (PlayerAvatar, StatusPill, MatchProgress)

### Games System
- Game creation modal (type, stake, players)
- Redesigned GameCard with match status borders
- GamesList with Active/Completed sections
- Press creation flow
- **Game Detail Page** (NEW)
  - `/event/[eventId]/games/[gameId]` route
  - GameDetailHeader with player info and match status
  - GameScorecard with hole-by-hole scores
  - HoleResultRow showing winner indicators
  - Press and Settle action buttons (Settle is placeholder)

## Immediate Next Tasks

### 1. Settlement Modal (`SettleGameModal.tsx`)

Create modal that appears when clicking "Settle Game" on game detail page:

```
┌────────────────────────────────────────┐
│ Settle Game                        [X] │
├────────────────────────────────────────┤
│                                        │
│  Final Result                          │
│  Alex is 3 UP with 2 to play           │
│  (Match is dormie)                     │
│                                        │
│  Settlement                            │
│  ┌────────────────────────────────────┐│
│  │ Blake owes Alex                    ││
│  │        🦷 30                        ││
│  │ (10 teeth × 3 holes up)            ││
│  └────────────────────────────────────┘│
│                                        │
│  [Cancel]           [Confirm Settlement]│
└────────────────────────────────────────┘
```

**Implementation:**
- Use existing `computeMatchPlaySettlement` from `computeSettlement.ts`
- Show final match result and calculation breakdown
- Update game status to 'complete' on confirm
- Eventually: Create teeth ledger entries

### 2. Score Editing from Game Detail

Allow players to tap scores in GameScorecard to edit:
- Reuse existing `ScoreEditorSheet` component
- Wire up score cell clicks to open editor
- Update scores service and refresh scorecard

## Key Files

| File | Purpose |
|------|---------|
| `src/app/event/[eventId]/games/[gameId]/page.tsx` | Game detail page |
| `src/components/games/GameDetailHeader.tsx` | Detail page header |
| `src/components/games/GameScorecard.tsx` | Mini 2-player scorecard |
| `src/components/games/HoleResultRow.tsx` | Winner indicators |
| `src/lib/domain/settlement/computeSettlement.ts` | Settlement calculation |
| `src/lib/services/games.ts` | Game CRUD + status updates |

## Settlement Calculation Reference

Already implemented in `computeSettlement.ts`:

```typescript
// Match Play: stake × holes up
computeMatchPlaySettlement(game, playerAId, playerBId, scoresA, scoresB)
// Returns: { payerId, payeeId, amountInt, ... }
```

Future settlement types (not yet implemented):
- **Nassau**: 3 separate bets (front, back, overall)
- **Skins**: Each hole won = stake, carryover on ties

## Future Features (Priority Order)

1. **E2.2 Nassau** - Front/back/total bets
2. **E2.4 Presses** - Multiple presses per game
3. **E3.1 Alligator Teeth** - Full ledger system
4. **Tags System** - Game/event tagging for AI-generated synopses
5. **Deploy to Vercel** - Production deployment
