import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import type {
  HighLowTotalSettings,
  HighLowTotalHoleResult,
  HighLowTotalTieRule,
} from '@/types';

// In-memory mock storage
let mockHLTSettings: Map<string, HighLowTotalSettings> = new Map();
let mockHLTResults: Map<string, HighLowTotalHoleResult[]> = new Map();

/**
 * Check if we should use mock data
 */
function shouldUseMockData(gameId: string): boolean {
  return isMockMode || gameId.startsWith('demo-');
}

/**
 * Save High-Low-Total settings for a game
 */
export async function saveHighLowTotalSettings(
  gameId: string,
  settings: HighLowTotalSettings
): Promise<void> {
  if (shouldUseMockData(gameId)) {
    mockHLTSettings.set(gameId, settings);
    return;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { error } = await supabase
    .from('high_low_total_settings')
    .upsert({
      game_id: gameId,
      tie_rule: settings.tieRule,
      is_team_mode: settings.isTeamMode,
      point_value: settings.pointValue,
    });

  if (error) throw error;
}

/**
 * Get High-Low-Total settings for a game
 */
export async function getHighLowTotalSettings(
  gameId: string
): Promise<HighLowTotalSettings | null> {
  if (shouldUseMockData(gameId)) {
    return mockHLTSettings.get(gameId) ?? null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('high_low_total_settings')
    .select('*')
    .eq('game_id', gameId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    tieRule: data.tie_rule as HighLowTotalTieRule,
    isTeamMode: data.is_team_mode,
    pointValue: data.point_value,
  };
}

/**
 * Save a hole result for High-Low-Total
 */
export async function saveHoleResult(
  gameId: string,
  result: HighLowTotalHoleResult
): Promise<void> {
  if (shouldUseMockData(gameId)) {
    const existing = mockHLTResults.get(gameId) ?? [];
    const filtered = existing.filter((r) => r.hole !== result.hole);
    filtered.push(result);
    mockHLTResults.set(gameId, filtered);
    return;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { error } = await supabase
    .from('high_low_total_results')
    .upsert({
      game_id: gameId,
      hole_number: result.hole,
      low_winner_id: result.lowWinnerId,
      high_loser_id: result.highLoserId,
      total_winner_id: result.totalWinnerId,
      carryover_low: result.carryover.low,
      carryover_high: result.carryover.high,
      carryover_total: result.carryover.total,
    });

  if (error) throw error;
}

/**
 * Get all hole results for a High-Low-Total game
 */
export async function getHoleResults(
  gameId: string
): Promise<HighLowTotalHoleResult[]> {
  if (shouldUseMockData(gameId)) {
    return mockHLTResults.get(gameId) ?? [];
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('high_low_total_results')
    .select('*')
    .eq('game_id', gameId)
    .order('hole_number');

  if (error) throw error;

  return (data ?? []).map((row) => ({
    hole: row.hole_number,
    lowWinnerId: row.low_winner_id,
    highLoserId: row.high_loser_id,
    totalWinnerId: row.total_winner_id,
    carryover: {
      low: row.carryover_low ?? 0,
      high: row.carryover_high ?? 0,
      total: row.carryover_total ?? 0,
    },
  }));
}

/**
 * Compute standings from hole results
 */
export interface HLTStanding {
  playerId: string;
  playerName: string;
  lowPoints: number;
  highPoints: number;
  totalPoints: number;
  netPoints: number;
  netValue: number;
}

export async function computeStandings(
  gameId: string,
  playerNames: Record<string, string>,
  pointValue: number
): Promise<HLTStanding[]> {
  const results = await getHoleResults(gameId);

  // Initialize standings
  const standings: Record<string, HLTStanding> = {};
  for (const [playerId, playerName] of Object.entries(playerNames)) {
    standings[playerId] = {
      playerId,
      playerName,
      lowPoints: 0,
      highPoints: 0,
      totalPoints: 0,
      netPoints: 0,
      netValue: 0,
    };
  }

  // Accumulate points from results
  for (const result of results) {
    if (result.lowWinnerId && standings[result.lowWinnerId]) {
      standings[result.lowWinnerId].lowPoints += 1 + result.carryover.low;
    }
    if (result.highLoserId && standings[result.highLoserId]) {
      standings[result.highLoserId].highPoints += 1 + result.carryover.high;
    }
    if (result.totalWinnerId && standings[result.totalWinnerId]) {
      standings[result.totalWinnerId].totalPoints += 1 + result.carryover.total;
    }
  }

  // Calculate net points and values
  const standingsList = Object.values(standings).map((s) => {
    s.netPoints = s.lowPoints + s.totalPoints - s.highPoints;
    s.netValue = s.netPoints * pointValue;
    return s;
  });

  // Sort by net points (descending)
  return standingsList.sort((a, b) => b.netPoints - a.netPoints);
}

/**
 * Reset mock data (for testing)
 */
export function resetMockData(): void {
  mockHLTSettings = new Map();
  mockHLTResults = new Map();
}
