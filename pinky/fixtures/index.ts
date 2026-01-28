/**
 * Pinky Test Fixtures
 *
 * Re-exports all fixtures for convenient imports.
 *
 * Usage:
 * import { DEMO_USERS, CHAOS_INPUTS } from '../fixtures';
 */

export {
  DEMO_USERS,
  TEST_PERSONAS,
  getOwnerUser,
  getPlayers,
  getUserById,
  getUserByRole,
  humanDelay,
  type TestUser,
  type UserBehavior,
} from './test-users';

export {
  CHAOS_INPUTS,
  ALL_CHAOS_INPUTS,
  EMPTY_INPUTS,
  BOUNDARY_NUMBERS,
  SPECIAL_CHARS,
  SECURITY_INPUTS,
  UNICODE_INPUTS,
  LONG_STRINGS,
  getRandomChaos,
  getTextFieldChaos,
  getNumberFieldChaos,
  type ChaosInput,
} from './chaos-inputs';

export {
  FULL_ROUND_SCORES,
  EXPECTED_SETTLEMENT,
  TEST_GAME_CONFIG,
  PRESS_CONFIG,
  getFront9Scores,
  getBack9Scores,
  calculateTotals,
  type HoleScore,
} from './test-scores';
