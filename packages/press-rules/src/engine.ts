/**
 * Press! Rules Engine - Main Engine
 *
 * Provides:
 * - ContestRegistry for pluggable contest types
 * - computeContests() main entry point
 * - Aggregated settlement computation
 */

import type {
  Round,
  ContestConfig,
  ContestResult,
  ContestType,
  ContestHandler,
  ValidationResult,
  PlayerId,
  Units,
  LedgerEntry,
} from './types';
import { aggregateSettlements } from './settlement';

// ============================================
// CONTEST REGISTRY
// ============================================

/**
 * Registry for contest handlers
 * Allows pluggable architecture where each contest type can be added independently
 */
export class ContestRegistry {
  private handlers: Map<ContestType, ContestHandler> = new Map();

  /**
   * Register a contest handler
   */
  register(handler: ContestHandler): void {
    this.handlers.set(handler.type, handler);
  }

  /**
   * Get handler for a contest type
   */
  get(type: ContestType): ContestHandler | undefined {
    return this.handlers.get(type);
  }

  /**
   * Check if handler exists for a contest type
   */
  has(type: ContestType): boolean {
    return this.handlers.has(type);
  }

  /**
   * Get all registered contest types
   */
  types(): ContestType[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Validate a contest configuration
   */
  validate(config: ContestConfig): ValidationResult {
    const handler = this.handlers.get(config.type);
    if (!handler) {
      return {
        valid: false,
        errors: [`Unknown contest type: ${config.type}`],
      };
    }

    return handler.validate(config);
  }
}

/**
 * Create a new contest registry
 */
export function createContestRegistry(): ContestRegistry {
  return new ContestRegistry();
}

// ============================================
// DEFAULT REGISTRY (populated by contests/index.ts)
// ============================================

/**
 * Default registry - will be populated with all MVP contest handlers
 */
export const defaultRegistry = new ContestRegistry();

// ============================================
// MAIN ENGINE FUNCTION
// ============================================

/**
 * Compute results for multiple contests
 *
 * This is the main entry point for the rules engine.
 * Given a round (scores, players, tee data) and contest configurations,
 * computes complete results including standings, audit, and settlement.
 *
 * @param round - Round data including scores, players, tee info
 * @param contests - Array of contest configurations
 * @param registry - Optional custom registry (defaults to defaultRegistry)
 * @returns Array of contest results
 */
export function computeContests(
  round: Round,
  contests: ContestConfig[],
  registry: ContestRegistry = defaultRegistry
): ContestResult[] {
  const results: ContestResult[] = [];

  for (const config of contests) {
    const handler = registry.get(config.type);

    if (!handler) {
      // Skip unknown contest types with a warning result
      console.warn(`No handler for contest type: ${config.type}`);
      continue;
    }

    // Validate configuration
    const validation = handler.validate(config);
    if (!validation.valid) {
      console.warn(`Invalid contest config for ${config.contestId}: ${validation.errors.join(', ')}`);
      continue;
    }

    // Compute contest result
    const result = handler.compute(round, config);
    results.push(result);
  }

  return results;
}

/**
 * Compute aggregated settlement across all contests
 *
 * Combines all ledger entries and computes net balances per player.
 *
 * @param results - Array of contest results
 * @returns Combined entries and net balances
 */
export function computeAggregatedSettlement(
  results: ContestResult[]
): {
  allEntries: LedgerEntry[];
  netBalances: Record<PlayerId, Units>;
} {
  const settlements = results.map((r) => r.settlement);
  return aggregateSettlements(settlements);
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Basic validation for any contest configuration
 */
export function validateBasicConfig(config: ContestConfig): ValidationResult {
  const errors: string[] = [];

  if (!config.contestId) {
    errors.push('contestId is required');
  }

  if (!config.name) {
    errors.push('name is required');
  }

  if (!config.type) {
    errors.push('type is required');
  }

  if (!config.participants || config.participants.length === 0) {
    errors.push('participants are required');
  }

  if (!config.stakesConfig) {
    errors.push('stakesConfig is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that all participants exist in the round
 */
export function validateParticipantsExist(
  round: Round,
  participantIds: PlayerId[]
): ValidationResult {
  const errors: string[] = [];
  const roundPlayerIds = new Set(round.players.map((p) => p.id));

  for (const playerId of participantIds) {
    if (!roundPlayerIds.has(playerId)) {
      errors.push(`Participant ${playerId} not found in round players`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Combine multiple validation results
 */
export function combineValidations(...validations: ValidationResult[]): ValidationResult {
  const errors: string[] = [];

  for (const validation of validations) {
    errors.push(...validation.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// ROUND HELPERS
// ============================================

/**
 * Get holes planned from round meta (default: 18)
 */
export function getHolesPlanned(round: Round): 9 | 18 {
  return round.meta?.holesPlanned ?? 18;
}

/**
 * Get press events from round meta
 */
export function getPressEvents(round: Round) {
  return round.meta?.events?.presses ?? [];
}

/**
 * Get CTP events from round meta
 */
export function getCtpEvents(round: Round) {
  return round.meta?.events?.ctp ?? [];
}

/**
 * Get Long Drive events from round meta
 */
export function getLongDriveEvents(round: Round) {
  return round.meta?.events?.longDrive ?? [];
}

/**
 * Get Three-putt events from round meta
 */
export function getThreePuttEvents(round: Round) {
  return round.meta?.events?.threePutts ?? [];
}
