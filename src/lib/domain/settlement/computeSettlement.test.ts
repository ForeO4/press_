import { describe, it, expect } from 'vitest';
import {
  computeHoleResults,
  computeMatchPlayResult,
  computeMatchPlaySettlement,
  computeNetPositions,
  computeNassauSettlement,
  computeHoleResultsForRange,
  computeMatchResultForRange,
} from './computeSettlement';
import type { Game, HoleScore, Settlement } from '@/types';

const mockGame: Game = {
  id: 'game-1',
  eventId: 'event-1',
  type: 'match_play',
  stakeTeethInt: 10,
  parentGameId: null,
  startHole: 1,
  endHole: 9,
  status: 'complete',
  createdAt: '2024-01-01T00:00:00Z',
};

const createScore = (roundId: string, hole: number, strokes: number): HoleScore => ({
  id: `score-${roundId}-${hole}`,
  roundId,
  holeNumber: hole,
  strokes,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

describe('computeHoleResults', () => {
  it('computes wins and losses correctly', () => {
    const playerAScores = [
      createScore('round-a', 1, 4),
      createScore('round-a', 2, 5),
      createScore('round-a', 3, 3),
    ];
    const playerBScores = [
      createScore('round-b', 1, 5), // A wins
      createScore('round-b', 2, 4), // B wins
      createScore('round-b', 3, 3), // Tie
    ];

    const results = computeHoleResults(
      { ...mockGame, startHole: 1, endHole: 3 },
      'player-a',
      'player-b',
      playerAScores,
      playerBScores
    );

    expect(results).toHaveLength(3);
    expect(results[0].winner).toBe('A');
    expect(results[1].winner).toBe('B');
    expect(results[2].winner).toBe('tie');
  });

  it('handles missing scores', () => {
    const playerAScores = [createScore('round-a', 1, 4)];
    const playerBScores = [createScore('round-b', 1, 5)];

    const results = computeHoleResults(
      { ...mockGame, startHole: 1, endHole: 3 },
      'player-a',
      'player-b',
      playerAScores,
      playerBScores
    );

    // Only hole 1 has both scores
    expect(results).toHaveLength(1);
  });
});

describe('computeMatchPlayResult', () => {
  it('calculates winner when A is up', () => {
    const holeResults = [
      { hole: 1, playerAStrokes: 4, playerBStrokes: 5, winner: 'A' as const },
      { hole: 2, playerAStrokes: 4, playerBStrokes: 5, winner: 'A' as const },
      { hole: 3, playerAStrokes: 5, playerBStrokes: 4, winner: 'B' as const },
    ];

    const result = computeMatchPlayResult('player-a', 'player-b', holeResults);

    expect(result.winnerId).toBe('player-a');
    expect(result.loserId).toBe('player-b');
    expect(result.holesUp).toBe(1);
    expect(result.playerANet).toBe(1);
    expect(result.playerBNet).toBe(-1);
  });

  it('calculates winner when B is up', () => {
    const holeResults = [
      { hole: 1, playerAStrokes: 5, playerBStrokes: 4, winner: 'B' as const },
      { hole: 2, playerAStrokes: 5, playerBStrokes: 4, winner: 'B' as const },
      { hole: 3, playerAStrokes: 4, playerBStrokes: 5, winner: 'A' as const },
    ];

    const result = computeMatchPlayResult('player-a', 'player-b', holeResults);

    expect(result.winnerId).toBe('player-b');
    expect(result.loserId).toBe('player-a');
    expect(result.holesUp).toBe(1);
  });

  it('returns null winner for tie', () => {
    const holeResults = [
      { hole: 1, playerAStrokes: 4, playerBStrokes: 5, winner: 'A' as const },
      { hole: 2, playerAStrokes: 5, playerBStrokes: 4, winner: 'B' as const },
    ];

    const result = computeMatchPlayResult('player-a', 'player-b', holeResults);

    expect(result.winnerId).toBeNull();
    expect(result.loserId).toBeNull();
    expect(result.holesUp).toBe(0);
  });
});

describe('computeMatchPlaySettlement', () => {
  it('calculates settlement amount correctly', () => {
    const playerAScores = [
      createScore('round-a', 1, 4),
      createScore('round-a', 2, 4),
      createScore('round-a', 3, 4),
    ];
    const playerBScores = [
      createScore('round-b', 1, 5),
      createScore('round-b', 2, 5),
      createScore('round-b', 3, 5),
    ];

    const settlement = computeMatchPlaySettlement(
      { ...mockGame, startHole: 1, endHole: 3, stakeTeethInt: 10 },
      'player-a',
      'player-b',
      playerAScores,
      playerBScores
    );

    expect(settlement).not.toBeNull();
    expect(settlement!.amountInt).toBe(30); // 3 holes up * 10 teeth
    expect(settlement!.payeeId).toBe('player-a'); // Winner
    expect(settlement!.payerId).toBe('player-b'); // Loser
  });

  it('returns null for tie', () => {
    const playerAScores = [createScore('round-a', 1, 4)];
    const playerBScores = [createScore('round-b', 1, 4)];

    const settlement = computeMatchPlaySettlement(
      { ...mockGame, startHole: 1, endHole: 1 },
      'player-a',
      'player-b',
      playerAScores,
      playerBScores
    );

    expect(settlement).toBeNull();
  });
});

describe('computeNetPositions', () => {
  it('calculates net positions correctly', () => {
    const settlements: Settlement[] = [
      {
        id: 's1',
        eventId: 'event-1',
        gameId: 'game-1',
        payerId: 'player-b',
        payeeId: 'player-a',
        amountInt: 30,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 's2',
        eventId: 'event-1',
        gameId: 'game-2',
        payerId: 'player-a',
        payeeId: 'player-c',
        amountInt: 10,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    const positions = computeNetPositions(settlements, [
      'player-a',
      'player-b',
      'player-c',
    ]);

    expect(positions.get('player-a')).toBe(20); // +30 - 10
    expect(positions.get('player-b')).toBe(-30);
    expect(positions.get('player-c')).toBe(10);
  });

  it('handles users with no settlements', () => {
    const settlements: Settlement[] = [];
    const positions = computeNetPositions(settlements, ['player-a', 'player-b']);

    expect(positions.get('player-a')).toBe(0);
    expect(positions.get('player-b')).toBe(0);
  });
});

// Helper to create a full 18-hole round
const createFullRound = (roundId: string, scores: number[]): HoleScore[] =>
  scores.map((strokes, idx) => createScore(roundId, idx + 1, strokes));

const mockNassauGame: Game = {
  id: 'nassau-1',
  eventId: 'event-1',
  type: 'nassau',
  stakeTeethInt: 5,
  parentGameId: null,
  startHole: 1,
  endHole: 18,
  status: 'complete',
  createdAt: '2024-01-01T00:00:00Z',
};

describe('computeHoleResultsForRange', () => {
  it('computes results only for specified range', () => {
    const playerAScores = createFullRound('round-a', [4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
    const playerBScores = createFullRound('round-b', [5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4]);

    // Front 9: A wins all
    const front9Results = computeHoleResultsForRange('player-a', 'player-b', playerAScores, playerBScores, 1, 9);
    expect(front9Results).toHaveLength(9);
    expect(front9Results.every(r => r.winner === 'A')).toBe(true);

    // Back 9: B wins all
    const back9Results = computeHoleResultsForRange('player-a', 'player-b', playerAScores, playerBScores, 10, 18);
    expect(back9Results).toHaveLength(9);
    expect(back9Results.every(r => r.winner === 'B')).toBe(true);
  });
});

describe('computeNassauSettlement', () => {
  it('computes different winners for each segment', () => {
    // A wins front 9, B wins back 9, tie overall
    const playerAScores = createFullRound('round-a', [4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
    const playerBScores = createFullRound('round-b', [5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4]);

    const settlement = computeNassauSettlement(
      mockNassauGame,
      'player-a',
      'player-b',
      playerAScores,
      playerBScores
    );

    // Front 9: A wins 9-0
    expect(settlement.front9).not.toBeNull();
    expect(settlement.front9!.payeeId).toBe('player-a');
    expect(settlement.front9!.payerId).toBe('player-b');
    expect(settlement.front9!.amountInt).toBe(45); // 5 teeth * 9 up

    // Back 9: B wins 9-0
    expect(settlement.back9).not.toBeNull();
    expect(settlement.back9!.payeeId).toBe('player-b');
    expect(settlement.back9!.payerId).toBe('player-a');
    expect(settlement.back9!.amountInt).toBe(45); // 5 teeth * 9 up

    // Overall: Tie (9-9)
    expect(settlement.overall).toBeNull();
  });

  it('same player wins all 3 segments', () => {
    // A wins every hole
    const playerAScores = createFullRound('round-a', [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
    const playerBScores = createFullRound('round-b', [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);

    const settlement = computeNassauSettlement(
      mockNassauGame,
      'player-a',
      'player-b',
      playerAScores,
      playerBScores
    );

    expect(settlement.front9!.payeeId).toBe('player-a');
    expect(settlement.front9!.amountInt).toBe(45); // 9 up

    expect(settlement.back9!.payeeId).toBe('player-a');
    expect(settlement.back9!.amountInt).toBe(45); // 9 up

    expect(settlement.overall!.payeeId).toBe('player-a');
    expect(settlement.overall!.amountInt).toBe(90); // 18 up
  });

  it('handles ties on some segments', () => {
    // All ties
    const playerAScores = createFullRound('round-a', [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
    const playerBScores = createFullRound('round-b', [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);

    const settlement = computeNassauSettlement(
      mockNassauGame,
      'player-a',
      'player-b',
      playerAScores,
      playerBScores
    );

    expect(settlement.front9).toBeNull();
    expect(settlement.back9).toBeNull();
    expect(settlement.overall).toBeNull();
  });

  it('handles partial scores gracefully', () => {
    // Only 5 holes played
    const playerAScores = [
      createScore('round-a', 1, 4),
      createScore('round-a', 2, 4),
      createScore('round-a', 3, 4),
      createScore('round-a', 4, 4),
      createScore('round-a', 5, 4),
    ];
    const playerBScores = [
      createScore('round-b', 1, 5),
      createScore('round-b', 2, 5),
      createScore('round-b', 3, 5),
      createScore('round-b', 4, 5),
      createScore('round-b', 5, 5),
    ];

    const settlement = computeNassauSettlement(
      mockNassauGame,
      'player-a',
      'player-b',
      playerAScores,
      playerBScores
    );

    // A is 5 up on front 9 (only 5 holes played)
    expect(settlement.front9!.payeeId).toBe('player-a');
    expect(settlement.front9!.amountInt).toBe(25); // 5 up * 5 teeth

    // No back 9 scores
    expect(settlement.back9).toBeNull();

    // Overall is also 5 up
    expect(settlement.overall!.payeeId).toBe('player-a');
    expect(settlement.overall!.amountInt).toBe(25);
  });
});

describe('computeMatchResultForRange', () => {
  it('computes match result for specific hole range', () => {
    const playerAScores = createFullRound('round-a', [4, 4, 4, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
    const playerBScores = createFullRound('round-b', [5, 5, 5, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5]);

    const front9Result = computeMatchResultForRange('player-a', 'player-b', playerAScores, playerBScores, 1, 9);
    // A wins 3, B wins 6, so B is 3 up
    expect(front9Result.winnerId).toBe('player-b');
    expect(front9Result.holesUp).toBe(3);

    const back9Result = computeMatchResultForRange('player-a', 'player-b', playerAScores, playerBScores, 10, 18);
    // A wins all 9
    expect(back9Result.winnerId).toBe('player-a');
    expect(back9Result.holesUp).toBe(9);
  });
});
