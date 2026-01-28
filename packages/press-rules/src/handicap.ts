/**
 * Press! Rules Engine - Handicap Computation
 *
 * Computes handicap strokes per hole based on course handicap and stroke index.
 * Supports:
 * - Course handicap 0-18 (single dots)
 * - Course handicap 19-36 (double dots on harder holes)
 * - Negative course handicap (giving strokes)
 * - Relative handicap for match play
 */

import type { HoleNumber, PlayerId, HandicapConfig } from './types';

/** Stroke index values (1-18) */
export type StrokeIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18;

/** Strokes received per hole */
export type StrokesPerHole = Record<HoleNumber, number>;

/**
 * Compute handicap strokes received per hole
 *
 * Rules:
 * - Stroke index 1 = hardest hole, 18 = easiest
 * - Handicap 1-18: One stroke (dot) on holes where strokeIndex <= courseHandicap
 * - Handicap 19-36: Two strokes on holes where strokeIndex <= (courseHandicap - 18),
 *                   one stroke on remaining holes up to 18
 * - Handicap 0: No strokes
 * - Negative handicap: Giving strokes (returned as negative values)
 *
 * @param strokeIndex - Stroke index for each hole (1-18)
 * @param courseHandicap - Player's course handicap
 * @returns Strokes received per hole (positive = receiving, negative = giving)
 */
export function computeHandicapStrokes(
  strokeIndex: Record<HoleNumber, StrokeIndex>,
  courseHandicap: number
): StrokesPerHole {
  const strokes: Partial<StrokesPerHole> = {};

  // Handle negative handicap (giving strokes)
  const isGiving = courseHandicap < 0;
  const absHandicap = Math.abs(courseHandicap);

  // Calculate base strokes (first 18)
  const baseStrokes = Math.min(absHandicap, 18);
  // Calculate extra strokes for handicap > 18 (double dots)
  const extraStrokes = Math.max(0, absHandicap - 18);

  for (let hole = 1; hole <= 18; hole++) {
    const holeNum = hole as HoleNumber;
    const holeStrokeIndex = strokeIndex[holeNum];

    let dots = 0;

    // First round of strokes (holes with stroke index <= baseStrokes)
    if (holeStrokeIndex <= baseStrokes) {
      dots += 1;
    }

    // Second round of strokes for handicap > 18 (holes with stroke index <= extraStrokes)
    if (holeStrokeIndex <= extraStrokes) {
      dots += 1;
    }

    // Apply sign for giving strokes
    strokes[holeNum] = isGiving ? -dots : dots;
  }

  return strokes as StrokesPerHole;
}

/**
 * Compute relative handicaps for match play
 *
 * In match play, the lowest handicap player plays off scratch (0),
 * and other players receive the difference.
 *
 * @param playerHandicaps - Map of player IDs to course handicaps
 * @returns Map of player IDs to relative handicaps
 */
export function computeRelativeHandicaps(
  playerHandicaps: Record<PlayerId, number>
): Record<PlayerId, number> {
  const handicaps = Object.values(playerHandicaps);
  if (handicaps.length === 0) {
    return {};
  }

  const minHandicap = Math.min(...handicaps);
  const result: Record<PlayerId, number> = {};

  for (const [playerId, handicap] of Object.entries(playerHandicaps)) {
    result[playerId] = handicap - minHandicap;
  }

  return result;
}

/**
 * Compute net score for a hole
 *
 * @param grossScore - Gross strokes
 * @param dotsReceived - Handicap strokes received (positive) or given (negative)
 * @param config - Handicap configuration
 * @returns Net score (minimum 1 unless allowBelow1 is true)
 */
export function computeNetScore(
  grossScore: number,
  dotsReceived: number,
  config?: HandicapConfig
): number {
  const netScore = grossScore - dotsReceived;

  // By default, minimum net score is 1 (can't score zero or negative)
  const allowBelow1 = config?.allowBelow1 ?? false;
  if (!allowBelow1 && netScore < 1) {
    return 1;
  }

  return netScore;
}

/**
 * Get total strokes received for a range of holes
 *
 * @param strokesPerHole - Strokes per hole map
 * @param startHole - Start of range (inclusive)
 * @param endHole - End of range (inclusive)
 * @returns Total strokes in range
 */
export function getTotalStrokesInRange(
  strokesPerHole: StrokesPerHole,
  startHole: HoleNumber,
  endHole: HoleNumber
): number {
  let total = 0;
  for (let hole = startHole; hole <= endHole; hole++) {
    total += strokesPerHole[hole as HoleNumber] ?? 0;
  }
  return total;
}

/**
 * Get holes where a player receives strokes (dots)
 *
 * @param strokesPerHole - Strokes per hole map
 * @returns Array of hole numbers where player receives >= 1 stroke
 */
export function getHolesWithDots(strokesPerHole: StrokesPerHole): HoleNumber[] {
  const holes: HoleNumber[] = [];
  for (let hole = 1; hole <= 18; hole++) {
    const holeNum = hole as HoleNumber;
    if ((strokesPerHole[holeNum] ?? 0) > 0) {
      holes.push(holeNum);
    }
  }
  return holes;
}

/**
 * Get holes where a player receives double dots (2 strokes)
 *
 * @param strokesPerHole - Strokes per hole map
 * @returns Array of hole numbers where player receives >= 2 strokes
 */
export function getHolesWithDoubleDots(strokesPerHole: StrokesPerHole): HoleNumber[] {
  const holes: HoleNumber[] = [];
  for (let hole = 1; hole <= 18; hole++) {
    const holeNum = hole as HoleNumber;
    if ((strokesPerHole[holeNum] ?? 0) >= 2) {
      holes.push(holeNum);
    }
  }
  return holes;
}
