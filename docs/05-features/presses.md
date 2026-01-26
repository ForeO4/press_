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
3. `stake` must be a non-negative integer (0 allowed for friendly games)
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

### Press Button (Game Detail Page)

On game detail page, bold, animated `PressButton` component when:
- Game is active
- Current hole < end hole
- User has permission

**Features (Bold & Exciting Design):**
- Amber/gold gradient theme (from-amber-500 via-orange-500 to-red-500)
- Flame icon with "PRESS!" label
- Animated sparkle effects when expanded
- Pulsing glow animation when selecting multiplier
- 1x, 2x, 3x, 4x multiplier selection
- Shows calculated teeth amount for each option
- Scale animation on confirm
- This is the "drama moment" of the game!

**Note:** Press button removed from games list. Press is only available from game detail page.

### Press Creation Flow

1. Tap PRESS! button on game detail page
2. Select multiplier (1x/2x/3x/4x)
3. See calculated stake (base × multiplier)
4. Confirm to create press

### Press Display

Presses shown as `GameTrackingRow` components:

```
MATCH PLAY                      Blake +2
1   2   3   4   5   6   7   8   9
-  +1  +1   -  +1   -   _   _   _

PRESS (H10)                     All Square
10  11  12  13  14  15  16  17  18
 -   -   _   _   _   _   _   _   _
```

**Display format:**
- "-" for ties (not "=")
- Cumulative status ("+2", "All Square")
- Tap row to toggle per-hole breakdown
- Purple styling for press rows

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
  if (input.stake < 0) {
    return { valid: false, error: 'Stake cannot be negative' };
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
