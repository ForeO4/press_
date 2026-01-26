# Components

## Component Library

Using shadcn/ui as the base component library. Components are copied into the codebase and customized.

## Directory Structure

### Implemented ✅

```
src/components/
├── ui/                 # Base UI components (shadcn)
│   ├── button.tsx      ✅
│   ├── card.tsx        ✅
│   ├── input.tsx       ✅
│   ├── theme-toggle.tsx ✅ (dark/light mode toggle)
│   ├── PlayerAvatar.tsx ✅ (initials avatar with variants)
│   └── StatusPill.tsx  ✅ (game type badges)
├── nav/                # Navigation components
│   └── BottomNav.tsx   ✅ (mobile bottom tab navigation)
├── providers/          # Context providers
│   └── ThemeProvider.tsx ✅ (next-themes wrapper)
├── auth/               # Authentication components
│   └── AuthHeader.tsx  ✅ (user display + logout)
├── events/             # Event management components
│   ├── EventForm.tsx   ✅ (reusable create/edit form)
│   └── CreateEventModal.tsx ✅ (create event dialog)
├── games/              # Games components
│   ├── GamesList.tsx   ✅ (status-grouped game list)
│   ├── GameCard.tsx    ✅ (redesigned with match status)
│   ├── GameSummaryHeader.tsx ✅ (stats bar)
│   ├── MatchProgress.tsx ✅ (hole-by-hole progress)
│   ├── CreatePressModal.tsx ✅
│   ├── GameDetailHeader.tsx ✅ (detail page hero)
│   ├── GameScorecard.tsx ✅ (2-player mini scorecard)
│   └── HoleResultRow.tsx ✅ (winner indicators)
├── settlement/         # Settlement components
│   └── SettlementLedger.tsx ✅
└── UserSwitcher.tsx    ✅ (dev tool for mock mode)
```

### Planned (v1.0)

```
src/components/
├── ui/                 # Additional UI components
│   ├── dialog.tsx
│   └── select.tsx
├── scorecard/          # Scoring components ✅
│   ├── ScorecardTable.tsx ✅
│   ├── ScorecardRow.tsx ✅
│   ├── ScoreCell.tsx ✅
│   ├── ScoreEditorSheet.tsx ✅
│   └── ScoreAdjuster.tsx ✅ (direct input + quick-select)
├── games/
│   └── PressCard.tsx
├── settlement/
│   └── ComputeSettlementBtn.tsx
├── feed/               # Social feed components
│   ├── FeedList.tsx
│   └── PostComposer.tsx
├── chat/               # Chat components
│   ├── ChatThread.tsx
│   └── ChatInput.tsx
└── admin/              # Admin components
    ├── LockToggle.tsx
    └── PressRulesSettings.tsx
```

## Key Components

### ScorecardGrid

4-player scorecard display.

```tsx
interface ScorecardGridProps {
  players: Player[];
  scores: HoleScore[];
  onScoreChange: (roundId: string, hole: number, strokes: number) => void;
  currentUserId: string;
}
```

### GameCard

Individual game display with press support.

```tsx
interface GameCardProps {
  game: Game;
  participants: GameParticipant[];
  scores: HoleScore[];
  onPress: () => void;
  canPress: boolean;
}
```

### CreatePressModal

Modal for creating a press.

```tsx
interface CreatePressModalProps {
  parentGame: Game;
  currentHole: number;
  onSubmit: (input: CreatePressInput) => void;
  onClose: () => void;
}
```

### SettlementLedger

Settlement display table.

```tsx
interface SettlementLedgerProps {
  settlements: Settlement[];
  currentUserId: string;
}
```

### ComputeSettlementBtn

Button to trigger settlement computation.

```tsx
interface ComputeSettlementBtnProps {
  eventId: string;
  onComputed: (settlements: Settlement[]) => void;
  disabled: boolean;
}
```

---

## Navigation Components

### BottomNav

Mobile-first bottom tab navigation with 4 main tabs.

```tsx
interface BottomNavProps {
  eventId: string;
}

// Tabs: Home, Scores, Games, Social
// Active state with primary color highlight and scale animation
// Glassmorphism background with backdrop blur
```

**Features:**
- Fixed bottom position with safe area padding for notched devices
- Active tab indication with background highlight and icon scale
- Icons: Flag (Home), LayoutGrid (Scores), Swords (Games), MessageCircle (Social)

---

## UI Components

### PlayerAvatar

Initials-based avatar with size and color variants.

```tsx
interface PlayerAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';  // default: 'md'
  color?: 'primary' | 'secondary' | 'accent' | 'muted';  // default: 'primary'
  className?: string;
}

// Size classes: sm=h-6, md=h-8, lg=h-10
// Extracts 2-char initials from name
```

### PlayerAvatarGroup

Displays multiple overlapping avatars with overflow indicator.

```tsx
interface PlayerAvatarGroupProps {
  names: string[];
  size?: 'sm' | 'md' | 'lg';
  max?: number;  // default: 4, shows "+N" overflow
  className?: string;
}
```

### StatusPill

Color-coded badge for game types and statuses.

```tsx
interface StatusPillProps {
  variant: 'match_play' | 'nassau' | 'skins' | 'press' | 'active' | 'completed';
  children: React.ReactNode;
  size?: 'sm' | 'md';  // default: 'sm'
  className?: string;
}
```

**Variant Colors:**
- `match_play` - Emerald green
- `nassau` - Blue
- `skins` - Amber
- `press` - Purple
- `active` - Green
- `completed` - Muted gray

### GameTypePill

Convenience wrapper for game type badges.

```tsx
interface GameTypePillProps {
  type: string;  // 'match_play' | 'nassau' | 'skins'
  isPress?: boolean;  // Shows "Press" label with purple styling
  className?: string;
}
```

### GameStatusBadge

Status indicator for game state.

```tsx
interface GameStatusBadgeProps {
  status: 'active' | 'completed' | 'pending';
  className?: string;
}
```

---

## Games Components

### GameSummaryHeader

Stats bar showing active/complete game counts and total teeth at stake.

```tsx
interface GameSummaryHeaderProps {
  activeCount: number;
  completedCount: number;
  totalTeeth: number;
  className?: string;
}
```

**Display:**
- Active games with Gamepad2 icon (green)
- Completed games with CheckCircle2 icon (muted)
- Total teeth with emoji and primary color

### MatchProgress

Hole-by-hole progress visualization for match play games.

```tsx
interface MatchProgressProps {
  game: Game;
  playerAId: string;
  playerBId: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
  playerAName: string;
  playerBName: string;
  showDots?: boolean;  // default: true
  className?: string;
}
```

**Status Display:**
- "Not started" (muted)
- "All Square thru N" (amber)
- "PlayerName N UP thru N" (green for leading, red for trailing)

**Progress Bar:**
- Segmented bar with color-coded hole results
- Green = Player A won, Red = Player B won, Gray = Tie, Muted = Unplayed

### MatchProgressCompact

Inline compact version for card headers.

```tsx
interface MatchProgressCompactProps {
  game: Game;
  playerAId: string;
  playerBId: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
  playerAName: string;
  playerBName: string;
}
```

### MatchProgressDots

Alternative visualization with numbered hole circles.

```tsx
interface MatchProgressDotsProps {
  game: Game;
  playerAId: string;
  playerBId: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
}
```

### GameCard (Updated)

Redesigned game card with match status borders and player avatars.

```tsx
interface GameCardProps {
  game: GameWithParticipants;
  eventId?: string;  // Enables navigation to detail page
  canPress: boolean;
  onPress: () => void;
  isNested?: boolean;  // For nested press games
  scores?: Record<string, HoleScore[]>;
}
```

**Features:**
- Left border color indicates match status (winning/losing/tied/not started)
- Header row with game type pill and teeth stake
- Player section with avatars and match progress
- Footer with hole range and action buttons
- Nested display for child press games (purple left border)

### GamesList (Updated)

Status-grouped game list with collapsible sections.

```tsx
interface GamesListProps {
  games: GameWithParticipants[];
  eventId?: string;
  canPress: boolean;
  onPress: (gameId: string) => void;
  scores?: Record<string, HoleScore[]>;
}
```

**Features:**
- GameSummaryHeader at top
- "Active Games" section with Flame icon
- "Completed" section with collapsible toggle
- Empty state with helpful message

---

## Game Detail Components

### GameDetailHeader

Hero section for game detail page with players and match status.

```tsx
interface GameDetailHeaderProps {
  game: GameWithParticipants;
  eventId: string;
  playerAName: string;
  playerBName: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
}
```

**Features:**
- Back button with navigation to games list
- Game type pill and stake display
- Large player avatars with names
- Live indicator for active games
- Match progress bar (for match play)

### GameScorecard

Mini 2-player scorecard for game detail view.

```tsx
interface GameScorecardProps {
  game: Game;
  playerAId: string;
  playerBId: string;
  playerAName: string;
  playerBName: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
  holes: HoleSnapshot[];
  className?: string;
}
```

**Features:**
- Front 9 and Back 9 sections
- Par row with totals
- Player score rows with par-relative coloring (eagle, birdie, par, bogey, double+)
- HoleResultRow showing winner for each hole
- Grayed out holes outside game's range
- Total scores summary

### HoleResultRow

Row showing who won each hole in a match.

```tsx
interface HoleResultRowProps {
  holes: HoleSnapshot[];
  holeResults: HoleResult[];
  isHoleInRange: (holeNum: number) => boolean;
}
```

**Display:**
- "A" for Player A wins (green)
- "B" for Player B wins (red)
- "=" for ties (gray)
- "-" for unplayed holes
- Summary in total column (A wins / ties / B wins)

## Styling Conventions

### Tailwind

Use Tailwind CSS utilities:

```tsx
<button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
  Click me
</button>
```

### Color System

Using CSS variables for theming with dark mode support via `next-themes`:

```css
:root {
  --primary: 142.1 76.2% 36.3%;
  --primary-foreground: 355.7 100% 97.3%;
  --success: 142.1 76.2% 36.3%;
  --success-foreground: 355.7 100% 97.3%;
  --warning: 38 92% 50%;
  --warning-foreground: 38 92% 10%;
  --info: 199 89% 48%;
  --info-foreground: 199 89% 10%;
  /* ... */
}

.dark {
  /* Enhanced dark mode palette */
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
  /* ... */
}
```

Use semantic tokens instead of hardcoded colors:
```tsx
// Good - uses semantic tokens
<span className="bg-success/20 text-success">PUBLIC</span>
<span className="bg-warning/10 text-warning-foreground">Warning</span>

// Bad - hardcoded colors
<span className="bg-green-100 text-green-800">PUBLIC</span>
```

### Responsive Design

Mobile-first approach:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* ... */}
</div>
```

## Mock Mode Support

Components should work with mock data:

```tsx
const GamesList = ({ eventId }: Props) => {
  const games = useMockMode()
    ? mockGames
    : useGames(eventId);

  return (/* ... */);
};
```
