# Next Session - Deployment & Nassau

> **Last Updated:** 2025-01-26
> **Branch:** `feat/fully-baked-press` (default)
> **Status:** Core game features complete, ready for deployment

## Session Goals

1. **Deploy to Vercel** - Production deployment
2. **E2.2 Nassau** - Implement Nassau game type

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
- **Game Detail Page**
  - `/event/[eventId]/games/[gameId]` route
  - GameDetailHeader with player info and match status
  - GameScorecard with hole-by-hole scores + inline editing
  - HoleResultRow showing winner indicators
  - Press and End Match action buttons
- **End Match Modal** - Settlement flow with teeth calculation
- **Inline Score Editing** - Tap cells in GameScorecard to edit scores
- **Scalable IDs** - Uses `crypto.randomUUID()` in mock mode

## Immediate Next Tasks

### 1. Deploy to Vercel

Production deployment checklist:
- Configure environment variables
- Set up Supabase production project
- Enable RLS policies
- Configure custom domain (optional)

### 2. E2.2 Nassau Game Type

Nassau = 3 match play bets in one:
- Front 9 (holes 1-9)
- Back 9 (holes 10-18)
- Overall 18

**Implementation needs:**
- Settlement calculation for Nassau (3 separate results)
- UI to show front/back/overall status
- End Match modal update for Nassau

## Key Files

| File | Purpose |
|------|---------|
| `src/app/event/[eventId]/games/[gameId]/page.tsx` | Game detail page |
| `src/components/games/GameScorecard.tsx` | Mini scorecard with inline editing |
| `src/components/games/SettleGameModal.tsx` | End Match modal |
| `src/lib/domain/settlement/computeSettlement.ts` | Settlement calculation |
| `src/lib/services/games.ts` | Game CRUD + status updates |
| `src/lib/services/events.ts` | Event CRUD |
| `src/lib/services/courses.ts` | Course/tee data |

## Future Features (Priority Order)

1. **Deploy to Vercel** - Production deployment
2. **E2.2 Nassau** - Front/back/total bets
3. **E2.4 Presses** - Multiple presses per game
4. **E3.1 Alligator Teeth** - Full ledger system
5. **Tags System** - Game/event tagging for AI-generated synopses
