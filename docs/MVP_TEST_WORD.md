# MVP Manual Testing Checklist

App URL: https://press-4qf0.onrender.com/
Date: 2026-01-27
Tester: _______________________


================================================================================
SECTION 1: PRE-FLIGHT
================================================================================

[ ] App loads at production URL
[ ] HTTPS lock icon visible in browser
[ ] No blocking console errors

Notes:



================================================================================
SECTION 2: AUTHENTICATION
================================================================================

SIGN UP (New User)
------------------
[ ] Navigate to /auth/signup
[ ] Enter test email: _______________________
[ ] Enter password (6+ characters)
[ ] Click Sign Up button
[ ] Check email inbox for confirmation
[ ] Click confirmation link in email
[ ] Verify redirected to app and logged in

SIGN IN (Existing User)
-----------------------
[ ] Sign out first
[ ] Navigate to /auth/login
[ ] Enter registered email
[ ] Enter password
[ ] Click Sign In
[ ] Verify redirected to /app

PROTECTED ROUTES
----------------
[ ] While logged out, go to /app - should redirect to login
[ ] While logged in, go to /auth/login - should redirect to /app

Notes:



================================================================================
SECTION 3: EVENT CREATION WIZARD
================================================================================

STEP 1: BASICS
--------------
[ ] Navigate to /app/events/new
[ ] Progress indicator shows Step 1
[ ] Enter event name: _______________________
[ ] Enter description
[ ] Select start date
[ ] Select end date
[ ] Click Next

STEP 2: COURSE SELECTION
------------------------
[ ] Course search field visible
[ ] Type course name and search
[ ] Select course: _______________________
[ ] Tee set dropdown appears
[ ] Select tee set: _______________________
[ ] Click Next

STEP 3: FORMAT & RULES
----------------------
[ ] Game types displayed (Match Play, Nassau)
[ ] Toggle game types on/off
[ ] Set default stakes: $_______
[ ] Auto-press toggle works
[ ] Set auto-press threshold: _______ down
[ ] Click Next

STEP 4: REVIEW & CREATE
-----------------------
[ ] Review summary displays all entered info
[ ] Event name correct
[ ] Course/tee correct
[ ] Rules correct
[ ] Click Create Event
[ ] Success message shown
[ ] Redirected to event page

Created Event ID: _______________________

Notes:



================================================================================
SECTION 4: INVITE SYSTEM
================================================================================

GENERATE INVITE
---------------
[ ] Go to event admin/settings page
[ ] Find Invite or Share button
[ ] Click to open invite modal
[ ] Invite link displayed
[ ] Copy link button works

Invite Link: _______________________
Event Code: _______________________

JOIN VIA INVITE LINK
--------------------
[ ] Open invite link in incognito/different browser
[ ] Prompted to sign in
[ ] After auth, see join confirmation page
[ ] Event name displayed correctly
[ ] Click Join Event
[ ] Success message shown
[ ] Redirected to event

Test User Email: _______________________

JOIN VIA EVENT CODE
-------------------
[ ] Navigate to /join
[ ] Enter valid event code
[ ] Event details displayed
[ ] Confirm join successful
[ ] Test invalid code shows error

Notes:



================================================================================
SECTION 5: MATCH PLAY GAME
================================================================================

CREATE GAME
-----------
[ ] Navigate to event Games tab
[ ] Click New Game or + button
[ ] Select Match Play type
[ ] Select Player 1: _______________________
[ ] Select Player 2: _______________________
[ ] Set stakes: $_______
[ ] Click Create Game
[ ] Game appears in list with In Progress status

Game ID: _______________________

ENTER SCORES
------------
[ ] Open game detail page
[ ] Enter hole 1 scores for both players
[ ] Match status updates (shows X UP or AS)
[ ] Enter holes 2-9 (front nine)
[ ] Match status accurate
[ ] Enter holes 10-18 (back nine)
[ ] Final match result displays

Final Result: _______________________

AUTO-PRESS TRIGGER
------------------
[ ] One player goes 2 down
[ ] Auto-press triggers automatically
[ ] Press notification/indicator appears
[ ] Press game shows in UI
[ ] Press stakes correct (same as parent)

Press Created at Hole: _______

SETTLE GAME
-----------
[ ] All 18 holes entered
[ ] Click Settle button
[ ] Winner amount displayed correctly
[ ] Loser amount displayed correctly
[ ] Confirm settlement
[ ] Game status changes to Settled

Settlement Amount: $_______
Winner: _______________________

Notes:



================================================================================
SECTION 6: NASSAU GAME
================================================================================

CREATE NASSAU
-------------
[ ] Click New Game
[ ] Select Nassau type
[ ] Select both players
[ ] Set stakes per bet: $_______
[ ] Create game

Nassau Game ID: _______________________

SCORE ENTRY
-----------
[ ] Enter front 9 scores
[ ] Front 9 winner shown
[ ] Enter back 9 scores
[ ] Back 9 winner shown
[ ] Overall winner shown

Results:
Front 9 Winner: _______________________
Back 9 Winner: _______________________
Overall Winner: _______________________

SETTLE NASSAU
-------------
[ ] View settlement breakdown
[ ] Front/Back/Total bets visible (3 bets)
[ ] Presses included if any
[ ] Confirm settlement
[ ] All bets settled

Total Settlement: $_______

Notes:



================================================================================
SECTION 7: EVENT FEED
================================================================================

VIEW FEED
---------
[ ] Navigate to Feed tab
[ ] Feed page loads
[ ] Posts display in chronological order
[ ] System posts visible (game events)
[ ] User posts visible

CREATE POST
-----------
[ ] Find New Post or composer area
[ ] Type post content
[ ] Submit post
[ ] Post appears in feed
[ ] Post shows your name as author
[ ] Post shows timestamp

Post Content: _______________________

REACTIONS
---------
[ ] Find like button on a post
[ ] Click to like
[ ] Like count increases
[ ] Icon changes state (filled)
[ ] Click again to unlike
[ ] Like count decreases

COMMENTS
--------
[ ] Click comment icon/area
[ ] Comment input appears
[ ] Type comment
[ ] Submit comment
[ ] Comment appears on post
[ ] Comment shows your name
[ ] Comment count updates

Comment Content: _______________________

Notes:



================================================================================
SECTION 8: LEADERBOARD
================================================================================

VIEW LEADERBOARD
----------------
[ ] Navigate to Leaderboard tab
[ ] Page loads
[ ] Player list displays
[ ] Rankings sorted by net Gator Bucks
[ ] Your position highlighted/visible

LEADERBOARD ACCURACY
--------------------
[ ] Winner's balance increased after settlement
[ ] Loser's balance decreased after settlement
[ ] Net change matches game results
[ ] Win/Loss/Push statistics correct

Leaderboard After Testing:
Rank 1: _______________________ Net: _______
Rank 2: _______________________ Net: _______
Rank 3: _______________________ Net: _______

Notes:



================================================================================
SECTION 9: GATOR BUCKS
================================================================================

VIEW BALANCE
------------
[ ] Balance display visible
[ ] Starting balance was 100 Bucks
[ ] Balance updates after game win/loss

Current Balance: _______ Bucks

TRANSACTION HISTORY
-------------------
[ ] Navigate to transaction history/ledger
[ ] Initial credit entry shown
[ ] Game settlement entries shown
[ ] Amounts correct
[ ] Timestamps present

Notes:



================================================================================
SECTION 10: NOTIFICATIONS
================================================================================

NOTIFICATION BELL
-----------------
[ ] Bell icon visible in header
[ ] Unread count badge shows if > 0
[ ] Click bell opens dropdown

NOTIFICATION TYPES
------------------
[ ] Score entered notification appears
[ ] Press created notification appears
[ ] Game settled notification appears
[ ] New game notification appears

MARK AS READ
------------
[ ] Click notification marks it as read
[ ] Mark all read option works
[ ] Badge count updates/disappears

Notes:



================================================================================
SECTION 11: MOBILE RESPONSIVENESS
================================================================================

Test on phone or browser DevTools responsive mode:

Device/Viewport: _______________________

[ ] Login page displays correctly and is usable
[ ] Signup page displays correctly and is usable
[ ] App home displays correctly and is usable
[ ] Event home displays correctly and is usable
[ ] Games list displays correctly and is usable
[ ] Game detail displays correctly and is usable
[ ] Score entry displays correctly and is usable
[ ] Feed displays correctly and is usable
[ ] Leaderboard displays correctly and is usable
[ ] Bottom navigation works

Notes:



================================================================================
SECTION 12: ERROR HANDLING
================================================================================

NETWORK ERRORS
--------------
[ ] Disconnect network - error message shows
[ ] Reconnect network - app recovers
[ ] Retry button works (if present)

INVALID DATA
------------
[ ] Submit empty form - validation errors show
[ ] Invalid email format - error shown
[ ] Short password - error shown

Notes:



================================================================================
TEST SUMMARY
================================================================================

Section                 Result (Pass/Fail/Blocked)
-------                 --------------------------
1. Pre-Flight           _______
2. Authentication       _______
3. Event Wizard         _______
4. Invite System        _______
5. Match Play           _______
6. Nassau               _______
7. Event Feed           _______
8. Leaderboard          _______
9. Gator Bucks          _______
10. Notifications       _______
11. Mobile              _______
12. Error Handling      _______


CRITICAL ISSUES (Blocking)
--------------------------
1.

2.

3.


MINOR ISSUES (Non-blocking)
---------------------------
1.

2.

3.


================================================================================
SIGN-OFF
================================================================================

Overall Result:
[ ] PASS - All core features work
[ ] PASS WITH ISSUES - Works but has bugs to fix
[ ] FAIL - Critical features broken

Tester Signature: _______________________

Date Completed: _______________________

Additional Notes:




================================================================================
SCREENSHOTS COLLECTED
================================================================================

[ ] Signup success
[ ] Event wizard completion
[ ] Game with scores entered
[ ] Leaderboard state
[ ] Feed with post and comments
[ ] Notification dropdown
[ ] Mobile view
