import type { Game, CreatePressInput, CreatePressResult, AlligatorTeeth } from '@/types';

/**
 * Validation result for press creation
 */
export interface ValidatePressResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate press creation input
 */
export function validatePress(
  input: CreatePressInput,
  parentGame: Game,
  currentHole: number
): ValidatePressResult {
  // Stake cannot be negative
  if (input.stake < 0) {
    return { valid: false, error: 'Stake cannot be negative' };
  }

  // Stake must be an integer (Alligator Teeth are always integers)
  if (!Number.isInteger(input.stake)) {
    return { valid: false, error: 'Stake must be an integer (Alligator Teeth)' };
  }

  // Start hole must be valid
  if (input.startHole < 1 || input.startHole > 18) {
    return { valid: false, error: 'Start hole must be between 1 and 18' };
  }

  // Press must start after current completed hole
  if (input.startHole <= currentHole) {
    return {
      valid: false,
      error: `Press must start after current hole (${currentHole})`,
    };
  }

  // Press cannot start after parent game ends
  if (input.startHole > parentGame.endHole) {
    return {
      valid: false,
      error: `Press cannot start after parent game ends (hole ${parentGame.endHole})`,
    };
  }

  // Parent game must be active
  if (parentGame.status !== 'active') {
    return { valid: false, error: 'Cannot press a completed game' };
  }

  return { valid: true };
}

/**
 * Create a press (child game)
 * Returns the new press data
 */
export function createPress(
  input: CreatePressInput,
  parentGame: Game
): CreatePressResult {
  return {
    id: `press-${Date.now()}`, // Temporary ID, replaced by DB
    parentGameId: input.parentGameId,
    startHole: input.startHole,
    endHole: parentGame.endHole, // Inherit end hole from parent
    stake: input.stake,
  };
}

/**
 * Get default press stake (usually same as parent)
 */
export function getDefaultPressStake(parentGame: Game): AlligatorTeeth {
  return parentGame.stakeTeethInt;
}

/**
 * Check if a press can be created for a game
 */
export function canCreatePress(
  game: Game,
  currentHole: number,
  allowSelfPress: boolean,
  isAdmin: boolean,
  isParticipant: boolean
): boolean {
  // Game must be active
  if (game.status !== 'active') {
    return false;
  }

  // Must have holes remaining
  if (currentHole >= game.endHole) {
    return false;
  }

  // Admin can always create presses
  if (isAdmin) {
    return true;
  }

  // Check if self-press is allowed and user is participant
  return allowSelfPress && isParticipant;
}
