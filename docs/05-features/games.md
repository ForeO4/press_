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

1. Select game type
2. Enter stake (in Alligator Teeth)
3. Select participants
4. Optionally set start/end holes (default 1-18)

```typescript
interface CreateGameInput {
  eventId: string;
  type: GameType;
  stake: number;
  participantIds: string[];
  startHole?: number;
  endHole?: number;
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

Shows all games for event:
- Game type and stake
- Participants
- Current status
- Nested presses indented

### Game Card

Individual game display:
- Type badge (Match/Nassau/Skins)
- Stake in Teeth
- Hole range
- Current standing
- Press button (if allowed)

### Create Game Modal

Form for new game:
- Type selector
- Stake input
- Participant selector
- Hole range (optional)

## Settlement Integration

Games feed into settlement:
1. Scores determine winners
2. Stakes determine amounts
3. Settlement shows who owes who
4. All in Alligator Teeth
