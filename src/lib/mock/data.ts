import type {
  Event,
  EventSettings,
  EventMembership,
  Game,
  GameParticipant,
  GameWithParticipants,
  Round,
  HoleScore,
  TeethBalance,
  EventPost,
  EventMessage,
  Settlement,
  ActivityEvent,
} from '@/types';
import { mockUsers } from './users';

// ============================================
// DEMO EVENT
// ============================================

export const mockEvent: Event = {
  id: 'demo-event',
  name: 'Bandon Dunes 2026',
  date: '2026-01-28',
  endDate: '2026-01-30',
  visibility: 'PRIVATE',
  isLocked: false,
  numRounds: 3,
  numHoles: 18,
  defaultGameType: 'match_play',
  theme: 'dark',
  createdBy: 'demo-owner',
  createdAt: '2026-01-20T10:00:00Z',
  updatedAt: '2026-01-28T08:00:00Z',
};

export const mockEventSettings: EventSettings = {
  eventId: 'demo-event',
  pressRules: {
    enabled: true,
    trigger: 2,
    maxPresses: 3,
    stakeMultiplier: 1,
  },
  defaultBucks: 100,
  allowSelfPress: true,
  updatedAt: '2024-04-01T10:00:00Z',
};

// ============================================
// MEMBERSHIPS
// ============================================

export const mockMemberships: EventMembership[] = mockUsers.map((user) => ({
  id: `membership-${user.id}`,
  eventId: 'demo-event',
  userId: user.id,
  role: user.role,
  status: 'ACTIVE',
  createdAt: '2024-04-01T10:00:00Z',
}));

// ============================================
// ROUNDS & SCORES
// ============================================

export const mockRounds: Round[] = mockUsers.map((user) => ({
  id: `round-${user.id}`,
  eventId: 'demo-event',
  userId: user.id,
  teeSetId: 'tee-set-blue',
  roundDate: '2024-04-15',
  createdAt: '2024-04-15T08:00:00Z',
}));

// Sample scores (full 18 holes)
const createScores = (roundId: string, scores: number[]): HoleScore[] =>
  scores.map((strokes, index) => ({
    id: `score-${roundId}-${index + 1}`,
    roundId,
    holeNumber: index + 1,
    strokes,
    createdAt: '2024-04-15T12:00:00Z',
    updatedAt: '2024-04-15T12:00:00Z',
  }));

export const mockScores: HoleScore[] = [
  // Front 9 + Back 9 for each player
  // prettier-ignore
  ...createScores('round-demo-owner', [4, 4, 3, 5, 3, 4, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4]),   // 36+36=72
  // prettier-ignore
  ...createScores('round-demo-admin', [5, 4, 4, 4, 4, 5, 6, 4, 5, 5, 4, 6, 5, 4, 4, 5, 6, 5]),   // 41+44=85
  // prettier-ignore
  ...createScores('round-demo-player1', [5, 5, 3, 5, 4, 4, 5, 5, 4, 4, 4, 5, 5, 4, 4, 4, 5, 5]), // 40+40=80
  // prettier-ignore
  ...createScores('round-demo-player2', [4, 5, 4, 6, 3, 5, 6, 4, 5, 5, 3, 6, 4, 5, 4, 5, 6, 4]), // 42+42=84
];

// ============================================
// GAMES
// ============================================

const matchPlayGame: Game = {
  id: 'game-match-1',
  eventId: 'demo-event',
  type: 'match_play',
  stakeTeethInt: 10,
  parentGameId: null,
  startHole: 1,
  endHole: 18,
  status: 'active',
  createdAt: '2024-04-15T08:00:00Z',
};

const pressGame: Game = {
  id: 'game-press-1',
  eventId: 'demo-event',
  type: 'match_play',
  stakeTeethInt: 10,
  parentGameId: 'game-match-1',
  startHole: 10,
  endHole: 18,
  status: 'active',
  createdAt: '2024-04-15T11:00:00Z',
};

const nassauGame: Game = {
  id: 'game-nassau-1',
  eventId: 'demo-event',
  type: 'nassau',
  stakeTeethInt: 5,
  parentGameId: null,
  startHole: 1,
  endHole: 18,
  status: 'active',
  createdAt: '2024-04-15T08:00:00Z',
};

export const mockGames: Game[] = [matchPlayGame, pressGame, nassauGame];

export const mockGameParticipants: GameParticipant[] = [
  // Match play: Owner vs Admin
  { id: 'gp-1', gameId: 'game-match-1', userId: 'demo-owner', guestPlayerId: null, teamId: null },
  { id: 'gp-2', gameId: 'game-match-1', userId: 'demo-admin', guestPlayerId: null, teamId: null },
  // Press (same participants)
  { id: 'gp-3', gameId: 'game-press-1', userId: 'demo-owner', guestPlayerId: null, teamId: null },
  { id: 'gp-4', gameId: 'game-press-1', userId: 'demo-admin', guestPlayerId: null, teamId: null },
  // Nassau: Player1 vs Player2
  { id: 'gp-5', gameId: 'game-nassau-1', userId: 'demo-player1', guestPlayerId: null, teamId: null },
  { id: 'gp-6', gameId: 'game-nassau-1', userId: 'demo-player2', guestPlayerId: null, teamId: null },
];

/**
 * Get games with participants and nested child games
 */
export function getGamesWithParticipants(): GameWithParticipants[] {
  const rootGames = mockGames.filter((g) => !g.parentGameId);

  return rootGames.map((game) => {
    const participants = mockGameParticipants.filter(
      (p) => p.gameId === game.id
    );
    const childGames = mockGames
      .filter((g) => g.parentGameId === game.id)
      .map((child) => ({
        ...child,
        participants: mockGameParticipants.filter((p) => p.gameId === child.id),
      }));

    return {
      ...game,
      participants,
      childGames: childGames.length > 0 ? childGames : undefined,
    };
  });
}

// ============================================
// GATOR BUCKS BALANCES
// ============================================

export const mockGatorBucksBalances: TeethBalance[] = mockUsers.map((user) => ({
  id: `balance-${user.id}`,
  eventId: 'demo-event',
  userId: user.id,
  balanceInt: 100,
  updatedAt: '2024-04-15T08:00:00Z',
}));

/** @deprecated Use mockGatorBucksBalances instead */
export const mockTeethBalances = mockGatorBucksBalances;

// ============================================
// SETTLEMENTS
// ============================================

export const mockSettlements: Settlement[] = [
  {
    id: 'settlement-1',
    eventId: 'demo-event',
    gameId: 'game-match-1',
    payerId: 'demo-admin',
    payeeId: 'demo-owner',
    amountInt: 30,
    status: 'pending',
    createdAt: '2024-04-15T16:00:00Z',
  },
];

// ============================================
// SOCIAL
// ============================================

export const mockPosts: EventPost[] = [
  {
    id: 'post-1',
    eventId: 'demo-event',
    authorId: null,
    content: 'Event created: Spring Classic 2024',
    mediaIds: [],
    isSystem: true,
    createdAt: '2024-04-01T10:00:00Z',
  },
  {
    id: 'post-2',
    eventId: 'demo-event',
    authorId: 'demo-owner',
    content: 'First tee time is 8:00 AM. See everyone there!',
    mediaIds: [],
    isSystem: false,
    createdAt: '2024-04-14T20:00:00Z',
  },
  {
    id: 'post-3',
    eventId: 'demo-event',
    authorId: null,
    content: 'Press created starting hole 10 (10 Bucks)',
    mediaIds: [],
    isSystem: true,
    createdAt: '2024-04-15T11:00:00Z',
  },
];

export const mockMessages: EventMessage[] = [
  {
    id: 'msg-1',
    threadId: 'thread-general',
    authorId: null,
    content: 'Welcome to Bandon Dunes 2026!',
    isSystem: true,
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'msg-2',
    threadId: 'thread-general',
    authorId: 'demo-owner',
    content: 'Looking forward to a great round today!',
    isSystem: false,
    createdAt: '2026-01-28T07:00:00Z',
  },
  {
    id: 'msg-3',
    threadId: 'thread-general',
    authorId: 'demo-admin',
    content: 'Weather looks perfect',
    isSystem: false,
    createdAt: '2026-01-28T07:30:00Z',
  },
];

// ============================================
// ACTIVITY EVENTS
// ============================================

export const mockActivityEvents: ActivityEvent[] = [
  {
    id: 'activity-1',
    eventId: 'demo-event',
    userId: 'demo-owner',
    activityType: 'eagle',
    metadata: { playerName: 'John', hole: 7 },
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5m ago
  },
  {
    id: 'activity-2',
    eventId: 'demo-event',
    activityType: 'press',
    metadata: { hole: 12, amount: 10 },
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12m ago
  },
  {
    id: 'activity-3',
    eventId: 'demo-event',
    userId: 'demo-admin',
    activityType: 'settlement',
    metadata: { playerName: 'Mike', amount: 15 },
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h ago
  },
  {
    id: 'activity-4',
    eventId: 'demo-event',
    userId: 'demo-player1',
    activityType: 'birdie',
    metadata: { playerName: 'Sarah', hole: 4 },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
  },
  {
    id: 'activity-5',
    eventId: 'demo-event',
    userId: 'demo-player2',
    activityType: 'round_start',
    metadata: { playerName: 'Dave' },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3h ago
  },
  {
    id: 'activity-6',
    eventId: 'demo-event',
    activityType: 'game_start',
    metadata: { gameType: 'Match Play', players: ['John', 'Mike'] },
    createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(), // 3.5h ago
  },
  {
    id: 'activity-7',
    eventId: 'demo-event',
    userId: 'demo-player1',
    activityType: 'player_joined',
    metadata: { playerName: 'Sarah' },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1d ago
  },
];
