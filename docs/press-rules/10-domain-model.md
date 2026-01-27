# Press! Rules Engine - Domain Model

## Core Concepts

### Round

A `Round` represents a single golf round with all scoring data:

```typescript
interface Round {
  tee: TeeInfo;
  players: PlayerInfo[];
  grossStrokes: Record<PlayerId, Partial<Record<HoleNumber, number>>>;
  meta?: RoundMeta;
}

interface TeeInfo {
  par: Record<HoleNumber, number>;        // Par for each hole
  strokeIndex: Record<HoleNumber, number>; // Handicap stroke allocation order
}

interface PlayerInfo {
  id: PlayerId;
  name: string;
  courseHandicap?: number; // Already computed from handicap index
}

interface RoundMeta {
  holesPlanned: 9 | 18;
  events?: {
    presses?: PressEvent[];
    ctp?: CtpEvent[];
    longDrive?: LongDriveEvent[];
    threePutts?: ThreePuttEvent[];
  };
}
```

### HoleNumber

A union type representing valid hole numbers (1-18):

```typescript
type HoleNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
                  10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18;
```

### Contest Configuration

```typescript
interface ContestConfig {
  contestId: ContestId;
  name: string;
  type: ContestType;
  scoringBasis: ScoringBasis;  // 'gross' | 'net'
  participants: Participant[]; // Players or Teams
  stakesConfig: StakesConfig;
  handicapConfig: HandicapConfig;
  segments?: SegmentConfig[];
  options?: ContestOptions;
}
```

### Participants

Participants can be individual players or teams:

```typescript
// Individual player
interface Player {
  id: PlayerId;
  name?: string;
}

// Team of players
interface Team {
  id: TeamId;
  name?: string;
  playerIds: PlayerId[];
}

type Participant = Player | Team;
```

### Stakes Configuration

```typescript
interface StakesConfig {
  unit: Units;              // Base stake amount
  payoutFormat?: 'per_hole' | 'per_skin' | 'total';
  potTotal?: Units;         // For pot-based contests
}
```

### Handicap Configuration

```typescript
interface HandicapConfig {
  useRelativeHandicap?: boolean; // Lowest plays off 0
  allowBelow1?: boolean;         // Allow net scores below 1
}
```

## Type Guards

The package provides type guards for participant checking:

```typescript
function isTeamParticipants(participants: Participant[]): participants is Team[];
function isPlayerParticipants(participants: Participant[]): participants is Player[];
function getAllPlayerIds(participants: Participant[]): PlayerId[];
```
