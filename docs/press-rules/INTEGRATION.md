# Press! Rules Engine - Integration Guide

## Installation

### From npm (when published)
```bash
npm install @press/rules
```

### From Monorepo
```bash
# Install dependencies
npm install

# Build the package
npm -C packages/press-rules run build

# Run tests
npm -C packages/press-rules run test
```

## Basic Usage

### Importing

```typescript
// Import main function
import { computeContests } from '@press/rules';

// Import types
import type { Round, ContestConfig, ContestResult } from '@press/rules';

// Import utilities
import {
  computeHandicapStrokes,
  computeRelativeHandicaps,
  explainMatchResult
} from '@press/rules';
```

### Computing Contest Results

```typescript
import { computeContests } from '@press/rules';

// Prepare round data
const round: Round = {
  tee: {
    par: { 1: 4, 2: 3, 3: 5, /* ... */ },
    strokeIndex: { 1: 7, 2: 15, 3: 3, /* ... */ }
  },
  players: [
    { id: 'blake', name: 'Blake', courseHandicap: 12 },
    { id: 'mike', name: 'Mike', courseHandicap: 6 }
  ],
  grossStrokes: {
    blake: { 1: 5, 2: 4, 3: 6, /* ... */ },
    mike: { 1: 4, 2: 3, 3: 5, /* ... */ }
  },
  meta: { holesPlanned: 18 }
};

// Define contests
const contests: ContestConfig[] = [
  {
    contestId: 'match-1',
    name: 'Match Play',
    type: 'match_play_singles',
    scoringBasis: 'net',
    participants: ['blake', 'mike'],  // Player IDs (strings)
    stakesConfig: { unit: 5 },
    handicapConfig: { basis: 'net', useRelativeHandicap: true }
  }
];

// Compute results
const results = computeContests(round, contests);
```

### Accessing Results

```typescript
for (const result of results) {
  // Summary
  console.log(`${result.summary.name}: ${result.summary.status}`);
  console.log(`Thru: ${result.summary.thruHole}`);

  // Standings (type-specific)
  if (result.standings.type === 'match_play') {
    for (const standing of result.standings.standings) {
      console.log(`${standing.playerName}: ${standing.holesUp} UP`);
    }
  }

  // Settlement
  for (const [playerId, balance] of Object.entries(result.settlement.balancesByPlayerId)) {
    console.log(`${playerId}: ${balance > 0 ? '+' : ''}${balance}`);
  }
}
```

### Aggregated Settlement

```typescript
import { computeContests, computeAggregatedSettlement } from '@press/rules';

const results = computeContests(round, contests);
const aggregate = computeAggregatedSettlement(results);

// Total balances across all contests
console.log(aggregate.totalBalancesByPlayerId);
// { blake: -15, mike: 15 }

// All ledger entries
console.log(aggregate.allEntries.length);
```

## Real-Time Updates

The engine supports incremental scoring:

```typescript
// Initial computation with partial scores
let round = {
  // ...
  grossStrokes: {
    blake: { 1: 5 },  // Only hole 1 completed
    mike: { 1: 4 }
  }
};

let results = computeContests(round, contests);
console.log(results[0].summary.status);  // 'live'
console.log(results[0].summary.thruHole); // 1

// Update with more scores
round.grossStrokes.blake[2] = 4;
round.grossStrokes.mike[2] = 3;

// Recompute (deterministic)
results = computeContests(round, contests);
console.log(results[0].summary.thruHole); // 2
```

## Custom Contest Registry

```typescript
import { ContestRegistry, computeContests } from '@press/rules';
import type { ContestHandler } from '@press/rules';

// Create custom registry
const customRegistry = new ContestRegistry();

// Register handlers
customRegistry.register(myCustomHandler);

// Use custom registry
const results = computeContests(round, contests, customRegistry);
```

## Runtime Events (Nassau Presses)

```typescript
const round: Round = {
  // ...
  meta: {
    holesPlanned: 18,
    events: {
      presses: [
        { hole: 5, segment: 'front', pressedByTeamId: 'team-a' }
      ]
    }
  }
};
```

## Side Pot Events

```typescript
const round: Round = {
  // ...
  meta: {
    holesPlanned: 18,
    events: {
      ctp: [
        { hole: 6, winnerPlayerId: 'blake', distanceFt: 8.5 }
      ],
      longDrive: [
        { hole: 3, winnerPlayerId: 'mike', distanceYds: 285 }
      ],
      threePutts: [
        { hole: 7, playerId: 'blake' }
      ]
    }
  }
};
```

## Error Handling

```typescript
import { computeContests, defaultRegistry } from '@press/rules';

// Validate before computing
for (const contest of contests) {
  const handler = defaultRegistry.get(contest.type);
  if (handler) {
    const validation = handler.validate(contest);
    if (!validation.valid) {
      console.error(`Invalid config: ${validation.errors.join(', ')}`);
    }
  }
}

// Compute (will skip invalid contests)
const results = computeContests(round, contests);
```

## TypeScript Types

All types are exported for use in consuming applications:

```typescript
import type {
  // Input types
  Round,
  ContestConfig,
  HoleNumber,
  PlayerId,

  // Result types
  ContestResult,
  ContestSummary,
  ContestStandings,
  ContestSettlement,

  // Standings types
  MatchPlayStandings,
  SkinsStandings,
  SkinResultEntry,
  NassauStandings,

  // Utility types
  LedgerEntry,
  StrokesPerHole
} from '@press/rules';
```

## Determinism

The engine produces deterministic output. For testing purposes, reset the ledger ID counter between runs:

```typescript
import { computeContests, resetLedgerIdCounter } from '@press/rules';

// Reset before computing for deterministic IDs
resetLedgerIdCounter();
const results = computeContests(round, contests);
```
