# Code Conventions

## Core Development Principles

### 1. Production-First Mindset
- Write every line as if it ships tomorrow
- Mock/dev code must be clearly isolated and NEVER leak to production
- Use environment detection (`isMockMode`) to gate dev-only features
- Test with production-like data and conditions

### 2. Security is Non-Negotiable
- Validate ALL user input at system boundaries
- Use Row-Level Security (RLS) - never trust client-side checks alone
- No secrets in code - use environment variables
- Follow principle of least privilege for all permissions
- See `/docs/04-security/` for detailed security requirements

### 3. Build for Change ("Living Code")
- Code will be read 10x more than written - prioritize clarity
- Use explicit types - no `any`, no implicit inference where ambiguous
- Small, focused functions over large monoliths
- Prefer composition over inheritance
- Delete dead code immediately - version control is your backup

### 4. Performance by Default
- Use Zustand selectors to prevent unnecessary re-renders
- Memoize expensive computations (`useMemo`, `useCallback`)
- Lazy load routes and heavy components
- Database queries: select only needed columns, use indexes

## Testing (Pinky & Brain Cycle)

### Pre-Commit: Run Brain
Before committing, run the Brain phase for fast feedback:

```bash
npm run cycle:brain
```

This runs lint, TypeScript checks, and unit tests. Fix all errors before committing.

### Pre-PR: Run Full Cycle
Before opening a PR, run the complete cycle:

```bash
npm run cycle:full
```

This runs Brain + Pinky E2E tests + Report generation.

**Requirements for PR:**
- Brain phase passes (lint, types, unit tests)
- Happy path tests pass (critical user flows)
- Narf failures documented (chaos tests may fail - that's expected)

### Test Categories

| Category | Purpose | Must Pass? |
|----------|---------|------------|
| Unit (Vitest) | Domain logic | Yes |
| Happy Path (Pinky) | User flows | Yes |
| Narf (Chaos) | Edge cases | No (but review) |

### Writing Tests

**Happy Path Tests:**
- Test what a naive user would do
- Capture screenshots at every step
- Use `PinkyScreenshot` helper

**Narf Tests:**
- Test what could break
- Security inputs (XSS, SQL injection)
- Timing edge cases (rapid clicks, race conditions)
- Navigation abuse (back button, deep links)

### Viewing Results

After running Pinky:
- HTML Report: `pinky/html-report/index.html`
- Markdown Report: `pinky/PINKY_REPORT.md`
- Screenshots: `pinky/results/screenshots/`

## TypeScript

### Strict Mode

TypeScript strict mode is enabled. No `any` types.

```typescript
// Bad
const data: any = fetchData();

// Good
const data: unknown = fetchData();
if (isValidData(data)) {
  // use data
}
```

### Type Definitions

```typescript
// Types in src/types/
export interface Game {
  id: string;
  eventId: string;
  type: GameType;
  // ...
}

export type GameType = 'match_play' | 'nassau' | 'skins';
```

### Alligator Teeth

Always use integers for Teeth amounts:

```typescript
// Type alias for clarity
type AlligatorTeeth = number;

// Validate on input
function validateTeethAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount >= 0;
}
```

## React

### Functional Components

Always use functional components with hooks:

```typescript
// Good
export function GameCard({ game, onPress }: GameCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (/* ... */);
}

// Bad - class components
class GameCard extends React.Component { }
```

### Props Interface

Define props interface above component:

```typescript
interface GameCardProps {
  game: Game;
  onPress: () => void;
  canPress: boolean;
}

export function GameCard({ game, onPress, canPress }: GameCardProps) {
  // ...
}
```

### Event Handlers

Prefix with `handle`:

```typescript
function GameCard({ onPress }: Props) {
  const handleClick = () => {
    // do something
    onPress();
  };

  return <button onClick={handleClick}>Press</button>;
}
```

## File Organization

### Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `camelCase.ts`
- Tests: `*.test.ts` or `*.test.tsx`

### Exports

Named exports for most things:

```typescript
// Good
export function GameCard() { }
export interface Game { }

// Bad (except for pages)
export default function GameCard() { }
```

## Styling

### Tailwind Classes

Order: layout → spacing → sizing → visual

```tsx
<div className="flex items-center gap-4 p-4 w-full bg-card rounded-lg shadow">
```

### No Magic Numbers

Use Tailwind scale or CSS variables:

```tsx
// Good
<div className="p-4 text-lg">

// Bad
<div style={{ padding: '17px', fontSize: '19px' }}>
```

## Database

### Column Naming

- Snake case: `event_id`, `created_at`
- `_int` suffix for integer amounts: `stake_teeth_int`

### RLS

Always have RLS policies. Never bypass in client code.

## Git

### Commit Messages

Follow conventional commits:

```
feat: add press creation modal
fix: correct teeth balance calculation
docs: update API contracts
refactor: extract settlement logic
```

### Branch Naming

```
feat/press-creation
fix/teeth-balance
docs/api-update
```

## Error Handling

### User-Facing Errors

Show friendly messages:

```typescript
try {
  await createPress(input);
} catch (error) {
  toast.error('Could not create press. Please try again.');
  console.error('Press creation failed:', error);
}
```

### API Errors

Return structured errors:

```typescript
return Response.json({
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Stake cannot be negative',
  }
}, { status: 400 });
```

## Configuration & Data

### No Hardcoding Rule

Never hardcode values that could change or vary by context:

```typescript
// BAD - hardcoded game types
const GAME_TYPES = ['match_play', 'nassau', 'skins'];

// GOOD - fetch from database
const gameTypes = await db.from('game_types').select('*');
```

### What Must Be Database-Driven

| Category | Examples | Table |
|----------|----------|-------|
| Game configuration | Game types, scoring formats, press rules | `game_types`, `scoring_formats` |
| Betting/currency | Default stakes, limits, payout structures | `system_config`, event-level settings |
| UI/display | Labels, messages, dropdown options | `ui_strings` (future), `system_config` |
| Feature flags | Enabled features per event/user | `system_config`, `event_settings` |

### Exceptions (OK to hardcode)

- TypeScript type definitions (derived from DB schema)
- Enum validation (must match DB constraints)
- Mathematical constants
- Security-critical values (e.g., max retry attempts)

### Caching Strategy

```typescript
// Use React Query or similar for config caching
const { data: gameTypes } = useQuery({
  queryKey: ['config', 'gameTypes'],
  queryFn: () => fetchGameTypes(),
  staleTime: 5 * 60 * 1000, // 5 min cache
});
```
