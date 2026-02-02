import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import type {
  NassauSettings,
  NassauBetResult,
  NassauHoleResult,
  NassauBetType,
  NassauTeamFormat,
} from '@/types';

// In-memory mock storage
let mockNassauSettings: Map<string, NassauSettings> = new Map();
let mockNassauBetResults: Map<string, NassauBetResult[]> = new Map();
let mockNassauHoleResults: Map<string, NassauHoleResult[]> = new Map();

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
 * Save Nassau settings for a game
 */
export async function saveNassauSettings(
  gameId: string,
  settings: NassauSettings
): Promise<void> {
  if (shouldUseMockData(gameId)) {
    mockNassauSettings.set(gameId, settings);
    return;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { error } = await supabase.from('nassau_settings').upsert({
    game_id: gameId,
    team_format: settings.teamFormat,
    max_presses: settings.maxPresses,
    scoring_basis: settings.scoringBasis,
  });

  if (error) throw error;
}

/**
 * Get Nassau settings for a game
 */
export async function getNassauSettings(
  gameId: string
): Promise<NassauSettings | null> {
  if (shouldUseMockData(gameId)) {
    return mockNassauSettings.get(gameId) ?? null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('nassau_settings')
    .select('*')
    .eq('game_id', gameId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    teamFormat: data.team_format as NassauTeamFormat,
    maxPresses: data.max_presses,
    scoringBasis: data.scoring_basis as 'net' | 'gross',
  };
}

// ============================================
// Hole Results
// ============================================

/**
 * Calculate and save hole result
 * Returns the winner ID or null if halved
 */
export async function calculateNassauHoleResult(
  gameId: string,
  holeNumber: number,
  player1Id: string,
  player2Id: string,
  player1Score: number,
  player2Score: number
): Promise<NassauHoleResult> {
  // Determine hole winner
  let winnerId: string | null = null;
  if (player1Score < player2Score) {
    winnerId = player1Id;
  } else if (player2Score < player1Score) {
    winnerId = player2Id;
  }
  // If tied, winnerId stays null (halved)

  // Get previous hole result to calculate running tallies
  const previousResults = await getNassauHoleResults(gameId);
  const previousHole = previousResults.find((r) => r.hole === holeNumber - 1);

  // Calculate running tallies
  let frontHolesUp = previousHole?.frontHolesUp ?? 0;
  let backHolesUp = previousHole?.backHolesUp ?? 0;
  let overallHolesUp = previousHole?.overallHolesUp ?? 0;

  // Update based on winner
  // Positive = player1 is up, negative = player2 is up
  const holeDelta = winnerId === player1Id ? 1 : winnerId === player2Id ? -1 : 0;

  if (holeNumber <= 9) {
    frontHolesUp += holeDelta;
  } else {
    backHolesUp += holeDelta;
  }
  overallHolesUp += holeDelta;

  const result: NassauHoleResult = {
    hole: holeNumber,
    winnerId,
    frontHolesUp,
    backHolesUp,
    overallHolesUp,
  };

  // Save the result
  if (shouldUseMockData(gameId)) {
    const existing = mockNassauHoleResults.get(gameId) ?? [];
    const filtered = existing.filter((r) => r.hole !== holeNumber);
    filtered.push(result);
    filtered.sort((a, b) => a.hole - b.hole);
    mockNassauHoleResults.set(gameId, filtered);
  } else {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { error } = await supabase.from('nassau_hole_results').upsert({
      game_id: gameId,
      hole_number: holeNumber,
      winner_id: winnerId,
      front_holes_up: frontHolesUp,
      back_holes_up: backHolesUp,
      overall_holes_up: overallHolesUp,
    });

    if (error) throw error;
  }

  return result;
}

/**
 * Get all hole results for a Nassau game
 */
export async function getNassauHoleResults(
  gameId: string
): Promise<NassauHoleResult[]> {
  if (shouldUseMockData(gameId)) {
    return mockNassauHoleResults.get(gameId) ?? [];
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('nassau_hole_results')
    .select('*')
    .eq('game_id', gameId)
    .order('hole_number');

  if (error) throw error;

  return (data ?? []).map((row) => ({
    hole: row.hole_number,
    winnerId: row.winner_id,
    frontHolesUp: row.front_holes_up,
    backHolesUp: row.back_holes_up,
    overallHolesUp: row.overall_holes_up,
  }));
}

// ============================================
// Bet Results
// ============================================

/**
 * Get current standings for all 3 bets
 */
export interface NassauStandings {
  front: { holesUp: number; status: 'active' | 'won' | 'halved' };
  back: { holesUp: number; status: 'active' | 'won' | 'halved' };
  overall: { holesUp: number; status: 'active' | 'won' | 'halved' };
}

export async function getNassauStandings(
  gameId: string
): Promise<NassauStandings> {
  const holeResults = await getNassauHoleResults(gameId);
  const lastHole = holeResults.length > 0 ? holeResults[holeResults.length - 1] : null;

  const standings: NassauStandings = {
    front: { holesUp: lastHole?.frontHolesUp ?? 0, status: 'active' },
    back: { holesUp: lastHole?.backHolesUp ?? 0, status: 'active' },
    overall: { holesUp: lastHole?.overallHolesUp ?? 0, status: 'active' },
  };

  // Determine status based on holes completed
  const holesCompleted = holeResults.length;

  // Front 9 complete after hole 9
  if (holesCompleted >= 9) {
    const hole9 = holeResults.find((r) => r.hole === 9);
    if (hole9) {
      standings.front.holesUp = hole9.frontHolesUp;
      standings.front.status = hole9.frontHolesUp === 0 ? 'halved' : 'won';
    }
  }

  // Back 9 complete after hole 18
  if (holesCompleted >= 18) {
    const hole18 = holeResults.find((r) => r.hole === 18);
    if (hole18) {
      standings.back.holesUp = hole18.backHolesUp;
      standings.back.status = hole18.backHolesUp === 0 ? 'halved' : 'won';

      standings.overall.holesUp = hole18.overallHolesUp;
      standings.overall.status = hole18.overallHolesUp === 0 ? 'halved' : 'won';
    }
  }

  return standings;
}

/**
 * Get bet results for a Nassau game
 */
export async function getNassauBetResults(
  gameId: string
): Promise<NassauBetResult[]> {
  if (shouldUseMockData(gameId)) {
    return mockNassauBetResults.get(gameId) ?? [];
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('nassau_bet_results')
    .select('*')
    .eq('game_id', gameId);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    gameId: row.game_id,
    betType: row.bet_type as NassauBetType,
    winnerId: row.winner_id,
    status: row.status as 'active' | 'won' | 'halved',
    holesUp: row.holes_up,
  }));
}

// ============================================
// Settlement
// ============================================

export interface NassauSettlement {
  player1Id: string;
  player2Id: string;
  frontBet: { winnerId: string | null; amount: number };
  backBet: { winnerId: string | null; amount: number };
  overallBet: { winnerId: string | null; amount: number };
  totalAmount: number; // Net for player1 (positive = wins, negative = loses)
}

/**
 * Compute final settlement for Nassau game
 */
export async function computeNassauSettlement(
  gameId: string,
  player1Id: string,
  player2Id: string,
  stakePerBet: number
): Promise<NassauSettlement> {
  const standings = await getNassauStandings(gameId);

  const settlement: NassauSettlement = {
    player1Id,
    player2Id,
    frontBet: { winnerId: null, amount: 0 },
    backBet: { winnerId: null, amount: 0 },
    overallBet: { winnerId: null, amount: 0 },
    totalAmount: 0,
  };

  // Front 9
  if (standings.front.status === 'won') {
    settlement.frontBet.winnerId =
      standings.front.holesUp > 0 ? player1Id : player2Id;
    settlement.frontBet.amount = stakePerBet;
  }

  // Back 9
  if (standings.back.status === 'won') {
    settlement.backBet.winnerId =
      standings.back.holesUp > 0 ? player1Id : player2Id;
    settlement.backBet.amount = stakePerBet;
  }

  // Overall
  if (standings.overall.status === 'won') {
    settlement.overallBet.winnerId =
      standings.overall.holesUp > 0 ? player1Id : player2Id;
    settlement.overallBet.amount = stakePerBet;
  }

  // Calculate net for player1
  let player1Net = 0;
  if (settlement.frontBet.winnerId === player1Id) player1Net += stakePerBet;
  else if (settlement.frontBet.winnerId === player2Id) player1Net -= stakePerBet;

  if (settlement.backBet.winnerId === player1Id) player1Net += stakePerBet;
  else if (settlement.backBet.winnerId === player2Id) player1Net -= stakePerBet;

  if (settlement.overallBet.winnerId === player1Id) player1Net += stakePerBet;
  else if (settlement.overallBet.winnerId === player2Id) player1Net -= stakePerBet;

  settlement.totalAmount = player1Net;

  return settlement;
}

/**
 * Reset mock data (for testing)
 */
export function resetMockData(): void {
  mockNassauSettings = new Map();
  mockNassauBetResults = new Map();
  mockNassauHoleResults = new Map();
}
