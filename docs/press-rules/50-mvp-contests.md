# Press! Rules Engine - MVP Contests

## Match Play Singles

1v1 match play where each hole is worth 1 point to the winner.

### Rules
- Lower score wins the hole
- Tie = hole halved (no points)
- Match closes when lead > remaining holes ("3&2")
- Net scoring uses relative handicap (low man plays off scratch)

### Configuration
```json
{
  "type": "match_play_singles",
  "participants": [{ "id": "p1" }, { "id": "p2" }],
  "stakesConfig": { "unit": 5, "payoutFormat": "per_hole" },
  "handicapConfig": { "useRelativeHandicap": true }
}
```

### Settlement
Winner receives: `stake * holesUp`

---

## Nassau

Three-segment match play (front 9, back 9, total 18) with manual presses.

### Rules
- Front: holes 1-9
- Back: holes 10-18
- Total: holes 1-18
- Each segment is independent match play
- Presses start new matches mid-segment

### 9-Hole Support
For 9-hole rounds:
- Back segment is inactive
- Front and Total both cover holes 1-9

### Presses
Presses can come from:
1. Config: `options.presses[]`
2. Runtime: `round.meta.events.presses[]`

```typescript
interface PressEvent {
  hole: HoleNumber;
  segment: 'front' | 'back' | 'total';
  pressedByTeamId: TeamId;
}
```

### Configuration
```json
{
  "type": "nassau",
  "participants": [
    { "id": "team-a", "playerIds": ["a1", "a2"] },
    { "id": "team-b", "playerIds": ["b1", "b2"] }
  ],
  "stakesConfig": { "unit": 10 }
}
```

---

## Skins

Lowest unique score wins the skin. Ties carry over.

### Rules
- Lowest score on a hole wins the skin
- If tied, skin carries over to next hole
- Carryover skins accumulate
- Final hole carryovers: optionally carry to hole 1 or split

### Configuration
```json
{
  "type": "skins",
  "participants": [{ "id": "p1" }, { "id": "p2" }, { "id": "p3" }, { "id": "p4" }],
  "stakesConfig": { "unit": 2, "payoutFormat": "per_skin" },
  "options": { "carryOver": true }
}
```

### Settlement
Winner collects `perSkin` from EACH other player for each skin won.

Example: 4 players, $2/skin, Player 1 wins 3 skins
- Player 1 receives: 3 skins × $2 × 3 other players = $18

---

## Match Play Best Ball (2v2)

Team match play where each team's score is their best player's score.

### Rules
- Each hole: team score = min(player1 score, player2 score)
- Lower team score wins the hole
- Match closes when lead > remaining holes

### Configuration
```json
{
  "type": "match_play_bestball",
  "participants": [
    { "id": "team-a", "playerIds": ["a1", "a2"] },
    { "id": "team-b", "playerIds": ["b1", "b2"] }
  ],
  "stakesConfig": { "unit": 10 }
}
```

### Audit
Tracks which player's score counted for each team on each hole.

---

## Best Ball Stroke (2v2)

Team stroke play where each team's score is their best player's score.

### Rules
- Each hole: team score = min(player1 score, player2 score)
- Sum team scores across all holes
- Lower total wins

### Configuration
```json
{
  "type": "bestball_stroke",
  "participants": [
    { "id": "team-a", "playerIds": ["a1", "a2"] },
    { "id": "team-b", "playerIds": ["b1", "b2"] }
  ],
  "stakesConfig": { "unit": 20 }
}
```

---

## Stableford

Points-based scoring relative to par.

### Default Point Table
| Score vs Par | Points |
|--------------|--------|
| Albatross (-3) | 5 |
| Eagle (-2) | 4 |
| Birdie (-1) | 3 |
| Par (0) | 2 |
| Bogey (+1) | 1 |
| Double Bogey+ | 0 |

### Configuration
```json
{
  "type": "stableford",
  "participants": [{ "id": "p1" }, { "id": "p2" }, { "id": "p3" }],
  "stakesConfig": { "unit": 5 },
  "options": {
    "stablefordTable": {
      "albatross": 8, "eagle": 5, "birdie": 3,
      "par": 2, "bogey": 1, "doubleBogey": 0, "worse": 0
    }
  }
}
```

---

## Side Pots

### CTP (Closest to Pin)

Input from `round.meta.events.ctp`:
```typescript
interface CtpEvent {
  hole: HoleNumber;
  winnerPlayerId: PlayerId;
  distanceFt?: number;
}
```

### Long Drive

Input from `round.meta.events.longDrive`:
```typescript
interface LongDriveEvent {
  hole: HoleNumber;
  winnerPlayerId: PlayerId;
  distanceYds?: number;
}
```

### Birdie Pool

Counts birdies (net or gross), pot split proportionally.

### Snake

Tracks three-putts from `round.meta.events.threePutts`.
Last holder at end of round pays the pot.

```typescript
interface ThreePuttEvent {
  hole: HoleNumber;
  playerId: PlayerId;
}
```
