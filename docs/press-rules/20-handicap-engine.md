# Press! Rules Engine - Handicap Engine

## Overview

The handicap engine allocates strokes per hole based on course handicap and stroke index.

## Stroke Allocation

### Basic Allocation

Strokes are allocated to holes in stroke index order (1 = hardest hole):

```typescript
import { computeHandicapStrokes } from '@press/rules';

const strokeIndex = { 1: 7, 2: 15, 3: 3, /* ... */ };
const courseHandicap = 12;

const strokes = computeHandicapStrokes(strokeIndex, courseHandicap);
// Returns: { 1: 1, 2: 0, 3: 1, 4: 1, 5: 1, ... }
```

### Double Dots (Handicap > 18)

When course handicap exceeds 18, players receive 2 strokes ("double dots") on some holes:

```typescript
const strokes = computeHandicapStrokes(strokeIndex, 24);
// Holes with stroke index 1-6 get 2 strokes
// Holes with stroke index 7-18 get 1 stroke
```

### Negative Handicaps

Plus handicaps (negative numbers) work by giving strokes back:

```typescript
const strokes = computeHandicapStrokes(strokeIndex, -3);
// Holes with stroke index 16-18 get -1 strokes
```

## Relative Handicap (Match Play)

In match play, the lowest handicap plays off scratch, others receive the difference:

```typescript
import { computeRelativeHandicaps } from '@press/rules';

const handicaps = { blake: 12, mike: 6 };
const relative = computeRelativeHandicaps(handicaps);
// Returns: { blake: 6, mike: 0 }
```

## Net Score Computation

Net score is gross score minus strokes received:

```typescript
import { computeNetScore } from '@press/rules';

const netScore = computeNetScore(
  5,      // gross
  1,      // dots received
  { allowBelow1: false }
);
// Returns: 4 (or minimum 1 if gross - dots < 1)
```

### Minimum Net Score

By default, minimum net score is 1 (can't score 0 or negative):

```typescript
computeNetScore(2, 3, { allowBelow1: false }); // Returns 1
computeNetScore(2, 3, { allowBelow1: true });  // Returns -1
```

## API Reference

### `computeHandicapStrokes(strokeIndex, courseHandicap)`

Returns strokes per hole based on stroke index and handicap.

**Parameters:**
- `strokeIndex`: `Record<HoleNumber, number>` - Stroke index for each hole
- `courseHandicap`: `number` - Player's course handicap

**Returns:** `StrokesPerHole` - Map of hole number to strokes received

### `computeRelativeHandicaps(handicaps)`

Computes relative handicaps for match play (lowest plays off 0).

**Parameters:**
- `handicaps`: `Record<PlayerId, number>` - Course handicaps by player

**Returns:** `Record<PlayerId, number>` - Relative handicaps

### `computeNetScore(gross, dots, config)`

Computes net score from gross and handicap strokes.

**Parameters:**
- `gross`: `number` - Gross score
- `dots`: `number` - Handicap strokes received
- `config`: `{ allowBelow1?: boolean }` - Configuration

**Returns:** `number` - Net score (minimum 1 unless allowBelow1)
