/**
 * Game Type Configuration System
 *
 * This is the single source of truth for all game type definitions.
 * Each game type defines its rules, player requirements, scoring options,
 * settlement calculations, and Gator Bucks conversion.
 *
 * GLOBAL RULES:
 * - Gross scores are always recorded
 * - Net scores are calculated per hole when handicap applies
 * - Hole score confirmation is the source of truth for all game outcomes
 * - Settlement happens when all hole scores are entered and game marked complete
 *
 * GAME LENGTH RULES:
 * - Match Play: 9 or 18 holes (default 18)
 * - Nassau: 18 holes only (Front/Back/Overall structure)
 * - Skins: 9 or 18 holes (default 18)
 * - High-Low-Total: 18 holes only (full-round balance)
 *
 * PRESS SUPPORT:
 * - Match Play: Yes (default max: 2)
 * - Nassau: Yes (per bet, default max: 2)
 * - Skins: No
 * - High-Low-Total: No
 *
 * FUTURE GAME TYPES:
 * - Wolf: Choose-your-partner rotating captain format
 * - Stableford: Points-based scoring
 * - Best Ball: Team best score format
 * - Scramble: All play from best shot
 */

import type { GameType } from '@/types';

// ============================================
// Types
// ============================================

export type ScoringBasisOption = 'net' | 'gross' | 'both';
export type GameLength = 9 | 18;

// ============================================
// Press Configuration
// ============================================

export interface PressConfig {
  allowed: boolean;
  maxPresses: number; // Default: 2, configurable 1-5
  autoPress: boolean;
  autoPressThreshold: number; // Holes down to trigger auto-press (1-5)
}

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

  // Game length options
  supportedLengths: GameLength[];
  defaultLength: GameLength;

  // Scoring options
  scoringBasis: ScoringBasisOption;
  defaultScoringBasis: 'net' | 'gross';

  // Scoring calculation (how winners/points are determined)
  scoring: ScoringCalculation;

  // Press configuration
  press: PressConfig;

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
    description:
      'Two players compete hole by hole. Win a hole by having the lowest score. The player who wins more holes wins the match.',
    shortDescription: 'Head-to-head hole-by-hole',

    players: {
      min: 2,
      max: 2,
      exact: 2,
    },

    supportedLengths: [9, 18],
    defaultLength: 18,

    scoringBasis: 'both',
    defaultScoringBasis: 'net',

    scoring: {
      method: 'hole_by_hole',
      description: 'Lowest score wins each hole. Tied holes are "halved".',
      holeWinner: {
        criteria: 'lowest_score',
        tieHandling: 'halve',
      },
    },

    press: {
      allowed: true,
      maxPresses: 2,
      autoPress: false,
      autoPressThreshold: 2,
    },

    gatorBucks: {
      method: 'per_hole',
      formula: 'Stake × Holes Up (margin of victory)',
      calculate: ({ stake, holesUp = 0 }) => stake * holesUp,
      examples: [
        { scenario: '3 Up at $10/hole', result: '+$30 winner, -$30 loser' },
        { scenario: '1 Up at $10/hole', result: '+$10 winner, -$10 loser' },
        { scenario: 'All Square', result: 'No money changes hands' },
      ],
    },

    stakeLabel: 'Stake per hole margin',
    defaultStake: 10,

    settings: [
      {
        key: 'gameLength',
        label: 'Holes',
        type: 'select',
        defaultValue: '18',
        options: [
          { value: '9', label: '9 Holes' },
          { value: '18', label: '18 Holes' },
        ],
        description: 'Number of holes to play',
      },
      {
        key: 'scoringBasis',
        label: 'Scoring',
        type: 'select',
        defaultValue: 'net',
        options: [
          { value: 'net', label: 'Net', description: 'With handicap strokes' },
          { value: 'gross', label: 'Gross', description: 'No handicap' },
        ],
        description: 'How scores are calculated',
      },
      {
        key: 'pressEnabled',
        label: 'Allow Presses',
        type: 'toggle',
        defaultValue: true,
        description: 'Players can press to create side bets',
      },
      {
        key: 'maxPresses',
        label: 'Max Presses',
        type: 'number',
        defaultValue: 2,
        min: 1,
        max: 5,
        description: 'Maximum number of presses allowed',
        dependsOn: { field: 'pressEnabled', value: true },
      },
      {
        key: 'autoPress',
        label: 'Auto Press',
        type: 'toggle',
        defaultValue: false,
        description: 'Automatically press when down',
        dependsOn: { field: 'pressEnabled', value: true },
      },
      {
        key: 'autoPressThreshold',
        label: 'Auto Press When Down',
        type: 'number',
        defaultValue: 2,
        min: 1,
        max: 5,
        description: 'Holes down to trigger auto press',
        dependsOn: { field: 'autoPress', value: true },
      },
    ],

    rulesSummary: [
      'Two players compete hole by hole for the lowest net score',
      'Win a hole by having the lower score; tied holes are "halved"',
      'Match status shown as "X Up", "X Down", or "All Square"',
      'Match may end early when mathematically decided (e.g., 4 & 3)',
      'Gator Bucks = Stake × Final Holes Up Margin',
    ],

    status: 'stable',
  },

  nassau: {
    type: 'nassau',
    label: 'Nassau',
    description:
      'The most popular golf betting format. Three separate match play bets: Front 9, Back 9, and Overall 18. Each bet is scored independently using match play rules.',
    shortDescription: 'Three bets in one',

    players: {
      min: 2,
      max: 4,
      teamSize: 2, // For 2v2 team mode
    },

    supportedLengths: [18], // Nassau requires 18 holes
    defaultLength: 18,

    scoringBasis: 'both',
    defaultScoringBasis: 'net',

    scoring: {
      method: 'hole_by_hole',
      description: 'Three separate match play bets: Front 9 (1-9), Back 9 (10-18), Overall 18.',
      holeWinner: {
        criteria: 'lowest_score',
        tieHandling: 'halve',
      },
    },

    press: {
      allowed: true,
      maxPresses: 2, // Per bet
      autoPress: false,
      autoPressThreshold: 2,
    },

    gatorBucks: {
      method: 'per_bet',
      formula: 'Stake × Bets Won (3 possible: Front, Back, Overall)',
      calculate: ({ stake, betsWon = 0 }) => stake * betsWon,
      examples: [
        { scenario: 'Sweep (win all 3) at $10/bet', result: '+$30' },
        { scenario: 'Win 2, Lose 1 at $10/bet', result: '+$10' },
        { scenario: 'Win 1, Tie 2 at $10/bet', result: '+$10' },
        { scenario: 'All Ties at $10/bet', result: '$0' },
        { scenario: 'Get swept at $10/bet', result: '-$30' },
      ],
    },

    stakeLabel: 'Stake per bet',
    defaultStake: 10,

    settings: [
      {
        key: 'scoringBasis',
        label: 'Scoring',
        type: 'select',
        defaultValue: 'net',
        options: [
          { value: 'net', label: 'Net', description: 'With handicap strokes' },
          { value: 'gross', label: 'Gross', description: 'No handicap' },
        ],
        description: 'How scores are calculated',
      },
      {
        key: 'teamFormat',
        label: 'Team Format',
        type: 'select',
        defaultValue: 'individual',
        options: [
          { value: 'individual', label: 'Individual', description: '1v1 or 1v1v1v1' },
          { value: 'best_ball', label: 'Best Ball', description: '2v2, best score counts' },
          { value: 'both_balls', label: 'Both Balls', description: '2v2, both scores count' },
        ],
        description: 'How teams are scored',
      },
      {
        key: 'pressEnabled',
        label: 'Allow Presses',
        type: 'toggle',
        defaultValue: true,
        description: 'Players can press on any of the three bets',
      },
      {
        key: 'maxPresses',
        label: 'Max Presses Per Bet',
        type: 'number',
        defaultValue: 2,
        min: 1,
        max: 5,
        description: 'Maximum presses allowed per bet',
        dependsOn: { field: 'pressEnabled', value: true },
      },
      {
        key: 'autoPress',
        label: 'Auto Press',
        type: 'toggle',
        defaultValue: false,
        description: 'Automatically press when down',
        dependsOn: { field: 'pressEnabled', value: true },
      },
      {
        key: 'autoPressThreshold',
        label: 'Auto Press When Down',
        type: 'number',
        defaultValue: 2,
        min: 1,
        max: 5,
        description: 'Holes down to trigger auto press',
        dependsOn: { field: 'autoPress', value: true },
      },
    ],

    rulesSummary: [
      'Always 18 holes - three separate match-play bets',
      'Front 9 (holes 1-9), Back 9 (holes 10-18), Overall 18',
      'Each bet uses match play scoring (most holes won)',
      'Win a bet = +1× stake, lose = -1× stake, tie = push',
      'Presses can be made on any of the three bets independently',
    ],

    status: 'stable',
  },

  skins: {
    type: 'skins',
    label: 'Skins',
    description:
      'Each hole has value. To win a "skin" you must have the lowest score outright (no ties). Tied holes carry over to the next, building larger pots.',
    shortDescription: 'Winner-take-all per hole',

    players: {
      min: 2,
      max: 8,
    },

    supportedLengths: [9, 18],
    defaultLength: 18,

    scoringBasis: 'both',
    defaultScoringBasis: 'gross', // More common in casual skins

    scoring: {
      method: 'skins',
      description: 'Outright lowest score wins the skin. Ties carry over (default).',
      holeWinner: {
        criteria: 'lowest_score',
        tieHandling: 'carryover',
      },
    },

    press: {
      allowed: false, // Skins does not support presses
      maxPresses: 0,
      autoPress: false,
      autoPressThreshold: 0,
    },

    gatorBucks: {
      method: 'per_skin',
      formula: 'Winner receives: Stake × Skins × (Players - 1)',
      calculate: ({ stake, skins = 0, players = 2 }) => stake * skins * (players - 1),
      examples: [
        { scenario: '1 skin at $5, 4 players', result: '+$15 (from 3 others)' },
        { scenario: '1 skin with 1 carryover at $5, 4 players', result: '+$30 (2 skins worth)' },
        { scenario: '3 skins at $5, 4 players', result: '+$45' },
        { scenario: '0 skins won, 6 skins awarded', result: '-$30 (paid to winners)' },
      ],
    },

    stakeLabel: 'Stake per skin',
    defaultStake: 5,

    settings: [
      {
        key: 'gameLength',
        label: 'Holes',
        type: 'select',
        defaultValue: '18',
        options: [
          { value: '9', label: '9 Holes' },
          { value: '18', label: '18 Holes' },
        ],
        description: 'Number of holes to play',
      },
      {
        key: 'scoringBasis',
        label: 'Scoring',
        type: 'select',
        defaultValue: 'gross',
        options: [
          { value: 'gross', label: 'Gross', description: 'No handicap (more common)' },
          { value: 'net', label: 'Net', description: 'With handicap strokes' },
        ],
        description: 'How scores are calculated',
      },
      {
        key: 'carryover',
        label: 'Carryover Ties',
        type: 'toggle',
        defaultValue: true,
        description: 'When tied, skin carries to next hole',
      },
    ],

    rulesSummary: [
      'Win a skin by having the lowest net score outright - no ties',
      'Tied holes carry over (default) - carryovers accumulate as a count',
      'Last hole tie: skins split evenly among tied players',
      'UI shows current carryover count and which holes carry',
      'Winner collects stake from each other player per skin won',
    ],

    status: 'stable',
  },

  high_low_total: {
    type: 'high_low_total',
    label: 'High-Low-Total',
    description:
      'A 2v2 team game where each hole awards up to 3 points: Low Ball (best individual), High Ball (worst individual avoided), and Total (best combined team score).',
    shortDescription: 'Team game: 3 points per hole',

    players: {
      min: 4,
      max: 4,
      exact: 4, // HLT requires exactly 4 players
      teamSize: 2, // Always 2v2
    },

    supportedLengths: [18], // HLT is 18 holes only
    defaultLength: 18,

    scoringBasis: 'net', // HLT is net scoring only
    defaultScoringBasis: 'net',

    scoring: {
      method: 'points',
      description:
        'Each hole: Low Ball (1 pt), High Ball (1 pt), Total (1 pt). Ties = wash (no point awarded).',
      pointsSystem: {
        perHole: { lowBall: 1, highBall: 1, total: 1 },
        aggregation: 'sum',
      },
    },

    press: {
      allowed: false, // HLT does not support presses
      maxPresses: 0,
      autoPress: false,
      autoPressThreshold: 0,
    },

    gatorBucks: {
      method: 'per_point',
      formula: 'Net Team Points × Point Value (split between teammates)',
      calculate: ({ stake, points = 0 }) => stake * points,
      examples: [
        { scenario: 'Team wins all 3 on a hole', result: '+3 points' },
        { scenario: 'Low Ball tie (wash)', result: '0 points for that category' },
        { scenario: 'Team +15 points at $10/point', result: '+$150 (split $75 each)' },
        { scenario: 'All ties (wash)', result: '0 points' },
      ],
    },

    stakeLabel: 'Gator Bucks per point',
    defaultStake: 10,

    settings: [
      {
        key: 'pointValue',
        label: 'Point Value',
        type: 'number',
        defaultValue: 10,
        min: 1,
        max: 100,
        description: 'Gator Bucks per point',
      },
    ],

    rulesSummary: [
      '2v2 team game, 18 holes only, net scoring required',
      'Each hole has 3 possible points: Low Ball, High Ball, Total',
      'Low Ball: Team with best individual net wins a point',
      'High Ball: Team that avoids the worst individual net wins a point',
      'Total: Team with lowest combined net wins a point',
      'Ties = wash (no points awarded, no carryovers)',
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
export function requiresTeams(type: GameType): boolean {
  const config = getGameTypeConfig(type);

  // HLT always requires teams (2v2)
  if (type === 'high_low_total') {
    return true;
  }

  // Nassau can be team mode if configured
  if (type === 'nassau') {
    return false; // Team mode is optional for Nassau
  }

  // Check if team size is defined
  return config.players.teamSize !== undefined && config.players.exact === 4;
}

/**
 * Get the team size for a game type (if applicable)
 */
export function getTeamSize(type: GameType): number | null {
  const config = getGameTypeConfig(type);
  return config.players.teamSize ?? null;
}

// ============================================
// Game Length Helpers
// ============================================

/**
 * Get supported game lengths for a game type
 */
export function getSupportedLengths(type: GameType): GameLength[] {
  const config = getGameTypeConfig(type);
  return config.supportedLengths;
}

/**
 * Get default game length for a game type
 */
export function getDefaultLength(type: GameType): GameLength {
  const config = getGameTypeConfig(type);
  return config.defaultLength;
}

/**
 * Check if a game length is supported for a game type
 */
export function isLengthSupported(type: GameType, length: GameLength): boolean {
  const config = getGameTypeConfig(type);
  return config.supportedLengths.includes(length);
}

/**
 * Validate game length for a game type
 */
export function validateGameLength(
  type: GameType,
  length: number
): { valid: boolean; error?: string } {
  const config = getGameTypeConfig(type);

  if (length !== 9 && length !== 18) {
    return { valid: false, error: 'Game length must be 9 or 18 holes' };
  }

  if (!config.supportedLengths.includes(length as GameLength)) {
    return {
      valid: false,
      error: `${config.label} only supports ${config.supportedLengths.join(' or ')} holes`,
    };
  }

  return { valid: true };
}

// ============================================
// Press Support Helpers
// ============================================

/**
 * Check if a game type supports presses
 */
export function supportsPresses(type: GameType): boolean {
  const config = getGameTypeConfig(type);
  return config.press.allowed;
}

/**
 * Get press configuration for a game type
 */
export function getPressConfig(type: GameType): PressConfig {
  const config = getGameTypeConfig(type);
  return config.press;
}

/**
 * Get default max presses for a game type
 */
export function getDefaultMaxPresses(type: GameType): number {
  const config = getGameTypeConfig(type);
  return config.press.maxPresses;
}

// ============================================
// Enhanced Validation
// ============================================

/**
 * Comprehensive game setup validation
 */
export function validateGameSetupFull(
  type: GameType,
  playerCount: number,
  scoringBasis: 'net' | 'gross',
  gameLength: number
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

  // Validate game length
  const lengthValidation = validateGameLength(type, gameLength);
  if (!lengthValidation.valid && lengthValidation.error) {
    errors.push(lengthValidation.error);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
