# Architectural Decision Records (ADRs)

This document records significant architectural decisions made in Press!

## Template

See [_templates/adr.md](./_templates/adr.md) for the ADR template.

---

## ADR-001: Use Alligator Teeth as Fun Currency

**Status:** Accepted
**Date:** 2024-01-15
**Deciders:** Core Team

### Context
Press! needs a currency system for betting-style games within golf events. We need to decide between real money, virtual currency, or a fun-only system.

### Decision
Use "Alligator Teeth" as a fun-only virtual currency with no cash value.

### Consequences
- **Positive:** Avoids gambling regulations, keeps app fun and social
- **Positive:** Simplifies legal compliance
- **Negative:** Cannot monetize through currency exchange
- **Negative:** Users must understand Teeth have no real value

### Implementation
- All Teeth amounts are integers (no decimals)
- Double-entry ledger for audit trail
- Clear disclaimer on all settlement screens

---

## ADR-002: Stripe for Registration Only

**Status:** Accepted
**Date:** 2024-01-15
**Deciders:** Core Team

### Context
We need payment processing for event registration fees. We could use Stripe for all monetary transactions including game stakes.

### Decision
Use Stripe ONLY for event registration fees. All game stakes, calcuttas, and presses use Alligator Teeth.

### Consequences
- **Positive:** Clear separation of real money and fun currency
- **Positive:** Avoids gambling classification
- **Negative:** Cannot process real-money bets

---

## ADR-003: No GHIN Automation

**Status:** Accepted
**Date:** 2024-01-15
**Deciders:** Core Team

### Context
We could scrape GHIN data to auto-populate handicaps, but this may violate GHIN terms of service.

### Decision
No GHIN scraping or automation. Users manually enter their handicap information.

### Consequences
- **Positive:** No legal/TOS issues with GHIN
- **Positive:** Users control their own data
- **Negative:** More manual data entry
- **Negative:** Handicaps may be out of date

---

## ADR-004: Press as Child Game

**Status:** Accepted
**Date:** 2024-01-15
**Deciders:** Core Team

### Context
Presses need to be tracked in relation to their parent game. Options include flat game list, nested games, or separate press table.

### Decision
Model presses as child games with `parent_game_id` foreign key.

### Consequences
- **Positive:** Unified game model
- **Positive:** Easy to query all games including presses
- **Positive:** Natural hierarchy for UI rendering
- **Negative:** Slightly more complex queries for root games only

---

## ADR-005: Mock Mode for Development

**Status:** Accepted
**Date:** 2024-01-15
**Deciders:** Core Team

### Context
Developers need to run the app without setting up Supabase. We need a way to work on UI without backend.

### Decision
When `NEXT_PUBLIC_SUPABASE_URL` is empty, app runs in "mock mode" with static demo data.

### Consequences
- **Positive:** Zero-config local development
- **Positive:** Easy onboarding for new developers
- **Positive:** Can demo UI without backend
- **Negative:** Must maintain mock data in sync with schema

---

## ADR-006: Double-Entry Teeth Ledger

**Status:** Accepted
**Date:** 2024-01-15
**Deciders:** Core Team

### Context
We need to track Alligator Teeth transactions. Options include simple balance field, transaction log, or double-entry accounting.

### Decision
Implement double-entry accounting with `teeth_balances` (current state) and `teeth_ledger` (immutable log).

### Consequences
- **Positive:** Full audit trail
- **Positive:** Can reconstruct any point in time
- **Positive:** Catches balance discrepancies
- **Negative:** More complex than simple balance field

---

## ADR-007: Event Visibility Levels

**Status:** Accepted
**Date:** 2024-01-15
**Deciders:** Core Team

### Context
Events need different privacy levels. Some should be completely private, some shareable, some public.

### Decision
Three visibility levels: PRIVATE, UNLISTED, PUBLIC.

### Consequences
- **PRIVATE:** Members only, no share links work
- **UNLISTED:** Leaderboard via share links; feed/chat members-only
- **PUBLIC:** Leaderboard public; feed/chat still members-only

---

## ADR-008: Database-Driven Configuration

**Status:** Accepted
**Date:** 2026-01-25
**Deciders:** Core Team

### Context
Press! has various configurable elements: game types, scoring formats, betting structures, UI labels, and system settings. We need to decide between hardcoding these values or storing them in the database.

### Decision
All configurable data must be stored in the database and retrieved dynamically. No hardcoding of:
- Game types and rules
- Scoring formats and calculations
- Betting amounts and limits
- UI display text and labels
- System configuration values

### Consequences
- **Positive:** Change configuration without code deployment
- **Positive:** A/B testing and feature flags become trivial
- **Positive:** Different events can have different rules
- **Positive:** Admins can modify settings via UI
- **Negative:** More complex initial setup
- **Negative:** Requires configuration seeding strategy
- **Negative:** Slightly more database queries (mitigated by caching)

### Implementation
Configuration tables:
- `game_types` - Available game formats
- `scoring_formats` - Scoring calculation rules
- `system_config` - Key-value system settings
- `ui_strings` - Localizable UI text (future i18n)

Related: ADR-005 (Mock Mode must include config seeding)

---

## ADR-009: Local Development Only (No Cloud Deployment)

**Status:** Accepted
**Date:** 2026-01-27
**Deciders:** Project Owner

### Context
We explored deploying Press! to Vercel with Supabase backend for cloud hosting.

### Decision
Run Press! locally only. No Vercel deployment. No cloud hosting.

### Consequences
- **Positive:** Full control over environment
- **Positive:** No deployment complexity or costs
- **Positive:** Faster iteration during development
- **Negative:** Not accessible from other devices/users remotely

### How to Run
```bash
npm run dev
```
App runs at http://localhost:3000

---

## ADR-010: Manual Course Input Fallback

**Status:** Accepted
**Date:** 2026-01-27
**Deciders:** Project Owner

### Context
The course API may fail or return empty results, blocking users from completing event creation. Users need a way to proceed without course data.

### Decision
Add manual course input option in the CourseSelector component:
- When course API fails or returns empty, show "Enter course manually" option
- Manual input fields: Course Name (required), Slope Rating (required, default 113), Course Rating (optional)
- Toggle between course search and manual entry at any time

### Consequences
- **Positive:** Users can always complete event creation
- **Positive:** Graceful degradation when API fails
- **Positive:** Works offline/without course database
- **Negative:** Manual entries may have inconsistent data quality
- **Negative:** No hole-by-hole par information for manual courses

### Implementation
- `CourseSelector.tsx`: Manual input mode with toggle
- `StepCourse.tsx`: Accept either teeSetId or manualCourse data
- Continue button enabled with valid teeSetId OR valid manual course data
