# Testing

## Overview

Press! uses Vitest for unit and integration testing.

## Running Tests

```bash
# Run all tests
pnpm test

# Run with watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

## Test Structure

```
src/
├── lib/
│   └── domain/
│       ├── games/
│       │   ├── createPress.ts
│       │   └── createPress.test.ts
│       ├── settlement/
│       │   ├── computeSettlement.ts
│       │   └── computeSettlement.test.ts
│       └── scoring/
│           ├── matchPlay.ts
│           └── matchPlay.test.ts
```

## Unit Tests

### Domain Logic

Test pure functions in `src/lib/domain/`:

```typescript
// createPress.test.ts
import { describe, it, expect } from 'vitest';
import { validatePress, createPress } from './createPress';

describe('validatePress', () => {
  it('rejects negative stake', () => {
    const result = validatePress({
      parentGameId: 'game-1',
      startHole: 10,
      stake: -5,
    }, parentGame, currentHole);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('positive');
  });

  it('rejects non-integer stake', () => {
    const result = validatePress({
      parentGameId: 'game-1',
      startHole: 10,
      stake: 5.5,
    }, parentGame, currentHole);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('integer');
  });

  it('rejects press starting before current hole', () => {
    const result = validatePress({
      parentGameId: 'game-1',
      startHole: 5, // current is 7
      stake: 10,
    }, parentGame, 7);

    expect(result.valid).toBe(false);
  });

  it('accepts valid press', () => {
    const result = validatePress({
      parentGameId: 'game-1',
      startHole: 10,
      stake: 10,
    }, parentGame, 9);

    expect(result.valid).toBe(true);
  });
});
```

### Settlement

```typescript
// computeSettlement.test.ts
import { describe, it, expect } from 'vitest';
import { computeMatchPlaySettlement } from './computeSettlement';

describe('computeMatchPlaySettlement', () => {
  it('calculates winner correctly', () => {
    const game = {
      id: 'game-1',
      stakeTeethInt: 10,
      startHole: 1,
      endHole: 18,
    };

    const scores = [
      // Player A wins 5 holes, loses 2
      { playerId: 'player-a', hole: 1, strokes: 4 },
      { playerId: 'player-b', hole: 1, strokes: 5 },
      // ... more scores
    ];

    const settlement = computeMatchPlaySettlement(game, scores);

    expect(settlement.payerId).toBe('player-b');
    expect(settlement.payeeId).toBe('player-a');
    expect(settlement.amount).toBe(30); // 3 up * 10 teeth
  });
});
```

## Component Tests

Use React Testing Library:

```typescript
// GameCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { GameCard } from './GameCard';

describe('GameCard', () => {
  it('shows press button when allowed', () => {
    render(
      <GameCard
        game={mockGame}
        canPress={true}
        onPress={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /press/i })).toBeVisible();
  });

  it('hides press button when not allowed', () => {
    render(
      <GameCard
        game={mockGame}
        canPress={false}
        onPress={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /press/i })).toBeNull();
  });
});
```

## Test Utilities

### Mock Data

```typescript
// src/lib/mock/testData.ts
export const mockGame: Game = {
  id: 'game-1',
  eventId: 'event-1',
  type: 'match_play',
  stakeTeethInt: 10,
  parentGameId: null,
  startHole: 1,
  endHole: 18,
  status: 'active',
};

export const mockScores: HoleScore[] = [
  // ...
];
```

### Test Setup

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom';
```

## Coverage

Aim for:
- Domain logic: 90%+
- Components: 70%+
- API routes: 80%+

```bash
pnpm test:coverage
```
