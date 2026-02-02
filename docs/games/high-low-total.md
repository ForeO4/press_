# High-Low-Total

A popular golf side game for groups of 3-4 players. Each hole awards points based on who has the lowest net score and who has the highest (a penalty).

## Overview

- **Players**: 3-4 (individual mode) or 4 players in 2 teams (team mode)
- **Scoring**: Net (handicap strokes applied)
- **Points per Hole**:
  - **Individual Mode (3-4 players)**: 2 points per hole (Low + High)
  - **Team Mode (2v2)**: 3 points per hole (Low + High + Total)

## How It Works

### Individual Mode (3-4 Players)

On each hole:
1. **Low Winner**: Player with the lowest net score wins 1 point (good!)
2. **High Loser**: Player with the highest net score loses 1 point (penalty!)

### Team Mode (2v2)

On each hole:
1. **Low Winner**: Player with the lowest net score earns 1 point for their team
2. **High Loser**: Player with the highest net score loses 1 point for their team
3. **Total Winner**: Team with the lowest combined net score wins 1 point

## Tie Rules

When two or more players tie for Low or High, the tie can be handled three ways:

| Rule | Description |
|------|-------------|
| **Push** (default) | No points awarded for that category on that hole |
| **Split** | Points divided evenly among tied players |
| **Carryover** | Points carry to the next hole (pot builds) |

## Example Round (Individual Mode, 3 Players)

| Hole | Alice (Net) | Bob (Net) | Carol (Net) | Low | High |
|------|-------------|-----------|-------------|-----|------|
| 1 | 4 | 5 | 6 | Alice +1 | Carol -1 |
| 2 | 5 | 4 | 4 | Bob/Carol tie | Alice -1 |
| 3 | 3 | 4 | 5 | Alice +1 | Carol -1 |

**After 3 holes** (Push rule):
- Alice: +1 (Low) - 1 (High) + 1 (Low) = +1
- Bob: 0
- Carol: -1 (High) - 1 (High) = -2

## Example Round (Team Mode)

Teams: Alice & Bob vs Carol & Dan

| Hole | Alice | Bob | Carol | Dan | Team A Total | Team B Total | L | H | T |
|------|-------|-----|-------|-----|--------------|--------------|---|---|---|
| 1 | 4 | 5 | 6 | 4 | 9 | 10 | Alice/Dan tie | Carol | A |
| 2 | 5 | 3 | 4 | 5 | 8 | 9 | Bob | Alice/Dan tie | A |

**After 2 holes** (Push rule):
- Team A: 0 (Low tie) + 1 (Total) + 1 (Low) + 1 (Total) = +3
- Team B: -1 (High) + -1 (High tie push) = -1

## Settlement

At the end of the round, net points are multiplied by the agreed Gator Bucks per point:

```
Settlement = Net Points x Gator Bucks per Point
```

Example: If playing for 10 Gator Bucks per point:
- Alice (+3 points) wins 30 Gator Bucks
- Bob (-1 point) owes 10 Gator Bucks
- Carol (-2 points) owes 20 Gator Bucks

## Strategy Tips

1. **Avoid being High**: The penalty for highest score hurts as much as Low helps
2. **Play safe when ahead**: A bogey is fine if someone else has double
3. **Team communication**: In team mode, discuss risk/reward on each shot
4. **Net scoring matters**: Know your handicap strokes - dots make a difference!

## Press! Implementation Notes

- Net scoring is automatically calculated based on course handicap
- Tiebreaker: Push (default), configurable to Split or Carryover
- Team mode requires exactly 4 players in 2 teams
- Real-time standings update as scores are entered
