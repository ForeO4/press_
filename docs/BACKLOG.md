# Press! Backlog

## Critical (Blocker)

### Event Page Not Fetching Real Data
- **Bug**: Event page shows "Event not found" after creating event in production
- **Root Cause**: `src/app/event/[eventId]/page.tsx` line 19 only uses mock data, never fetches from Supabase
- **Impact**: Blocks all event functionality (games, scores, invites)
- **Added**: 2026-01-27
- **Status**: In Progress

---

## High Priority

### GHIN Official API Integration (Phase 5-6)
- **Feature**: Connect to official USGA GHIN API for live handicap data
- **Context**: Now that local course database is in place (Phase 1-4 complete), next step is seed data import and official API connection
- **Remaining Work**:
  - Phase 5: Seed data import (local course database)
  - Phase 6: Official GHIN API application and integration
- **Added**: 2026-01-27
- **Status**: Backlog (Phase 1-4 Complete)

### Manual Course Input - Add Tee Selection
- **Feature**: Allow users to add multiple tees when entering course manually
- **Context**: Currently only slope/rating, need full tee sets (name, slope, rating, par, yardage)
- **Added**: 2026-01-27
- **Status**: Backlog

---

## Medium Priority

### Game Types UI Redesign
- **Feature**: Improve game type selection on Step 3 of event wizard
- **Requirements**:
  - Remove Banker from list
  - Show top 4 game types, rest in dropdown
  - Add favorites feature with croc/gator icon (like a star)
- **Added**: 2026-01-27
- **Status**: Backlog

---

## Low Priority

### Invite via Email/Phone
- **Feature**: Send event invites via email or phone number (not just link/code)
- **Added**: 2026-01-27
- **Status**: Backlog

---

## Completed

### Local Course Database & Handicap Calculator (2026-01-27)
- **Completed**: Phase 1-4 of GHIN Integration plan
- Search/create courses with full tee set data
- WHS formula for accurate course handicap
- Source tracking for future API integration
- **Remaining**: Phase 5-6 (Seed data import, Official API) - moved to High Priority

