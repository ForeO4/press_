import type {
  Game,
  HoleScore,
  Settlement,
  AlligatorTeeth,
  SettlementWithNames,
} from '@/types';

/**
 * Match play hole result
 */
export interface HoleResult {
  hole: number;
  playerAStrokes: number;
  playerBStrokes: number;
  winner: 'A' | 'B' | 'tie';
}

/**
 * Match play game result
 */
export interface MatchPlayResult {
  playerAId: string;
  playerBId: string;
  playerANet: number; // Positive = holes up
  playerBNet: number;
  winnerId: string | null;
  loserId: string | null;
  holesUp: number;
}

/**
 * Compute hole-by-hole results for match play
 */
export function computeHoleResults(
  game: Game,
  playerAId: string,
  playerBId: string,
  playerAScores: HoleScore[],
  playerBScores: HoleScore[]
): HoleResult[] {
  const results: HoleResult[] = [];

  for (let hole = game.startHole; hole <= game.endHole; hole++) {
    const scoreA = playerAScores.find((s) => s.holeNumber === hole);
    const scoreB = playerBScores.find((s) => s.holeNumber === hole);

    if (!scoreA || !scoreB) {
      continue; // Skip holes without scores
    }

    let winner: 'A' | 'B' | 'tie';
    if (scoreA.strokes < scoreB.strokes) {
      winner = 'A';
    } else if (scoreB.strokes < scoreA.strokes) {
      winner = 'B';
    } else {
      winner = 'tie';
    }

    results.push({
      hole,
      playerAStrokes: scoreA.strokes,
      playerBStrokes: scoreB.strokes,
      winner,
    });
  }

  return results;
}

/**
 * Compute match play result from hole results
 */
export function computeMatchPlayResult(
  playerAId: string,
  playerBId: string,
  holeResults: HoleResult[]
): MatchPlayResult {
  let playerANet = 0;

  for (const result of holeResults) {
    if (result.winner === 'A') {
      playerANet++;
    } else if (result.winner === 'B') {
      playerANet--;
    }
  }

  const playerBNet = -playerANet;
  const holesUp = Math.abs(playerANet);

  let winnerId: string | null = null;
  let loserId: string | null = null;

  if (playerANet > 0) {
    winnerId = playerAId;
    loserId = playerBId;
  } else if (playerBNet > 0) {
    winnerId = playerBId;
    loserId = playerAId;
  }

  return {
    playerAId,
    playerBId,
    playerANet,
    playerBNet,
    winnerId,
    loserId,
    holesUp,
  };
}

/**
 * Compute settlement for a match play game
 * Returns null if no settlement needed (tie)
 */
export function computeMatchPlaySettlement(
  game: Game,
  playerAId: string,
  playerBId: string,
  playerAScores: HoleScore[],
  playerBScores: HoleScore[]
): Omit<Settlement, 'id' | 'createdAt'> | null {
  const holeResults = computeHoleResults(
    game,
    playerAId,
    playerBId,
    playerAScores,
    playerBScores
  );

  const matchResult = computeMatchPlayResult(playerAId, playerBId, holeResults);

  // No settlement if tie
  if (!matchResult.winnerId || !matchResult.loserId) {
    return null;
  }

  // Calculate amount: stake * holes up
  const amount: AlligatorTeeth = game.stakeTeethInt * matchResult.holesUp;

  return {
    eventId: game.eventId,
    gameId: game.id,
    payerId: matchResult.loserId,
    payeeId: matchResult.winnerId,
    amountInt: amount,
    status: 'pending',
  };
}

/**
 * Compute net position for all users from settlements
 */
export function computeNetPositions(
  settlements: Settlement[],
  userIds: string[]
): Map<string, AlligatorTeeth> {
  const positions = new Map<string, AlligatorTeeth>();

  // Initialize all users at 0
  for (const userId of userIds) {
    positions.set(userId, 0);
  }

  // Process settlements
  for (const settlement of settlements) {
    const payerCurrent = positions.get(settlement.payerId) ?? 0;
    const payeeCurrent = positions.get(settlement.payeeId) ?? 0;

    positions.set(settlement.payerId, payerCurrent - settlement.amountInt);
    positions.set(settlement.payeeId, payeeCurrent + settlement.amountInt);
  }

  return positions;
}

/**
 * Format settlement for display
 */
export function formatSettlementDisplay(
  settlement: Settlement,
  getUserName: (id: string) => string
): SettlementWithNames {
  return {
    ...settlement,
    payerName: getUserName(settlement.payerId),
    payeeName: getUserName(settlement.payeeId),
  };
}

/**
 * Nassau settlement result (3 separate bets)
 */
export interface NassauSettlement {
  front9: Omit<Settlement, 'id' | 'createdAt'> | null;
  back9: Omit<Settlement, 'id' | 'createdAt'> | null;
  overall: Omit<Settlement, 'id' | 'createdAt'> | null;
}

/**
 * Compute hole results for a specific range of holes
 */
export function computeHoleResultsForRange(
  playerAId: string,
  playerBId: string,
  playerAScores: HoleScore[],
  playerBScores: HoleScore[],
  startHole: number,
  endHole: number
): HoleResult[] {
  const results: HoleResult[] = [];

  for (let hole = startHole; hole <= endHole; hole++) {
    const scoreA = playerAScores.find((s) => s.holeNumber === hole);
    const scoreB = playerBScores.find((s) => s.holeNumber === hole);

    if (!scoreA || !scoreB) {
      continue; // Skip holes without scores
    }

    let winner: 'A' | 'B' | 'tie';
    if (scoreA.strokes < scoreB.strokes) {
      winner = 'A';
    } else if (scoreB.strokes < scoreA.strokes) {
      winner = 'B';
    } else {
      winner = 'tie';
    }

    results.push({
      hole,
      playerAStrokes: scoreA.strokes,
      playerBStrokes: scoreB.strokes,
      winner,
    });
  }

  return results;
}

/**
 * Create a settlement from a match result
 */
function createSettlementFromResult(
  game: Game,
  matchResult: MatchPlayResult,
  stake: AlligatorTeeth
): Omit<Settlement, 'id' | 'createdAt'> | null {
  if (!matchResult.winnerId || !matchResult.loserId) {
    return null;
  }

  return {
    eventId: game.eventId,
    gameId: game.id,
    payerId: matchResult.loserId,
    payeeId: matchResult.winnerId,
    amountInt: stake * matchResult.holesUp,
    status: 'pending',
  };
}

/**
 * Compute Nassau settlement (front 9 / back 9 / overall = 3 bets)
 */
export function computeNassauSettlement(
  game: Game,
  playerAId: string,
  playerBId: string,
  playerAScores: HoleScore[],
  playerBScores: HoleScore[]
): NassauSettlement {
  const stake = game.stakeTeethInt;

  // Front 9 (holes 1-9)
  const front9Results = computeHoleResultsForRange(
    playerAId,
    playerBId,
    playerAScores,
    playerBScores,
    1,
    9
  );
  const front9Match = computeMatchPlayResult(playerAId, playerBId, front9Results);
  const front9Settlement = createSettlementFromResult(game, front9Match, stake);

  // Back 9 (holes 10-18)
  const back9Results = computeHoleResultsForRange(
    playerAId,
    playerBId,
    playerAScores,
    playerBScores,
    10,
    18
  );
  const back9Match = computeMatchPlayResult(playerAId, playerBId, back9Results);
  const back9Settlement = createSettlementFromResult(game, back9Match, stake);

  // Overall (holes 1-18)
  const overallResults = computeHoleResultsForRange(
    playerAId,
    playerBId,
    playerAScores,
    playerBScores,
    1,
    18
  );
  const overallMatch = computeMatchPlayResult(playerAId, playerBId, overallResults);
  const overallSettlement = createSettlementFromResult(game, overallMatch, stake);

  return {
    front9: front9Settlement,
    back9: back9Settlement,
    overall: overallSettlement,
  };
}

/**
 * Compute match result for a range of holes (useful for Nassau stats)
 */
export function computeMatchResultForRange(
  playerAId: string,
  playerBId: string,
  playerAScores: HoleScore[],
  playerBScores: HoleScore[],
  startHole: number,
  endHole: number
): MatchPlayResult {
  const holeResults = computeHoleResultsForRange(
    playerAId,
    playerBId,
    playerAScores,
    playerBScores,
    startHole,
    endHole
  );
  return computeMatchPlayResult(playerAId, playerBId, holeResults);
}

/**
 * Alligator Teeth disclaimer text
 */
export const TEETH_DISCLAIMER =
  'Alligator Teeth are for fun and have no cash value.';
