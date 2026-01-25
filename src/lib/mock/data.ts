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
} from '@/types';
import { mockUsers } from './users';

// ============================================
// DEMO EVENT
// ============================================

export const mockEvent: Event = {
  id: 'demo-event',
  name: 'Spring Classic 2024',
  date: '2024-04-15',
  visibility: 'UNLISTED',
  isLocked: false,
  createdBy: 'demo-owner',
  createdAt: '2024-04-01T10:00:00Z',
  updatedAt: '2024-04-15T08:00:00Z',
};

export const mockEventSettings: EventSettings = {
  eventId: 'demo-event',
  pressRules: { autoPressTrigger: 2, defaultStake: 10 },
  defaultTeeth: 100,
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

// Sample scores (front 9 for demo)
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
  ...createScores('round-demo-owner', [4, 4, 3, 5, 3, 4, 5, 4, 4]), // 36
  ...createScores('round-demo-admin', [5, 4, 4, 4, 4, 5, 6, 4, 5]), // 41
  ...createScores('round-demo-player1', [5, 5, 3, 5, 4, 4, 5, 5, 4]), // 40
  ...createScores('round-demo-player2', [4, 5, 4, 6, 3, 5, 6, 4, 5]), // 42
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
  { id: 'gp-1', gameId: 'game-match-1', userId: 'demo-owner', teamId: null },
  { id: 'gp-2', gameId: 'game-match-1', userId: 'demo-admin', teamId: null },
  // Press (same participants)
  { id: 'gp-3', gameId: 'game-press-1', userId: 'demo-owner', teamId: null },
  { id: 'gp-4', gameId: 'game-press-1', userId: 'demo-admin', teamId: null },
  // Nassau: Player1 vs Player2
  { id: 'gp-5', gameId: 'game-nassau-1', userId: 'demo-player1', teamId: null },
  { id: 'gp-6', gameId: 'game-nassau-1', userId: 'demo-player2', teamId: null },
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
// TEETH BALANCES
// ============================================

export const mockTeethBalances: TeethBalance[] = mockUsers.map((user) => ({
  id: `balance-${user.id}`,
  eventId: 'demo-event',
  userId: user.id,
  balanceInt: 100,
  updatedAt: '2024-04-15T08:00:00Z',
}));

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
    content: 'Press created starting hole 10 (10 Teeth)',
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
    content: 'Welcome to Spring Classic 2024!',
    isSystem: true,
    createdAt: '2024-04-01T10:00:00Z',
  },
  {
    id: 'msg-2',
    threadId: 'thread-general',
    authorId: 'demo-owner',
    content: 'Looking forward to a great round today!',
    isSystem: false,
    createdAt: '2024-04-15T07:00:00Z',
  },
  {
    id: 'msg-3',
    threadId: 'thread-general',
    authorId: 'demo-admin',
    content: 'Weather looks perfect',
    isSystem: false,
    createdAt: '2024-04-15T07:30:00Z',
  },
];
