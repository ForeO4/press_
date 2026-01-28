/**
 * Press! Rules Engine - Scoring Utilities
 *
 * Shared scoring logic for:
 * - Match play (hole winner, match status)
 * - Best ball selection
 * - Stableford points
 * - Skins (winner/carryover)
 * - Segment definitions
 */

import type {
  HoleNumber,
  PlayerId,
  Round,
  Segment,
  StablefordTable,
  HoleAuditEntry,
  HolePlayerAudit,
} from './types';

// ============================================
// MATCH PLAY
// ============================================

/** Result of a single hole in match play */
export interface HoleMatchResult {
  hole: HoleNumber;
  winner: PlayerId | null; // null = halved
  winnerName?: string;
  loser?: PlayerId;
  margin: number; // Positive strokes difference
}

/**
 * Determine match play result for a single hole
 * Lower score wins the hole; equal scores = halved
 */
export function computeHoleMatchResult(
  hole: HoleNumber,
  scoreA: number,
  scoreB: number,
  playerAId: PlayerId,
  playerBId: PlayerId,
  playerAName?: string,
  playerBName?: string
): HoleMatchResult {
  if (scoreA < scoreB) {
    return {
      hole,
      winner: playerAId,
      winnerName: playerAName,
      loser: playerBId,
      margin: scoreB - scoreA,
    };
  } else if (scoreB < scoreA) {
    return {
      hole,
      winner: playerBId,
      winnerName: playerBName,
      loser: playerAId,
      margin: scoreA - scoreB,
    };
  } else {
    return {
      hole,
      winner: null,
      margin: 0,
    };
  }
}

/** Match play status (cumulative) */
export interface MatchStatus {
  leaderId: PlayerId | null;
  leaderName?: string;
  holesUp: number;
  holesPlayed: number;
  holesRemaining: number;
  /** Match is "closed" when leader is up by more than remaining holes */
  isClosed: boolean;
  /** Hole where match was closed (if applicable) */
  closedOnHole?: HoleNumber;
  /** Status string: "leading", "trailing", "all_square", "dormie", "closed" */
  status: 'leading' | 'trailing' | 'all_square' | 'dormie' | 'closed';
  /** Final result string (e.g., "3&2", "1 UP", "A/S") */
  result?: string;
}

/**
 * Compute cumulative match play status from hole results
 *
 * @param holeResults - Results for each played hole
 * @param totalHoles - Total holes in the match
 * @param playerAId - First player ID (for determining leader)
 * @param playerBId - Second player ID
 */
export function computeMatchStatus(
  holeResults: HoleMatchResult[],
  totalHoles: number,
  playerAId: PlayerId,
  playerBId: PlayerId,
  playerAName?: string,
  playerBName?: string
): MatchStatus {
  // Tally holes won
  let playerANet = 0;
  for (const result of holeResults) {
    if (result.winner === playerAId) {
      playerANet++;
    } else if (result.winner === playerBId) {
      playerANet--;
    }
  }

  const holesPlayed = holeResults.length;
  const holesRemaining = totalHoles - holesPlayed;
  const holesUp = Math.abs(playerANet);

  // Determine leader
  let leaderId: PlayerId | null = null;
  let leaderName: string | undefined;
  if (playerANet > 0) {
    leaderId = playerAId;
    leaderName = playerAName;
  } else if (playerANet < 0) {
    leaderId = playerBId;
    leaderName = playerBName;
  }

  // Check if match is closed
  const isClosed = holesUp > holesRemaining;

  // Find when match was closed (if applicable)
  let closedOnHole: HoleNumber | undefined;
  if (isClosed) {
    // Walk through results to find closing hole
    let runningNet = 0;
    for (const result of holeResults) {
      if (result.winner === playerAId) runningNet++;
      else if (result.winner === playerBId) runningNet--;

      const remainingAtHole = totalHoles - result.hole;
      if (Math.abs(runningNet) > remainingAtHole) {
        closedOnHole = result.hole;
        break;
      }
    }
  }

  // Determine status
  let status: MatchStatus['status'];
  if (isClosed) {
    status = 'closed';
  } else if (holesUp === holesRemaining && holesUp > 0) {
    status = 'dormie';
  } else if (holesUp === 0) {
    status = 'all_square';
  } else {
    status = 'leading';
  }

  // Build result string
  let result: string | undefined;
  if (isClosed && closedOnHole !== undefined) {
    // "3&2" format: X up & Y to play when closed
    const holesRemainingAtClose = totalHoles - closedOnHole;
    result = `${holesUp}&${holesRemainingAtClose}`;
  } else if (holesPlayed === totalHoles) {
    // Match completed all holes
    if (holesUp === 0) {
      result = 'A/S'; // All Square
    } else {
      result = `${holesUp} UP`;
    }
  }

  return {
    leaderId,
    leaderName,
    holesUp,
    holesPlayed,
    holesRemaining,
    isClosed,
    closedOnHole,
    status,
    result,
  };
}

/**
 * Format match state for display (e.g., "2 UP", "A/S", "3&2")
 */
export function formatMatchState(status: MatchStatus, isLeaderPerspective: boolean = true): string {
  if (status.result) {
    return status.result;
  }

  if (status.holesUp === 0) {
    return 'A/S';
  }

  const upDown = isLeaderPerspective ? 'UP' : 'DN';
  return `${status.holesUp} ${upDown}`;
}

// ============================================
// BEST BALL
// ============================================

/** Best ball selection result */
export interface BestBallResult {
  score: number;
  countedPlayerId: PlayerId;
  countedPlayerName?: string;
}

/**
 * Compute best ball score for a team
 * Best ball = lowest score among team members
 *
 * @param playerScores - Map of player ID to score (undefined = no score)
 * @param playerNames - Optional map of player ID to name
 * @returns Best ball result (lowest score and who contributed it)
 */
export function computeBestBallScore(
  playerScores: Record<PlayerId, number | undefined>,
  playerNames?: Record<PlayerId, string>
): BestBallResult | null {
  let bestScore: number | null = null;
  let bestPlayerId: PlayerId | null = null;

  for (const [playerId, score] of Object.entries(playerScores)) {
    if (score !== undefined) {
      if (bestScore === null || score < bestScore) {
        bestScore = score;
        bestPlayerId = playerId;
      }
    }
  }

  if (bestScore === null || bestPlayerId === null) {
    return null;
  }

  return {
    score: bestScore,
    countedPlayerId: bestPlayerId,
    countedPlayerName: playerNames?.[bestPlayerId],
  };
}

// ============================================
// STABLEFORD
// ============================================

/**
 * Compute Stableford points for a hole
 *
 * @param netScore - Net strokes on the hole
 * @param par - Par for the hole
 * @param table - Stableford scoring table (optional, uses default)
 */
export function computeStablefordPoints(
  netScore: number,
  par: number,
  table: StablefordTable = {
    albatross: 5,
    eagle: 4,
    birdie: 3,
    par: 2,
    bogey: 1,
    doubleBogey: 0,
    worse: 0,
  }
): number {
  const diff = netScore - par;

  if (diff <= -3) return table.albatross; // 3 under or better
  if (diff === -2) return table.eagle;
  if (diff === -1) return table.birdie;
  if (diff === 0) return table.par;
  if (diff === 1) return table.bogey;
  if (diff === 2) return table.doubleBogey;
  return table.worse; // 3 over or worse
}

/**
 * Get score name relative to par
 */
export function getScoreName(netScore: number, par: number): string {
  const diff = netScore - par;
  if (diff <= -3) return 'Albatross';
  if (diff === -2) return 'Eagle';
  if (diff === -1) return 'Birdie';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  if (diff === 2) return 'Double Bogey';
  if (diff === 3) return 'Triple Bogey';
  return `+${diff}`;
}

// ============================================
// SKINS
// ============================================

/** Skin result for a single hole */
export interface SkinResult {
  hole: HoleNumber;
  /** Winner of the skin (null = carryover/push) */
  winnerId: PlayerId | null;
  winnerName?: string;
  /** Number of skins awarded (1 + carryovers) */
  skinCount: number;
  /** Scores that were in contention */
  scores: Record<PlayerId, number>;
}

/**
 * Compute skin winner for a hole
 *
 * @param hole - Hole number
 * @param scores - Map of player ID to score
 * @param playerNames - Optional map of player ID to name
 * @param carryoverCount - Number of carryovers coming into this hole
 * @returns Skin result
 */
export function computeSkinWinner(
  hole: HoleNumber,
  scores: Record<PlayerId, number>,
  playerNames?: Record<PlayerId, string>,
  carryoverCount: number = 0
): SkinResult {
  const scoreEntries = Object.entries(scores);

  if (scoreEntries.length === 0) {
    return {
      hole,
      winnerId: null,
      skinCount: carryoverCount + 1,
      scores,
    };
  }

  // Find lowest score
  const lowestScore = Math.min(...scoreEntries.map(([, s]) => s));

  // Find players with lowest score
  const playersWithLowest = scoreEntries.filter(([, s]) => s === lowestScore);

  if (playersWithLowest.length === 1) {
    // Single winner takes the skin(s)
    const [winnerId] = playersWithLowest[0];
    return {
      hole,
      winnerId,
      winnerName: playerNames?.[winnerId],
      skinCount: carryoverCount + 1,
      scores,
    };
  } else {
    // Tie = carryover (no winner)
    return {
      hole,
      winnerId: null,
      skinCount: carryoverCount + 1,
      scores,
    };
  }
}

// ============================================
// SEGMENTS
// ============================================

/**
 * Get default segments based on holes planned
 *
 * @param holesPlanned - 9 or 18 holes
 * @returns Array of segment definitions
 */
export function getDefaultSegments(holesPlanned: 9 | 18): Segment[] {
  if (holesPlanned === 9) {
    // For 9-hole rounds: front and total only (both cover 1-9)
    return [
      { id: 'front', startHole: 1, endHole: 9, active: true },
      { id: 'back', startHole: 10, endHole: 18, active: false }, // Inactive for 9-hole
      { id: 'total', startHole: 1, endHole: 9, active: true },
    ];
  }

  // For 18-hole rounds: full front, back, total
  return [
    { id: 'front', startHole: 1, endHole: 9, active: true },
    { id: 'back', startHole: 10, endHole: 18, active: true },
    { id: 'total', startHole: 1, endHole: 18, active: true },
  ];
}

/**
 * Get segment for a given hole
 */
export function getSegmentForHole(hole: HoleNumber): 'front' | 'back' {
  return hole <= 9 ? 'front' : 'back';
}

/**
 * Get end hole for a press based on parent segment
 */
export function getPressEndHole(
  parentSegment: 'front' | 'back' | 'total',
  holesPlanned: 9 | 18
): HoleNumber {
  if (holesPlanned === 9) {
    return 9;
  }

  switch (parentSegment) {
    case 'front':
      return 9;
    case 'back':
    case 'total':
      return 18;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get the maximum completed hole for a contest
 * A hole is "complete" when all required players have scores
 */
export function getThruHole(
  round: Round,
  playerIds: PlayerId[],
  startHole: HoleNumber,
  endHole: HoleNumber
): HoleNumber | null {
  let thruHole: HoleNumber | null = null;

  for (let hole = startHole; hole <= endHole; hole++) {
    const holeNum = hole as HoleNumber;
    const allHaveScores = playerIds.every((playerId) => {
      const score = round.grossStrokes[playerId]?.[holeNum];
      return score !== undefined && score > 0;
    });

    if (allHaveScores) {
      thruHole = holeNum;
    } else {
      // Stop at first incomplete hole
      break;
    }
  }

  return thruHole;
}

/**
 * Check if a contest is final (all holes complete)
 */
export function isContestFinal(
  thruHole: HoleNumber | null,
  endHole: HoleNumber,
  isClosed?: boolean
): boolean {
  // Match play can end early if closed
  if (isClosed) {
    return true;
  }

  return thruHole === endHole;
}

/**
 * Get player name from round data
 */
export function getPlayerName(round: Round, playerId: PlayerId): string {
  const player = round.players.find((p) => p.id === playerId);
  return player?.name ?? playerId;
}

/**
 * Build a map of player ID to name
 */
export function buildPlayerNameMap(round: Round): Record<PlayerId, string> {
  const map: Record<PlayerId, string> = {};
  for (const player of round.players) {
    map[player.id] = player.name;
  }
  return map;
}

/**
 * Create a hole audit entry
 */
export function createHoleAuditEntry(
  hole: HoleNumber,
  par: number,
  players: HolePlayerAudit[],
  options?: {
    winner?: PlayerId | PlayerId[] | 'halved' | 'carryover';
    skinValue?: number;
    carryoverCount?: number;
    matchState?: string;
    notes?: string;
  }
): HoleAuditEntry {
  return {
    hole,
    par,
    players,
    ...options,
  };
}
