# Scoring System

## Overview

Press! provides a mobile-first scorecard for tracking golf scores during events.

## Scorecard Features

### Grid View

4-player scorecard grid showing:
- Player names across top
- Holes 1-18 down side
- Current scores in cells
- Running totals at bottom

```
        Alex   Blake   Casey   Dana
Hole 1    4      5       4      6
Hole 2    3      4       3      4
Hole 3    5      5       6      5
...
OUT      36     38      37     40
IN       --     --      --     --
TOTAL    36     38      37     40
```

### Score Entry

- Tap cell to select
- +/- buttons for adjustment
- Direct score input (tap score to type)
- Quick-select buttons (par-2 to par+4)
- Auto-save on change
- Shows gross strokes

### Inline Editing from Game Detail

Score cells in the GameScorecard component on game detail pages are also tappable:
- Opens ScoreEditorSheet bottom sheet
- Supports prev/next hole navigation
- Changes persist to store and update match status in real-time

### Mobile Interaction

- Swipe between holes
- Pinch to zoom on grid
- Quick-entry mode for own score

## Data Model

### Round

```typescript
interface Round {
  id: string;
  eventId: string;
  userId: string;
  teeSetId: string | null;
  roundDate: string;
}
```

### Hole Score

```typescript
interface HoleScore {
  id: string;
  roundId: string;
  holeNumber: number; // 1-18
  strokes: number;    // integer, >= 0
  updatedAt: string;
}
```

## Score Rules

1. **Strokes must be integers** - No decimal values
2. **Minimum is 0** - Can't have negative strokes
3. **No maximum** - High scores allowed (for honesty)
4. **One score per hole** - Upsert pattern

## Real-time Updates

Scores sync in real-time via Supabase:

```typescript
// Subscribe to score changes
supabase
  .channel('scores')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'hole_scores',
    filter: `round_id=in.(${roundIds.join(',')})`
  }, handleScoreChange)
  .subscribe();
```

## Leaderboard

Auto-calculated from scores:
- Gross total (sum of strokes)
- Through hole N indicator
- Sorted by total strokes (ascending)

### Visibility

| Event Visibility | Leaderboard Access |
|------------------|-------------------|
| PRIVATE | Members only |
| UNLISTED | Via share link |
| PUBLIC | Anyone |

## Future: Net Scoring

Planned for v1.1:
- Handicap snapshots per event
- Course handicap calculation
- Net score display
- Handicap-adjusted leaderboard
