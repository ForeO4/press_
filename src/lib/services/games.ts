import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import {
  mockGames,
  mockGameParticipants,
  getGamesWithParticipants as getMockGamesWithParticipants,
} from '@/lib/mock/data';
import type {
  Game,
  GameParticipant,
  GameWithParticipants,
  GameType,
  GameStatus,
  AlligatorTeeth,
} from '@/types';

// In-memory mock storage for mock mode persistence within session
let mockGameStore: Game[] = [...mockGames];
let mockParticipantStore: GameParticipant[] = [...mockGameParticipants];

/**
 * Check if we should use mock data for this event
 * Demo events use mock data even when Supabase is configured
 */
function shouldUseMockData(eventId: string): boolean {
  return isMockMode || eventId === 'demo-event';
}

/**
 * Create a new game
 */
export async function createGame(
  eventId: string,
  type: GameType,
  stake: AlligatorTeeth,
  playerAId: string,
  playerBId: string,
  startHole: number = 1,
  endHole: number = 18
): Promise<GameWithParticipants> {
  console.log('[games service] createGame called:', { eventId, type, stake, playerAId, playerBId, shouldUseMock: shouldUseMockData(eventId) });
  if (shouldUseMockData(eventId)) {
    const gameId = crypto.randomUUID();
    const now = new Date().toISOString();
    console.log('[games service] Creating mock game:', gameId);

    const game: Game = {
      id: gameId,
      eventId,
      type,
      stakeTeethInt: stake,
      parentGameId: null,
      startHole,
      endHole,
      status: 'active',
      createdAt: now,
    };

    const participants: GameParticipant[] = [
      { id: `gp-${gameId}-a`, gameId, userId: playerAId, teamId: null },
      { id: `gp-${gameId}-b`, gameId, userId: playerBId, teamId: null },
    ];

    mockGameStore.push(game);
    mockParticipantStore.push(...participants);

    return {
      ...game,
      participants,
    };
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Create the game
  const { data: gameData, error: gameError } = await supabase
    .from('games')
    .insert({
      event_id: eventId,
      type,
      stake_teeth_int: stake,
      parent_game_id: null,
      start_hole: startHole,
      end_hole: endHole,
      status: 'active',
    })
    .select()
    .single();

  if (gameError) throw gameError;

  // Create participants
  const { data: participantsData, error: participantsError } = await supabase
    .from('game_participants')
    .insert([
      { game_id: gameData.id, user_id: playerAId, team_id: null },
      { game_id: gameData.id, user_id: playerBId, team_id: null },
    ])
    .select();

  if (participantsError) throw participantsError;

  return {
    ...mapGameFromDb(gameData),
    participants: (participantsData || []).map(mapParticipantFromDb),
  };
}

/**
 * Get all games for an event with participants
 */
export async function getGamesForEvent(
  eventId: string
): Promise<GameWithParticipants[]> {
  console.log('[games service] getGamesForEvent:', { eventId, shouldUseMock: shouldUseMockData(eventId), mockStoreSize: mockGameStore.length });
  if (shouldUseMockData(eventId)) {
    // Filter games by eventId and build hierarchy
    const eventGames = mockGameStore.filter((g) => g.eventId === eventId);
    console.log('[games service] Found games for event:', eventGames.length);
    const rootGames = eventGames.filter((g) => !g.parentGameId);

    return rootGames.map((game) => {
      const participants = mockParticipantStore.filter(
        (p) => p.gameId === game.id
      );
      const childGames = eventGames
        .filter((g) => g.parentGameId === game.id)
        .map((child) => ({
          ...child,
          participants: mockParticipantStore.filter(
            (p) => p.gameId === child.id
          ),
        }));

      return {
        ...game,
        participants,
        childGames: childGames.length > 0 ? childGames : undefined,
      };
    });
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Fetch games with participants
  const { data, error } = await supabase
    .from('games')
    .select(
      `
      *,
      game_participants(*)
    `
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const games = (data || []).map((row) => ({
    ...mapGameFromDb(row),
    participants: (row.game_participants || []).map(mapParticipantFromDb),
  }));

  // Build hierarchy
  const rootGames = games.filter((g) => !g.parentGameId);

  return rootGames.map((game) => {
    const childGames = games.filter((g) => g.parentGameId === game.id);
    return {
      ...game,
      childGames: childGames.length > 0 ? childGames : undefined,
    };
  });
}

/**
 * Get a single game with participants
 */
export async function getGameWithParticipants(
  gameId: string
): Promise<GameWithParticipants | null> {
  // Check if game exists in mock store (for demo events)
  const mockGame = mockGameStore.find((g) => g.id === gameId);
  if (mockGame && shouldUseMockData(mockGame.eventId)) {
    const participants = mockParticipantStore.filter((p) => p.gameId === gameId);
    const childGames = mockGameStore
      .filter((g) => g.parentGameId === gameId)
      .map((child) => ({
        ...child,
        participants: mockParticipantStore.filter((p) => p.gameId === child.id),
      }));

    return {
      ...mockGame,
      participants,
      childGames: childGames.length > 0 ? childGames : undefined,
    };
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('games')
    .select(
      `
      *,
      game_participants(*)
    `
    )
    .eq('id', gameId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    ...mapGameFromDb(data),
    participants: (data.game_participants || []).map(mapParticipantFromDb),
  };
}

/**
 * Update game status
 */
export async function updateGameStatus(
  gameId: string,
  status: GameStatus
): Promise<Game> {
  // Check if game exists in mock store (for demo events)
  const mockGameIndex = mockGameStore.findIndex((g) => g.id === gameId);
  if (mockGameIndex !== -1 && shouldUseMockData(mockGameStore[mockGameIndex].eventId)) {
    mockGameStore[mockGameIndex] = { ...mockGameStore[mockGameIndex], status };
    return mockGameStore[mockGameIndex];
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('games')
    .update({ status })
    .eq('id', gameId)
    .select()
    .single();

  if (error) throw error;

  return mapGameFromDb(data);
}

/**
 * Create a press (child game)
 */
export async function createPress(
  parentGame: Game,
  stake: AlligatorTeeth,
  startHole: number
): Promise<GameWithParticipants> {
  if (shouldUseMockData(parentGame.eventId)) {
    const gameId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Get parent participants
    const parentParticipants = mockParticipantStore.filter(
      (p) => p.gameId === parentGame.id
    );

    const game: Game = {
      id: gameId,
      eventId: parentGame.eventId,
      type: parentGame.type,
      stakeTeethInt: stake,
      parentGameId: parentGame.id,
      startHole,
      endHole: parentGame.endHole,
      status: 'active',
      createdAt: now,
    };

    const participants: GameParticipant[] = parentParticipants.map((p) => ({
      id: `gp-${gameId}-${p.userId}`,
      gameId,
      userId: p.userId,
      teamId: p.teamId,
    }));

    mockGameStore.push(game);
    mockParticipantStore.push(...participants);

    return {
      ...game,
      participants,
    };
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Create the press game
  const { data: gameData, error: gameError } = await supabase
    .from('games')
    .insert({
      event_id: parentGame.eventId,
      type: parentGame.type,
      stake_teeth_int: stake,
      parent_game_id: parentGame.id,
      start_hole: startHole,
      end_hole: parentGame.endHole,
      status: 'active',
    })
    .select()
    .single();

  if (gameError) throw gameError;

  // Get parent participants
  const { data: parentParticipants, error: parentError } = await supabase
    .from('game_participants')
    .select('*')
    .eq('game_id', parentGame.id);

  if (parentError) throw parentError;

  // Create participants for press (same as parent)
  const { data: participantsData, error: participantsError } = await supabase
    .from('game_participants')
    .insert(
      (parentParticipants || []).map((p) => ({
        game_id: gameData.id,
        user_id: p.user_id,
        team_id: p.team_id,
      }))
    )
    .select();

  if (participantsError) throw participantsError;

  return {
    ...mapGameFromDb(gameData),
    participants: (participantsData || []).map(mapParticipantFromDb),
  };
}

/**
 * Map database row to Game type
 */
function mapGameFromDb(row: Record<string, unknown>): Game {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    type: row.type as GameType,
    stakeTeethInt: row.stake_teeth_int as number,
    parentGameId: row.parent_game_id as string | null,
    startHole: row.start_hole as number,
    endHole: row.end_hole as number,
    status: row.status as GameStatus,
    createdAt: row.created_at as string,
  };
}

/**
 * Map database row to GameParticipant type
 */
function mapParticipantFromDb(row: Record<string, unknown>): GameParticipant {
  return {
    id: row.id as string,
    gameId: row.game_id as string,
    userId: row.user_id as string,
    teamId: row.team_id as string | null,
  };
}
