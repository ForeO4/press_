# Test Session: MVP Blocker Fixes (2026-01-27)

## Test Objective

Verify the critical MVP blocker fixes and UI improvements:

1. **RLS Policy Fix** - `threads_insert` policy added to unblock event creation
2. **Manual Course Input** - Fallback when course API fails or returns empty
3. **Sign-in Button** - "Select a user" prompt visible in mock mode
4. **RPC Permissions** - Grant execute on `rpc_create_event` to authenticated users
5. **Game Type Radio Buttons** - Single select instead of checkboxes
6. **Coming Soon Games** - Show future game types as disabled

**Previous Blockers:**
- Event creation failed silently (RLS policy missing)
- Event creation 403 error (RPC permissions not granted)
- Course selection step blocked when no courses in database
- Users confused by missing sign-in guidance in mock mode
- Game types allowed multi-select (should be single)

---

## Session Information

| Field | Value |
|-------|-------|
| **Tester Name** | brlim |
| **Date** | 2026-01-27 |
| **Start Time** | |
| **End Time** | |
| **Build/Commit** | `80c93c2` (feat: Game type radio buttons + Coming Soon games) |
| **Previous Commit** | `30e8d27` |
| **App URL** | https://press-4qf0.onrender.com/ |
| **Supabase Project** | njousvaobicmozxnzfaj |
| **Environment** | [x] Production  [ ] Staging  [ ] Local |
| **Device** | |
| **OS / Browser** | |

---

## What Changed (Files Modified)

| File | Change |
|------|--------|
| `supabase/migrations/0002_rls.sql` | Added `threads_insert` policy |
| `supabase/migrations/0005_fix_threads_rls.sql` | New migration for existing DBs |
| `supabase/migrations/0006_grant_rpc_permissions.sql` | Grant RPC execute to authenticated |
| `src/components/courses/CourseSelector.tsx` | Manual input mode + toggle |
| `src/components/events/wizard/StepCourse.tsx` | Accept manual course data |
| `src/components/events/wizard/StepRules.tsx` | Radio buttons + Coming Soon games |
| `src/components/auth/AuthHeader.tsx` | "Select a user" prompt |
| `src/lib/services/events.ts` | Better error messages |

---

## Results Summary

| # | Test Area | Pass | Fail | Blocked | Notes |
|---|-----------|:----:|:----:|:-------:|-------|
| 1 | Authentication | | | | |
| 2 | Event Creation | | | | |
| 3 | Manual Course Input | | | | |
| 4 | Game Type Radio Buttons | | | | |
| 5 | Coming Soon Games | | | | |
| 6 | Game Creation | | | | |
| 7 | Score Entry | | | | |
| 8 | Invite System | | | | |

**Overall:** [ ] PASS  [ ] PASS w/ Issues  [ ] FAIL  [ ] BLOCKED

---

## Test 1: Authentication (Fix #3 Verification)

**Objective:** Verify "Select a user" prompt appears in mock mode when no user selected

**Fix Being Tested:** `AuthHeader.tsx` - Added prompt when `isMockMode && !user`

| Step | Action | Expected | P/F |
|------|--------|----------|:---:|
| 1.1 | Load home page | Page loads, UserSwitcher visible | |
| 1.2 | Observe header (no user) | "Select a user above to continue" shown | |
| 1.3 | Click a mock user name | User highlighted/selected | |
| 1.4 | Navigate to `/app` | App home page loads | |

**Mock User Selected:**

```

```

**Issues:**

```

```

---

## Test 2: Event Creation (Fix #1 Verification)

**Objective:** Verify event creation completes without RLS errors

**Fix Being Tested:** `threads_insert` RLS policy - Event creation calls `rpc_create_event` which inserts into `event_threads`

**Previous Behavior:** Event creation failed silently, no event created

| Step | Action | Expected | P/F |
|------|--------|----------|:---:|
| 2.1 | Go to `/app/events/new` | Wizard Step 1 loads | |
| 2.2 | Enter event name | Text field accepts input | |
| 2.3 | Select event date | Date picker works | |
| 2.4 | Click "Next" | Step 2: Course Selection | |
| 2.5 | Skip or select course | Continue button enabled | |
| 2.6 | Click "Next" | Step 3: Format & Rules | |
| 2.7 | Configure game settings | Options respond correctly | |
| 2.8 | Click "Next" | Step 4: Review | |
| 2.9 | Click "Create Event" | Success, redirects to event | |

**Event Name:**

```

```

**Event ID (from URL):**

```

```

**Issues:**

```

```

---

## Test 3: Manual Course Input (Fix #2 Verification)

**Objective:** Verify manual course entry works when course API fails or returns empty

**Fix Being Tested:** `CourseSelector.tsx` - Manual input mode with toggle, `StepCourse.tsx` - Accept `manualCourse` data

**Previous Behavior:** Course step blocked if no courses in database (404 from API)

| Step | Action | Expected | P/F |
|------|--------|----------|:---:|
| 3.1 | On Step 2, find manual option | "Enter course manually" link visible | |
| 3.2 | Click manual entry link | Form switches to manual inputs | |
| 3.3 | Enter course name | Text accepted | |
| 3.4 | Enter slope rating | Number accepted (55-155) | |
| 3.5 | Enter course rating (optional) | Number accepted | |
| 3.6 | Click "Continue" | Proceeds to Step 3 | |
| 3.7 | Click "Search courses instead" | Toggles back to search | |

**Manual Course Name:**

```

```

**Slope Rating Entered:**

```

```

**Issues:**

```

```

---

## Test 4: Game Type Radio Buttons (Fix #5 Verification)

**Objective:** Verify game types use radio buttons (single select) instead of checkboxes

**Fix Being Tested:** `StepRules.tsx` - Changed from checkboxes to radio buttons

**Previous Behavior:** Checkboxes allowed multiple game types to be selected

| Step | Action | Expected | P/F |
|------|--------|----------|:---:|
| 4.1 | Go to `/app/events/new`, reach Step 3 | Rules page loads | |
| 4.2 | Observe game type controls | Radio buttons (circles), not checkboxes | |
| 4.3 | Check default selection | Nassau pre-selected | |
| 4.4 | Click "Match Play" | Match Play selected, Nassau deselects | |
| 4.5 | Click "Nassau" | Nassau selected, Match Play deselects | |
| 4.6 | Try to select both | Only one can be selected at a time | |

**Selected Game Type:**

```

```

**Issues:**

```

```

---

## Test 5: Coming Soon Games (Fix #6 Verification)

**Objective:** Verify future game types show as disabled with "Coming Soon" badge

**Fix Being Tested:** `StepRules.tsx` - Added coming soon games with disabled state

| Step | Action | Expected | P/F |
|------|--------|----------|:---:|
| 5.1 | On Step 3, view game type list | 9 game types visible | |
| 5.2 | Check available games | Match Play, Nassau are selectable | |
| 5.3 | Check Coming Soon badge | 7 games show "Coming Soon" badge | |
| 5.4 | Click a Coming Soon game (Skins) | Nothing happens (disabled) | |
| 5.5 | Verify all Coming Soon games | Skins, Wolf, Round Robin, 2 Man Low Ball, Banker, 2 Man Scramble, 9 Point | |

**Coming Soon Games Visible:**

```
[ ] Skins
[ ] Wolf
[ ] Round Robin
[ ] 2 Man Low Ball
[ ] Banker
[ ] 2 Man Scramble
[ ] 9 Point
```

**Issues:**

```

```

---

## Test 6: Game Creation (Regression)

**Objective:** Verify game creation still works after fixes (depends on event creation working)

| Step | Action | Expected | P/F |
|------|--------|----------|:---:|
| 6.1 | Go to event's Games tab | Games list loads | |
| 6.2 | Click "New Game" or "+" | Create modal opens | |
| 6.3 | Select "Match Play" | Game type selected | |
| 6.4 | Select Player A | Player added | |
| 6.5 | Select Player B | Player added | |
| 6.6 | Enter stakes amount | Number accepted | |
| 6.7 | Click "Create" | Game appears in list | |

**Game Type:**

```

```

**Players:**

```
                   vs
```

**Stakes (Gator Bucks):**

```

```

**Issues:**

```

```

---

## Test 7: Score Entry (Regression)

**Objective:** Verify score entry still works (depends on game creation working)

| Step | Action | Expected | P/F |
|------|--------|----------|:---:|
| 7.1 | Click game to open details | Game detail page loads | |
| 7.2 | Tap a score cell | Score entry modal opens | |
| 7.3 | Enter Player A score | Score saved | |
| 7.4 | Enter Player B score | Score saved | |
| 7.5 | Observe match status | Updates correctly (e.g., "1 UP") | |
| 7.6 | Enter scores for holes 1-9 | All scores persist | |

**Hole 1 Scores:**

```
Player A:       Player B:
```

**Match Status After Hole 1:**

```

```

**Issues:**

```

```

---

## Test 8: Invite System (Regression)

**Objective:** Verify invite system still works (depends on event creation working)

| Step | Action | Expected | P/F |
|------|--------|----------|:---:|
| 8.1 | Go to event Admin page | Admin page loads | |
| 8.2 | Find invite button (UserPlus icon) | Button visible in header | |
| 8.3 | Click to open invite modal | Modal with link appears | |
| 8.4 | Copy invite link | Link copied to clipboard | |
| 8.5 | Open link (incognito window) | Join page loads with event name | |

**Invite Link:**

```

```

**Event Code:**

```

```

**Issues:**

```

```

---

## Critical Issues Found

| # | Description | Severity | Steps to Reproduce |
|---|-------------|----------|-------------------|
| 1 | | [ ] Blocker  [ ] High | |
| 2 | | [ ] Blocker  [ ] High | |
| 3 | | [ ] Blocker  [ ] High | |

---

## Minor Issues / UX Feedback

| # | Description | Suggestion |
|---|-------------|------------|
| 1 | | |
| 2 | | |
| 3 | | |

---

## Console Errors

```



```

---

## Screenshots Attached

- [ ] Home page / user selection
- [ ] Event creation wizard
- [ ] Manual course input form
- [ ] Game creation modal
- [ ] Score entry with match status
- [ ] Invite modal

---

## Additional Notes

```




```

---

## Sign-Off

| Field | Value |
|-------|-------|
| **Tester Signature** | |
| **Date Completed** | |
| **Total Time Spent** | |
| **Recommended Next Steps** | |
