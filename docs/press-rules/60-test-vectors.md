# Press! Rules Engine - Test Vectors

## Overview

Test vectors are predefined round/contest combinations with expected outputs, used to validate the rules engine.

## Vector Format

```typescript
interface TestVector {
  id: string;
  description: string;
  round: Round;
  contests: ContestConfig[];
  expected: Record<ContestId, ExpectedResult>;
}

interface ExpectedResult {
  summary: {
    contestId: string;
    type: string;
    status: 'live' | 'final';
    thruHole?: number;
  };
  standings: {
    type: string;
    // Type-specific fields
  };
  settlement?: {
    // Settlement expectations
  };
  audit?: {
    // Audit expectations
  };
}
```

## Required Vectors

The test suite includes these mandatory vectors:

### 1. match-play-singles-net-4and3
- 2-player net match play
- Ends "4&3" with handicap dots
- Validates relative handicap, early close, settlement

### 2. skins-gross-carryovers
- 4-player gross skins
- 2+ carryovers
- Validates carryover accumulation, skin distribution

### 3. nassau-2v2-with-presses
- 4-player 2v2 Nassau
- 2 runtime presses
- Validates segment tracking, press handling

### 4. bestball-stroke-2v2
- 2v2 best ball stroke play
- 3 holes with audit
- Validates counted player tracking

### 5. stableford-with-ties
- 3+ players
- Tied winners
- Validates tie handling, rank assignment

### 6. 9-hole-match-skins
- 9-hole round
- Match play and skins
- Validates 9-hole support

### 7. side-pots-ctp-longdrive
- CTP and Long Drive
- Events from meta
- Validates event parsing, pot distribution

### 8. snake-three-putts
- Snake pot
- Multiple three-putts
- Validates holder tracking, settlement

## Running Vectors

```bash
# Run all tests
npm -C packages/press-rules run test

# Run only vector tests
npm -C packages/press-rules run test:vectors
```

## Determinism Validation

The test suite verifies that:
1. Same inputs produce identical outputs
2. Recomputing any vector produces byte-identical JSON
3. All vectors pass determinism checks

**Important**: Ledger entry IDs are generated using a counter. For deterministic testing, reset the counter before each comparison:

```typescript
import { computeContests, resetLedgerIdCounter } from '@press/rules';

describe('determinism', () => {
  it('produces identical results on recompute', () => {
    resetLedgerIdCounter();
    const results1 = computeContests(round, contests);

    resetLedgerIdCounter();
    const results2 = computeContests(round, contests);

    expect(JSON.stringify(results1)).toBe(JSON.stringify(results2));
  });
});
```

## Adding New Vectors

1. Add vector to `test-vectors/vectors.json`
2. Include all required fields
3. Specify minimum expected outputs
4. Run `npm -C packages/press-rules run test` to validate

## Vector Location

```
packages/press-rules/
└── test-vectors/
    └── vectors.json
```
