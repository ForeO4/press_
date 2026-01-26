# Games

## Overview

Press! supports multiple golf betting game types, all using Alligator Teeth as currency.

## Game Types

### Match Play

Hole-by-hole competition:
- Win hole: +1
- Lose hole: -1
- Tie: 0
- Final result: net holes won/lost

**Settlement:**
- Winner gets `stake * holes_up`
- Example: 3-up at stake of 5 Teeth = 15 Teeth

### Nassau

Three separate bets:
- **Front 9** (holes 1-9)
- **Back 9** (holes 10-18)
- **Overall 18**

Each bet is match play scored independently.

**Settlement:**
- Each of the 3 bets settles separately
- Example: Win front, lose back, win overall = net +1 bet won

### Skins

Per-hole competition:
- Lowest score wins the "skin"
- Ties carry over to next hole
- All skins distributed at end

**Settlement:**
- Each skin worth the stake
- Carried skins multiply value
- Example: Win 5 skins at 2 Teeth each = 10 Teeth

## Data Model

```typescript
interface Game {
  id: string;
  eventId: string;
  type: 'match_play' | 'nassau' | 'skins';
  stakeTeethInt: number;  // Alligator Teeth (integer)
  parentGameId: string | null; // null = root, set = press
  startHole: number;      // 1-18
  endHole: number;        // 1-18
  status: 'active' | 'complete';
  createdAt: string;
}

interface GameParticipant {
  id: string;
  gameId: string;
  userId: string;
  teamId: string | null;
}
```

## Game Creation

Admin creates games before or during round:

1. **Select contest types** - Multi-select checkboxes for Match Play, Nassau, Skins
2. **Toggle scoring basis** - Net (uses handicaps) or Gross per contest type
3. **Enter stake** - Text input allowing deletion and numeric-only input
4. **Select participants** - Dropdown with "Add New Player" button for inline player creation
5. **Set hole range** - Front 9, Back 9, Full 18 presets or custom range

```typescript
interface CreateGameInput {
  eventId: string;
  type: GameType;                    // Primary contest type
  contests: ContestConfig[];         // All enabled contests
  stake: number;
  participantIds: string[];
  startHole?: number;                // default 1
  endHole?: number;                  // default 18
  scoringBasis: 'net' | 'gross';     // Primary scoring basis
}

interface ContestConfig {
  type: GameType;
  enabled: boolean;
  scoringBasis: 'net' | 'gross';
}
```

## Game Status

| Status | Description |
|--------|-------------|
| `active` | Game in progress |
| `complete` | All holes played, settled |

## Game Hierarchy

Games can have child games (presses):

```
Match Play (1-18)
├── Press (10-18)
└── Press (14-18)
    └── Press (16-18)
```

See [presses.md](./presses.md) for details.

## UI Components

### Games List

Shows games organized by status:

**Active Games Section:**
- `ActiveGameCard` for each in-progress game
- Shows current hole, live match status
- "Continue" button to resume

**Recent Section (collapsible):**
- `RecentGameCard` for completed games (up to 3)
- Shows date, result, teeth won/lost
- "View All History" link

### ActiveGameCard

For in-progress games:
- Green pulsing live indicator
- Current hole number (e.g., "Hole 7 of 18")
- Player names with avatars
- Match status (e.g., "Blake +2")
- "Continue" button

### RecentGameCard

Compact completed game display:
- Date and game type
- Player avatars
- Result in +X/-X format
- Teeth won/lost

### Create Game Modal

Enhanced form:
- **Contest types** - Multi-select checkboxes (Match Play, Nassau, Skins)
- **Net/Gross toggle** - Per contest type
- **Stake input** - Text input with numeric validation
- **Player selection** - Dropdowns with "+" button to add new players inline
- **Hole presets** - Front 9, Back 9, Full 18, or custom range

## Settlement Integration

Games feed into settlement:
1. Scores determine winners
2. Stakes determine amounts
3. Settlement shows who owes who
4. All in Alligator Teeth
