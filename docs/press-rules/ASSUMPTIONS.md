# Press! Rules Engine - Assumptions

This document records design decisions and assumptions made during implementation.

## Handicap

### Course Handicap vs Index
- Input uses `courseHandicap` (already computed from handicap index)
- Engine does NOT convert handicap index to course handicap
- Conversion should be done before calling the engine

### Relative Handicap
- Match play uses relative handicap by default
- Lowest handicap plays off scratch (0)
- Others receive difference as strokes
- Can be disabled via `handicapConfig.useRelativeHandicap: false`

### Minimum Net Score
- Default minimum net score is 1 per hole
- Prevents 0 or negative scores from handicap strokes
- Can be disabled via `handicapConfig.allowBelow1: true`

### Double Dots
- Course handicap > 18 results in double dots
- Holes receive 2 strokes in stroke index order
- Example: handicap 24 = 2 strokes on SI 1-6, 1 stroke on SI 7-18

## Match Play

### Result Format
- "3&2" means 3 up with 2 holes to play (match closed)
- "1 UP" means 1 hole ahead after final hole
- "A/S" means all square (tied)

### Early Close
- Match closes when lead > remaining holes
- No more holes are played after close
- Settlement based on holes up at close

### Halved Matches
- If all square after final hole, match is halved
- No settlement for halved matches

## Skins

### Carryover Behavior
- Ties carry over by default (`carryOver: true`)
- Carryover skins accumulate to next won skin
- Final hole carryovers remain as carryovers (not redistributed)

### Settlement
- Winner collects `perSkin` from EACH other player
- Total payout = `perSkin × (N-1)` per skin won
- Example: 4 players, $2/skin, 3 skins = $2 × 3 × 3 = $18

## Nassau

### Segments
- Front: holes 1-9
- Back: holes 10-18
- Total: holes 1-18

### 9-Hole Rounds
- Back segment marked `isActive: false`
- Front and Total both cover holes 1-9
- Only 2 segments contribute to settlement

### Presses
- MVP supports manual presses only
- Presses from config OR runtime events
- Press ends at segment boundary
- Auto-press (2-down auto) is future TODO

## Best Ball

### Score Selection
- Lowest score among team members is used
- Ties: first player in order is "counted"
- Audit tracks which player's score counted

### Best Ball Match vs Stroke
- Match play: hole-by-hole winner, can close early
- Stroke play: sum of best balls, lower total wins

## Stableford

### Default Point Table
```
Albatross: 5
Eagle: 4
Birdie: 3
Par: 2
Bogey: 1
Double Bogey+: 0
```

### Ties
- Multiple players can share rank 1
- Settlement splits among tied winners

## Side Pots

### Event-Based Input
- CTP, Long Drive, Snake use `round.meta.events`
- Birdie Pool computed from scores

### Snake Rules
- Last three-putt holder pays the pot
- If no three-putts, no settlement
- Holder tracked hole-by-hole

## Settlement

### Units
- All amounts in abstract "units" (AlligatorTeeth)
- Conversion to currency is UI concern

### Balance Zero-Sum
- Sum of all balances always equals 0
- Positive = receives, Negative = pays

### Team Settlement
- Winning team splits winnings equally
- Losing team pays equally
- Each player's individual balance is tracked
