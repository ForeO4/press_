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
│   └── theme-toggle.tsx ✅ (dark/light mode toggle)
├── providers/          # Context providers
│   └── ThemeProvider.tsx ✅ (next-themes wrapper)
├── auth/               # Authentication components
│   └── AuthHeader.tsx  ✅ (user display + logout)
├── events/             # Event management components
│   ├── EventForm.tsx   ✅ (reusable create/edit form)
│   └── CreateEventModal.tsx ✅ (create event dialog)
├── games/              # Games components
│   ├── GamesList.tsx   ✅
│   ├── GameCard.tsx    ✅
│   └── CreatePressModal.tsx ✅
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
├── scorecard/          # Scoring components
│   ├── ScorecardGrid.tsx
│   ├── HoleSelector.tsx
│   └── StrokeAdjuster.tsx
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
