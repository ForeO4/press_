/**
 * Press! Rules Engine - Human-Readable Explanations
 *
 * Generates user-friendly strings explaining:
 * - Match results
 * - Handicap strokes
 * - Skins results
 * - Settlement summaries
 */

import type {
  HoleNumber,
  Units,
  LedgerEntry,
  ContestResult,
  MatchPlayStanding,
  SkinsStanding,
  StablefordStanding,
  NassauSegmentResult,
  NassauPressResult,
} from './types';
import type { MatchStatus, SkinResult } from './scoring';
import type { StrokesPerHole } from './handicap';

// ============================================
// MATCH PLAY EXPLANATIONS
// ============================================

/**
 * Explain match play result in human-readable form
 *
 * Examples:
 * - "Blake wins 3&2"
 * - "Alex 1 UP thru 14"
 * - "All Square"
 * - "Alex is dormie (2 UP with 2 to play)"
 */
export function explainMatchResult(
  status: MatchStatus,
  leaderName?: string
): string {
  const name = leaderName ?? status.leaderName ?? 'Leader';

  if (status.isClosed && status.result) {
    return `${name} wins ${status.result}`;
  }

  if (status.status === 'all_square') {
    if (status.holesRemaining === 0) {
      return 'All Square (tied)';
    }
    return `All Square thru ${status.holesPlayed}`;
  }

  if (status.status === 'dormie') {
    return `${name} is dormie (${status.holesUp} UP with ${status.holesRemaining} to play)`;
  }

  if (status.holesRemaining === 0) {
    // Match complete
    return `${name} wins ${status.holesUp} UP`;
  }

  return `${name} ${status.holesUp} UP thru ${status.holesPlayed}`;
}

/**
 * Format match state for display (short form)
 *
 * Examples: "2 UP", "A/S", "3&2"
 */
export function formatMatchState(status: MatchStatus): string {
  if (status.result) {
    return status.result;
  }

  if (status.holesUp === 0) {
    return 'A/S';
  }

  return `${status.holesUp} UP`;
}

/**
 * Explain match standing from player's perspective
 */
export function explainMatchStanding(standing: MatchPlayStanding): string {
  if (standing.result) {
    if (standing.holesUp > 0) {
      return `Won ${standing.result}`;
    } else if (standing.holesUp < 0) {
      return `Lost ${standing.result}`;
    } else {
      return 'Tied (A/S)';
    }
  }

  if (standing.matchStatus === 'all_square') {
    return `All Square thru ${standing.holesPlayed}`;
  }

  if (standing.matchStatus === 'dormie') {
    const upDown = standing.holesUp > 0 ? 'UP' : 'DOWN';
    return `Dormie (${Math.abs(standing.holesUp)} ${upDown})`;
  }

  const upDown = standing.holesUp > 0 ? 'UP' : 'DOWN';
  return `${Math.abs(standing.holesUp)} ${upDown} thru ${standing.holesPlayed}`;
}

// ============================================
// HANDICAP EXPLANATIONS
// ============================================

/**
 * Explain handicap strokes allocation
 *
 * Example: "Blake receives dots on holes 1,3,5,7,9,11,13,15,17 (9 strokes)"
 */
export function explainHandicapStrokes(
  playerName: string,
  strokesPerHole: StrokesPerHole
): string {
  const dotsHoles: number[] = [];
  const doubleDotsHoles: number[] = [];
  let totalStrokes = 0;

  for (let hole = 1; hole <= 18; hole++) {
    const strokes = strokesPerHole[hole as HoleNumber] ?? 0;
    if (strokes >= 2) {
      doubleDotsHoles.push(hole);
      totalStrokes += strokes;
    } else if (strokes === 1) {
      dotsHoles.push(hole);
      totalStrokes += strokes;
    }
  }

  if (totalStrokes === 0) {
    return `${playerName} plays scratch (no strokes)`;
  }

  const parts: string[] = [];

  if (dotsHoles.length > 0) {
    parts.push(`dots on holes ${dotsHoles.join(',')}`);
  }

  if (doubleDotsHoles.length > 0) {
    parts.push(`double dots on holes ${doubleDotsHoles.join(',')}`);
  }

  return `${playerName} receives ${parts.join(' and ')} (${totalStrokes} strokes total)`;
}

/**
 * Short form handicap explanation
 *
 * Example: "9 strokes (dots: 1,3,5,7,9,11,13,15,17)"
 */
export function formatHandicapShort(strokesPerHole: StrokesPerHole): string {
  const dotsHoles: number[] = [];
  let totalStrokes = 0;

  for (let hole = 1; hole <= 18; hole++) {
    const strokes = strokesPerHole[hole as HoleNumber] ?? 0;
    if (strokes > 0) {
      dotsHoles.push(hole);
      totalStrokes += strokes;
    }
  }

  if (totalStrokes === 0) {
    return 'Scratch';
  }

  return `${totalStrokes} strokes (holes: ${dotsHoles.join(',')})`;
}

// ============================================
// SKINS EXPLANATIONS
// ============================================

/**
 * Explain skin result for a hole
 *
 * Examples:
 * - "Hole 7: Blake wins (2 skins)"
 * - "Hole 8: Carryover (tied)"
 * - "Hole 9: Alex wins skin"
 */
export function explainSkinResult(result: SkinResult): string {
  if (result.winnerId === null) {
    if (result.skinCount > 1) {
      return `Hole ${result.hole}: Carryover (+${result.skinCount - 1} = ${result.skinCount} skins at stake)`;
    }
    return `Hole ${result.hole}: Carryover (tied)`;
  }

  const winnerName = result.winnerName ?? result.winnerId;
  if (result.skinCount > 1) {
    return `Hole ${result.hole}: ${winnerName} wins ${result.skinCount} skins`;
  }
  return `Hole ${result.hole}: ${winnerName} wins skin`;
}

/**
 * Explain skins standing
 */
export function explainSkinsStanding(standing: SkinsStanding): string {
  if (standing.skinsWon === 0) {
    return `${standing.playerName}: No skins`;
  }

  const skinWord = standing.skinsWon === 1 ? 'skin' : 'skins';
  return `${standing.playerName}: ${standing.skinsWon} ${skinWord} (${standing.totalValue} units)`;
}

// ============================================
// STABLEFORD EXPLANATIONS
// ============================================

/**
 * Explain Stableford standing
 */
export function explainStablefordStanding(standing: StablefordStanding): string {
  const rankSuffix = getRankSuffix(standing.rank);
  return `${standing.rank}${rankSuffix}: ${standing.playerName} - ${standing.totalPoints} points thru ${standing.thruHole}`;
}

/**
 * Get ordinal suffix for rank (1st, 2nd, 3rd, etc.)
 */
function getRankSuffix(rank: number): string {
  if (rank >= 11 && rank <= 13) return 'th';
  switch (rank % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// ============================================
// NASSAU EXPLANATIONS
// ============================================

/**
 * Explain Nassau segment result
 */
export function explainNassauSegment(segment: NassauSegmentResult): string {
  if (segment.status === 'live') {
    if (segment.holesUp === 0) {
      return `${segment.segmentName}: All Square thru ${segment.thruHole}`;
    }
    return `${segment.segmentName}: ${segment.winnerName} ${segment.holesUp} UP thru ${segment.thruHole}`;
  }

  // Final
  if (segment.holesUp === 0) {
    return `${segment.segmentName}: All Square`;
  }
  return `${segment.segmentName}: ${segment.winnerName} wins ${segment.result}`;
}

/**
 * Explain Nassau press result
 */
export function explainNassauPress(press: NassauPressResult): string {
  const range = `H${press.startHole}-${press.endHole}`;

  if (press.status === 'live') {
    if (press.holesUp === 0) {
      return `Press (${range}): All Square thru ${press.thruHole}`;
    }
    return `Press (${range}): ${press.winnerName} ${press.holesUp} UP thru ${press.thruHole}`;
  }

  // Final
  if (press.holesUp === 0) {
    return `Press (${range}): All Square`;
  }
  return `Press (${range}): ${press.winnerName} wins ${press.result}`;
}

// ============================================
// SETTLEMENT EXPLANATIONS
// ============================================

/**
 * Explain a single ledger entry
 */
export function explainLedgerEntry(entry: LedgerEntry): string {
  if (entry.fromPlayerId && entry.toPlayerId) {
    return `${entry.fromPlayerId} owes ${entry.toPlayerId} ${entry.amount} units (${entry.description})`;
  }

  if (entry.toPlayerId && entry.splitAmongPlayerIds) {
    return `${entry.toPlayerId} wins ${entry.amount} units from ${entry.splitAmongPlayerIds.join(', ')} (${entry.description})`;
  }

  return `${entry.description}: ${entry.amount} units`;
}

/**
 * Explain all settlement entries
 */
export function explainSettlement(entries: LedgerEntry[]): string[] {
  return entries.map(explainLedgerEntry);
}

/**
 * Format balance for display
 *
 * Examples: "+30 units", "-15 units", "Even"
 */
export function formatBalance(balance: Units): string {
  if (balance === 0) {
    return 'Even';
  }

  const sign = balance > 0 ? '+' : '';
  return `${sign}${balance} units`;
}

/**
 * Explain net balance for a player
 */
export function explainNetBalance(playerName: string, balance: Units): string {
  if (balance === 0) {
    return `${playerName}: Even`;
  }

  if (balance > 0) {
    return `${playerName}: +${balance} units (winning)`;
  }

  return `${playerName}: ${balance} units (owing)`;
}

// ============================================
// CONTEST RESULT SUMMARY
// ============================================

/**
 * Generate a brief summary of contest result
 */
export function summarizeContestResult(result: ContestResult): string {
  const { summary, standings } = result;
  const statusStr = summary.status === 'final' ? 'Final' : `Thru ${summary.thruHole}`;

  switch (standings.type) {
    case 'match_play': {
      const leader = standings.standings.find((s) => s.holesUp > 0);
      if (!leader) {
        return `${summary.name}: All Square (${statusStr})`;
      }
      return `${summary.name}: ${leader.playerName} ${leader.result ?? `${leader.holesUp} UP`} (${statusStr})`;
    }

    case 'skins': {
      const totalSkins = standings.totalSkinsAwarded;
      const topWinner = standings.standings.reduce(
        (best, s) => (s.skinsWon > (best?.skinsWon ?? 0) ? s : best),
        null as SkinsStanding | null
      );
      if (!topWinner || topWinner.skinsWon === 0) {
        return `${summary.name}: ${totalSkins} skins awarded (${statusStr})`;
      }
      return `${summary.name}: ${topWinner.playerName} leads with ${topWinner.skinsWon} skins (${statusStr})`;
    }

    case 'stableford': {
      const leader = standings.standings[0];
      if (!leader) {
        return `${summary.name}: No scores yet`;
      }
      return `${summary.name}: ${leader.playerName} leads with ${leader.totalPoints} pts (${statusStr})`;
    }

    case 'nassau': {
      const segmentsComplete = standings.segments.filter((s) => s.status === 'final').length;
      return `${summary.name}: ${segmentsComplete}/3 segments complete, ${standings.presses.length} presses (${statusStr})`;
    }

    default:
      return `${summary.name}: ${statusStr}`;
  }
}

// ============================================
// STAKES SUMMARY
// ============================================

/**
 * Format stakes summary for display
 *
 * Examples:
 * - "10 units/hole"
 * - "Front: 5, Back: 5, Total: 10"
 * - "50 unit pot"
 */
export function formatStakesSummary(
  unit: Units,
  options?: {
    perHole?: boolean;
    potTotal?: Units;
    segments?: { front?: Units; back?: Units; total?: Units };
  }
): string {
  if (options?.potTotal) {
    return `${options.potTotal} unit pot`;
  }

  if (options?.perHole) {
    return `${unit} units/skin`;
  }

  if (options?.segments) {
    const parts: string[] = [];
    if (options.segments.front) parts.push(`Front: ${options.segments.front}`);
    if (options.segments.back) parts.push(`Back: ${options.segments.back}`);
    if (options.segments.total) parts.push(`Total: ${options.segments.total}`);
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }

  return `${unit} units`;
}
