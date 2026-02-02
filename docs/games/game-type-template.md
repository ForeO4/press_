# [Game Type Name]

> Template for documenting game types in Press!
> Copy this file and replace bracketed content with actual values.

## Overview

[Brief 1-2 sentence description of what this game is about and why golfers play it.]

## Player Requirements

| Requirement | Value |
|-------------|-------|
| Minimum Players | [X] |
| Maximum Players | [Y] |
| Exact Players | [Optional - if exact count required] |
| Team Mode | [Yes/No] |
| Team Size | [If team mode, e.g., "2 per team"] |

## Scoring

### Scoring Basis
- **Supported**: [Net / Gross / Both]
- **Default**: [Net or Gross]

### Scoring Method
[Describe how winners are determined - e.g., "hole_by_hole", "points", "skins"]

### Per Hole Logic
[Describe what happens on each hole]

- **Winner Criteria**: [Lowest score / Highest score / etc.]
- **Tie Handling**: [Halve / Carryover / Split / Push]

### Points System (if applicable)
| Category | Points |
|----------|--------|
| [e.g., Low] | [+1] |
| [e.g., High] | [-1] |
| [e.g., Total] | [+1] |

## Gator Bucks Conversion

### Formula
**[Formula in human-readable form, e.g., "Stake × Holes Up"]**

### Calculation Method
[per_hole / per_point / per_skin / per_bet / fixed_pool]

### Examples

| Scenario | Result |
|----------|--------|
| [e.g., "2 Up at $10/hole"] | [+$20 winner, -$20 loser] |
| [e.g., "All Square"] | [No money changes hands] |
| [e.g., "Max exposure at $10"] | [$XX] |

## Game Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| [e.g., pressEnabled] | [toggle] | [true] | [Players can press when down] |
| [e.g., tieRule] | [select] | [push] | [How ties are handled] |

### Setting Dependencies
[Describe any settings that only appear when other settings have specific values]

## Rules Summary

1. [Rule 1 - Core mechanic]
2. [Rule 2 - Scoring logic]
3. [Rule 3 - Tie handling]
4. [Rule 4 - Settlement]
5. [Additional rules as needed...]

## Strategy Tips

- [Tip 1 for playing this game well]
- [Tip 2]
- [Tip 3]

## Common Variants

[List any common house rules or variants of this game type]

## Status

- **Implementation Status**: [stable / beta / planned]
- **Config Location**: `src/lib/games/gameTypeConfig.ts`
- **Database Tables**: [List any game-type-specific tables]

---

## Technical Implementation

### Config Reference
```typescript
// From src/lib/games/gameTypeConfig.ts
{
  type: '[game_type]',
  label: '[Game Type Name]',
  scoring: {
    method: '[method]',
    // ...
  },
  gatorBucks: {
    method: '[method]',
    formula: '[formula]',
    // ...
  },
}
```

### Related Files
- `src/lib/games/gameTypeConfig.ts` - Game type configuration
- `src/components/games/CreateGameModal.tsx` - Game creation UI
- [Any game-type-specific components or services]

---

*Last Updated: [Date]*
*Author: [Name or "AI-Generated"]*
