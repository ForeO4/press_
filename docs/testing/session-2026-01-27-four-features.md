# Testing Document: Four Features Session
**Date:** January 27, 2026
**Branch:** main
**Commit:** b0f11c1

## Overview
This session implemented 4 major features:
1. **Gator Bucks** - Renamed from "Alligator Teeth" + transaction history
2. **Player Profile Setup** - Full onboarding modal when adding players
3. **Event Feed** - Posts, comments, reactions with real data
4. **Automatic Presses** - Auto-press at 2-down rule

---

## Test Environment Setup

### Mock Mode (Recommended for Testing)
```bash
# Create mock mode env
echo "NEXT_PUBLIC_SUPABASE_URL=" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=" >> .env.local

# Start dev server
npm run dev
```

### Real Mode (With Supabase)
```bash
# Restore real env
cp .env.local.backup .env.local

# Start dev server
npm run dev
```

---

## Feature 1: Gator Bucks

### Test Cases

#### 1.1 Terminology Update
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Home page branding | Navigate to `/` | Shows "Gator Bucks" (not "Alligator Teeth") | |
| Feature card | Check Features section | Card titled "Gator Bucks" | |
| Info section | Check "What are Gator Bucks?" section | Correct terminology throughout | |
| Footer | Check footer | "Gator Bucks are for fun..." | |

#### 1.2 Event Home Balance
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Balance card visible | Navigate to `/event/demo-event` | Balance card shows at top | |
| Shows amount | Check balance card | Shows "Your Balance" with number | |
| Shows label | Check balance card | Shows "Gator Bucks" label | |

#### 1.3 Settlement Page
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Net positions | Navigate to `/event/demo-event/settlement` | Shows "Bucks" in amounts | |
| Disclaimer | Check bottom of page | "Gator Bucks are for fun..." | |

#### 1.4 Create Game Modal
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Stake label | Click "New Game" on Games page | Stake field mentions "Gator Bucks" | |
| Validation error | Enter decimal stake | Error says "Gator Bucks" | |

#### 1.5 Create Press Modal
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Stake label | Open press modal in active game | Label says "Stake (Gator Bucks)" | |

---

## Feature 2: Player Profile Setup

### Test Cases

#### 2.1 Modal Opens
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Plus button Player 1 | In Create Game modal, click "+" next to Player 1 dropdown | AddPlayerModal opens | |
| Plus button Player 2 | Click "+" next to Player 2 dropdown | AddPlayerModal opens | |
| Modal title | Check modal header | Shows "Add New Player" with user icon | |

#### 2.2 Form Fields
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Name field | Check form | Name field with asterisk (required) | |
| Email field | Check form | Email field with "for account linking" hint | |
| Phone field | Check form | Phone field present | |
| GHIN field | Check form | GHIN Number field present | |
| Handicap field | Check form | Handicap Index field with "0-54" hint | |

#### 2.3 Validation
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Empty name | Leave name blank, click Add | Error: "Name is required" | |
| Invalid email | Enter "notanemail", click Add | Error: "Please enter a valid email" | |
| Handicap too high | Enter handicap "60", click Add | Error: "Handicap index must be between 0 and 54" | |
| Handicap negative | Enter handicap "-5", click Add | Error about range | |

#### 2.4 Successful Creation
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Add with name only | Enter "Test Player", click Add | Modal closes, player in dropdown | |
| Auto-select | Add player via Player 1 "+" button | New player auto-selected in Player 1 | |
| Full profile | Enter all fields, click Add | Player created successfully | |

---

## Feature 3: Event Feed

### Test Cases

#### 3.1 Feed Page Layout
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Page loads | Navigate to `/event/demo-event/feed` | Page shows "Event Feed" header | |
| Post composer | Check top of page | Text input with "Post" button | |
| Existing posts | Check feed | Shows demo posts | |

#### 3.2 Creating Posts
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Empty post blocked | Click Post with empty input | Button disabled | |
| Create post | Type message, click Post | New post appears at top | |
| Post shows author | Create post | Shows your mock user name | |
| Post shows time | Create post | Shows "just now" or similar | |
| Enter key submits | Type message, press Enter | Post created | |

#### 3.3 Reactions (Likes)
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Like button visible | Check any post | Heart icon with "Like" text | |
| Like post | Click Like button | Heart fills red, count shows "1" | |
| Unlike post | Click Like again | Heart unfills, shows "Like" | |
| Like count | Like post multiple times | Count toggles correctly | |

#### 3.4 Comments
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Comment link | Check post | "Comment" link visible | |
| Expand comments | Click "Comment" | Comment section expands | |
| Add comment | Type comment, click Post | Comment appears in list | |
| Comment shows author | Add comment | Shows your mock user name | |
| Multiple comments | Add several comments | All display in order | |

#### 3.5 System Posts
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| System post style | Check system posts in feed | Shows robot icon, "System" label | |
| Italic text | Check system post content | Text is italicized | |

---

## Feature 4: Automatic Presses

### Test Cases

#### 4.1 Admin Settings UI
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Admin page access | Navigate to `/event/demo-event/admin` | Page loads (as Owner/Admin) | |
| Auto-Press card | Check page | "Auto-Press Rules" card visible | |
| Enable toggle | Check card | Toggle button shows Enabled/Disabled | |

#### 4.2 Toggle Auto-Press
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Disable auto-press | Click "Disable" button | Shows "Auto-Press: Disabled" | |
| Hide settings | When disabled | Threshold/Max settings hidden | |
| Enable auto-press | Click "Enable" button | Shows "Auto-Press: Enabled" | |
| Show settings | When enabled | Threshold/Max settings appear | |

#### 4.3 Threshold Setting
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Default value | Check threshold | Shows "2" | |
| Increase threshold | Click "+" button | Value increases to 3 | |
| Decrease threshold | Click "-" button | Value decreases | |
| Min limit | Decrease to 1, click "-" | Button disabled at 1 | |
| Max limit | Increase to 9, click "+" | Button disabled at 9 | |
| Text updates | Change value | "Auto-press when X holes down" updates | |

#### 4.4 Max Presses Setting
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Default value | Check max presses | Shows "3" | |
| Increase max | Click "+" button | Value increases | |
| Decrease max | Click "-" button | Value decreases | |
| Min limit | Decrease to 1, click "-" | Button disabled at 1 | |
| Max limit | Increase to 10, click "+" | Button disabled at 10 | |
| Text updates | Change value | "Limit of X auto-presses" updates | |

#### 4.5 Auto-Press Triggering (Advanced)
| Test | Steps | Expected Result | Pass/Fail |
|------|-------|-----------------|-----------|
| Setup | Create game, enter scores where one player loses 2 holes | - | |
| Press created | After 2nd hole loss | New press appears in game | |
| System post | Check feed | "{Player} is 2 down - auto-press starting hole X" | |
| Max limit respected | Trigger 3 auto-presses | No 4th auto-press created | |

---

## Quick Smoke Test Checklist

Run through these quickly to verify basic functionality:

- [ ] Home page loads with "Gator Bucks" text
- [ ] Can navigate to Event Home via button
- [ ] Balance card shows on Event Home
- [ ] Can open Create Game modal
- [ ] "+" button opens Add Player modal
- [ ] Can add a player with just a name
- [ ] Feed page shows posts
- [ ] Can create a new post
- [ ] Can like/unlike a post
- [ ] Admin page shows auto-press settings
- [ ] Can toggle auto-press on/off
- [ ] Settlement page shows "Bucks" text

---

## Known Issues / Notes

1. **Mock Mode Required**: Full testing requires mock mode (no Supabase) to bypass auth
2. **Port**: Dev server may run on 3001 or 3002 if 3000 is in use
3. **User Switcher**: Use the mock user switcher (top-right) to test different roles
4. **Auto-Press Testing**: Requires creating a game and entering multiple hole scores

---

## Files Changed

### Modified
- `src/types/index.ts` - Added GatorBucks, AutoPressConfig, PlayerProfile types
- `src/app/page.tsx` - Updated branding and nav links
- `src/app/event/[eventId]/page.tsx` - Added BalanceCard
- `src/app/event/[eventId]/admin/page.tsx` - Added auto-press settings UI
- `src/app/event/[eventId]/feed/page.tsx` - Wired to posts service
- `src/app/event/[eventId]/games/[gameId]/page.tsx` - Integrated auto-press check
- `src/components/games/CreateGameModal.tsx` - Uses AddPlayerModal
- `src/components/ui/AlligatorIcon.tsx` - Added BucksDisplay
- `src/lib/utils.ts` - Added formatGatorBucks
- Various other files for terminology updates

### New Files
- `src/lib/services/gatorBucks.ts` - Balance and transaction service
- `src/lib/services/players.ts` - Player profile service
- `src/lib/services/posts.ts` - Posts/comments/reactions service
- `src/lib/services/eventSettings.ts` - Event settings service
- `src/lib/domain/games/autoPress.ts` - Auto-press logic
- `src/components/gatorBucks/BalanceCard.tsx`
- `src/components/gatorBucks/TransactionHistory.tsx`
- `src/components/players/AddPlayerModal.tsx`
- `src/components/feed/PostCard.tsx`
- `src/components/feed/CommentSection.tsx`
- `src/components/feed/ReactionButton.tsx`

---

## Sign-off

| Tester | Date | Result |
|--------|------|--------|
| | | |
