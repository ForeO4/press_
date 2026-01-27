# Design System

> **Source:** `src/lib/design/colors.ts`
> **Theme:** Premium dark mode with glassmorphism effects

## Overview

Press! uses a golf-inspired color palette optimized for dark mode. The design system emphasizes:
- Dark backgrounds for reduced eye strain
- Semantic color tokens for consistency
- Glassmorphism effects (backdrop blur, transparency)
- Status-based visual feedback

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary (Emerald) | `#10B981` | Main actions, golf green theme |
| Secondary (Blue) | `#3B82F6` | Water hazard, secondary actions |
| Accent (Amber) | `#F59E0B` | Sand trap, highlights, tied states |
| Danger (Red) | `#EF4444` | Out of bounds, errors, losing |
| Success (Green) | `#22C55E` | Birdie, winning states |
| Purple | `#8B5CF6` | Press games |

### Background Colors

| Name | Hex | Usage |
|------|-----|-------|
| Background | `#0F172A` | Page background (dark slate) |
| Surface | `#1E293B` | Elevated surfaces |
| Card | `#334155` | Card backgrounds |
| Elevated | `#475569` | Higher elevation surfaces |

### Foreground Colors

| Name | Hex | Usage |
|------|-----|-------|
| Default | `#F8FAFC` | Primary text |
| Muted | `#94A3B8` | Secondary text |
| Subtle | `#64748B` | Tertiary text, placeholders |

## Game Type Pill Styles

Status pills use 20% opacity backgrounds with 30% opacity borders.

```typescript
const gameTypePillStyles = {
  match_play: {
    background: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  nassau: {
    background: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  skins: {
    background: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  press: {
    background: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
};
```

## Match Status Card Styles

Cards display left borders indicating match status from the first player's perspective.

```typescript
const matchStatusStyles = {
  winning: 'border-l-4 border-l-green-500 bg-green-500/5',
  losing: 'border-l-4 border-l-red-500 bg-red-500/5',
  tied: 'border-l-4 border-l-amber-500 bg-amber-500/5',
  notStarted: 'border-l-4 border-l-muted bg-muted/5',
};
```

## Hole Result Dot Colors

For hole-by-hole progress visualization:

```typescript
const holeDotColors = {
  unplayed: 'bg-muted text-muted-foreground',
  playerAWon: 'bg-green-500 text-white',
  playerBWon: 'bg-red-500 text-white',
  tied: 'bg-gray-400 text-gray-900',
};
```

## Glassmorphism Effects

Used for navigation and overlays:

```css
/* Bottom navigation */
.bottom-nav {
  background: rgba(var(--background), 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* With fallback */
@supports (backdrop-filter: blur(16px)) {
  .bottom-nav {
    background: rgba(var(--background), 0.80);
  }
}
```

Tailwind classes:
```
bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80
```

## Typography

### Font Weights
- Regular (400): Body text
- Medium (500): Labels, secondary headings
- Semibold (600): Emphasis, stats
- Bold (700): Headings, important numbers

### Text Sizes
- `text-xs` (10-12px): Pills, badges, metadata
- `text-sm` (14px): Secondary content
- `text-base` (16px): Body text
- `text-lg` (18px): Large numbers, section headers
- `text-2xl` (24px): Emojis, hero elements

## Status Indicators

### Active State
- Green pulsing dot: `animate-pulse bg-green-500`
- Use sparingly for active games

### Match Progress Colors
- Winning: `text-green-400`
- Losing: `text-red-400`
- Tied (All Square): `text-amber-400`
- Not started: `text-muted-foreground`

## Scorecard Theme (Augusta Green & Gold)

The scorecard uses an Augusta National-inspired color scheme with emerald (forest green) and amber (gold) as the primary accent colors. This provides a premium golf aesthetic while maintaining clear visual distinction between players.

### Player Colors

| Player | Light Mode | Dark Mode | Usage |
|--------|------------|-----------|-------|
| Player A | `emerald-700` | `emerald-400` | Player A names, scores, indicators |
| Player B | `amber-700` | `amber-400` | Player B names, scores, indicators |

### Match Status Colors

| Condition | Color | Usage |
|-----------|-------|-------|
| Player A leads | Emerald | Match status text, header gradient |
| Player B leads | Amber | Match status text, header gradient |
| All Square | Gray | Neutral state |

### Winner Highlights

- **Winner score cells**: `ring-2 ring-amber-400` with `bg-amber-400/20` background
- Creates a "golden circle" effect around winning scores each hole

### Section Headers

- **Front 9 / Back 9 headers**: Emerald gradient background (`bg-emerald-900/50` dark, `bg-emerald-100` light)
- Provides visual separation between scorecard sections

### Press Rows

- **Press game rows**: Amber gradient with flame icon
- Background: `from-amber-900/30 via-orange-900/20 to-background` (dark mode)
- Icon: Flame emoji or Lucide Flame in amber/orange

### Light/Dark Mode Support

All Augusta theme colors have light and dark variants:
- Light mode uses `-700` shades for sufficient contrast
- Dark mode uses `-400` shades for visibility on dark backgrounds
- Background colors adjust opacity for each mode

## Avatar Colors

PlayerAvatar uses cycling colors for visual distinction:

```typescript
const colorClasses = {
  primary: 'bg-primary/20 text-primary border-primary/30',
  secondary: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  accent: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  muted: 'bg-muted/20 text-muted-foreground border-muted/30',
};
```

## Usage Guidelines

### Do
- Use semantic tokens (`primary`, `danger`, `success`) over raw colors
- Apply transparency for layered effects (20% for backgrounds, 30% for borders)
- Use `backdrop-blur-lg` for floating elements
- Match border colors to content type (game type pills, status borders)

### Don't
- Use pure black backgrounds (use `background` token)
- Mix warm and cool status colors arbitrarily
- Overuse pulsing animations
- Use bright colors without transparency on dark backgrounds
