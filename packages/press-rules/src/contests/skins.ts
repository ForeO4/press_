/**
 * Press! Rules Engine - Skins Contest
 *
 * Skins game for 2-4 players (gross or net).
 * Features:
 * - Lowest unique score wins the skin
 * - Ties carry over to next hole (configurable)
 * - Settlement: winner collects perSkin from EACH other player
 *   (so a skin is worth perSkin * (numPlayers - 1) to winner)
 */

import type {
  Round,
  ContestConfig,
  ContestResult,
  ContestHandler,
  ValidationResult,
  ContestSummary,
  SkinsStandings,
  SkinsStanding,
  SkinResultEntry,
  ContestAudit,
  HoleAuditEntry,
  HolePlayerAudit,
  ContestSettlement,
  HoleNumber,
  PlayerId,
} from '../types';
import { isPlayerParticipants, getAllPlayerIds } from '../types';
import {
  computeHandicapStrokes,
  computeNetScore,
  StrokesPerHole,
} from '../handicap';
import {
  computeSkinWinner,
  getThruHole,
  isContestFinal,
  buildPlayerNameMap,
  SkinResult,
} from '../scoring';
import { settleSkins, settleSkinsWithPot, buildSettlement, createEmptySettlement } from '../settlement';
import { validateBasicConfig, getHolesPlanned } from '../engine';

// ============================================
// HANDLER
// ============================================

export const skinsHandler: ContestHandler = {
  type: 'skins',

  validate(config: ContestConfig): ValidationResult {
    const basicValidation = validateBasicConfig(config);
    const errors: string[] = [...basicValidation.errors];

    // Must have 2-4 player participants
    if (!isPlayerParticipants(config.participants)) {
      errors.push('Skins requires player participants (not teams)');
    } else if (config.participants.length < 2 || config.participants.length > 4) {
      errors.push('Skins requires 2-4 players');
    }

    return { valid: errors.length === 0, errors };
  },

  compute(round: Round, config: ContestConfig): ContestResult {
    const holesPlanned = getHolesPlanned(round);
    const playerIds = getAllPlayerIds(config.participants);
    const playerNames = buildPlayerNameMap(round);
    const numPlayers = playerIds.length;

    // Determine scoring basis
    const isNet = config.scoringBasis === 'net';

    // Get segment bounds
    const startHole: HoleNumber = 1;
    const endHole: HoleNumber = holesPlanned === 9 ? 9 : 18;

    // Compute handicap strokes if net scoring
    const playerStrokes: Record<PlayerId, StrokesPerHole> = {};
    if (isNet) {
      for (const playerId of playerIds) {
        const player = round.players.find((p) => p.id === playerId);
        const handicap = player?.courseHandicap ?? 0;
        playerStrokes[playerId] = computeHandicapStrokes(round.tee.strokeIndex, handicap);
      }
    }

    // Carryover rules
    const carryoverEnabled = config.options?.carryoverRules?.enabled !== false;
    const maxCarryover = config.options?.carryoverRules?.maxMultiplier;

    // Process each hole
    const skinResults: SkinResult[] = [];
    const auditEntries: HoleAuditEntry[] = [];
    const skinsWonByPlayer: Record<PlayerId, number> = {};
    for (const id of playerIds) {
      skinsWonByPlayer[id] = 0;
    }

    let currentCarryover = 0;

    for (let hole = startHole; hole <= endHole; hole++) {
      const holeNum = hole as HoleNumber;

      // Get scores for all players
      const scores: Record<PlayerId, number> = {};
      let allHaveScores = true;

      for (const playerId of playerIds) {
        const gross = round.grossStrokes[playerId]?.[holeNum];
        if (gross === undefined) {
          allHaveScores = false;
          break;
        }

        if (isNet) {
          const dots = playerStrokes[playerId][holeNum];
          scores[playerId] = computeNetScore(gross, dots, config.handicapConfig);
        } else {
          scores[playerId] = gross;
        }
      }

      // Skip holes without all scores
      if (!allHaveScores) {
        continue;
      }

      // Determine skin winner
      const result = computeSkinWinner(holeNum, scores, playerNames, currentCarryover);
      skinResults.push(result);

      // Build audit entry
      const playerAudit: HolePlayerAudit[] = playerIds.map((playerId) => ({
        playerId,
        playerName: playerNames[playerId] ?? playerId,
        gross: round.grossStrokes[playerId]?.[holeNum] ?? 0,
        net: isNet ? scores[playerId] : undefined,
        dots: isNet ? playerStrokes[playerId][holeNum] : undefined,
      }));

      const auditEntry: HoleAuditEntry = {
        hole: holeNum,
        par: round.tee.par[holeNum],
        players: playerAudit,
        winner: result.winnerId ?? 'carryover',
        skinValue: result.winnerId ? result.skinCount : undefined,
        carryoverCount: result.winnerId ? 0 : currentCarryover + 1,
        notes: result.winnerId
          ? `${result.winnerName} wins ${result.skinCount > 1 ? `${result.skinCount} skins` : 'skin'}`
          : `Carryover (${currentCarryover + 1} skins at stake)`,
      };
      auditEntries.push(auditEntry);

      // Update state
      if (result.winnerId) {
        skinsWonByPlayer[result.winnerId] += result.skinCount;
        currentCarryover = 0;
      } else if (carryoverEnabled) {
        currentCarryover++;
        // Apply max carryover limit if configured
        if (maxCarryover !== undefined && currentCarryover > maxCarryover) {
          currentCarryover = maxCarryover;
        }
      } else {
        // No carryover - skin is lost
        currentCarryover = 0;
      }
    }

    // Calculate totals
    const totalSkinsAwarded = Object.values(skinsWonByPlayer).reduce((sum, count) => sum + count, 0);

    // Determine thru hole and status
    const thruHole = getThruHole(round, playerIds, startHole, endHole);
    const isFinal = isContestFinal(thruHole, endHole);

    // Get stakes info
    const perSkin = config.stakesConfig.unit;
    const potTotal = config.stakesConfig.potTotal;

    // Build skinResults for output
    const skinResultEntries: SkinResultEntry[] = skinResults.map((result) => ({
      hole: result.hole,
      winnerId: result.winnerId,
      winnerName: result.winnerName,
      skinsWon: result.winnerId ? result.skinCount : 0,
    }));

    // Build standings
    const standings: SkinsStandings = {
      type: 'skins',
      standings: playerIds.map((playerId) => {
        const skinsWon = skinsWonByPlayer[playerId];
        // Each skin won = perSkin from each other player = perSkin * (numPlayers - 1)
        const totalValue = potTotal
          ? Math.floor((potTotal / (totalSkinsAwarded || 1)) * skinsWon)
          : skinsWon * perSkin * (numPlayers - 1);

        return {
          playerId,
          playerName: playerNames[playerId] ?? playerId,
          skinsWon,
          totalValue,
        } as SkinsStanding;
      }).sort((a, b) => b.skinsWon - a.skinsWon),
      skinResults: skinResultEntries,
      totalSkinsAwarded,
      carryoverSkins: currentCarryover,
    };

    // Compute settlement (only if final)
    let settlement: ContestSettlement;
    if (isFinal && totalSkinsAwarded > 0) {
      const entries = potTotal
        ? settleSkinsWithPot(config.contestId, skinsWonByPlayer, potTotal, playerIds)
        : settleSkins(config.contestId, skinsWonByPlayer, perSkin, playerIds);
      settlement = buildSettlement(entries);
    } else {
      settlement = createEmptySettlement();
    }

    // Build summary
    const stakesSummary = potTotal
      ? `${potTotal} unit pot`
      : `${perSkin} units/skin`;

    const summary: ContestSummary = {
      contestId: config.contestId,
      name: config.name,
      type: config.type,
      scoringBasis: config.scoringBasis,
      stakesSummary,
      status: isFinal ? 'final' : 'live',
      thruHole,
    };

    // Build audit
    const audit: ContestAudit = {
      holeByHole: auditEntries,
      summary: `${totalSkinsAwarded} skins awarded${currentCarryover > 0 ? `, ${currentCarryover} pending` : ''}`,
    };

    return {
      summary,
      standings,
      audit,
      settlement,
    };
  },
};
