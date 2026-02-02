import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import type {
  HighLowTotalSettings,
  HighLowTotalHoleResult,
  HLTTeamNumber,
  HLTTeamStanding,
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

// ============================================
// Settings Management
// ============================================

/**
 * Team assignment for HLT game
 */
export interface HLTTeams {
  team1: [string, string]; // [player1Id, player2Id]
  team2: [string, string];
}

/**
 * Save High-Low-Total settings for a game
 */
export async function saveHLTSettings(
  gameId: string,
  teams: HLTTeams,
  pointValue: number = 10
): Promise<void> {
  const settings: HighLowTotalSettings = {
    pointValue,
    team1Player1Id: teams.team1[0],
    team1Player2Id: teams.team1[1],
    team2Player1Id: teams.team2[0],
    team2Player2Id: teams.team2[1],
  };

  if (shouldUseMockData(gameId)) {
    mockHLTSettings.set(gameId, settings);
    return;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { error } = await supabase.from('hlt_settings').upsert({
    game_id: gameId,
    point_value: pointValue,
    team1_player1_id: teams.team1[0],
    team1_player2_id: teams.team1[1],
    team2_player1_id: teams.team2[0],
    team2_player2_id: teams.team2[1],
  });

  if (error) throw error;
}

/**
 * Get High-Low-Total settings for a game
 */
export async function getHLTSettings(
  gameId: string
): Promise<HighLowTotalSettings | null> {
  if (shouldUseMockData(gameId)) {
    return mockHLTSettings.get(gameId) ?? null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('hlt_settings')
    .select('*')
    .eq('game_id', gameId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    pointValue: data.point_value,
    team1Player1Id: data.team1_player1_id,
    team1Player2Id: data.team1_player2_id,
    team2Player1Id: data.team2_player1_id,
    team2Player2Id: data.team2_player2_id,
  };
}

/**
 * Get teams from settings
 */
export async function getHLTTeams(gameId: string): Promise<HLTTeams | null> {
  const settings = await getHLTSettings(gameId);
  if (!settings) return null;

  return {
    team1: [settings.team1Player1Id, settings.team1Player2Id],
    team2: [settings.team2Player1Id, settings.team2Player2Id],
  };
}

// ============================================
// Hole Results
// ============================================

/**
 * Player scores for a hole (net scores)
 */
export interface HLTPlayerScores {
  team1Player1Score: number;
  team1Player2Score: number;
  team2Player1Score: number;
  team2Player2Score: number;
}

/**
 * Calculate HLT hole result
 * Returns the result with Low Ball, High Ball, and Total winners
 * Ties = wash (null winner, no points awarded)
 */
export async function calculateHLTHoleResult(
  gameId: string,
  holeNumber: number,
  scores: HLTPlayerScores
): Promise<HighLowTotalHoleResult> {
  // Calculate team scores
  const team1Low = Math.min(scores.team1Player1Score, scores.team1Player2Score);
  const team1High = Math.max(scores.team1Player1Score, scores.team1Player2Score);
  const team1Total = scores.team1Player1Score + scores.team1Player2Score;

  const team2Low = Math.min(scores.team2Player1Score, scores.team2Player2Score);
  const team2High = Math.max(scores.team2Player1Score, scores.team2Player2Score);
  const team2Total = scores.team2Player1Score + scores.team2Player2Score;

  // Determine point winners (null = wash/tie)
  let lowBallWinner: HLTTeamNumber | null = null;
  if (team1Low < team2Low) {
    lowBallWinner = 1;
  } else if (team2Low < team1Low) {
    lowBallWinner = 2;
  }
  // If tied, stays null (wash)

  let highBallWinner: HLTTeamNumber | null = null;
  // High Ball: team that AVOIDS the worst score wins
  if (team1High < team2High) {
    highBallWinner = 1;
  } else if (team2High < team1High) {
    highBallWinner = 2;
  }
  // If tied, stays null (wash)

  let totalWinner: HLTTeamNumber | null = null;
  if (team1Total < team2Total) {
    totalWinner = 1;
  } else if (team2Total < team1Total) {
    totalWinner = 2;
  }
  // If tied, stays null (wash)

  const result: HighLowTotalHoleResult = {
    hole: holeNumber,
    team1Low,
    team1High,
    team1Total,
    team2Low,
    team2High,
    team2Total,
    lowBallWinner,
    highBallWinner,
    totalWinner,
  };

  // Save the result
  if (shouldUseMockData(gameId)) {
    const existing = mockHLTResults.get(gameId) ?? [];
    const filtered = existing.filter((r) => r.hole !== holeNumber);
    filtered.push(result);
    filtered.sort((a, b) => a.hole - b.hole);
    mockHLTResults.set(gameId, filtered);
  } else {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { error } = await supabase.from('hlt_hole_results').upsert({
      game_id: gameId,
      hole_number: holeNumber,
      team1_low: team1Low,
      team1_high: team1High,
      team1_total: team1Total,
      team2_low: team2Low,
      team2_high: team2High,
      team2_total: team2Total,
      low_ball_winner: lowBallWinner,
      high_ball_winner: highBallWinner,
      total_winner: totalWinner,
    });

    if (error) throw error;
  }

  return result;
}

/**
 * Get all hole results for a HLT game
 */
export async function getHLTHoleResults(
  gameId: string
): Promise<HighLowTotalHoleResult[]> {
  if (shouldUseMockData(gameId)) {
    return mockHLTResults.get(gameId) ?? [];
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('hlt_hole_results')
    .select('*')
    .eq('game_id', gameId)
    .order('hole_number');

  if (error) throw error;

  return (data ?? []).map((row) => ({
    hole: row.hole_number,
    team1Low: row.team1_low,
    team1High: row.team1_high,
    team1Total: row.team1_total,
    team2Low: row.team2_low,
    team2High: row.team2_high,
    team2Total: row.team2_total,
    lowBallWinner: row.low_ball_winner as HLTTeamNumber | null,
    highBallWinner: row.high_ball_winner as HLTTeamNumber | null,
    totalWinner: row.total_winner as HLTTeamNumber | null,
  }));
}

// ============================================
// Standings
// ============================================

/**
 * Get current standings for both teams
 */
export async function getHLTStandings(
  gameId: string
): Promise<{ team1: HLTTeamStanding; team2: HLTTeamStanding }> {
  const settings = await getHLTSettings(gameId);
  const results = await getHLTHoleResults(gameId);
  const pointValue = settings?.pointValue ?? 10;

  // Initialize standings
  const team1: HLTTeamStanding = {
    teamNumber: 1,
    player1Id: settings?.team1Player1Id ?? '',
    player2Id: settings?.team1Player2Id ?? '',
    lowBallPoints: 0,
    highBallPoints: 0,
    totalPoints: 0,
    netPoints: 0,
    netValue: 0,
  };

  const team2: HLTTeamStanding = {
    teamNumber: 2,
    player1Id: settings?.team2Player1Id ?? '',
    player2Id: settings?.team2Player2Id ?? '',
    lowBallPoints: 0,
    highBallPoints: 0,
    totalPoints: 0,
    netPoints: 0,
    netValue: 0,
  };

  // Accumulate points from results
  for (const result of results) {
    if (result.lowBallWinner === 1) team1.lowBallPoints++;
    else if (result.lowBallWinner === 2) team2.lowBallPoints++;

    if (result.highBallWinner === 1) team1.highBallPoints++;
    else if (result.highBallWinner === 2) team2.highBallPoints++;

    if (result.totalWinner === 1) team1.totalPoints++;
    else if (result.totalWinner === 2) team2.totalPoints++;
  }

  // Calculate net points
  team1.netPoints = team1.lowBallPoints + team1.highBallPoints + team1.totalPoints;
  team2.netPoints = team2.lowBallPoints + team2.highBallPoints + team2.totalPoints;

  // Calculate net value (team1 perspective: positive = team1 wins, negative = team2 wins)
  const pointDiff = team1.netPoints - team2.netPoints;
  team1.netValue = pointDiff * pointValue;
  team2.netValue = -pointDiff * pointValue;

  return { team1, team2 };
}

// ============================================
// Settlement
// ============================================

export interface HLTSettlement {
  team1: {
    player1Id: string;
    player2Id: string;
    netPoints: number;
    netValue: number; // Per player (split)
  };
  team2: {
    player1Id: string;
    player2Id: string;
    netPoints: number;
    netValue: number; // Per player (split)
  };
  pointValue: number;
}

/**
 * Compute final settlement for HLT game
 * Net Points × Point Value (split between teammates)
 */
export async function computeHLTSettlement(
  gameId: string
): Promise<HLTSettlement> {
  const settings = await getHLTSettings(gameId);
  const standings = await getHLTStandings(gameId);
  const pointValue = settings?.pointValue ?? 10;

  // Calculate net points for each team
  const team1NetPoints = standings.team1.netPoints;
  const team2NetPoints = standings.team2.netPoints;
  const pointDiff = team1NetPoints - team2NetPoints;

  // Net value is the difference × point value
  // Winner gets this amount from loser (split between teammates)
  const netValue = pointDiff * pointValue;

  return {
    team1: {
      player1Id: settings?.team1Player1Id ?? '',
      player2Id: settings?.team1Player2Id ?? '',
      netPoints: team1NetPoints,
      netValue: netValue / 2, // Split between teammates
    },
    team2: {
      player1Id: settings?.team2Player1Id ?? '',
      player2Id: settings?.team2Player2Id ?? '',
      netPoints: team2NetPoints,
      netValue: -netValue / 2, // Split between teammates
    },
    pointValue,
  };
}

// ============================================
// Legacy Compatibility (Deprecated)
// ============================================

/**
 * @deprecated Use getHLTStandings instead
 * Compute standings from hole results (legacy format)
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

/**
 * @deprecated Use getHLTStandings instead
 */
export async function computeStandings(
  gameId: string,
  playerNames: Record<string, string>,
  pointValue: number
): Promise<HLTStanding[]> {
  const settings = await getHLTSettings(gameId);
  const standings = await getHLTStandings(gameId);

  // Convert team standings to player standings for backwards compatibility
  const playerStandings: HLTStanding[] = [];

  // Team 1 players
  if (settings?.team1Player1Id) {
    playerStandings.push({
      playerId: settings.team1Player1Id,
      playerName: playerNames[settings.team1Player1Id] ?? 'Player 1',
      lowPoints: standings.team1.lowBallPoints,
      highPoints: standings.team1.highBallPoints,
      totalPoints: standings.team1.totalPoints,
      netPoints: standings.team1.netPoints,
      netValue: standings.team1.netValue / 2,
    });
  }
  if (settings?.team1Player2Id) {
    playerStandings.push({
      playerId: settings.team1Player2Id,
      playerName: playerNames[settings.team1Player2Id] ?? 'Player 2',
      lowPoints: standings.team1.lowBallPoints,
      highPoints: standings.team1.highBallPoints,
      totalPoints: standings.team1.totalPoints,
      netPoints: standings.team1.netPoints,
      netValue: standings.team1.netValue / 2,
    });
  }

  // Team 2 players
  if (settings?.team2Player1Id) {
    playerStandings.push({
      playerId: settings.team2Player1Id,
      playerName: playerNames[settings.team2Player1Id] ?? 'Player 3',
      lowPoints: standings.team2.lowBallPoints,
      highPoints: standings.team2.highBallPoints,
      totalPoints: standings.team2.totalPoints,
      netPoints: standings.team2.netPoints,
      netValue: standings.team2.netValue / 2,
    });
  }
  if (settings?.team2Player2Id) {
    playerStandings.push({
      playerId: settings.team2Player2Id,
      playerName: playerNames[settings.team2Player2Id] ?? 'Player 4',
      lowPoints: standings.team2.lowBallPoints,
      highPoints: standings.team2.highBallPoints,
      totalPoints: standings.team2.totalPoints,
      netPoints: standings.team2.netPoints,
      netValue: standings.team2.netValue / 2,
    });
  }

  return playerStandings.sort((a, b) => b.netPoints - a.netPoints);
}

/**
 * @deprecated Use saveHLTSettings instead
 */
export async function saveHighLowTotalSettings(
  gameId: string,
  settings: { pointValue: number; isTeamMode?: boolean; tieRule?: string }
): Promise<void> {
  console.warn(
    'saveHighLowTotalSettings is deprecated. Use saveHLTSettings with team assignments.'
  );
  // This is a no-op for backwards compatibility
  // New games should use saveHLTSettings
}

/**
 * @deprecated Use getHLTSettings instead
 */
export async function getHighLowTotalSettings(
  gameId: string
): Promise<{ tieRule: 'push' | 'split' | 'carryover'; isTeamMode: boolean; pointValue: number } | null> {
  const settings = await getHLTSettings(gameId);
  if (!settings) return null;

  return {
    tieRule: 'push', // Always wash in new system
    isTeamMode: true, // Always team mode in new system
    pointValue: settings.pointValue,
  };
}

/**
 * @deprecated - Old format, use calculateHLTHoleResult instead
 */
export async function saveHoleResult(
  gameId: string,
  result: {
    hole: number;
    lowWinnerId: string | null;
    highLoserId: string | null;
    totalWinnerId: string | null;
    carryover: { low: number; high: number; total: number };
  }
): Promise<void> {
  console.warn('saveHoleResult is deprecated. Use calculateHLTHoleResult instead.');
  // This is a no-op for backwards compatibility
}

/**
 * @deprecated - Old format, use getHLTHoleResults instead
 */
export async function getHoleResults(
  gameId: string
): Promise<
  Array<{
    hole: number;
    lowWinnerId: string | null;
    highLoserId: string | null;
    totalWinnerId: string | null;
    carryover: { low: number; high: number; total: number };
  }>
> {
  console.warn('getHoleResults is deprecated. Use getHLTHoleResults instead.');
  // Return empty array for backwards compatibility
  return [];
}

/**
 * Reset mock data (for testing)
 */
export function resetMockData(): void {
  mockHLTSettings = new Map();
  mockHLTResults = new Map();
}
