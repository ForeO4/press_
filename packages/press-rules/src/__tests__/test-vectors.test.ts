/**
 * Press! Rules Engine - Test Vector Runner
 *
 * Validates the rules engine against predefined test vectors.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
// Import contests to register handlers with defaultRegistry
import '../contests';
import { computeContests } from '../engine';
import { resetLedgerIdCounter } from '../settlement';
import type { Round, ContestConfig, ContestResult, SkinsStandings, SidePotStandings, NassauStandings } from '../types';

// Reset ledger counter before each test for deterministic output
beforeEach(() => {
  resetLedgerIdCounter();
});

interface TestVector {
  id: string;
  description: string;
  round: Round;
  contests: ContestConfig[];
  expected: Record<string, {
    summary: {
      contestId: string;
      type: string;
      status: string;
      thruHole?: number | null;
    };
    standings: {
      type: string;
      winner?: string;
      result?: string;
      skinResults?: Array<{ hole: number; winner: string | null; carryover?: boolean; skinsWon?: number }>;
      totalSkinsWon?: number;
      carryoverSkins?: number;
      segments?: string[];
      pressCount?: number;
      hasTies?: boolean;
      potType?: string;
      holeResultCount?: number;
      currentHolder?: string;
      hasCountedPlayerInfo?: boolean;
    };
    settlement?: {
      totalAmount?: number;
      winner?: string;
      loser?: string;
      holderPays?: boolean;
      potTotal?: number;
    };
    audit?: {
      holeCount?: number;
      hasCountedPlayerInfo?: boolean;
    };
  }>;
}

interface VectorsFile {
  vectors: TestVector[];
}

// Load test vectors
const vectorsPath = path.join(__dirname, '../../test-vectors/vectors.json');
const vectorsData: VectorsFile = JSON.parse(fs.readFileSync(vectorsPath, 'utf-8'));

describe('test vectors', () => {
  for (const vector of vectorsData.vectors) {
    describe(vector.id, () => {
      it(vector.description, () => {
        // Run the computation
        const results = computeContests(vector.round, vector.contests);

        // Validate each expected contest result
        for (const [contestId, expected] of Object.entries(vector.expected)) {
          const result = results.find((r) => r.summary.contestId === contestId);
          expect(result, `Result for ${contestId} should exist`).toBeDefined();

          if (!result) continue;

          // Validate summary
          expect(result.summary.contestId).toBe(expected.summary.contestId);
          expect(result.summary.type).toBe(expected.summary.type);
          expect(result.summary.status).toBe(expected.summary.status);
          if (expected.summary.thruHole !== undefined) {
            expect(result.summary.thruHole).toBe(expected.summary.thruHole);
          }

          // Validate standings type
          expect(result.standings.type).toBe(expected.standings.type);

          // Type-specific standings validation
          if (expected.standings.type === 'match_play') {
            const standings = result.standings as { type: 'match_play'; standings: Array<{ playerId: string; holesUp: number; result?: string }> };
            if (expected.standings.winner) {
              // Winner has positive holesUp
              const winner = standings.standings.find((s) => s.holesUp > 0);
              expect(winner?.playerId).toBe(expected.standings.winner);
            }
            if (expected.standings.result) {
              // Find player with positive holesUp for result check
              const winner = standings.standings.find((s) => s.holesUp > 0);
              expect(winner?.result).toBe(expected.standings.result);
            }
          }

          if (expected.standings.type === 'skins') {
            const standings = result.standings as SkinsStandings;
            if (expected.standings.skinResults) {
              // Verify key skin results match
              for (const expectedSkin of expected.standings.skinResults) {
                const actualSkin = standings.skinResults.find((s) => s.hole === expectedSkin.hole);
                expect(actualSkin, `Skin result for hole ${expectedSkin.hole}`).toBeDefined();
                if (actualSkin) {
                  if (expectedSkin.winner === null) {
                    expect(actualSkin.winnerId).toBeNull();
                  } else {
                    expect(actualSkin.winnerId).toBe(expectedSkin.winner);
                  }
                  if (expectedSkin.skinsWon !== undefined) {
                    expect(actualSkin.skinsWon).toBe(expectedSkin.skinsWon);
                  }
                }
              }
            }
            if (expected.standings.totalSkinsWon !== undefined) {
              const totalWon = standings.skinResults.reduce((sum, s) => sum + s.skinsWon, 0);
              expect(totalWon).toBe(expected.standings.totalSkinsWon);
            }
            if (expected.standings.carryoverSkins !== undefined) {
              expect(standings.carryoverSkins).toBe(expected.standings.carryoverSkins);
            }
          }

          if (expected.standings.type === 'nassau') {
            const standings = result.standings as NassauStandings;
            if (expected.standings.segments) {
              const segmentNames = standings.segments.map((s) => s.segmentId);
              for (const expectedSeg of expected.standings.segments) {
                expect(segmentNames).toContain(expectedSeg);
              }
            }
            if (expected.standings.pressCount !== undefined) {
              expect(standings.presses.length).toBe(expected.standings.pressCount);
            }
          }

          if (expected.standings.type === 'stableford') {
            if (expected.standings.hasTies) {
              const standings = result.standings as { type: 'stableford'; standings: Array<{ rank: number }> };
              // Check if there are multiple rank 1s
              const rank1Count = standings.standings.filter((s) => s.rank === 1).length;
              expect(rank1Count).toBeGreaterThan(1);
            }
          }

          if (expected.standings.type === 'side_pot') {
            const standings = result.standings as SidePotStandings;
            if (expected.standings.potType) {
              expect(standings.potType).toBe(expected.standings.potType);
            }
            if (expected.standings.holeResultCount !== undefined) {
              expect(standings.holeResults?.length).toBe(expected.standings.holeResultCount);
            }
            if (expected.standings.currentHolder) {
              const holder = standings.standings.find((s) => s.isHolding);
              expect(holder?.playerId).toBe(expected.standings.currentHolder);
            }
          }

          // Validate settlement if expected
          if (expected.settlement) {
            if (expected.settlement.totalAmount !== undefined) {
              const totalFlow = result.settlement.ledgerEntries.reduce(
                (sum, e) => sum + Math.abs(e.amount),
                0
              ) / 2; // Divide by 2 because each transaction is recorded twice (from/to)
              // For simple 1v1, total amount is the stake * holesUp
              const maxAmount = Math.max(...result.settlement.ledgerEntries.map((e) => Math.abs(e.amount)));
              expect(maxAmount).toBe(expected.settlement.totalAmount);
            }
            if (expected.settlement.winner && expected.settlement.loser) {
              const winnerEntry = result.settlement.ledgerEntries.find(
                (e) => e.toPlayerId === expected.settlement!.winner
              );
              expect(winnerEntry, 'Winner entry should exist').toBeDefined();
              const loserEntry = result.settlement.ledgerEntries.find(
                (e) => e.fromPlayerId === expected.settlement!.loser
              );
              expect(loserEntry, 'Loser entry should exist').toBeDefined();
            }
            if (expected.settlement.holderPays) {
              // Snake: holder pays everyone
              expect(result.settlement.ledgerEntries.length).toBeGreaterThan(0);
            }
            if (expected.settlement.potTotal !== undefined) {
              expect(result.standings).toHaveProperty('potTotal', expected.settlement.potTotal);
            }
          }

          // Validate audit if expected
          if (expected.audit) {
            if (expected.audit.holeCount !== undefined) {
              expect(result.audit.holeByHole.length).toBe(expected.audit.holeCount);
            }
            if (expected.audit.hasCountedPlayerInfo) {
              // Check that at least one hole has counted player info
              const hasCountedInfo = result.audit.holeByHole.some(
                (h) => h.players.some((p) => p.counted !== undefined)
              );
              expect(hasCountedInfo).toBe(true);
            }
          }
        }
      });
    });
  }
});

describe('determinism', () => {
  it('produces identical results on recompute', () => {
    // Use first vector for determinism test
    const vector = vectorsData.vectors[0];

    // Reset counter before first run
    resetLedgerIdCounter();
    const results1 = computeContests(vector.round, vector.contests);

    // Reset counter before second run to ensure identical IDs
    resetLedgerIdCounter();
    const results2 = computeContests(vector.round, vector.contests);

    // Deep equality check
    expect(JSON.stringify(results1)).toBe(JSON.stringify(results2));
  });

  it('produces identical results across all vectors', () => {
    for (const vector of vectorsData.vectors) {
      // Reset counter before first run
      resetLedgerIdCounter();
      const results1 = computeContests(vector.round, vector.contests);

      // Reset counter before second run to ensure identical IDs
      resetLedgerIdCounter();
      const results2 = computeContests(vector.round, vector.contests);

      expect(
        JSON.stringify(results1),
        `Determinism check failed for ${vector.id}`
      ).toBe(JSON.stringify(results2));
    }
  });
});

describe('validation', () => {
  it('validates contest configurations', () => {
    for (const vector of vectorsData.vectors) {
      for (const contest of vector.contests) {
        // computeContests should not throw
        expect(() => computeContests(vector.round, [contest])).not.toThrow();
      }
    }
  });
});
