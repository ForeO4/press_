# Press! Game Rules

This folder contains official game rules documentation for all supported game types in Press!

## Game Types

| Game | Players | Description |
|------|---------|-------------|
| [Match Play](./match-play.md) | 2-4 | Win holes, not strokes. Best for 1v1 or 2v2. |
| [Nassau](./nassau.md) | 2-4 | Three bets: front 9, back 9, and overall. The classic. |
| [Skins](./skins.md) | 2-4 | Win the hole outright to take the skin. Carryovers build the pot. |
| [High-Low-Total](./high-low-total.md) | 3-4 | Win Low point, avoid High penalty. Team mode adds Total. |

## How Games Work in Press!

### Gator Bucks
All wagers in Press! use **Gator Bucks** - our fun currency that keeps things friendly. Set your stakes at the start of each game.

### Net vs Gross Scoring
- **Net**: Handicap strokes applied per hole (fairer for mixed skill groups)
- **Gross**: Raw strokes only (no handicap adjustments)

### Presses
Many game types support **presses** - side bets that start mid-round when a player is down. This keeps things competitive even when the match is lopsided.

## Adding New Games

Game rules are documented in markdown files in this folder. Each game type has a corresponding handler in the rules engine at `packages/press-rules/src/contests/`.
