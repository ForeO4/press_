import type {
  Game,
  GameWithParticipants,
  HoleScore,
  AutoPressConfig,
} from '@/types';
import {
  computeHoleResults,
  computeMatchPlayResult,
} from '@/lib/domain/settlement/computeSettlement';

export interface AutoPressCheckResult {
  shouldPress: boolean;
  losingPlayerId: string | null;
  losingPlayerName?: string;
  holesDown: number;
  startHole: number;
  reason?: string;
}

/**
 * Default auto-press configuration
 */
export const DEFAULT_AUTO_PRESS_CONFIG: AutoPressConfig = {
  enabled: true,
  trigger: 2,      // Press when 2 down
  maxPresses: 3,   // Max 3 presses per game
  stakeMultiplier: 1, // Same stake as parent
};

/**
 * Check if an auto-press should be triggered after a hole is completed
 */
export function checkAutoPress(
  game: GameWithParticipants,
  playerAId: string,
  playerBId: string,
  playerAScores: HoleScore[],
  playerBScores: HoleScore[],
  config: AutoPressConfig,
  currentHole: number
): AutoPressCheckResult {
  // If auto-press is disabled, never trigger
  if (!config.enabled) {
    return {
      shouldPress: false,
      losingPlayerId: null,
      holesDown: 0,
      startHole: currentHole + 1,
      reason: 'Auto-press disabled',
    };
  }

  // Count existing presses (child games)
  const existingPressCount = game.childGames?.length ?? 0;
  if (existingPressCount >= config.maxPresses) {
    return {
      shouldPress: false,
      losingPlayerId: null,
      holesDown: 0,
      startHole: currentHole + 1,
      reason: `Max presses (${config.maxPresses}) reached`,
    };
  }

  // Check if we're past the point where a press would make sense
  // (need at least 2 holes remaining for a meaningful press)
  const holesRemaining = game.endHole - currentHole;
  if (holesRemaining < 2) {
    return {
      shouldPress: false,
      losingPlayerId: null,
      holesDown: 0,
      startHole: currentHole + 1,
      reason: 'Not enough holes remaining',
    };
  }

  // Calculate current match status
  const holeResults = computeHoleResults(
    game,
    playerAId,
    playerBId,
    playerAScores,
    playerBScores
  );
  const matchResult = computeMatchPlayResult(playerAId, playerBId, holeResults);

  // Check if either player is down by the trigger amount
  if (matchResult.holesUp >= config.trigger && matchResult.loserId) {
    return {
      shouldPress: true,
      losingPlayerId: matchResult.loserId,
      holesDown: matchResult.holesUp,
      startHole: currentHole + 1,
    };
  }

  return {
    shouldPress: false,
    losingPlayerId: null,
    holesDown: 0,
    startHole: currentHole + 1,
    reason: `Not enough holes down (need ${config.trigger})`,
  };
}

/**
 * Compute the stake for an auto-press based on the parent game
 */
export function computeAutoPressStake(
  parentGame: Game,
  config: AutoPressConfig
): number {
  return Math.round(parentGame.stakeTeethInt * config.stakeMultiplier);
}

/**
 * Check if auto-press should fire for the current match state
 * This is a simpler check used for real-time updates
 */
export function shouldTriggerAutoPress(
  holesDown: number,
  existingPressCount: number,
  holesRemaining: number,
  config: AutoPressConfig
): boolean {
  if (!config.enabled) return false;
  if (existingPressCount >= config.maxPresses) return false;
  if (holesRemaining < 2) return false;
  if (holesDown < config.trigger) return false;
  return true;
}
