// Press! Core Types

// ============================================
// ALLIGATOR TEETH
// ============================================

/** Alligator Teeth - fun currency (always integers) */
export type AlligatorTeeth = number;

// ============================================
// EVENTS
// ============================================

export type EventVisibility = 'PRIVATE' | 'UNLISTED' | 'PUBLIC';

export interface Event {
  id: string;
  name: string;
  date: string;
  visibility: EventVisibility;
  isLocked: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventSettings {
  eventId: string;
  pressRules: Record<string, unknown>;
  defaultTeeth: number;
  allowSelfPress: boolean;
  updatedAt: string;
}

// ============================================
// MEMBERSHIPS
// ============================================

export type MembershipRole = 'OWNER' | 'ADMIN' | 'PLAYER' | 'VIEWER';
export type MembershipStatus = 'PENDING' | 'ACTIVE' | 'REMOVED';

export interface EventMembership {
  id: string;
  eventId: string;
  userId: string;
  role: MembershipRole;
  status: MembershipStatus;
  createdAt: string;
}

// ============================================
// USERS
// ============================================

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: MembershipRole;
}

// ============================================
// GAMES
// ============================================

export type GameType = 'match_play' | 'nassau' | 'skins';
export type GameStatus = 'active' | 'complete';

export interface Game {
  id: string;
  eventId: string;
  type: GameType;
  stakeTeethInt: AlligatorTeeth;
  parentGameId: string | null;
  startHole: number;
  endHole: number;
  status: GameStatus;
  createdAt: string;
}

export interface GameParticipant {
  id: string;
  gameId: string;
  userId: string;
  teamId: string | null;
}

export interface GameWithParticipants extends Game {
  participants: GameParticipant[];
  childGames?: GameWithParticipants[];
}

// ============================================
// PRESSES
// ============================================

export interface CreatePressInput {
  parentGameId: string;
  startHole: number;
  stake: AlligatorTeeth;
}

export interface CreatePressResult {
  id: string;
  parentGameId: string;
  startHole: number;
  endHole: number;
  stake: AlligatorTeeth;
}

// ============================================
// SCORING
// ============================================

export interface Round {
  id: string;
  eventId: string;
  userId: string;
  teeSetId: string | null;
  roundDate: string;
  createdAt: string;
}

export interface HoleScore {
  id: string;
  roundId: string;
  holeNumber: number;
  strokes: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SETTLEMENT
// ============================================

export type SettlementStatus = 'pending' | 'confirmed';

export interface Settlement {
  id: string;
  eventId: string;
  gameId: string;
  payerId: string;
  payeeId: string;
  amountInt: AlligatorTeeth;
  status: SettlementStatus;
  createdAt: string;
}

export interface SettlementWithNames extends Settlement {
  payerName: string;
  payeeName: string;
}

// ============================================
// TEETH
// ============================================

export interface TeethBalance {
  id: string;
  eventId: string;
  userId: string;
  balanceInt: AlligatorTeeth;
  updatedAt: string;
}

export interface TeethLedgerEntry {
  id: string;
  eventId: string;
  userId: string;
  deltaInt: AlligatorTeeth;
  balanceInt: AlligatorTeeth;
  reason: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

// ============================================
// SOCIAL
// ============================================

export interface EventPost {
  id: string;
  eventId: string;
  authorId: string | null;
  content: string;
  mediaIds: string[];
  isSystem: boolean;
  createdAt: string;
}

export interface EventComment {
  id: string;
  postId: string;
  authorId: string | null;
  content: string;
  createdAt: string;
}

export interface EventMessage {
  id: string;
  threadId: string;
  authorId: string | null;
  content: string;
  isSystem: boolean;
  createdAt: string;
}
