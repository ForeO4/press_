# Components

## Component Library

Using shadcn/ui as the base component library. Components are copied into the codebase and customized.

## Directory Structure

```
src/components/
├── ui/                 # Base UI components (shadcn)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── select.tsx
├── scorecard/          # Scoring components
│   ├── ScorecardGrid.tsx
│   ├── HoleSelector.tsx
│   └── StrokeAdjuster.tsx
├── games/              # Games components
│   ├── GamesList.tsx
│   ├── GameCard.tsx
│   ├── PressCard.tsx
│   └── CreatePressModal.tsx
├── settlement/         # Settlement components
│   ├── SettlementLedger.tsx
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

Using CSS variables for theming:

```css
:root {
  --primary: 142.1 76.2% 36.3%;
  --primary-foreground: 355.7 100% 97.3%;
  /* ... */
}
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
