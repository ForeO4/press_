// Press! Core Types

// ============================================
// GATOR BUCKS
// ============================================

/** Gator Bucks - fun currency (always integers) */
export type GatorBucks = number;

/** @deprecated Use GatorBucks instead */
export type AlligatorTeeth = GatorBucks;

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

export interface AutoPressConfig {
  enabled: boolean;        // Master toggle
  trigger: number;         // Holes down (default: 2)
  maxPresses: number;      // Per game limit (default: 3)
  stakeMultiplier: number; // Stake = parent * multiplier (default: 1)
}

export interface EventSettings {
  eventId: string;
  pressRules: AutoPressConfig;
  defaultBucks: number;
  allowSelfPress: boolean;
  updatedAt: string;
}

export interface CreateEventInput {
  name: string;
  date: string;
  visibility: EventVisibility;
  teeSetId?: string; // Optional tee set to create snapshot from
}

export interface UpdateEventInput {
  name?: string;
  date?: string;
  visibility?: EventVisibility;
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
  userId: string | null;
  guestPlayerId: string | null;
  teamId: string | null;
}

/**
 * Get the effective player ID from a participant
 * Returns either userId or "guest-{guestPlayerId}" for guest players
 */
export function getParticipantPlayerId(participant: GameParticipant): string {
  if (participant.userId) {
    return participant.userId;
  }
  if (participant.guestPlayerId) {
    return `guest-${participant.guestPlayerId}`;
  }
  return ''; // Shouldn't happen if constraint is enforced
}

// Guest player (no Supabase account required)
export interface GuestPlayer {
  id: string;
  eventId: string;
  name: string;
  email?: string;
  phone?: string;
  handicapIndex?: number;
  createdAt: string;
  createdBy?: string;
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
// COURSES
// ============================================

export type CourseSource = 'manual' | 'imported' | 'ghin_api' | 'verified';

export interface Course {
  id: string;
  name: string;
  city: string;
  state: string;
  country?: string;
  source: CourseSource;
  verified: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseInput {
  name: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface TeeSet {
  id: string;
  courseId: string;
  name: string; // "Blue", "White", "Red"
  color?: string; // Tee color for display
  rating: number; // 72.1
  slope: number; // 131
  par?: number; // 72 (total par for the tee set)
  yardage?: number; // Total yardage
}

export interface CreateTeeSetInput {
  courseId: string;
  name: string;
  color?: string;
  rating: number;
  slope: number;
  par?: number;
  yardage?: number;
}

export interface Hole {
  id: string;
  teeSetId: string;
  number: number; // 1-18
  par: number; // 3, 4, or 5
  handicap: number; // 1-18 (difficulty ranking)
  yardage: number;
}

export interface TeeSetWithHoles extends TeeSet {
  holes: Hole[];
}

export interface TeeSnapshot {
  id: string;
  eventId: string;
  teeSetId: string | null;
  courseName: string;
  teeSetName: string;
  rating: number;
  slope: number;
  holes: HoleSnapshot[];
  createdAt: string;
}

export interface HoleSnapshot {
  number: number;
  par: number;
  handicap: number;
  yardage: number;
}

export interface CourseHole {
  number: number; // 1-18
  par: number; // 3, 4, or 5
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
// GATOR BUCKS
// ============================================

export interface GatorBucksBalance {
  id: string;
  eventId: string;
  userId: string;
  balanceInt: GatorBucks;
  updatedAt: string;
}

/** @deprecated Use GatorBucksBalance instead */
export type TeethBalance = GatorBucksBalance;

export interface GatorBucksTransaction {
  id: string;
  eventId: string;
  userId: string;
  deltaInt: GatorBucks;
  balanceInt: GatorBucks;
  reason: string;
  referenceType: 'game' | 'settlement' | 'adjustment' | null;
  referenceId: string | null;
  createdAt: string;
}

/** @deprecated Use GatorBucksTransaction instead */
export type TeethLedgerEntry = GatorBucksTransaction;

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

// ============================================
// HANDICAPS
// ============================================

export type HandicapSource = 'manual' | 'ghin_verified';

export interface HandicapProfile {
  id: string;
  userId: string;
  handicapIndex: number | null;
  ghinNumber: string | null;
  source: HandicapSource;
  homeCourseId?: string;
  lastVerifiedAt?: string;
  updatedAt: string;
}

export interface HandicapSnapshot {
  id: string;
  eventId: string;
  userId: string;
  handicapIndex: number;
  courseHandicap: number | null;
  createdAt: string;
}

// ============================================
// PLAYER PROFILES
// ============================================

export interface PlayerProfile {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  ghinNumber?: string;
  handicapIndex?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlayerInput {
  name: string;
  email?: string;
  phone?: string;
  ghinNumber?: string;
  handicapIndex?: number;
}
