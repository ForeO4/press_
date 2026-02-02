/**
 * Press! Rules Engine - Core Type Definitions
 *
 * This file defines all types for the rules engine including:
 * - Primitive types (HoleNumber, PlayerId, etc.)
 * - Input types (Round, ContestConfig)
 * - Output types (ContestResult, Results Posting Contract)
 * - Settlement types (LedgerEntry, balances)
 */

// ============================================
// PRIMITIVE TYPES
// ============================================

/** Hole number (1-18) */
export type HoleNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18;

/** Player identifier */
export type PlayerId = string;

/** Contest identifier */
export type ContestId = string;

/** Team identifier */
export type TeamId = string;

/** Integer currency units (Alligator Teeth internally) */
export type Units = number;

// ============================================
// COURSE/TEE DATA
// ============================================

/** Tee data for a round */
export interface TeeData {
  /** Par for each hole (3, 4, or 5) */
  par: Record<HoleNumber, 3 | 4 | 5>;
  /** Stroke index (handicap ranking) for each hole (1 = hardest, 18 = easiest) */
  strokeIndex: Record<HoleNumber, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18>;
  /** Course rating (optional) */
  rating?: number;
  /** Course slope (optional) */
  slope?: number;
}

// ============================================
// PLAYER DATA
// ============================================

/** Player data for a round */
export interface PlayerData {
  id: PlayerId;
  name: string;
  /** Course handicap - omit or set to 0 for gross scoring */
  courseHandicap?: number;
}

// ============================================
// TEAM DATA
// ============================================

/** Team definition for team-based contests */
export interface Team {
  id: TeamId;
  name?: string;
  playerIds: [PlayerId, PlayerId]; // Exactly 2 players per team
}

// ============================================
// ROUND INPUT
// ============================================

/** Press event recorded during play */
export interface PressEvent {
  pressId: string;
  parentSegment: 'front' | 'back' | 'total';
  /** Hole where press was initiated (press starts on next hole by default) */
  initiatedOnHole: HoleNumber;
  /** Override: hole where press actually starts (default: initiatedOnHole + 1) */
  startHole?: HoleNumber;
  /** Stake for this press in units */
  stake: Units;
  /** Who initiated the press */
  initiatorPlayerId?: PlayerId;
}

/** CTP (Closest to Pin) event */
export interface CtpEvent {
  hole: HoleNumber;
  winnerPlayerId: PlayerId;
  distanceFt?: number;
}

/** Long Drive event */
export interface LongDriveEvent {
  hole: HoleNumber;
  winnerPlayerId: PlayerId;
  distanceYds?: number;
}

/** Three-putt event (for Snake) */
export interface ThreePuttEvent {
  hole: HoleNumber;
  playerId: PlayerId;
}

/** Events recorded during round play */
export interface RoundEvents {
  /** Presses initiated during play */
  presses?: PressEvent[];
  /** Closest to pin winners */
  ctp?: CtpEvent[];
  /** Long drive winners */
  longDrive?: LongDriveEvent[];
  /** Three-putts for snake tracking */
  threePutts?: ThreePuttEvent[];
}

/** Round metadata */
export interface RoundMeta {
  /** Number of holes planned (9 or 18) */
  holesPlanned: 9 | 18;
  /** Events recorded during play */
  events?: RoundEvents;
}

/** Complete round input for the rules engine */
export interface Round {
  /** Tee/course data */
  tee: TeeData;
  /** Players in this round */
  players: PlayerData[];
  /** Gross strokes by player and hole */
  grossStrokes: Record<PlayerId, Partial<Record<HoleNumber, number>>>;
  /** Round metadata */
  meta?: RoundMeta;
}

// ============================================
// CONTEST CONFIGURATION
// ============================================

/** Contest type identifiers */
export type ContestType =
  | 'match_play_singles'
  | 'match_play_bestball'
  | 'nassau'
  | 'skins'
  | 'bestball_stroke'
  | 'stableford'
  | 'ctp'
  | 'long_drive'
  | 'birdie_pool'
  | 'snake'
  | 'high_low_total';

/** Scoring basis */
export type ScoringBasis = 'gross' | 'net';

/** Handicap configuration */
export interface HandicapConfig {
  /** Scoring basis (gross or net) */
  basis: ScoringBasis;
  /** For match play: use relative handicap (lowest plays off 0) */
  useRelativeHandicap?: boolean;
  /**
   * Allow net strokes below 1 (default: false)
   * When false, minimum net strokes per hole = 1
   */
  allowBelow1?: boolean;
}

/** Stakes configuration for segment-based contests (Nassau) */
export interface SegmentStakes {
  front?: Units;
  back?: Units;
  total?: Units;
}

/** Stakes configuration */
export interface StakesConfig {
  /** Base unit amount */
  unit: Units;
  /** Per-hole stakes (for skins) */
  perHole?: boolean;
  /** Total pot amount (alternative to per-skin) */
  potTotal?: Units;
  /** Per-segment stakes (for Nassau) */
  segments?: SegmentStakes;
}

/** Stableford scoring table */
export interface StablefordTable {
  albatross: number; // Default: 5
  eagle: number; // Default: 4
  birdie: number; // Default: 3
  par: number; // Default: 2
  bogey: number; // Default: 1
  doubleBogey: number; // Default: 0
  worse: number; // Default: 0
}

/** Default Stableford scoring table */
export const DEFAULT_STABLEFORD_TABLE: StablefordTable = {
  albatross: 5,
  eagle: 4,
  birdie: 3,
  par: 2,
  bogey: 1,
  doubleBogey: 0,
  worse: 0,
};

/** Segment definition */
export interface Segment {
  id: 'front' | 'back' | 'total';
  startHole: HoleNumber;
  endHole: HoleNumber;
  active: boolean;
}

/** Press configuration (predefined in contest config) */
export interface PressConfig {
  pressId: string;
  parentSegment: 'front' | 'back' | 'total';
  startHole: HoleNumber;
  stake: Units;
}

/** Skins carryover rules */
export interface CarryoverRules {
  /** Enable carryover on ties (default: true) */
  enabled: boolean;
  /** Maximum carryover multiplier (default: unlimited) */
  maxMultiplier?: number;
}

/** Contest-specific options */
export interface ContestOptions {
  /** Stableford scoring table override */
  stablefordTable?: StablefordTable;
  /** Predefined presses (Nassau) */
  presses?: PressConfig[];
  /** Skins carryover rules */
  carryoverRules?: CarryoverRules;
  /** CTP/Long Drive: designated holes */
  designatedHoles?: HoleNumber[];
  /** Birdie pool: per-player buy-in (alternative to potTotal) */
  perPlayerBuyIn?: Units;
}

/** Participant specification - either player IDs or teams */
export type Participants = PlayerId[] | Team[];

/** Contest configuration */
export interface ContestConfig {
  contestId: ContestId;
  name: string;
  type: ContestType;
  scoringBasis: ScoringBasis;
  handicapConfig: HandicapConfig;
  stakesConfig: StakesConfig;
  participants: Participants;
  /** Segment overrides (default: front/back/total based on holesPlanned) */
  segments?: Segment[];
  /** Contest-specific options */
  options?: ContestOptions;
}

// ============================================
// RESULTS POSTING CONTRACT
// ============================================

/** Contest status */
export type ContestStatus = 'live' | 'final';

/** Contest summary */
export interface ContestSummary {
  contestId: ContestId;
  name: string;
  type: ContestType;
  scoringBasis: ScoringBasis;
  /** Human-readable stakes description (e.g., "10 units/hole") */
  stakesSummary?: string;
  status: ContestStatus;
  /** Highest completed hole for this contest */
  thruHole: HoleNumber | null;
}

// ============================================
// STANDINGS (contest-specific shapes)
// ============================================

/** Match play standing for a player */
export interface MatchPlayStanding {
  playerId: PlayerId;
  playerName: string;
  /** Positive = winning, negative = losing, 0 = tied */
  holesUp: number;
  holesPlayed: number;
  holesRemaining: number;
  /** Match status description */
  matchStatus: 'leading' | 'trailing' | 'all_square' | 'dormie' | 'closed';
  /** Final result string (e.g., "3&2", "1 UP", "A/S") */
  result?: string;
}

/** Match play standings container */
export interface MatchPlayStandings {
  type: 'match_play';
  standings: MatchPlayStanding[];
}

/** Team match play standing */
export interface TeamMatchPlayStanding {
  teamId: TeamId;
  teamName: string;
  playerIds: PlayerId[];
  holesUp: number;
  holesPlayed: number;
  holesRemaining: number;
  matchStatus: 'leading' | 'trailing' | 'all_square' | 'dormie' | 'closed';
  result?: string;
}

/** Team match play standings container */
export interface TeamMatchPlayStandings {
  type: 'team_match_play';
  standings: TeamMatchPlayStanding[];
}

/** Skins standing for a player */
export interface SkinsStanding {
  playerId: PlayerId;
  playerName: string;
  skinsWon: number;
  /** Total value of skins won (skinsWon * perSkin * (numPlayers - 1)) */
  totalValue: Units;
}

/** Per-hole skin result */
export interface SkinResultEntry {
  hole: HoleNumber;
  /** Winner of the skin, null if carryover */
  winnerId: PlayerId | null;
  winnerName?: string;
  /** Number of skins won (includes carryovers) */
  skinsWon: number;
}

/** Skins standings container */
export interface SkinsStandings {
  type: 'skins';
  standings: SkinsStanding[];
  /** Per-hole skin results */
  skinResults: SkinResultEntry[];
  /** Total skins awarded so far */
  totalSkinsAwarded: number;
  /** Current carryover count (skins pending) */
  carryoverSkins: number;
}

/** Stableford standing for a player */
export interface StablefordStanding {
  playerId: PlayerId;
  playerName: string;
  totalPoints: number;
  thruHole: HoleNumber;
  /** Rank position (1 = first, handles ties) */
  rank: number;
}

/** Stableford standings container */
export interface StablefordStandings {
  type: 'stableford';
  standings: StablefordStanding[];
}

/** Stroke play standing for a player/team */
export interface StrokePlayStanding {
  playerId?: PlayerId;
  teamId?: TeamId;
  name: string;
  grossTotal: number;
  netTotal?: number;
  thruHole: HoleNumber;
  rank: number;
}

/** Stroke play standings container */
export interface StrokePlayStandings {
  type: 'stroke_play';
  standings: StrokePlayStanding[];
}

/** Nassau segment result */
export interface NassauSegmentResult {
  segmentId: 'front' | 'back' | 'total';
  segmentName: string;
  startHole: HoleNumber;
  endHole: HoleNumber;
  winnerId: PlayerId | TeamId | null;
  winnerName: string | null;
  holesUp: number;
  result: string; // "2 UP", "A/S", etc.
  status: ContestStatus;
  thruHole: HoleNumber | null;
}

/** Nassau press result */
export interface NassauPressResult {
  pressId: string;
  parentSegment: 'front' | 'back' | 'total';
  startHole: HoleNumber;
  endHole: HoleNumber;
  stake: Units;
  winnerId: PlayerId | TeamId | null;
  winnerName: string | null;
  holesUp: number;
  result: string;
  status: ContestStatus;
  thruHole: HoleNumber | null;
}

/** Nassau standings container */
export interface NassauStandings {
  type: 'nassau';
  segments: NassauSegmentResult[];
  presses: NassauPressResult[];
  /** Net standings per player/team across all segments and presses */
  netStandings: Array<{
    id: PlayerId | TeamId;
    name: string;
    segmentsWon: number;
    segmentsLost: number;
    pressesWon: number;
    pressesLost: number;
    netUnits: Units;
  }>;
}

/** Side pot standing */
export interface SidePotStanding {
  playerId: PlayerId;
  playerName: string;
  wins: number;
  /** For snake: currently holding */
  isHolding?: boolean;
  totalWinnings: Units;
}

/** Side pot standings container */
export interface SidePotStandings {
  type: 'side_pot';
  potType: 'ctp' | 'long_drive' | 'birdie_pool' | 'snake';
  standings: SidePotStanding[];
  potTotal: Units;
  /** For pots with designated holes, results per hole */
  holeResults?: Array<{
    hole: HoleNumber;
    winnerId: PlayerId | null;
    winnerName: string | null;
    value: Units;
    details?: string; // "12 ft 3 in", "285 yds", etc.
  }>;
}

/** High-Low-Total standing for a player */
export interface HighLowTotalStanding {
  playerId: PlayerId;
  playerName: string;
  lowPoints: number;      // Points from winning Low
  highPoints: number;     // Points from losing High (negative)
  totalPoints: number;    // Points from winning Total (team mode only)
  netPoints: number;      // lowPoints + totalPoints - highPoints
  netValue: Units;        // netPoints * pointValue
}

/** High-Low-Total tie rule */
export type HighLowTotalTieRule = 'push' | 'split' | 'carryover';

/** High-Low-Total hole result */
export interface HighLowTotalHoleResult {
  hole: HoleNumber;
  lowWinnerId: PlayerId | null;
  highLoserId: PlayerId | null;
  totalWinnerId: PlayerId | null;  // Team mode only
  carryover: { low: number; high: number; total: number };
}

/** High-Low-Total standings container */
export interface HighLowTotalStandings {
  type: 'high_low_total';
  standings: HighLowTotalStanding[];
  holeResults: HighLowTotalHoleResult[];
  tieRule: HighLowTotalTieRule;
  isTeamMode: boolean;
  pointValue: Units;
}

/** Union of all standings types */
export type ContestStandings =
  | MatchPlayStandings
  | TeamMatchPlayStandings
  | SkinsStandings
  | StablefordStandings
  | StrokePlayStandings
  | NassauStandings
  | SidePotStandings
  | HighLowTotalStandings;

// ============================================
// AUDIT (hole-by-hole details)
// ============================================

/** Player score details for a hole in audit */
export interface HolePlayerAudit {
  playerId: PlayerId;
  playerName: string;
  gross: number;
  /** Net score (if net scoring) */
  net?: number;
  /** Handicap strokes received on this hole */
  dots?: number;
  /** Whether this player's score counted (for best ball) */
  counted?: boolean;
  /** Stableford points earned */
  stablefordPoints?: number;
}

/** Audit entry for a single hole */
export interface HoleAuditEntry {
  hole: HoleNumber;
  par: number;
  /** Player details for this hole */
  players: HolePlayerAudit[];
  /** Winner(s) of this hole (player ID or "halved"/"carryover") */
  winner?: PlayerId | PlayerId[] | 'halved' | 'carryover';
  /** Skin value if awarded */
  skinValue?: number;
  /** Carryover count going into next hole */
  carryoverCount?: number;
  /** Match state after this hole (e.g., "2 UP", "A/S") */
  matchState?: string;
  /** Notes (e.g., "Team A: Blake 4 (counted)", "Carryover +1") */
  notes?: string;
}

/** Complete audit for a contest */
export interface ContestAudit {
  holeByHole: HoleAuditEntry[];
  /** Summary notes */
  summary?: string;
}

// ============================================
// SETTLEMENT
// ============================================

/** Ledger entry for settlement */
export interface LedgerEntry {
  id: string;
  contestId: ContestId;
  description: string;
  amount: Units;
  /** Player paying (if individual payment) */
  fromPlayerId?: PlayerId;
  /** Player receiving (if individual receipt) */
  toPlayerId?: PlayerId;
  /** Players splitting receipt equally */
  splitAmongPlayerIds?: PlayerId[];
}

/** Settlement result for a contest */
export interface ContestSettlement {
  ledgerEntries: LedgerEntry[];
  /** Net balance per player (positive = winning, negative = owing) */
  balancesByPlayerId: Record<PlayerId, Units>;
}

// ============================================
// COMPLETE CONTEST RESULT
// ============================================

/** Complete result for a single contest */
export interface ContestResult {
  summary: ContestSummary;
  standings: ContestStandings;
  audit: ContestAudit;
  settlement: ContestSettlement;
}

// ============================================
// ENGINE TYPES
// ============================================

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Contest handler interface for pluggable architecture */
export interface ContestHandler {
  type: ContestType;
  compute(round: Round, config: ContestConfig): ContestResult;
  validate(config: ContestConfig): ValidationResult;
}

// ============================================
// HELPER TYPE GUARDS
// ============================================

/** Check if participants are teams */
export function isTeamParticipants(participants: Participants): participants is Team[] {
  return participants.length > 0 && typeof (participants[0] as Team).playerIds !== 'undefined';
}

/** Check if participants are player IDs */
export function isPlayerParticipants(participants: Participants): participants is PlayerId[] {
  return participants.length > 0 && typeof participants[0] === 'string';
}

/** Get all player IDs from participants (whether team or individual) */
export function getAllPlayerIds(participants: Participants): PlayerId[] {
  if (isTeamParticipants(participants)) {
    return participants.flatMap((team) => team.playerIds);
  }
  return participants as PlayerId[];
}
