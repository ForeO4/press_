# Press! Rules Engine - Contest Configuration Schema

## ContestConfig

The main configuration object for any contest:

```typescript
interface ContestConfig {
  contestId: ContestId;        // Unique identifier
  name: string;                // Display name
  type: ContestType;           // Handler type
  scoringBasis: ScoringBasis;  // 'gross' | 'net'
  participants: Participants;  // PlayerId[] or Team[]
  stakesConfig: StakesConfig;
  handicapConfig: HandicapConfig;
  segments?: Segment[];        // For Nassau
  options?: ContestOptions;
}

// Participants can be player IDs (strings) or team objects
type Participants = PlayerId[] | Team[];

interface Team {
  id: TeamId;
  name?: string;
  playerIds: [PlayerId, PlayerId];  // Exactly 2 players
}
```

## Contest Types

```typescript
type ContestType =
  | 'match_play_singles'
  | 'match_play_bestball'
  | 'nassau'
  | 'skins'
  | 'bestball_stroke'
  | 'stableford'
  | 'ctp'
  | 'long_drive'
  | 'birdie_pool'
  | 'snake';
```

## Stakes Configuration

```typescript
interface StakesConfig {
  unit: Units;                           // Base unit (e.g., 5)
  payoutFormat?: 'per_hole' | 'per_skin' | 'total';
  potTotal?: Units;                      // Fixed pot amount
}
```

### Payout Formats

- **per_hole**: Stake multiplied by holes won (match play)
- **per_skin**: Stake multiplied by skins won (skins)
- **total**: Fixed pot amount split among winners

## Handicap Configuration

```typescript
interface HandicapConfig {
  basis: 'gross' | 'net';         // Required
  useRelativeHandicap?: boolean;  // Default: true for match play
  allowBelow1?: boolean;          // Default: false
}
```

## Contest Options

```typescript
interface ContestOptions {
  carryOver?: boolean;           // Skins: carry over ties
  perPlayerBuyIn?: Units;        // Side pots: buy-in amount
  designatedHoles?: HoleNumber[]; // CTP/Long Drive: specific holes
  stablefordTable?: StablefordTable;
  presses?: PressConfig[];       // Nassau: predefined presses
}
```

## Segment Configuration (Nassau)

```typescript
interface SegmentConfig {
  segmentId: string;      // 'front', 'back', 'total'
  startHole: HoleNumber;
  endHole: HoleNumber;
  stake: Units;
  isActive: boolean;      // false for back on 9-hole
}
```

## Example Configurations

### Match Play Singles

```json
{
  "contestId": "mp-1",
  "name": "Match Play",
  "type": "match_play_singles",
  "scoringBasis": "net",
  "participants": ["blake", "mike"],
  "stakesConfig": { "unit": 5, "payoutFormat": "per_hole" },
  "handicapConfig": { "basis": "net", "useRelativeHandicap": true }
}
```

### Skins

```json
{
  "contestId": "skins-1",
  "name": "Skins",
  "type": "skins",
  "scoringBasis": "net",
  "participants": ["p1", "p2", "p3", "p4"],
  "stakesConfig": { "unit": 2, "payoutFormat": "per_skin" },
  "handicapConfig": { "basis": "net", "useRelativeHandicap": true },
  "options": { "carryoverRules": { "enabled": true } }
}
```

### Nassau (2v2)

```json
{
  "contestId": "nassau-1",
  "name": "Nassau",
  "type": "nassau",
  "scoringBasis": "net",
  "participants": [
    { "id": "team-a", "name": "Team A", "playerIds": ["a1", "a2"] },
    { "id": "team-b", "name": "Team B", "playerIds": ["b1", "b2"] }
  ],
  "stakesConfig": { "unit": 10, "payoutFormat": "per_hole" },
  "handicapConfig": { "basis": "net", "useRelativeHandicap": true }
}
```

### CTP Side Pot

```json
{
  "contestId": "ctp-1",
  "name": "Closest to Pin",
  "type": "ctp",
  "scoringBasis": "gross",
  "participants": ["p1", "p2"],
  "stakesConfig": { "unit": 5 },
  "handicapConfig": { "basis": "gross" },
  "options": { "designatedHoles": [2, 6, 11, 15] }
}
```
