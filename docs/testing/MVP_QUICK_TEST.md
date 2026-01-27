# Press! MVP Quick Test

## Test Info
| Field | Value |
|-------|-------|
| Test Run | MVP-YYYY-MM-DD-## |
| Tester | |
| Date | |
| Build/Commit | |
| Environment | [ ] Prod  [ ] Staging  [ ] Local |
| Browser/Device | |
| URL | https://press-4qf0.onrender.com/ |

---

## Test Flow
```
1. Sign In ──→ 2. Create Event ──→ 3. Invite Player
                        │
                        └──→ 4. Create Game ──→ 5. Enter Scores
```

---

## 1. Sign In
**Requires:** None (entry point)

- [ ] Page loads (may take 30s for Render wake-up)
- [ ] "Select a user" prompt visible at top
- [ ] Click a mock user name → user selected

| Result | User Selected |
|--------|---------------|
| [ ] Pass  [ ] Fail | |

---

## 2. Create an Event
**Requires:** Sign In (Step 1)

- [ ] Click "Create Event" or go to `/app/events/new`
- [ ] Enter event name
- [ ] Pick a date
- [ ] Click Next → Course step
- [ ] Click "Enter course manually"
- [ ] Enter course name + slope (e.g., 113)
- [ ] Click Next → Format step
- [ ] Click Next → Review step
- [ ] Click "Create Event" → Redirects to event page

| Result | Event Name | Event ID |
|--------|------------|----------|
| [ ] Pass  [ ] Fail | | |

---

## 3. Invite a Player
**Requires:** Create Event (Step 2)

- [ ] On event page, find invite button (person+ icon)
- [ ] Click → Modal shows invite link
- [ ] Copy link

| Result | Invite Link Works |
|--------|-------------------|
| [ ] Pass  [ ] Fail | [ ] Yes  [ ] No |

---

## 4. Create a Game
**Requires:** Create Event (Step 2)

- [ ] Go to Games tab
- [ ] Click "New Game"
- [ ] Select Player 1, Player 2
- [ ] Enter stake amount
- [ ] Click Create → Game appears in list

| Result | Players | Stakes |
|--------|---------|--------|
| [ ] Pass  [ ] Fail | vs | |

---

## 5. Enter Scores
**Requires:** Create Game (Step 4)

- [ ] Click into a game
- [ ] Tap a hole score cell
- [ ] Enter scores for both players
- [ ] Score saves and match status updates

| Result | Scores Saving |
|--------|---------------|
| [ ] Pass  [ ] Fail | [ ] Yes  [ ] No |

---

## Summary

| Step | Test | Status | Blocked By |
|------|------|:------:|------------|
| 1 | Sign In | | - |
| 2 | Create Event | | Step 1 |
| 3 | Invite Player | | Step 2 |
| 4 | Create Game | | Step 2 |
| 5 | Enter Scores | | Step 4 |

**Overall:** [ ] ALL PASS  [ ] Has Issues  [ ] BLOCKED

---

## Issues Found

| # | Description | Severity | Repro Steps |
|---|-------------|----------|-------------|
| 1 | | [ ] Blocker [ ] High [ ] Medium [ ] Low | |
| 2 | | [ ] Blocker [ ] High [ ] Medium [ ] Low | |
| 3 | | [ ] Blocker [ ] High [ ] Medium [ ] Low | |

---

## Console Errors
```

```

---

## Sign-Off
| Completed | Time Spent | Next Steps |
|-----------|------------|------------|
| | | |
