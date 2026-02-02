import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import type { SkinsSettings, SkinResult, SkinsGameState } from '@/types';

// In-memory mock storage
let mockSkinsSettings: Map<string, SkinsSettings> = new Map();
let mockSkinsResults: Map<string, SkinResult[]> = new Map();

/**
 * Check if we should use mock data
 */
function shouldUseMockData(gameId: string): boolean {
  return isMockMode || gameId.startsWith('demo-');
}

// ============================================
// Settings Management
// ============================================

/**
 * Save Skins settings for a game
 */
export async function saveSkinsSettings(
  gameId: string,
  settings: SkinsSettings
): Promise<void> {
  if (shouldUseMockData(gameId)) {
    mockSkinsSettings.set(gameId, settings);
    return;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { error } = await supabase.from('skins_settings').upsert({
    game_id: gameId,
    game_length: settings.gameLength,
    carryover: settings.carryover,
    scoring_basis: settings.scoringBasis,
  });

  if (error) throw error;
}

/**
 * Get Skins settings for a game
 */
export async function getSkinsSettings(
  gameId: string
): Promise<SkinsSettings | null> {
  if (shouldUseMockData(gameId)) {
    return mockSkinsSettings.get(gameId) ?? null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('skins_settings')
    .select('*')
    .eq('game_id', gameId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    gameLength: data.game_length as 9 | 18,
    carryover: data.carryover,
    scoringBasis: data.scoring_basis as 'net' | 'gross',
  };
}

// ============================================
// Hole Results
// ============================================

/**
 * Player score for a hole
 */
export interface PlayerHoleScore {
  playerId: string;
  score: number;
}

/**
 * Calculate skin result for a hole
 * Returns winner ID if there's an outright winner, null if carryover
 */
export async function calculateSkinResult(
  gameId: string,
  holeNumber: number,
  scores: PlayerHoleScore[]
): Promise<SkinResult> {
  const settings = await getSkinsSettings(gameId);
  const useCarryover = settings?.carryover ?? true;

  // Find the lowest score
  const sortedScores = [...scores].sort((a, b) => a.score - b.score);
  const lowestScore = sortedScores[0].score;

  // Check if there's an outright winner
  const playersWithLowest = sortedScores.filter((s) => s.score === lowestScore);
  const hasOutrightWinner = playersWithLowest.length === 1;

  // Get current carryover count
  const { currentCarryover } = await getSkinsGameState(gameId);

  let winnerId: string | null = null;
  let skinValue = 1;

  if (hasOutrightWinner) {
    winnerId = playersWithLowest[0].playerId;
    skinValue = 1 + currentCarryover; // Claim all carryover skins
  } else if (!useCarryover) {
    // Split among tied players on last hole
    // (handled in settlement, result still has no single winner)
    winnerId = null;
    skinValue = 1;
  }

  const result: SkinResult = {
    gameId,
    holeNumber,
    winnerId,
    skinValue,
  };

  // Save the result
  if (shouldUseMockData(gameId)) {
    const existing = mockSkinsResults.get(gameId) ?? [];
    const filtered = existing.filter((r) => r.holeNumber !== holeNumber);
    filtered.push(result);
    filtered.sort((a, b) => a.holeNumber - b.holeNumber);
    mockSkinsResults.set(gameId, filtered);
  } else {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { error } = await supabase.from('skins_results').upsert({
      game_id: gameId,
      hole_number: holeNumber,
      winner_id: winnerId,
      skin_value: skinValue,
    });

    if (error) throw error;
  }

  return result;
}

/**
 * Get all skin results for a game
 */
export async function getSkinsResults(gameId: string): Promise<SkinResult[]> {
  if (shouldUseMockData(gameId)) {
    return mockSkinsResults.get(gameId) ?? [];
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('skins_results')
    .select('*')
    .eq('game_id', gameId)
    .order('hole_number');

  if (error) throw error;

  return (data ?? []).map((row) => ({
    gameId: row.game_id,
    holeNumber: row.hole_number,
    winnerId: row.winner_id,
    skinValue: row.skin_value,
  }));
}

/**
 * Get current game state including carryover
 */
export async function getSkinsGameState(gameId: string): Promise<SkinsGameState> {
  const results = await getSkinsResults(gameId);

  // Calculate current carryover
  let currentCarryover = 0;
  const holesWithCarryover: number[] = [];

  for (const result of results) {
    if (result.winnerId === null) {
      currentCarryover++;
      holesWithCarryover.push(result.holeNumber);
    } else {
      // Winner claimed all carryovers
      currentCarryover = 0;
      holesWithCarryover.length = 0;
    }
  }

  return {
    currentCarryover,
    holesWithCarryover,
    results,
  };
}

/**
 * Get current carryover count (for UI display)
 */
export async function getCurrentCarryover(gameId: string): Promise<number> {
  const state = await getSkinsGameState(gameId);
  return state.currentCarryover;
}

// ============================================
// Settlement
// ============================================

export interface SkinsPlayerResult {
  playerId: string;
  skinsWon: number;
  skinValuesWon: number; // Including carryovers
  netAmount: number; // Gator Bucks
}

export interface SkinsSettlement {
  stakePerSkin: number;
  playerCount: number;
  results: SkinsPlayerResult[];
  totalSkinsAwarded: number;
}

/**
 * Compute final settlement for Skins game
 * Formula: Winner receives Stake × Skins × (Players - 1)
 */
export async function computeSkinsSettlement(
  gameId: string,
  playerIds: string[],
  stakePerSkin: number
): Promise<SkinsSettlement> {
  const results = await getSkinsResults(gameId);
  const playerCount = playerIds.length;

  // Initialize player results
  const playerResults: Map<string, SkinsPlayerResult> = new Map();
  for (const playerId of playerIds) {
    playerResults.set(playerId, {
      playerId,
      skinsWon: 0,
      skinValuesWon: 0,
      netAmount: 0,
    });
  }

  // Calculate skins won by each player
  let totalSkinsAwarded = 0;
  for (const result of results) {
    if (result.winnerId) {
      const playerResult = playerResults.get(result.winnerId);
      if (playerResult) {
        playerResult.skinsWon++;
        playerResult.skinValuesWon += result.skinValue;
        totalSkinsAwarded += result.skinValue;
      }
    }
  }

  // Calculate net amounts
  // Winner receives: stake × skins × (players - 1)
  // Each loser pays: stake × skins won by winners
  const valuePerSkin = stakePerSkin * (playerCount - 1);
  const playerResultsArray = Array.from(playerResults.entries());

  for (const [, playerResult] of playerResultsArray) {
    // Amount won from skins
    const amountWon = playerResult.skinValuesWon * valuePerSkin;

    // Amount paid to other players who won skins
    let amountPaid = 0;
    for (const [otherId, otherResult] of playerResultsArray) {
      if (otherId !== playerResult.playerId && otherResult.skinValuesWon > 0) {
        amountPaid += otherResult.skinValuesWon * stakePerSkin;
      }
    }

    playerResult.netAmount = amountWon - amountPaid;
  }

  return {
    stakePerSkin,
    playerCount,
    results: Array.from(playerResults.values()),
    totalSkinsAwarded,
  };
}

/**
 * Handle last hole tie when carryover is enabled
 * Skins are split evenly among tied players
 */
export function handleLastHoleTie(
  tiedPlayerIds: string[],
  currentCarryover: number
): Map<string, number> {
  const skinsToSplit = 1 + currentCarryover;
  const splitValue = skinsToSplit / tiedPlayerIds.length;

  const splits = new Map<string, number>();
  for (const playerId of tiedPlayerIds) {
    splits.set(playerId, splitValue);
  }

  return splits;
}

/**
 * Reset mock data (for testing)
 */
export function resetMockData(): void {
  mockSkinsSettings = new Map();
  mockSkinsResults = new Map();
}
