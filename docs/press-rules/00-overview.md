# Press! Rules Engine - Overview

The Press! Rules Engine (`@press/rules`) is a TypeScript package for computing golf betting contest results with deterministic recompute capabilities.

## Features

- **Deterministic**: Same inputs always produce identical outputs
- **Pluggable**: Contest handlers can be registered/swapped via registry
- **Handicap Support**: Full stroke allocation with relative handicap for match play
- **9 & 18 Hole**: Supports both 9-hole and 18-hole rounds
- **Gross & Net**: All contests support gross and net scoring

## Quick Start

```typescript
import { computeContests } from '@press/rules';

const round = {
  tee: {
    par: { 1: 4, 2: 3, /* ... */ },
    strokeIndex: { 1: 7, 2: 15, /* ... */ }
  },
  players: [
    { id: 'blake', name: 'Blake', courseHandicap: 12 },
    { id: 'mike', name: 'Mike', courseHandicap: 6 }
  ],
  grossStrokes: {
    blake: { 1: 5, 2: 4, /* ... */ },
    mike: { 1: 4, 2: 3, /* ... */ }
  },
  meta: { holesPlanned: 18 }
};

const contests = [
  {
    contestId: 'match-1',
    name: 'Match Play',
    type: 'match_play_singles',
    scoringBasis: 'net',
    participants: [
      { id: 'blake', name: 'Blake' },
      { id: 'mike', name: 'Mike' }
    ],
    stakesConfig: { unit: 5 },
    handicapConfig: { useRelativeHandicap: true }
  }
];

const results = computeContests(round, contests);
```

## MVP Contest Types

| Type | Description | Players |
|------|-------------|---------|
| `match_play_singles` | 1v1 match play | 2 |
| `nassau` | 3-segment match play with presses | 2 teams |
| `skins` | Lowest unique score wins skin | 2-4 |
| `match_play_bestball` | 2v2 best ball match play | 2 teams |
| `bestball_stroke` | 2v2 best ball stroke play | 2 teams |
| `stableford` | Points-based scoring vs par | 2-4 |
| `ctp` | Closest to pin | 2-4 |
| `long_drive` | Longest drive | 2-4 |
| `birdie_pool` | Birdie count pot | 2-4 |
| `snake` | Last 3-putt holder pays | 2-4 |

## Package Structure

```
@press/rules/
├── src/
│   ├── index.ts          # Public exports
│   ├── types.ts          # Type definitions
│   ├── engine.ts         # Registry & computeContests
│   ├── handicap.ts       # Stroke allocation
│   ├── scoring.ts        # Scoring utilities
│   ├── settlement.ts     # Ledger generation
│   ├── explain.ts        # Human-readable strings
│   └── contests/         # Contest handlers
└── test-vectors/
    └── vectors.json      # Validation data
```

## Installation

```bash
npm install @press/rules
```

Or if using from the monorepo:

```bash
npm install
npm -C packages/press-rules run build
```
