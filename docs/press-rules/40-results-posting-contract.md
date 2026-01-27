# Press! Rules Engine - Results Posting Contract

## Overview

Every contest computation returns a `ContestResult` with four components:

```typescript
interface ContestResult {
  summary: ContestSummary;
  standings: ContestStandings;
  audit: ContestAudit;
  settlement: ContestSettlement;
}
```

## ContestSummary

High-level contest state:

```typescript
interface ContestSummary {
  contestId: ContestId;
  name: string;
  type: ContestType;
  scoringBasis: ScoringBasis;
  stakesSummary: string;        // "5 units/hole"
  status: ContestStatus;        // 'live' | 'final'
  thruHole: HoleNumber | null;
}
```

## ContestStandings

Type-specific standings with discriminated union:

```typescript
type ContestStandings =
  | MatchPlayStandings
  | TeamMatchPlayStandings
  | SkinsStandings
  | NassauStandings
  | StrokePlayStandings
  | StablefordStandings
  | SidePotStandings;
```

### MatchPlayStandings

```typescript
interface MatchPlayStandings {
  type: 'match_play';
  standings: MatchPlayStanding[];
}

interface MatchPlayStanding {
  playerId: PlayerId;
  playerName: string;
  holesUp: number;          // Positive = leading, negative = trailing
  holesPlayed: number;
  holesRemaining: number;
  matchStatus: 'leading' | 'trailing' | 'all_square' | 'dormie' | 'closed';
  result?: string;          // "3&2" if match closed
}
```

### SkinsStandings

```typescript
interface SkinsStandings {
  type: 'skins';
  standings: SkinsStanding[];       // Per-player totals
  skinResults: SkinResultEntry[];   // Per-hole results
  totalSkinsAwarded: number;
  carryoverSkins: number;           // Skins pending (ties carried forward)
}

interface SkinsStanding {
  playerId: PlayerId;
  playerName: string;
  skinsWon: number;
  totalValue: Units;        // skinsWon * perSkin * (numPlayers - 1)
}

interface SkinResultEntry {
  hole: HoleNumber;
  winnerId: PlayerId | null;  // null = carryover (tie)
  winnerName?: string;
  skinsWon: number;           // 0 if carryover, 1+ if won with carryovers
}
```

### NassauStandings

```typescript
interface NassauStandings {
  type: 'nassau';
  segments: SegmentStanding[];
  presses: SegmentStanding[];
}

interface SegmentStanding {
  segmentId: string;
  name: string;
  startHole: HoleNumber;
  endHole: HoleNumber;
  standings: TeamMatchPlayStanding[];
  isFinal: boolean;
}
```

### SidePotStandings

```typescript
interface SidePotStandings {
  type: 'side_pot';
  potType: 'ctp' | 'long_drive' | 'birdie_pool' | 'snake';
  standings: SidePotStanding[];
  potTotal: Units;
  holeResults?: Array<{
    hole: HoleNumber;
    winnerId?: PlayerId;
    winnerName?: string;
    value: Units;
    details?: string;
  }>;
}
```

## ContestAudit

Detailed hole-by-hole breakdown:

```typescript
interface ContestAudit {
  holeByHole: HoleAuditEntry[];
  summary: string;
}

interface HoleAuditEntry {
  hole: HoleNumber;
  par: number;
  players: HolePlayerAudit[];
  winner?: PlayerId | PlayerId[] | 'halved';
  matchState?: string;        // "Blake 2 UP"
  notes?: string;
}

interface HolePlayerAudit {
  playerId: PlayerId;
  playerName: string;
  gross: number;
  net?: number;
  dots?: number;
  counted?: boolean;          // For best ball
  stablefordPoints?: number;
}
```

## ContestSettlement

Settlement ledger for financial reconciliation:

```typescript
interface ContestSettlement {
  ledgerEntries: LedgerEntry[];
  balancesByPlayerId: Record<PlayerId, number>;
}

interface LedgerEntry {
  id: string;
  contestId: ContestId;
  description: string;
  amount: Units;
  fromPlayerId?: PlayerId;
  toPlayerId?: PlayerId;
  splitAmongPlayerIds?: PlayerId[];
}
```

### Balance Computation

The `balancesByPlayerId` field shows net position per player:
- Positive = net winner (receives money)
- Negative = net loser (pays money)
- Sum always equals 0

## Usage

```typescript
import { computeContests, computeAggregatedSettlement } from '@press/rules';

const results = computeContests(round, contests);

// Access individual results
for (const result of results) {
  console.log(result.summary.status);
  console.log(result.standings);
  console.log(result.settlement.balancesByPlayerId);
}

// Get aggregated settlement across all contests
const aggregate = computeAggregatedSettlement(results);
console.log(aggregate.totalBalancesByPlayerId);
```
