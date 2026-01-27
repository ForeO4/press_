# Epics

## Priority Legend

| Priority | Description |
|----------|-------------|
| **P0** | Must have for MVP - blocks launch |
| **P1** | Important - needed for good UX |
| **P2** | Nice to have - can defer |

## Status Legend

| Status | Description |
|--------|-------------|
| **Not Started** | Work has not begun |
| **In Progress** | Actively being worked on |
| **Blocked** | Waiting on dependency or decision |
| **Complete** | Fully implemented and tested |

---

## E1: Core Platform

### E1.1: Authentication
**Priority:** P0 | **Status:** Complete ✅

| Feature | Status |
|---------|--------|
| User registration | Complete ✅ |
| Email/password sign in | Complete ✅ |
| Session management | Complete ✅ |
| Mock mode for development | Complete ✅ |

### E1.2: Event Management
**Priority:** P0 | **Status:** Complete ✅

| Feature | Status |
|---------|--------|
| Create events | Complete ✅ |
| Event settings | Complete ✅ |
| Member invitations | Not Started |
| Event visibility controls | Complete ✅ |

### E1.3: Scoring
**Priority:** P0 | **Status:** Complete ✅

| Feature | Status |
|---------|--------|
| 18-hole scorecard | Complete ✅ |
| Multi-player grid view | Complete ✅ |
| Real-time score sync | Complete ✅ |
| Leaderboard | Not Started |

---

## E2: Games

### E2.1: Match Play
**Priority:** P0 | **Status:** Complete ✅

| Feature | Status |
|---------|--------|
| Head-to-head match tracking | Complete ✅ |
| Hole-by-hole results | Complete ✅ |
| Net position display | Complete ✅ |

### E2.2: Nassau
**Priority:** P0 | **Status:** Not Started

| Feature | Status |
|---------|--------|
| Front/back/total tracking | Not Started |
| Independent bet scoring | Not Started |

### E2.3: Skins
**Priority:** P1 | **Status:** Not Started

| Feature | Status |
|---------|--------|
| Per-hole competition | Not Started |
| Carryover handling | Not Started |
| Skin distribution | Not Started |

### E2.4: Presses
**Priority:** P0 | **Status:** In Progress

| Feature | Status |
|---------|--------|
| Mid-game press creation | Complete ✅ |
| Parent-child game hierarchy | Complete ✅ |
| Press rules configuration | Not Started |

---

## E3: Currency & Settlement

### E3.1: Alligator Teeth
**Priority:** P0 | **Status:** Not Started

| Feature | Status |
|---------|--------|
| Balance tracking per event | Not Started |
| Double-entry ledger | Not Started |
| Transaction history | Not Started |

### E3.2: Settlement
**Priority:** P0 | **Status:** Not Started

| Feature | Status |
|---------|--------|
| Settlement computation | Not Started |
| Payer/payee display | Not Started |
| Net position view | Not Started |
| Disclaimer display | Not Started |

---

## E4: Social

### E4.1: Event Feed
**Priority:** P1 | **Status:** Not Started

| Feature | Status |
|---------|--------|
| Post creation | Not Started |
| Comments | Not Started |
| Reactions | Not Started |
| System posts | Not Started |

### E4.2: Event Chat
**Priority:** P1 | **Status:** Not Started

| Feature | Status |
|---------|--------|
| Group messaging | Not Started |
| Real-time updates | Not Started |
| System messages | Not Started |

### E4.3: Media
**Priority:** P1 | **Status:** Not Started

| Feature | Status |
|---------|--------|
| Image uploads | Not Started |
| Media in posts/chat | Not Started |
| R2 integration | Not Started |

---

## E5: Calcutta

### E5.1: Basic Calcutta (v1)
**Priority:** P1 | **Status:** Not Started

| Feature | Status |
|---------|--------|
| Pool creation | Not Started |
| Item management | Not Started |
| Bid entry (post-auction) | Not Started |
| Position entry | Not Started |
| Payout calculation | Not Started |

### E5.2: Live Calcutta (v2)
**Priority:** P2 | **Status:** Not Started

| Feature | Status |
|---------|--------|
| Real-time bidding | Not Started |
| Auction timer | Not Started |
| Bid validation | Not Started |
| Live updates | Not Started |

---

## E6: Administration

### E6.1: Event Admin
**Priority:** P1 | **Status:** Not Started

| Feature | Status |
|---------|--------|
| Lock/unlock events | Not Started |
| Score corrections | Not Started |
| Member management | Not Started |

### E6.2: Platform Admin
**Priority:** P2 | **Status:** Not Started

| Feature | Status |
|---------|--------|
| User management | Not Started |
| Event oversight | Not Started |
| Analytics | Not Started |

---

## Summary by Priority

| Priority | Epics | Status |
|----------|-------|--------|
| P0 | E1.1, E1.2, E1.3, E2.1 | Complete ✅ |
| P0 | E2.4 | In Progress |
| P0 | E2.2, E3.1, E3.2 | Not Started |
| P1 | E2.3, E4.1, E4.2, E4.3, E5.1, E6.1 | Not Started |
| P2 | E5.2, E6.2 | Not Started |
