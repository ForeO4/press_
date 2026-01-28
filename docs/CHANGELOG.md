# Changelog

All notable changes to Press! will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Create Game Flow - Empty Player Dropdowns** - Critical fix for production
  - Current user always appears in player dropdown even if membership query fails
  - Added diagnostic logging throughout player loading pipeline
  - `getEventMembers()` returns empty array on error instead of throwing (graceful degradation)
  - `createPlayer()` now properly logs and propagates errors
  - Empty state UI shows helpful message: "No players loaded. Use the + button to add players."
  - AddPlayerModal shows specific error messages instead of generic failure
  - Player dropdowns show "No players - click + to add" when empty

### Added
- **Local Course Database & WHS Calculator** - Foundation for official GHIN integration
  - Database: `source`, `verified`, `created_by` columns on courses
  - Database: `par`, `yardage`, `color` columns on tee_sets
  - Database: `source`, `home_course_id`, `last_verified_at` on handicap_profiles
  - WHS Formula: `Course Handicap = Index × (Slope/113) + (Rating - Par)`
  - CourseEntryForm: Full course entry with multiple tee sets
  - CourseSelector: Search-as-you-type with database persistence
  - Course search by name, city, state with auto-suggest
  - AddPlayerModal: Course handicap preview calculator
- **Manual Course Input Fallback** - Enter course details manually when API fails
  - CourseSelector shows "Enter course manually" option on error or empty results
  - Manual fields: Course Name, Slope Rating (55-155, default 113), Course Rating
  - Toggle between course search and manual entry
  - StepCourse accepts either teeSetId or manualCourse data
- **E2.2 Nassau Game Type** - Front 9 / Back 9 / Overall (3 bets in one)
  - `computeNassauSettlement()` - Computes 3 separate settlements
  - `computeHoleResultsForRange()` - Hole results for specific range
  - `computeMatchResultForRange()` - Match result for any hole range
  - SettleGameModal shows 3-box display for Nassau games
  - Total summary shows net teeth owed between players
  - GameScorecard stats box shows Front 9 / Back 9 / Overall status with gross scores
  - 5 new test cases for Nassau settlement scenarios
- **Score Entry UX Improvements**
  - "Enter → [Next Player]" button shows progression through players
  - "Save & Next Hole" on last player for clear flow
  - Larger, more prominent action button
- **Real Handicap System** - Database-backed handicaps replace mock values
  - `HandicapProfile` type - User's handicap index + GHIN number
  - `HandicapSnapshot` type - Frozen handicap for event duration
  - `src/lib/services/handicaps.ts` - Service layer for handicap operations
    - `getHandicapProfile()` - Get user's current handicap
    - `getHandicapSnapshot()` - Get frozen handicap for event
    - `createHandicapSnapshot()` - Freeze handicap when event starts
    - `calculateCourseHandicap()` - Formula: Index × (Slope / 113)
  - Game detail page now loads handicaps from database
  - Mock data support for demo mode with realistic handicaps
- **Augusta Green & Gold Theme** - Premium scorecard color scheme
  - Player A: Emerald (forest green) - `emerald-700` light / `emerald-400` dark
  - Player B: Amber (gold) - `amber-700` light / `amber-400` dark
  - Match status colors: Emerald when A leads, amber when B leads
  - Winner highlights: Golden circle with amber ring and background
  - Section headers: Emerald gradient backgrounds for Front 9/Back 9
  - Press rows: Amber gradient with flame icon
  - Full light/dark mode support throughout
- **UI/UX Fixes Round 4** - Scorecard enhancements based on user testing
  - **Handicap Stroke Dots** - Visual indicators (pops) on holes where player gets strokes
    - Dots appear in top-right corner of each relevant score cell
    - Primary color for Player A, blue for Player B
    - Shows on all stroke holes even before scores entered
  - **Gross/Net Score Display** - Shows "5/4" format on stroke holes
    - Gross score (dimmed), Net score (bold)
    - Score color based on net score vs par
  - **Player Handicaps in Scorecard** - Shows "(12)" next to player names
  - **Yardage Row** - Added hole yardages to scorecard header
  - **Match Stats Box** - Replaced simple totals with rich stats
    - Match Status (e.g., "Alex 13 UP")
    - Player stats (Gross score, Holes Won)
    - Summary (Par, Holes Played, Halved)
  - **Score Entry Width** - Limited modal width for better mobile UX
  - **Press Button Updates** - Flame icon with "Press!" text
- **UI/UX Fixes Round 3** - Based on user testing feedback from Round 2
  - **Score Persistence Bug Fix** (CRITICAL)
    - Fixed race condition in ScoreEntry where scores disappeared when switching players
    - ScoreEntry now uses Zustand store directly for real-time score display
  - **Scorecard Redesign**
    - Renamed SI (Stroke Index) to HCP (Handicap) throughout
    - Added HCP row in scorecard showing hole handicaps
    - Scorecard now visible by default (not hidden behind toggle)
    - Golden circle ring around winning scores for each hole
    - Winner row shows cumulative +/- status (e.g., +1, AS, -2)
    - Press rows (Press 1, Press 2) that start at their initiation hole
  - **Press Button Redesign** - Bold, animated, exciting
    - Amber/gold gradient theme with Flame icon
    - Animated sparkle effects and pulsing glow when expanded
    - Scale animation on confirm
    - Removed from Games list (only on game detail page)
  - **Score Entry UX**
    - Added prominent "Save Score" button below number pad
    - Enter key already saves
    - Cells clickable when scorecard is visible
- **UI/UX Overhaul** - Comprehensive improvements based on user testing feedback
  - **Create Game Modal Enhancements**
    - Multi-select contest types (Match Play, Nassau, Skins can be combined)
    - Net/Gross toggle per contest type
    - Fixed stake input to allow deleting first digit
    - Add New Player button with inline form
  - **Games Page Redesign**
    - `ActiveGameCard` component showing current hole, live status, "Continue" button
    - `RecentGameCard` component with date, result, teeth won/lost
    - Collapsible sections for Active Games and Recent
    - "View All History" link for completed games
    - Removed Press button from list view (moved to game detail)
  - **Scorecard Overhaul**
    - Sticky header with course info (par, yardage, stroke index)
    - `ScoreEntry` component with number pad and tap-to-select players
    - `GameTrackingRow` for live contest status with per-hole breakdown
    - `PressButton` with 1x/2x/3x/4x multiplier options
    - Prev/Next hole navigation
    - Toggle to show/hide full scorecard view
  - **End Game Screen**
    - Renamed "End Match" to "End Game" throughout
    - Player stats section (eagles, birdies, pars, bogeys, double+)
  - **Quick Fixes**
    - Draws now display as "-" instead of "="
    - Match results show as "+X" or "-X" instead of "W/T/L" format
- **Inline Score Editing** - Tap score cells in GameScorecard to edit directly from game detail page
  - Integrated ScoreEditorSheet with scorecard cells
  - Live score updates reflect immediately in match status
- **Game Detail Page** - Full game view at `/event/[eventId]/games/[gameId]`
  - `GameDetailHeader` - Hero section with players, avatars, match status, back navigation
  - `GameScorecard` - Mini 2-player scorecard with par-relative coloring
  - `HoleResultRow` - Winner indicators (A/B/tie) for each hole
  - Press creation from detail page
  - Placeholder for settlement modal
- **GameCard Navigation** - "Details" button now navigates to game detail page
- **Design System Overhaul** - Premium dark theme with glassmorphism effects
  - New color palette with semantic tokens (`src/lib/design/colors.ts`)
  - Bottom navigation with 4 main tabs (Home, Scores, Games, Social)
  - Admin/Settings moved to header icon buttons
- **New UI Components**
  - `BottomNav` - Mobile-first tab navigation with active state feedback
  - `PlayerAvatar` - Initials avatar with size/color variants
  - `PlayerAvatarGroup` - Overlapping avatar display with overflow indicator
  - `StatusPill` - Game type badges (Match Play, Nassau, Skins, Press)
  - `GameTypePill` - Convenience wrapper for game type display
  - `GameStatusBadge` - Active/completed/pending status indicator
  - `GameSummaryHeader` - Stats bar (active games, completed, total teeth)
  - `MatchProgress` - Hole-by-hole progress bar visualization
  - `MatchProgressCompact` - Inline compact version for cards
  - `MatchProgressDots` - Numbered hole circle visualization
- **Enhanced Games Page**
  - Redesigned `GameCard` with match status borders (winning/losing/tied)
  - Player rows with avatars and progress visualization
  - Nested press game display with purple accent
  - Redesigned `GamesList` with status grouping (Active/Complete sections)
  - Collapsible completed games section
  - Empty state with helpful messaging
- **Demo Mode** - Demo events (`demo-*`) work alongside Supabase with mock data
- **Scores Service** - `src/lib/services/scores.ts` with upsert/fetch operations
- **useScoreSync Hook** - Realtime score sync with debounced persistence
- **CourseSelector Component** - Course/tee selection UI for scorecard
- **Landing Page Try Demo** - "Try Demo" button for quick scorecard access
- **Scorecard Components** - Mobile-first score entry system
  - ScorecardTable, ScorecardRow, ScoreCell components
  - ScoreEditorSheet bottom sheet for score editing
  - ScoreAdjuster with +/- buttons, direct input, and quick-select
  - Direct score input with numeric keyboard on mobile
- **E1.1 Authentication** - Supabase Auth integration with email/password
  - AuthProvider context with session management
  - Login/signup pages with form validation
  - AuthHeader component with user display and logout
  - Mock mode authentication support
  - Middleware for protected routes
- **E1.2 Event Management** - Full event CRUD functionality
  - Event service layer (`src/lib/services/events.ts`)
  - CreateEventModal with form validation
  - EventForm reusable component (create/edit)
  - Event settings page with edit and delete
  - Settings tab added to event navigation
- **Dark Theme Support** - Full light/dark mode theming
  - ThemeProvider with next-themes integration
  - ThemeToggle component (sun/moon icons)
  - System preference detection with localStorage persistence
  - Enhanced dark mode color palette
- **Semantic Status Colors** - success, warning, info color tokens
  - Added to globals.css and tailwind.config.ts
  - Replaced hardcoded colors with semantic tokens
- Initial project setup with Next.js 14 App Router
- Supabase schema with core tables (events, games, scores)
- Alligator Teeth ledger system (double-entry accounting)
- Press mechanics for match play games
- Mock mode for development without backend
- Cloudflare R2 media proxy worker
- Documentation SSOT system

### Changed
- **"Settle Game" → "End Match"** - Renamed button and modal for clearer terminology
- **Mock Mode IDs** - Replaced `Date.now()` with `crypto.randomUUID()` for collision-free ID generation

### Fixed
- **Event Threads RLS Policy** - Added missing `threads_insert` policy that blocked event creation
  - Event creation via `rpc_create_event` creates a default "General" thread
  - Without INSERT policy, thread creation failed silently
- **Sign-in Button Visibility** - Fixed AuthHeader to show "Select a user" prompt in mock mode when no user selected
- **Handicap Stroke Calculation** - Fixed to use individual player handicap, not handicap difference
  - Strokes now based on each player's handicap vs hole HCP rating
  - Player gets stroke on hole if: holeHandicap <= playerHandicap
- **Score Box Width Consistency** - Fixed width variations in scorecard cells
- **Light/Dark Mode Colors** - Improved color contrast and visibility in both modes
- **Demo Mode with Supabase** - Demo events now work even when Supabase is configured
- **Dark Theme System Detection** - Theme toggle now uses `resolvedTheme` instead of `theme` to properly detect system dark mode preference
- **Docs Page Dark Mode** - Added dark mode classes to documentation page background, header, and info box
- **Landing Page Dark Mode** - Added dark mode background gradient and header with theme toggle

### Security
- RLS policies for all tables
- Event visibility controls (private, unlisted, public)
- Server-only environment validation

## [0.1.0] - 2025-01-25

### Added
- Project initialization with Next.js 14 App Router
- Full documentation structure (51 docs)
- Database schema with 3 migrations (init, RLS, RPCs)
- Domain logic for press creation and settlement computation
- 26 unit tests with Vitest
- Mock mode with demo data
- Cloudflare R2 media proxy worker scaffold
- UI components: Button, Card, Input, GameCard, CreatePressModal, SettlementLedger
- App routes: landing, dashboard, event pages (scorecard, games, settlement, feed, chat, admin)
- Zustand store setup
- TypeScript types for core entities

### Infrastructure
- Supabase integration setup
- Tailwind CSS with shadcn/ui patterns
- ESLint and Prettier configuration
