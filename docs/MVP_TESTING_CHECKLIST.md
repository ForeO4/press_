# MVP Manual Testing Checklist

## Deployment Info
- **App URL**: https://press-4qf0.onrender.com/
- **Supabase Project**: https://njousvaobicmozxnzfaj.supabase.co
- **Tester**: brlim
- **Date**: 2026-01-27
- **Build Version**: f6a0ff5 (feat: Add MVP features)

---

## Pre-Test Setup

### Environment Verification
- [ ] App loads at production URL
- [ ] No console errors on initial load
- [ ] HTTPS certificate is valid

**Notes**:
```
_________________________________________________________________
```

---

## 1. Authentication Flow

### 1.1 Sign Up (New User)
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1.1.1 | Navigate to `/auth/signup` | Signup form displays | | |
| 1.1.2 | Enter valid email | Email field accepts input | | |
| 1.1.3 | Enter password (min 6 chars) | Password field accepts input | | |
| 1.1.4 | Click "Sign Up" | Loading state shows | | |
| 1.1.5 | Check email inbox | Confirmation email received | | |
| 1.1.6 | Click confirmation link | Redirects to app | | |
| 1.1.7 | Verify logged in state | User menu shows email/name | | |

**Test Email Used**: ___________________
**Screenshot**: [ ] Attached

---

### 1.2 Sign In (Existing User)
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1.2.1 | Navigate to `/auth/login` | Login form displays | | |
| 1.2.2 | Enter registered email | Email field accepts input | | |
| 1.2.3 | Enter correct password | Password field accepts input | | |
| 1.2.4 | Click "Sign In" | Loading state, then redirect | | |
| 1.2.5 | Verify redirect to `/app` | App home page loads | | |
| 1.2.6 | Check auth state persists | Refresh page, still logged in | | |

**Screenshot**: [ ] Attached

---

### 1.3 Sign Out
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1.3.1 | Click user menu / sign out | Sign out option visible | | |
| 1.3.2 | Confirm sign out | Redirects to login page | | |
| 1.3.3 | Try accessing `/app` | Redirects to login | | |

---

### 1.4 Protected Routes
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1.4.1 | While logged out, go to `/app` | Redirects to `/auth/login` | | |
| 1.4.2 | While logged out, go to `/event/demo-123` | Redirects to `/auth/login` | | |
| 1.4.3 | While logged in, go to `/auth/login` | Redirects to `/app` | | |

---

## 2. Event Creation Wizard

### 2.1 Step 1: Event Basics
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 2.1.1 | Navigate to `/app/events/new` | Wizard Step 1 displays | | |
| 2.1.2 | Progress indicator shows Step 1 | "Basics" highlighted | | |
| 2.1.3 | Enter event name | Text input works | | |
| 2.1.4 | Enter description | Textarea works | | |
| 2.1.5 | Select start date | Date picker works | | |
| 2.1.6 | Select end date | Date picker works | | |
| 2.1.7 | Click "Next" | Proceeds to Step 2 | | |

**Event Name Used**: ___________________

---

### 2.2 Step 2: Course Selection
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 2.2.1 | Course search field visible | Search input displays | | |
| 2.2.2 | Type course name | Search results appear | | |
| 2.2.3 | Select a course | Course details show | | |
| 2.2.4 | Tee set dropdown appears | Multiple tee options | | |
| 2.2.5 | Select a tee set | Tee set highlighted | | |
| 2.2.6 | Click "Next" | Proceeds to Step 3 | | |
| 2.2.7 | **OR** Click "Enter course manually" | Manual input form appears | | |
| 2.2.8 | Enter course name | Text input works | | |
| 2.2.9 | Enter slope rating (default 113) | Number input works | | |
| 2.2.10 | Click "Next" with manual data | Proceeds to Step 3 | | |

**Course Selected**: ___________________ (or "Manual Entry")
**Tee Set Selected**: ___________________
**Manual Course Name**: ___________________
**Manual Slope Rating**: ___________________

---

### 2.3 Step 3: Format & Rules
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 2.3.1 | Game types displayed | Match Play, Nassau visible | | |
| 2.3.2 | Toggle game types | Can enable/disable | | |
| 2.3.3 | Default stakes input | Can set dollar amount | | |
| 2.3.4 | Auto-press toggle | Can enable/disable | | |
| 2.3.5 | Auto-press threshold | Can set "X down" value | | |
| 2.3.6 | Click "Next" | Proceeds to Step 4 | | |

**Settings Chosen**:
- Game Types: ___________________
- Default Stakes: $___________________
- Auto-Press Enabled: [ ] Yes [ ] No
- Auto-Press Threshold: ___ down

---

### 2.4 Step 4: Review & Create
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 2.4.1 | Review summary displays | All entered info shown | | |
| 2.4.2 | Event name correct | Matches Step 1 input | | |
| 2.4.3 | Course/tee correct | Matches Step 2 selection | | |
| 2.4.4 | Rules correct | Matches Step 3 settings | | |
| 2.4.5 | Click "Create Event" | Loading state shows | | |
| 2.4.6 | Success feedback | Event created message | | |
| 2.4.7 | Redirect to event page | `/event/[eventId]` loads | | |

**Created Event ID**: ___________________
**Screenshot**: [ ] Attached

---

## 3. Invite System

### 3.1 Generate Invite Link
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 3.1.1 | Go to event settings/admin | Admin page loads | | |
| 3.1.2 | Find "Invite" or "Share" button | Button visible | | |
| 3.1.3 | Click to open invite modal | Modal opens | | |
| 3.1.4 | Invite link displayed | URL with token shown | | |
| 3.1.5 | Copy link button | Copies to clipboard | | |
| 3.1.6 | Event code displayed | 6-character code shown | | |

**Invite Link**: ___________________
**Event Code**: ___________________

---

### 3.2 Join via Invite Link
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 3.2.1 | Open invite link (logged out) | Prompt to sign in | | |
| 3.2.2 | Sign in or create account | Auth flow completes | | |
| 3.2.3 | Redirect back to invite | Join confirmation page | | |
| 3.2.4 | Event name displayed | Correct event shown | | |
| 3.2.5 | Click "Join Event" | Joining in progress | | |
| 3.2.6 | Success message | Now a member | | |
| 3.2.7 | Redirect to event | Event home loads | | |

**Test User Email**: ___________________
**Screenshot**: [ ] Attached

---

### 3.3 Join via Event Code
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 3.3.1 | Navigate to `/join` | Code entry page loads | | |
| 3.3.2 | Enter valid event code | Code input accepts | | |
| 3.3.3 | Click "Join" | Validation happens | | |
| 3.3.4 | If valid, show event details | Event name displayed | | |
| 3.3.5 | Confirm join | Join successful | | |
| 3.3.6 | Error for invalid code | "Code not found" error | | |

**Code Tested**: ___________________
**Screenshot**: [ ] Attached

---

## 4. Game Flow (Match Play)

### 4.1 Create Match Play Game
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 4.1.1 | Navigate to event games tab | Games list page loads | | |
| 4.1.2 | Click "New Game" or "+" | Create game modal opens | | |
| 4.1.3 | Select "Match Play" type | Match Play selected | | |
| 4.1.4 | Select Player 1 | Player added | | |
| 4.1.5 | Select Player 2 | Player added | | |
| 4.1.6 | Set stakes amount | Dollar value entered | | |
| 4.1.7 | Click "Create Game" | Game created | | |
| 4.1.8 | Game appears in list | Status shows "In Progress" | | |

**Game ID**: ___________________
**Players**: ___________________ vs ___________________
**Stakes**: $___________________

---

### 4.2 Enter Scores (Match Play)
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 4.2.1 | Open game detail page | Score entry visible | | |
| 4.2.2 | Enter hole 1 scores | Both player scores saved | | |
| 4.2.3 | Match status updates | Shows "1 UP" or "AS" | | |
| 4.2.4 | Enter holes 2-9 (front 9) | All scores saved | | |
| 4.2.5 | Match status accurate | Correct up/down count | | |
| 4.2.6 | Enter holes 10-18 | Back 9 scores saved | | |
| 4.2.7 | Final match result shows | Winner determined | | |

**Hole-by-Hole Results** (optional):
```
Hole:  1  2  3  4  5  6  7  8  9 | 10 11 12 13 14 15 16 17 18
P1:    _  _  _  _  _  _  _  _  _ |  _  _  _  _  _  _  _  _  _
P2:    _  _  _  _  _  _  _  _  _ |  _  _  _  _  _  _  _  _  _
```

**Final Result**: ___________________
**Screenshot**: [ ] Attached

---

### 4.3 Auto-Press Trigger
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 4.3.1 | One player goes 2 down | Auto-press triggers | | |
| 4.3.2 | Press notification appears | "Press created" message | | |
| 4.3.3 | Press game shows in UI | Child game visible | | |
| 4.3.4 | Press stakes correct | Same as parent game | | |

**Press Created at Hole**: ___________________

---

### 4.4 Settle Match Play Game
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 4.4.1 | All 18 holes entered | Game ready to settle | | |
| 4.4.2 | Click "Settle" or similar | Settlement screen shows | | |
| 4.4.3 | Winner amount displayed | Correct calculation | | |
| 4.4.4 | Loser amount displayed | Correct calculation | | |
| 4.4.5 | Confirm settlement | Balances updated | | |
| 4.4.6 | Game status changes | Shows "Settled" | | |

**Settlement Amount**: $___________________
**Winner**: ___________________

---

## 5. Game Flow (Nassau)

### 5.1 Create Nassau Game
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 5.1.1 | Click "New Game" | Create game modal | | |
| 5.1.2 | Select "Nassau" type | Nassau selected | | |
| 5.1.3 | Select players | Both players added | | |
| 5.1.4 | Set stakes (per bet) | e.g., $5 per bet | | |
| 5.1.5 | Create game | Nassau game created | | |

**Nassau Game ID**: ___________________
**Stakes Per Bet**: $___________________

---

### 5.2 Nassau Score Entry
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 5.2.1 | Enter front 9 scores | Scores saved | | |
| 5.2.2 | Front 9 winner shown | Correct determination | | |
| 5.2.3 | Enter back 9 scores | Scores saved | | |
| 5.2.4 | Back 9 winner shown | Correct determination | | |
| 5.2.5 | Overall winner shown | Total match result | | |

**Results**:
- Front 9 Winner: ___________________
- Back 9 Winner: ___________________
- Overall Winner: ___________________

---

### 5.3 Nassau Press
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 5.3.1 | Create manual press | Press game created | | |
| 5.3.2 | Press shows in UI | Linked to parent Nassau | | |
| 5.3.3 | Enter press scores | Separate tracking | | |

---

### 5.4 Settle Nassau
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 5.4.1 | View settlement breakdown | Front/Back/Total shown | | |
| 5.4.2 | 3 potential bets visible | $X each (3x stakes) | | |
| 5.4.3 | Presses included | If any, added to total | | |
| 5.4.4 | Confirm settlement | All bets settled | | |

**Total Settlement**: $___________________
**Screenshot**: [ ] Attached

---

## 6. Event Feed

### 6.1 View Feed
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 6.1.1 | Navigate to Feed tab | Feed page loads | | |
| 6.1.2 | Posts display in list | Chronological order | | |
| 6.1.3 | System posts visible | Game events shown | | |
| 6.1.4 | User posts visible | Member posts shown | | |

---

### 6.2 Create Post
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 6.2.1 | Find "New Post" or composer | Input area visible | | |
| 6.2.2 | Type post content | Text input works | | |
| 6.2.3 | Submit post | Post appears in feed | | |
| 6.2.4 | Post shows author | Your name displayed | | |
| 6.2.5 | Post shows timestamp | "Just now" or similar | | |

**Post Content**: ___________________

---

### 6.3 Reactions (Like)
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 6.3.1 | Find like button on post | Heart/thumbs icon visible | | |
| 6.3.2 | Click to like | Like count increases | | |
| 6.3.3 | Icon changes state | Filled/highlighted | | |
| 6.3.4 | Click again to unlike | Like count decreases | | |

---

### 6.4 Comments
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 6.4.1 | Click comment icon/area | Comment input appears | | |
| 6.4.2 | Type comment | Text input works | | |
| 6.4.3 | Submit comment | Comment appears on post | | |
| 6.4.4 | Comment shows author | Your name displayed | | |
| 6.4.5 | Comment count updates | Incremented by 1 | | |

**Comment Content**: ___________________
**Screenshot**: [ ] Attached

---

## 7. Leaderboard

### 7.1 View Leaderboard
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 7.1.1 | Navigate to Leaderboard tab | Page loads | | |
| 7.1.2 | Player list displays | All event members shown | | |
| 7.1.3 | Rankings by net bucks | Sorted correctly | | |
| 7.1.4 | Your position highlighted | Can find yourself | | |

---

### 7.2 Leaderboard Accuracy
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 7.2.1 | Check winner's balance | Increased after settlement | | |
| 7.2.2 | Check loser's balance | Decreased after settlement | | |
| 7.2.3 | Net change accurate | Matches game results | | |
| 7.2.4 | Statistics correct | Wins/losses/pushes | | |

**Leaderboard State After Games**:
| Rank | Player | Net Change | W/L/P |
|------|--------|------------|-------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

**Screenshot**: [ ] Attached

---

## 8. Gator Bucks

### 8.1 View Balance
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 8.1.1 | Find balance display | Current balance shown | | |
| 8.1.2 | Starting balance correct | 100 Bucks (or configured) | | |
| 8.1.3 | Balance updates after game | Reflects win/loss | | |

**Current Balance**: ___________________ Bucks

---

### 8.2 Transaction History
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 8.2.1 | Navigate to history/ledger | Transaction list loads | | |
| 8.2.2 | Initial credit shown | Starting balance entry | | |
| 8.2.3 | Game settlements shown | Win/loss entries | | |
| 8.2.4 | Amounts correct | Matches game stakes | | |
| 8.2.5 | Timestamps present | Chronological order | | |

**Screenshot**: [ ] Attached

---

## 9. Notifications

### 9.1 Notification Bell
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 9.1.1 | Bell icon visible in header | Icon displays | | |
| 9.1.2 | Unread count badge | Number shows if > 0 | | |
| 9.1.3 | Click bell | Dropdown opens | | |

---

### 9.2 Notification Types
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 9.2.1 | Score entered notification | Shows when scores added | | |
| 9.2.2 | Press created notification | Shows on auto-press | | |
| 9.2.3 | Game settled notification | Shows on settlement | | |
| 9.2.4 | New game notification | Shows when game created | | |

---

### 9.3 Mark as Read
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 9.3.1 | Click notification | Marks as read | | |
| 9.3.2 | "Mark all read" option | All notifications read | | |
| 9.3.3 | Badge count updates | Decreases/disappears | | |

**Screenshot**: [ ] Attached

---

## 10. Mobile Responsiveness

### 10.1 Key Pages on Mobile
| Page | Displays Correctly | Usable | Notes |
|------|-------------------|--------|-------|
| Login | | | |
| Signup | | | |
| App Home | | | |
| Event Home | | | |
| Games List | | | |
| Game Detail | | | |
| Score Entry | | | |
| Feed | | | |
| Leaderboard | | | |

**Device/Viewport Tested**: ___________________
**Screenshot**: [ ] Attached

---

## 11. Error Handling

### 11.1 Network Errors
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 11.1.1 | Disconnect network | Error message shows | | |
| 11.1.2 | Reconnect network | App recovers | | |
| 11.1.3 | Retry button works | Action retries | | |

### 11.2 Invalid Data
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 11.2.1 | Submit empty form | Validation errors show | | |
| 11.2.2 | Invalid email format | Email error shown | | |
| 11.2.3 | Short password | Password error shown | | |

---

## Test Summary

### Results Overview
| Section | Tests | Passed | Failed | Blocked |
|---------|-------|--------|--------|---------|
| 1. Authentication | 17 | | | |
| 2. Event Wizard | 28 | | | |
| 3. Invite System | 17 | | | |
| 4. Match Play | 20 | | | |
| 5. Nassau | 13 | | | |
| 6. Event Feed | 13 | | | |
| 7. Leaderboard | 8 | | | |
| 8. Gator Bucks | 9 | | | |
| 9. Notifications | 10 | | | |
| 10. Mobile | 10 | | | |
| 11. Error Handling | 6 | | | |
| **TOTAL** | **151** | | | |

### Critical Issues Found
1. ___________________
2. ___________________
3. ___________________

### Minor Issues Found
1. ___________________
2. ___________________
3. ___________________

### Blockers
1. ___________________

---

## Sign-Off

**Tester Signature**: ___________________
**Date Completed**: ___________________
**Overall Result**: [ ] PASS [ ] FAIL [ ] PASS WITH ISSUES

**Notes**:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## Attachments

List of screenshots/recordings:
1. [ ] Auth flow screenshots
2. [ ] Event wizard completion
3. [ ] Game creation and scoring
4. [ ] Feed interaction
5. [ ] Leaderboard state
6. [ ] Notification examples
7. [ ] Mobile views
