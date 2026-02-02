/**
 * Game Type Configuration System
 *
 * This is the single source of truth for all game type definitions.
 * Each game type defines its rules, player requirements, scoring options,
 * settlement calculations, and Gator Bucks conversion.
 *
 * BACKLOG:
 * - [ ] Match Play: Get full rules and settings definition
 * - [ ] Nassau: Get full rules and settings definition
 * - [ ] Skins: Get full rules and settings definition
 * - [ ] High-Low-Total: Rules defined, needs validation
 * - [ ] Wolf: Add game type
 * - [ ] Stableford: Add game type
 * - [ ] Best Ball: Add game type
 * - [ ] Scramble: Add game type
 */

import type { GameType } from '@/types';

// ============================================
// Types
// ============================================

export type ScoringBasisOption = 'net' | 'gross' | 'both';

// ============================================
// Scoring Calculation Types
// ============================================

export type ScoringMethod = 'hole_by_hole' | 'total_strokes' | 'points' | 'skins';
export type TieHandling = 'halve' | 'carryover' | 'split' | 'push';
export type WinnerCriteria = 'lowest_score' | 'highest_score' | 'closest_to_target';

export interface HoleWinnerConfig {
  criteria: WinnerCriteria;
  tieHandling: TieHandling;
}

export interface PointsSystem {
  perHole: Record<string, number>; // e.g., { low: 1, high: -1, total: 1 }
  aggregation: 'sum' | 'net';
}

export interface ScoringCalculation {
  method: ScoringMethod;
  description: string;
  holeWinner?: HoleWinnerConfig;
  pointsSystem?: PointsSystem;
}

// ============================================
// Gator Bucks Conversion Types
// ============================================

export type GatorBucksMethod = 'per_hole' | 'per_point' | 'per_skin' | 'per_bet' | 'fixed_pool';

export interface GatorBucksParams {
  stake: number;
  holesUp?: number;
  points?: number;
  skins?: number;
  players?: number;
  betsWon?: number;
}

export interface GatorBucksExample {
  scenario: string;
  result: string;
}

export interface GatorBucksConversion {
  method: GatorBucksMethod;
  formula: string; // Human-readable formula
  calculate: (params: GatorBucksParams) => number;
  examples: GatorBucksExample[];
}

export interface PlayerRequirement {
  min: number;
  max: number;
  exact?: number; // If set, exactly this many players required
  teamSize?: number; // For team games (e.g., 2 for 2v2)
}

export interface GameSettingField {
  key: string;
  label: string;
  type: 'select' | 'toggle' | 'number';
  defaultValue: string | boolean | number;
  options?: { value: string; label: string; description?: string }[];
  description?: string;
  min?: number;
  max?: number;
  dependsOn?: { field: string; value: unknown }; // Show only when another field has a specific value
}

export interface GameTypeConfig {
  type: GameType;
  label: string;
  description: string;
  shortDescription: string; // For compact display

  // Player requirements
  players: PlayerRequirement;

  // Scoring options
  scoringBasis: ScoringBasisOption;
  defaultScoringBasis: 'net' | 'gross';

  // Scoring calculation (how winners/points are determined)
  scoring: ScoringCalculation;

  // Gator Bucks conversion (how game results become currency)
  gatorBucks: GatorBucksConversion;

  // Stake configuration
  stakeLabel: string; // e.g., "Stake per hole", "Stake per point", "Stake per skin"
  defaultStake: number;

  // Game-specific settings
  settings: GameSettingField[];

  // Rules summary (for help/info display)
  rulesSummary: string[];

  // Whether this game type is fully implemented
  status: 'stable' | 'beta' | 'planned';
}

// ============================================
// Game Type Configurations
// ============================================

export const GAME_TYPE_CONFIGS: Record<GameType, GameTypeConfig> = {
  match_play: {
    type: 'match_play',
    label: 'Match Play',
    description: 'Win holes, not strokes. Each hole is worth 1 point.',
    shortDescription: 'Win holes, not strokes',

    players: {
      min: 2,
      max: 2,
      exact: 2,
    },

    scoringBasis: 'both',
    defaultScoringBasis: 'net',

    scoring: {
      method: 'hole_by_hole',
      description: 'Lowest score wins each hole. Count holes won vs lost.',
      holeWinner: {
        criteria: 'lowest_score',
        tieHandling: 'halve',
      },
    },

    gatorBucks: {
      method: 'per_hole',
      formula: 'Stake × Holes Up',
      calculate: ({ stake, holesUp = 0 }) => stake * holesUp,
      examples: [
        { scenario: '2 Up at $10/hole', result: '+$20 winner, -$20 loser' },
        { scenario: 'All Square', result: 'No money changes hands' },
      ],
    },

    stakeLabel: 'Stake per hole',
    defaultStake: 10,

    settings: [
      {
        key: 'pressEnabled',
        label: 'Allow Press',
        type: 'toggle',
        defaultValue: true,
        description: 'Players can press when down to create side games',
      },
      {
        key: 'autoPress',
        label: 'Auto Press',
        type: 'toggle',
        defaultValue: false,
        description: 'Automatically press when 2 down',
        dependsOn: { field: 'pressEnabled', value: true },
      },
      {
        key: 'autoPressThreshold',
        label: 'Auto Press When Down',
        type: 'number',
        defaultValue: 2,
        min: 1,
        max: 5,
        description: 'Number of holes down to trigger auto press',
        dependsOn: { field: 'autoPress', value: true },
      },
    ],

    rulesSummary: [
      'Lowest score on a hole wins that hole (1 point)',
      'Ties ("halved") result in no points awarded',
      'Player with most points at end wins',
      'Can be played net (with handicap strokes) or gross',
    ],

    status: 'stable',
  },

  nassau: {
    type: 'nassau',
    label: 'Nassau',
    description: 'Three bets in one: Front 9, Back 9, and Overall match.',
    shortDescription: 'Front 9 + Back 9 + Overall',

    players: {
      min: 2,
      max: 4,
    },

    scoringBasis: 'both',
    defaultScoringBasis: 'net',

    scoring: {
      method: 'hole_by_hole',
      description: 'Three separate match play bets: Front 9, Back 9, Overall.',
      holeWinner: {
        criteria: 'lowest_score',
        tieHandling: 'halve',
      },
    },

    gatorBucks: {
      method: 'per_bet',
      formula: 'Stake × 3 bets (Front + Back + Overall)',
      calculate: ({ stake, betsWon = 0 }) => stake * betsWon,
      examples: [
        { scenario: 'Win all 3 at $10/bet', result: '+$30' },
        { scenario: 'Win Front, Lose Back, Halve Overall', result: 'Net $0' },
        { scenario: 'Max exposure at $10/bet', result: '$30 (3 bets)' },
      ],
    },

    stakeLabel: 'Stake per bet',
    defaultStake: 10,

    settings: [
      {
        key: 'pressEnabled',
        label: 'Allow Press',
        type: 'toggle',
        defaultValue: true,
        description: 'Players can press on any of the three bets',
      },
      {
        key: 'autoPress',
        label: 'Auto Press',
        type: 'toggle',
        defaultValue: false,
        description: 'Automatically press when 2 down on any bet',
        dependsOn: { field: 'pressEnabled', value: true },
      },
    ],

    rulesSummary: [
      'Three separate match play bets: Front 9, Back 9, Overall 18',
      'Each bet is independent - you can win one and lose others',
      'Presses create additional side bets',
      'Total payout = sum of all three bets',
    ],

    status: 'beta', // TODO: Needs full implementation
  },

  skins: {
    type: 'skins',
    label: 'Skins',
    description: 'Win a skin by having the outright lowest score on a hole.',
    shortDescription: 'Win skin per hole',

    players: {
      min: 2,
      max: 8,
    },

    scoringBasis: 'both',
    defaultScoringBasis: 'gross',

    scoring: {
      method: 'skins',
      description: 'Outright lowest score wins the skin. Ties carry over.',
      holeWinner: {
        criteria: 'lowest_score',
        tieHandling: 'carryover',
      },
    },

    gatorBucks: {
      method: 'per_skin',
      formula: 'Stake × Skins Won × (Players - 1)',
      calculate: ({ stake, skins = 0, players = 2 }) => stake * skins * (players - 1),
      examples: [
        { scenario: '1 skin at $5, 4 players', result: '+$15 (from 3 others)' },
        { scenario: '2 skins with carryover at $5, 4 players', result: '+$30' },
        { scenario: 'No skins won', result: '$0' },
      ],
    },

    stakeLabel: 'Stake per skin',
    defaultStake: 10,

    settings: [
      {
        key: 'carryover',
        label: 'Carryover Ties',
        type: 'toggle',
        defaultValue: true,
        description: 'When tied, skin carries to next hole',
      },
      {
        key: 'validation',
        label: 'Validation Required',
        type: 'toggle',
        defaultValue: false,
        description: 'Other players must confirm skin winner',
      },
    ],

    rulesSummary: [
      'Lowest score on a hole wins that skin',
      'Must have outright lowest - ties push',
      'With carryover, tied skins add to next hole',
      'More players = more competition for each skin',
    ],

    status: 'beta', // TODO: Needs full implementation
  },

  high_low_total: {
    type: 'high_low_total',
    label: 'High-Low-Total',
    description: 'Win Low point, avoid High penalty. Optional team Total point.',
    shortDescription: 'Low wins, High penalty',

    players: {
      min: 3,
      max: 4,
      teamSize: 2, // For 2v2 team mode
    },

    scoringBasis: 'net', // HLT is typically played net only
    defaultScoringBasis: 'net',

    scoring: {
      method: 'points',
      description: 'Low wins +1, High gets -1 penalty. Team Total wins +1.',
      pointsSystem: {
        perHole: { low: 1, high: -1, total: 1 },
        aggregation: 'net',
      },
    },

    gatorBucks: {
      method: 'per_point',
      formula: 'Net Points × Point Value',
      calculate: ({ stake, points = 0 }) => stake * points,
      examples: [
        { scenario: '+3 net points at $10/pt', result: '+$30' },
        { scenario: '-2 net points at $10/pt', result: '-$20' },
        { scenario: 'Break even', result: '$0' },
      ],
    },

    stakeLabel: 'Gator Bucks per point',
    defaultStake: 10,

    settings: [
      {
        key: 'tieRule',
        label: 'Tie Rule',
        type: 'select',
        defaultValue: 'push',
        options: [
          { value: 'push', label: 'Push', description: 'Ties are void - no points awarded' },
          { value: 'split', label: 'Split', description: 'Tied players split the point' },
          { value: 'carryover', label: 'Carryover', description: 'Point carries to next hole' },
        ],
        description: 'How to handle ties for Low or High',
      },
      {
        key: 'isTeamMode',
        label: 'Team Mode (2v2)',
        type: 'toggle',
        defaultValue: false,
        description: 'Adds Total point for team combined score',
      },
    ],

    rulesSummary: [
      'Low: Lowest net score wins +1 point',
      'High: Highest net score gets -1 point (penalty)',
      'Team Mode adds Total: Team with lowest combined net wins +1',
      'Net points = Low points + Total points - High points',
    ],

    status: 'stable',
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get configuration for a game type
 */
export function getGameTypeConfig(type: GameType): GameTypeConfig {
  return GAME_TYPE_CONFIGS[type];
}

/**
 * Get all game type configs as an array
 */
export function getAllGameTypeConfigs(): GameTypeConfig[] {
  return Object.values(GAME_TYPE_CONFIGS);
}

/**
 * Get game types that are ready for use (stable or beta)
 */
export function getAvailableGameTypes(): GameTypeConfig[] {
  return getAllGameTypeConfigs().filter((c) => c.status !== 'planned');
}

/**
 * Validate player count for a game type
 */
export function validatePlayerCount(type: GameType, count: number): { valid: boolean; error?: string } {
  const config = getGameTypeConfig(type);

  if (config.players.exact && count !== config.players.exact) {
    return {
      valid: false,
      error: `${config.label} requires exactly ${config.players.exact} players`,
    };
  }

  if (count < config.players.min) {
    return {
      valid: false,
      error: `${config.label} requires at least ${config.players.min} players`,
    };
  }

  if (count > config.players.max) {
    return {
      valid: false,
      error: `${config.label} allows at most ${config.players.max} players`,
    };
  }

  return { valid: true };
}

/**
 * Check if a game type supports a scoring basis
 */
export function supportsScoringBasis(type: GameType, basis: 'net' | 'gross'): boolean {
  const config = getGameTypeConfig(type);
  return config.scoringBasis === 'both' || config.scoringBasis === basis;
}

/**
 * Get default settings for a game type
 */
export function getDefaultSettings(type: GameType): Record<string, unknown> {
  const config = getGameTypeConfig(type);
  const defaults: Record<string, unknown> = {};

  for (const setting of config.settings) {
    defaults[setting.key] = setting.defaultValue;
  }

  return defaults;
}

/**
 * Get visible settings based on dependencies
 */
export function getVisibleSettings(
  type: GameType,
  currentValues: Record<string, unknown>
): GameSettingField[] {
  const config = getGameTypeConfig(type);

  return config.settings.filter((setting) => {
    if (!setting.dependsOn) return true;
    return currentValues[setting.dependsOn.field] === setting.dependsOn.value;
  });
}

// ============================================
// Scoring & Gator Bucks Helper Functions
// ============================================

/**
 * Get the scoring description for a game type
 */
export function getScoringDescription(type: GameType): string {
  const config = getGameTypeConfig(type);
  return config.scoring.description;
}

/**
 * Get the Gator Bucks formula for a game type
 */
export function getGatorBucksFormula(type: GameType): string {
  const config = getGameTypeConfig(type);
  return config.gatorBucks.formula;
}

/**
 * Get the Gator Bucks examples for a game type
 */
export function getGatorBucksExamples(type: GameType): GatorBucksExample[] {
  const config = getGameTypeConfig(type);
  return config.gatorBucks.examples;
}

/**
 * Calculate Gator Bucks for a game result
 */
export function calculateGatorBucks(
  type: GameType,
  stake: number,
  result: Omit<GatorBucksParams, 'stake'>
): number {
  const config = getGameTypeConfig(type);
  return config.gatorBucks.calculate({ stake, ...result });
}

/**
 * Get the expected number of player slots for a game type
 * Returns the exact count if specified, otherwise the max
 */
export function getPlayerSlotCount(type: GameType): number {
  const config = getGameTypeConfig(type);
  return config.players.exact ?? config.players.max;
}

/**
 * Get the minimum player count for a game type
 */
export function getMinPlayerCount(type: GameType): number {
  const config = getGameTypeConfig(type);
  return config.players.min;
}

/**
 * Validate game setup comprehensively
 */
export function validateGameSetup(
  type: GameType,
  playerCount: number,
  scoringBasis: 'net' | 'gross'
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = getGameTypeConfig(type);

  // Validate player count
  const playerValidation = validatePlayerCount(type, playerCount);
  if (!playerValidation.valid && playerValidation.error) {
    errors.push(playerValidation.error);
  }

  // Validate scoring basis
  if (!supportsScoringBasis(type, scoringBasis)) {
    errors.push(`${config.label} does not support ${scoringBasis} scoring`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get a game type's stake label (e.g., "per hole", "per point")
 */
export function getStakeLabel(type: GameType): string {
  const config = getGameTypeConfig(type);
  return config.stakeLabel;
}

/**
 * Get a game type's default stake amount
 */
export function getDefaultStake(type: GameType): number {
  const config = getGameTypeConfig(type);
  return config.defaultStake;
}

/**
 * Check if a game type requires teams
 */
export function requiresTeams(type: GameType, settings?: Record<string, unknown>): boolean {
  const config = getGameTypeConfig(type);

  // Check if team size is defined
  if (!config.players.teamSize) return false;

  // For HLT, team mode is optional
  if (type === 'high_low_total') {
    return settings?.isTeamMode === true;
  }

  return true;
}

/**
 * Get the team size for a game type (if applicable)
 */
export function getTeamSize(type: GameType): number | null {
  const config = getGameTypeConfig(type);
  return config.players.teamSize ?? null;
}
