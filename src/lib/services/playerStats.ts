import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import type { PlayerRoundStats, CareerStats, StatsPeriod, RecentGameResult } from '@/types';

/**
 * Get player career stats for a given period
 */
export async function getPlayerCareerStats(
  userId: string,
  period: StatsPeriod = 'lifetime'
): Promise<CareerStats> {
  // Default empty stats
  const emptyStats: CareerStats = {
    totalRounds: 0,
    eagles: 0,
    birdies: 0,
    pars: 0,
    bogeys: 0,
    doubleBogeys: 0,
    triplePlus: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    totalWinnings: 0,
  };

  if (isMockMode) {
    return getMockCareerStats(userId, period);
  }

  const supabase = createClient();
  if (!supabase) return emptyStats;

  try {
    // Build date filter based on period
    let dateFilter: string | null = null;
    const now = new Date();

    if (period === 'ytd') {
      dateFilter = `${now.getFullYear()}-01-01`;
    } else if (period === 'today') {
      dateFilter = now.toISOString().split('T')[0];
    }

    // Get rounds with scores
    let roundsQuery = supabase
      .from('rounds')
      .select(`
        id,
        event_id,
        round_date,
        hole_scores (
          hole_number,
          strokes
        ),
        events!inner (
          id
        )
      `)
      .eq('user_id', userId);

    if (dateFilter) {
      roundsQuery = roundsQuery.gte('round_date', dateFilter);
    }

    const { data: rounds } = await roundsQuery;

    // Get tee snapshots for par info
    const eventIds = Array.from(new Set(rounds?.map(r => r.event_id) || []));
    const { data: teeSnapshots } = await supabase
      .from('tee_snapshots')
      .select('event_id, holes')
      .in('event_id', eventIds);

    const teeSnapshotMap = new Map(
      teeSnapshots?.map(ts => [ts.event_id, ts.holes]) || []
    );

    // Calculate score breakdown
    let eagles = 0, birdies = 0, pars = 0, bogeys = 0, doubleBogeys = 0, triplePlus = 0;
    let bestRound: PlayerRoundStats | undefined;
    let totalScores = 0;

    for (const round of rounds || []) {
      const holes = teeSnapshotMap.get(round.event_id) || [];
      const holeParMap = new Map(holes.map((h: { number: number; par: number }) => [h.number, h.par]));
      const scores = round.hole_scores || [];

      let roundTotal = 0;
      let roundPar = 0;

      for (const score of scores) {
        const par = (holeParMap.get(score.hole_number) || 4) as number;
        const strokes = score.strokes as number;
        const diff = strokes - par;
        roundTotal += strokes;
        roundPar += par;

        if (diff <= -2) eagles++;
        else if (diff === -1) birdies++;
        else if (diff === 0) pars++;
        else if (diff === 1) bogeys++;
        else if (diff === 2) doubleBogeys++;
        else if (diff >= 3) triplePlus++;
      }

      if (scores.length > 0) {
        totalScores += roundTotal;
        const relativeToPar = roundTotal - roundPar;

        // Check if this is best round
        if (!bestRound || relativeToPar < bestRound.relativeToPar) {
          bestRound = {
            roundId: round.id,
            eventId: round.event_id,
            courseName: '', // Would need to fetch
            date: round.round_date,
            totalScore: roundTotal,
            par: roundPar,
            relativeToPar,
            eagles: 0, birdies: 0, pars: 0, bogeys: 0, doubleBogeys: 0, triplePlus: 0,
          };
        }
      }
    }

    // Get game stats (wins/losses)
    let settlementsQuery = supabase
      .from('settlements')
      .select('payer_id, payee_id, amount_int, created_at')
      .or(`payer_id.eq.${userId},payee_id.eq.${userId}`);

    if (dateFilter) {
      settlementsQuery = settlementsQuery.gte('created_at', dateFilter);
    }

    const { data: settlements } = await settlementsQuery;

    let wins = 0, losses = 0, totalWinnings = 0;
    for (const settlement of settlements || []) {
      if (settlement.payee_id === userId) {
        wins++;
        totalWinnings += settlement.amount_int;
      } else if (settlement.payer_id === userId) {
        losses++;
        totalWinnings -= settlement.amount_int;
      }
    }

    const totalRounds = rounds?.length || 0;

    return {
      totalRounds,
      eagles,
      birdies,
      pars,
      bogeys,
      doubleBogeys,
      triplePlus,
      bestRound,
      avgScore: totalRounds > 0 ? Math.round(totalScores / totalRounds) : undefined,
      gamesPlayed: wins + losses,
      wins,
      losses,
      totalWinnings,
    };
  } catch (error) {
    console.error('[playerStats] Failed to get career stats:', error);
    return emptyStats;
  }
}

/**
 * Get stats for the player's most recent round
 */
export async function getLastRoundStats(
  userId: string
): Promise<PlayerRoundStats | null> {
  if (isMockMode) {
    return getMockLastRoundStats(userId);
  }

  const supabase = createClient();
  if (!supabase) return null;

  try {
    // Get most recent round
    const { data: round } = await supabase
      .from('rounds')
      .select(`
        id,
        event_id,
        round_date,
        hole_scores (
          hole_number,
          strokes
        )
      `)
      .eq('user_id', userId)
      .order('round_date', { ascending: false })
      .limit(1)
      .single();

    if (!round) return null;

    // Get tee snapshot for par info
    const { data: teeSnapshot } = await supabase
      .from('tee_snapshots')
      .select('course_name, holes')
      .eq('event_id', round.event_id)
      .single();

    const holes = teeSnapshot?.holes || [];
    const holeParMap = new Map(holes.map((h: { number: number; par: number }) => [h.number, h.par]));
    const scores = round.hole_scores || [];

    let totalScore = 0;
    let par = 0;
    let eagles = 0, birdies = 0, pars = 0, bogeys = 0, doubleBogeys = 0, triplePlus = 0;

    for (const score of scores) {
      const holePar = (holeParMap.get(score.hole_number) || 4) as number;
      const strokes = score.strokes as number;
      const diff = strokes - holePar;
      totalScore += strokes;
      par += holePar;

      if (diff <= -2) eagles++;
      else if (diff === -1) birdies++;
      else if (diff === 0) pars++;
      else if (diff === 1) bogeys++;
      else if (diff === 2) doubleBogeys++;
      else if (diff >= 3) triplePlus++;
    }

    return {
      roundId: round.id,
      eventId: round.event_id,
      courseName: teeSnapshot?.course_name || 'Unknown Course',
      date: round.round_date,
      totalScore,
      par,
      relativeToPar: totalScore - par,
      eagles,
      birdies,
      pars,
      bogeys,
      doubleBogeys,
      triplePlus,
    };
  } catch (error) {
    console.error('[playerStats] Failed to get last round stats:', error);
    return null;
  }
}

/**
 * Get the most recent game result for a player
 */
export async function getRecentGameResult(
  userId: string
): Promise<RecentGameResult | null> {
  if (isMockMode) {
    return getMockRecentGameResult(userId);
  }

  const supabase = createClient();
  if (!supabase) return null;

  try {
    // Get most recent settlement involving this user
    const { data: settlement } = await supabase
      .from('settlements')
      .select(`
        id,
        game_id,
        event_id,
        payer_id,
        payee_id,
        amount_int,
        created_at
      `)
      .or(`payer_id.eq.${userId},payee_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!settlement) return null;

    // Get player names
    const { data: profiles } = await supabase
      .from('player_profiles')
      .select('user_id, name')
      .in('user_id', [settlement.payer_id, settlement.payee_id]);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

    return {
      gameId: settlement.game_id,
      eventId: settlement.event_id,
      winner: {
        id: settlement.payee_id,
        name: profileMap.get(settlement.payee_id) || 'Unknown',
      },
      loser: {
        id: settlement.payer_id,
        name: profileMap.get(settlement.payer_id) || 'Unknown',
      },
      amount: settlement.amount_int,
      date: settlement.created_at,
    };
  } catch (error) {
    console.error('[playerStats] Failed to get recent game result:', error);
    return null;
  }
}

// ============================================
// MOCK DATA FUNCTIONS
// ============================================

function getMockCareerStats(userId: string, period: StatsPeriod): CareerStats {
  // Return realistic mock data based on period
  const baseStats: CareerStats = {
    totalRounds: period === 'today' ? 1 : period === 'ytd' ? 12 : 47,
    eagles: period === 'today' ? 0 : period === 'ytd' ? 2 : 5,
    birdies: period === 'today' ? 2 : period === 'ytd' ? 28 : 89,
    pars: period === 'today' ? 8 : period === 'ytd' ? 112 : 423,
    bogeys: period === 'today' ? 5 : period === 'ytd' ? 68 : 267,
    doubleBogeys: period === 'today' ? 2 : period === 'ytd' ? 18 : 54,
    triplePlus: period === 'today' ? 1 : period === 'ytd' ? 4 : 8,
    avgScore: period === 'today' ? 84 : period === 'ytd' ? 86 : 87,
    gamesPlayed: period === 'today' ? 1 : period === 'ytd' ? 8 : 32,
    wins: period === 'today' ? 1 : period === 'ytd' ? 5 : 18,
    losses: period === 'today' ? 0 : period === 'ytd' ? 3 : 14,
    totalWinnings: period === 'today' ? 20 : period === 'ytd' ? 150 : 420,
  };

  return baseStats;
}

function getMockLastRoundStats(userId: string): PlayerRoundStats | null {
  return {
    roundId: 'mock-round-1',
    eventId: 'demo-event-1',
    courseName: 'Pine Valley',
    date: new Date().toISOString().split('T')[0],
    totalScore: 78,
    par: 72,
    relativeToPar: 6,
    eagles: 0,
    birdies: 2,
    pars: 8,
    bogeys: 5,
    doubleBogeys: 2,
    triplePlus: 1,
  };
}

function getMockRecentGameResult(userId: string): RecentGameResult | null {
  return {
    gameId: 'mock-game-1',
    eventId: 'demo-event-1',
    winner: {
      id: userId,
      name: 'You',
    },
    loser: {
      id: 'mock-user-2',
      name: 'John',
    },
    amount: 20,
    date: new Date().toISOString(),
  };
}
