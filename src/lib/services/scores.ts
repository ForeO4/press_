import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import { mockRounds, mockScores } from '@/lib/mock/data';
import type { HoleScore, Round } from '@/types';

// In-memory mock storage for mock mode persistence within session
let mockScoreStore: Map<string, HoleScore> = new Map();

/**
 * Check if we should use mock data for this event
 * Demo events use mock data even when Supabase is configured
 */
function shouldUseMockData(eventId: string): boolean {
  return isMockMode || eventId === 'demo-event';
}

// Initialize mock store from mock data
function initMockStore() {
  if (mockScoreStore.size === 0) {
    for (const score of mockScores) {
      const key = `${score.roundId}-${score.holeNumber}`;
      mockScoreStore.set(key, { ...score });
    }
  }
}

/**
 * Upsert a score for a hole
 * Uses rpc_upsert_score for permissions, event lock check, and audit logging
 */
export async function upsertScore(
  eventId: string,
  roundId: string,
  userId: string,
  holeNumber: number,
  strokes: number
): Promise<HoleScore> {
  if (shouldUseMockData(eventId)) {
    initMockStore();
    const key = `${roundId}-${holeNumber}`;
    const now = new Date().toISOString();
    const existing = mockScoreStore.get(key);
    const score: HoleScore = {
      id: existing?.id ?? `score-${roundId}-${holeNumber}`,
      roundId,
      holeNumber,
      strokes,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    mockScoreStore.set(key, score);
    return score;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Use the RPC function for proper permission checking and audit logging
  const { data, error } = await supabase.rpc('rpc_upsert_score', {
    p_event_id: eventId,
    p_round_id: roundId,
    p_hole_number: holeNumber,
    p_strokes: strokes,
  });

  if (error) throw error;

  return mapScoreFromDb(data);
}

/**
 * Get all scores for a round
 */
export async function getScoresForRound(roundId: string): Promise<HoleScore[]> {
  if (isMockMode) {
    initMockStore();
    const scores: HoleScore[] = [];
    mockScoreStore.forEach((score) => {
      if (score.roundId === roundId) {
        scores.push({ ...score });
      }
    });
    return scores.sort((a, b) => a.holeNumber - b.holeNumber);
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('hole_scores')
    .select('*')
    .eq('round_id', roundId)
    .order('hole_number');

  if (error) throw error;

  return (data || []).map(mapScoreFromDb);
}

/**
 * Get all scores for an event (all rounds)
 */
export async function getScoresForEvent(
  eventId: string
): Promise<Record<string, HoleScore[]>> {
  if (shouldUseMockData(eventId)) {
    initMockStore();
    const result: Record<string, HoleScore[]> = {};
    const eventRounds = mockRounds.filter((r) => r.eventId === eventId);

    for (const round of eventRounds) {
      result[round.id] = [];
      mockScoreStore.forEach((score) => {
        if (score.roundId === round.id) {
          result[round.id].push({ ...score });
        }
      });
      result[round.id].sort((a, b) => a.holeNumber - b.holeNumber);
    }

    return result;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // First get all rounds for this event
  const { data: rounds, error: roundsError } = await supabase
    .from('rounds')
    .select('id')
    .eq('event_id', eventId);

  if (roundsError) throw roundsError;

  const roundIds = (rounds || []).map((r) => r.id);
  if (roundIds.length === 0) return {};

  // Then get all scores for those rounds
  const { data: scores, error: scoresError } = await supabase
    .from('hole_scores')
    .select('*')
    .in('round_id', roundIds)
    .order('hole_number');

  if (scoresError) throw scoresError;

  // Group by round
  const result: Record<string, HoleScore[]> = {};
  for (const roundId of roundIds) {
    result[roundId] = [];
  }

  for (const score of scores || []) {
    const mapped = mapScoreFromDb(score);
    if (result[mapped.roundId]) {
      result[mapped.roundId].push(mapped);
    }
  }

  return result;
}

/**
 * Get rounds for an event, returning userId -> roundId mapping
 */
export async function getEventRounds(
  eventId: string
): Promise<{ rounds: Round[]; userToRound: Record<string, string>; roundToUser: Record<string, string> }> {
  if (shouldUseMockData(eventId)) {
    const eventRounds = mockRounds.filter((r) => r.eventId === eventId);
    const userToRound: Record<string, string> = {};
    const roundToUser: Record<string, string> = {};

    for (const round of eventRounds) {
      userToRound[round.userId] = round.id;
      roundToUser[round.id] = round.userId;
    }

    return { rounds: eventRounds, userToRound, roundToUser };
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('rounds')
    .select('*')
    .eq('event_id', eventId);

  if (error) throw error;

  const rounds = (data || []).map(mapRoundFromDb);
  const userToRound: Record<string, string> = {};
  const roundToUser: Record<string, string> = {};

  for (const round of rounds) {
    userToRound[round.userId] = round.id;
    roundToUser[round.id] = round.userId;
  }

  return { rounds, userToRound, roundToUser };
}

/**
 * Map database row to HoleScore type
 */
function mapScoreFromDb(row: Record<string, unknown>): HoleScore {
  return {
    id: row.id as string,
    roundId: row.round_id as string,
    holeNumber: row.hole_number as number,
    strokes: row.strokes as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Map database row to Round type
 */
function mapRoundFromDb(row: Record<string, unknown>): Round {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    userId: row.user_id as string,
    teeSetId: row.tee_set_id as string | null,
    roundDate: row.round_date as string,
    createdAt: row.created_at as string,
  };
}
