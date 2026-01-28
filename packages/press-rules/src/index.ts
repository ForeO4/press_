/**
 * Press! Rules Engine
 *
 * A deterministic rules engine for computing golf betting contest results.
 *
 * @packageDocumentation
 */

// Core types
export type {
  // Primitives
  HoleNumber,
  PlayerId,
  ContestId,
  TeamId,
  Units,
  ScoringBasis,
  ContestType,
  ContestStatus,

  // Round input
  Round,
  TeeData,
  PlayerData,
  RoundMeta,
  RoundEvents,
  PressEvent,
  CtpEvent,
  LongDriveEvent,
  ThreePuttEvent,

  // Contest configuration
  ContestConfig,
  Participants,
  Team,
  StakesConfig,
  HandicapConfig,
  ContestOptions,
  Segment,
  StablefordTable,
  PressConfig,

  // Results Posting Contract
  ContestResult,
  ContestSummary,
  ContestAudit,
  HoleAuditEntry,
  HolePlayerAudit,
  ContestSettlement,
  LedgerEntry,

  // Standings types
  ContestStandings,
  MatchPlayStandings,
  MatchPlayStanding,
  TeamMatchPlayStandings,
  TeamMatchPlayStanding,
  SkinsStandings,
  SkinsStanding,
  SkinResultEntry,
  NassauStandings,
  NassauSegmentResult,
  NassauPressResult,
  StrokePlayStandings,
  StrokePlayStanding,
  StablefordStandings,
  StablefordStanding,
  SidePotStandings,
  SidePotStanding,

  // Handler interface
  ContestHandler,
  ValidationResult,
} from './types';

// Export const value
export { DEFAULT_STABLEFORD_TABLE } from './types';

// Type guards
export { isTeamParticipants, isPlayerParticipants, getAllPlayerIds } from './types';

// Engine
export {
  ContestRegistry,
  defaultRegistry,
  computeContests,
  computeAggregatedSettlement,
  validateBasicConfig,
  getHolesPlanned,
  getCtpEvents,
  getLongDriveEvents,
  getThreePuttEvents,
  getPressEvents,
} from './engine';

// Handicap utilities
export {
  computeHandicapStrokes,
  computeRelativeHandicaps,
  computeNetScore,
  type StrokesPerHole,
} from './handicap';

// Scoring utilities
export {
  computeHoleMatchResult,
  computeMatchStatus,
  computeBestBallScore,
  computeStablefordPoints,
  computeSkinWinner,
  getScoreName,
  getThruHole,
  isContestFinal,
  buildPlayerNameMap,
  getDefaultSegments,
  type HoleMatchResult,
  type MatchStatus,
  type BestBallResult,
} from './scoring';

// Settlement utilities
export {
  createLedgerEntry,
  computeBalances,
  buildSettlement,
  createEmptySettlement,
  settleMatchPlay,
  settleTeamMatchPlay,
  settleSkins,
  settlePot,
  settlePerHolePot,
  settleSnake,
  settleStableford,
  resetLedgerIdCounter,
} from './settlement';

// Explanation utilities
export {
  explainMatchResult,
  explainSkinResult,
  explainHandicapStrokes,
  explainSettlement,
} from './explain';

// Contest handlers (for direct use or custom registries)
export {
  matchPlaySinglesHandler,
  nassauHandler,
  skinsHandler,
  matchPlayBestballHandler,
  bestballStrokeHandler,
  stablefordHandler,
  ctpHandler,
  longDriveHandler,
  birdiePoolHandler,
  snakeHandler,
} from './contests';

// Initialize default registry with all handlers
import './contests';
