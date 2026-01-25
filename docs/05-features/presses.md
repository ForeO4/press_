# Presses

## Overview

A **press** is a new side bet that starts during an existing game. It's a key feature of golf betting, allowing players who are losing to "press" and create a new opportunity.

## Terminology

| Term | Definition |
|------|------------|
| **Press** | A new game that starts mid-round |
| **Parent Game** | The original game being pressed |
| **Press Hole** | The hole where the press starts |
| **Press Stake** | The stake for the new bet (in Alligator Teeth) |

## How Presses Work

1. Player is losing in a match (typically 2-down or more)
2. Player "presses" to start a new game
3. New game starts from next hole
4. New game ends when parent game ends
5. Both games settle independently

### Example

```
Original Match: Holes 1-18, Stake 10 Teeth
- After hole 9: Alex is 3-down to Blake

Press #1: Holes 10-18, Stake 10 Teeth
- After hole 13: Alex is 2-down in press

Press #2: Holes 14-18, Stake 10 Teeth
- Final: Alex wins Press #2 by 1
```

**Settlement:**
- Original: Blake wins +3 = 30 Teeth
- Press #1: Blake wins +1 = 10 Teeth
- Press #2: Alex wins +1 = 10 Teeth
- Net: Alex pays Blake 30 Teeth

## Data Model

Presses are games with `parent_game_id` set:

```typescript
interface Game {
  id: string;
  eventId: string;
  type: 'match_play' | 'nassau' | 'skins';
  stakeTeethInt: number;
  parentGameId: string | null;  // Set for presses
  startHole: number;            // Where press begins
  endHole: number;              // Inherited from parent
  status: 'active' | 'complete';
}
```

### Press Creation Input

```typescript
interface CreatePressInput {
  parentGameId: string;
  startHole: number;
  stake: number;  // Alligator Teeth (integer)
}
```

## Press Rules

### Validation

1. `startHole` must be > current completed hole
2. `startHole` must be <= parent's `endHole`
3. `stake` must be positive integer
4. Event must not be locked
5. User must have permission (player in game + settings allow)

### Press Stake

Common patterns:
- **Same stake**: Press matches parent
- **Auto-double**: Each press doubles
- **Custom**: Any integer stake

Event settings can configure defaults.

## Permission Rules

| Setting | Who Can Press |
|---------|--------------|
| `allow_self_press = true` | Game participants |
| `allow_self_press = false` | Admins only |

## UI Flow

### Press Button

On game card, shows "Press" button when:
- Game is active
- Current hole < end hole
- User has permission

### Press Modal

1. Shows parent game info
2. Confirms start hole (current + 1)
3. Shows stake (defaults to parent stake)
4. Allows stake adjustment
5. Confirm creates press

### Press Display

Presses shown nested under parent:

```
Match Play vs Blake (10 Teeth)
Holes 1-18 | 3 down
├── Press (10 Teeth)
│   Holes 10-18 | 1 down
└── Press (10 Teeth)
    Holes 14-18 | 1 up
```

## Domain Logic

```typescript
// src/lib/domain/games/createPress.ts

interface CreatePressInput {
  parentGameId: string;
  startHole: number;
  stake: number;
}

interface CreatePressResult {
  id: string;
  parentGameId: string;
  startHole: number;
  endHole: number;
  stake: number;
}

function validatePress(
  input: CreatePressInput,
  parentGame: Game,
  currentHole: number
): { valid: boolean; error?: string } {
  if (input.stake <= 0) {
    return { valid: false, error: 'Stake must be positive' };
  }

  if (!Number.isInteger(input.stake)) {
    return { valid: false, error: 'Stake must be an integer' };
  }

  if (input.startHole <= currentHole) {
    return { valid: false, error: 'Press must start after current hole' };
  }

  if (input.startHole > parentGame.endHole) {
    return { valid: false, error: 'Press cannot start after parent ends' };
  }

  return { valid: true };
}

function createPress(
  input: CreatePressInput,
  parentGame: Game
): CreatePressResult {
  return {
    id: generateId(),
    parentGameId: input.parentGameId,
    startHole: input.startHole,
    endHole: parentGame.endHole, // Inherit from parent
    stake: input.stake,
  };
}
```

## System Posts

When a press is created, system posts to event feed:

> "Casey pressed the match with Blake starting hole 10 (10 Teeth)"

## Settlement

Each press settles independently:
- Calculated based on its hole range
- Uses its own stake
- Added to total settlement
