/**
 * Test Score Data for Full Journey E2E Tests
 *
 * These scores are designed to create an interesting match with:
 * - Back-and-forth momentum swings
 * - A press situation (when a player is 2 down)
 * - Clear settlement calculations
 */

export interface HoleScore {
  hole: number;
  par: number;
  alexScore: number;
  blakeScore: number;
  originalMatchStatus: string;
  pressMatchStatus?: string;
}

/**
 * Full 18-hole round scores
 *
 * Story: Alex starts strong but Blake mounts a comeback on the back nine.
 * Blake presses at hole 9 when 2 down and wins the press convincingly.
 */
export const FULL_ROUND_SCORES: HoleScore[] = [
  // Front 9 - Alex builds a lead
  { hole: 1, par: 4, alexScore: 4, blakeScore: 5, originalMatchStatus: 'Alex 1 UP' },
  { hole: 2, par: 4, alexScore: 5, blakeScore: 4, originalMatchStatus: 'All Square' },
  { hole: 3, par: 3, alexScore: 3, blakeScore: 4, originalMatchStatus: 'Alex 1 UP' },
  { hole: 4, par: 4, alexScore: 4, blakeScore: 5, originalMatchStatus: 'Alex 2 UP' },
  { hole: 5, par: 5, alexScore: 5, blakeScore: 4, originalMatchStatus: 'Alex 1 UP' },
  { hole: 6, par: 4, alexScore: 4, blakeScore: 4, originalMatchStatus: 'Alex 1 UP' },
  { hole: 7, par: 3, alexScore: 3, blakeScore: 4, originalMatchStatus: 'Alex 2 UP' },
  { hole: 8, par: 5, alexScore: 5, blakeScore: 4, originalMatchStatus: 'Alex 1 UP' },
  { hole: 9, par: 4, alexScore: 4, blakeScore: 5, originalMatchStatus: 'Alex 2 UP' },

  // Back 9 - Blake's comeback (press starts at hole 10)
  { hole: 10, par: 4, alexScore: 5, blakeScore: 4, originalMatchStatus: 'Alex 1 UP', pressMatchStatus: 'Blake 1 UP' },
  { hole: 11, par: 3, alexScore: 4, blakeScore: 3, originalMatchStatus: 'All Square', pressMatchStatus: 'Blake 2 UP' },
  { hole: 12, par: 4, alexScore: 5, blakeScore: 4, originalMatchStatus: 'Blake 1 UP', pressMatchStatus: 'Blake 3 UP' },
  { hole: 13, par: 4, alexScore: 4, blakeScore: 4, originalMatchStatus: 'Blake 1 UP', pressMatchStatus: 'Blake 3 UP' },
  { hole: 14, par: 5, alexScore: 4, blakeScore: 4, originalMatchStatus: 'All Square', pressMatchStatus: 'Blake 3 UP' },
  { hole: 15, par: 4, alexScore: 5, blakeScore: 4, originalMatchStatus: 'Blake 1 UP', pressMatchStatus: 'Blake 4 UP' },
  { hole: 16, par: 3, alexScore: 4, blakeScore: 3, originalMatchStatus: 'Blake 2 UP', pressMatchStatus: 'Blake 5 UP' },
  { hole: 17, par: 4, alexScore: 5, blakeScore: 4, originalMatchStatus: 'Blake 3 UP', pressMatchStatus: 'Dormie' },
  { hole: 18, par: 4, alexScore: 4, blakeScore: 4, originalMatchStatus: 'Blake wins 3&1', pressMatchStatus: 'Blake wins 5 UP' },
];

/**
 * Get scores for front 9 only
 */
export function getFront9Scores(): HoleScore[] {
  return FULL_ROUND_SCORES.filter((s) => s.hole <= 9);
}

/**
 * Get scores for back 9 only
 */
export function getBack9Scores(): HoleScore[] {
  return FULL_ROUND_SCORES.filter((s) => s.hole >= 10);
}

/**
 * Calculate stroke totals
 */
export function calculateTotals() {
  const front9 = getFront9Scores();
  const back9 = getBack9Scores();

  return {
    alex: {
      front9: front9.reduce((sum, h) => sum + h.alexScore, 0), // 37
      back9: back9.reduce((sum, h) => sum + h.alexScore, 0), // 40
      total: FULL_ROUND_SCORES.reduce((sum, h) => sum + h.alexScore, 0), // 77
    },
    blake: {
      front9: front9.reduce((sum, h) => sum + h.blakeScore, 0), // 39
      back9: back9.reduce((sum, h) => sum + h.blakeScore, 0), // 34
      total: FULL_ROUND_SCORES.reduce((sum, h) => sum + h.blakeScore, 0), // 73
    },
  };
}

/**
 * Expected settlement calculations
 *
 * Original Match (10 Gator Bucks per hole):
 * - Blake wins 3&1 = 30 Gator Bucks to Blake
 *
 * Press Match (10 Gator Bucks per hole, starting hole 10):
 * - Blake wins by 5 holes = 50 Gator Bucks to Blake
 *
 * Total: Alex pays Blake 80 Gator Bucks
 */
export const EXPECTED_SETTLEMENT = {
  originalGame: {
    winner: 'Blake',
    margin: '3&1',
    stakes: 10,
    payout: 30,
  },
  pressGame: {
    winner: 'Blake',
    margin: '5 UP',
    stakes: 10,
    payout: 50,
  },
  netSettlement: {
    payer: 'Alex',
    receiver: 'Blake',
    amount: 80,
  },
};

/**
 * Test game configuration
 */
export const TEST_GAME_CONFIG = {
  gameType: 'Match Play',
  stakes: 10,
  stakesUnit: 'Gator Bucks',
  players: {
    player1: 'Alex Owner',
    player2: 'Blake Admin',
  },
  course: 'Bandon Dunes', // From seeded data
};

/**
 * Press configuration
 */
export const PRESS_CONFIG = {
  startingHole: 10,
  stakes: 10,
  multiplier: 1,
  initiator: 'Blake Admin',
  reason: '2 down after 9 holes',
};
