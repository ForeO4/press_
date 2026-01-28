/**
 * Press! Rules Engine - Stableford Contest
 *
 * Points-based scoring vs par (gross or net).
 * Default scoring: Double bogey+=0, Bogey=1, Par=2, Birdie=3, Eagle=4, Albatross=5
 */

import type {
  Round,
  ContestConfig,
  ContestResult,
  ContestHandler,
  ValidationResult,
  ContestSummary,
  StablefordStanding,
  ContestAudit,
  HoleAuditEntry,
  HolePlayerAudit,
  ContestSettlement,
  HoleNumber,
  PlayerId,
  StablefordTable,
} from '../types';
import { isPlayerParticipants, getAllPlayerIds } from '../types';
import { computeHandicapStrokes, computeNetScore, StrokesPerHole } from '../handicap';
import { computeStablefordPoints, getThruHole, isContestFinal, buildPlayerNameMap } from '../scoring';
import { settleStableford, buildSettlement, createEmptySettlement } from '../settlement';
import { validateBasicConfig, getHolesPlanned } from '../engine';

const defaultTable: StablefordTable = {
  albatross: 5,
  eagle: 4,
  birdie: 3,
  par: 2,
  bogey: 1,
  doubleBogey: 0,
  worse: 0,
};

export const stablefordHandler: ContestHandler = {
  type: 'stableford',

  validate(config: ContestConfig): ValidationResult {
    const basicValidation = validateBasicConfig(config);
    const errors: string[] = [...basicValidation.errors];

    if (!isPlayerParticipants(config.participants)) {
      errors.push('Stableford requires player participants (not teams)');
    } else if (config.participants.length < 2 || config.participants.length > 4) {
      errors.push('Stableford requires 2-4 players');
    }

    return { valid: errors.length === 0, errors };
  },

  compute(round: Round, config: ContestConfig): ContestResult {
    const holesPlanned = getHolesPlanned(round);
    const playerIds = getAllPlayerIds(config.participants);
    const playerNames = buildPlayerNameMap(round);
    const isNet = config.scoringBasis === 'net';
    const table = config.options?.stablefordTable ?? defaultTable;

    const startHole: HoleNumber = 1;
    const endHole: HoleNumber = holesPlanned === 9 ? 9 : 18;

    // Compute handicap strokes
    const playerStrokes: Record<PlayerId, StrokesPerHole> = {};
    if (isNet) {
      for (const playerId of playerIds) {
        const player = round.players.find((p) => p.id === playerId);
        const handicap = player?.courseHandicap ?? 0;
        playerStrokes[playerId] = computeHandicapStrokes(round.tee.strokeIndex, handicap);
      }
    }

    // Process holes
    const auditEntries: HoleAuditEntry[] = [];
    const playerPoints: Record<PlayerId, number> = {};
    const playerThruHole: Record<PlayerId, HoleNumber> = {};

    for (const id of playerIds) {
      playerPoints[id] = 0;
    }

    for (let hole = startHole; hole <= endHole; hole++) {
      const holeNum = hole as HoleNumber;
      const par = round.tee.par[holeNum];

      const playerAudit: HolePlayerAudit[] = [];

      for (const playerId of playerIds) {
        const gross = round.grossStrokes[playerId]?.[holeNum];
        if (gross === undefined) {
          continue;
        }

        const dots = playerStrokes[playerId]?.[holeNum] ?? 0;
        const netScore = isNet ? computeNetScore(gross, dots, config.handicapConfig) : gross;
        const points = computeStablefordPoints(netScore, par, table);

        playerPoints[playerId] += points;
        playerThruHole[playerId] = holeNum;

        playerAudit.push({
          playerId,
          playerName: playerNames[playerId] ?? playerId,
          gross,
          net: isNet ? netScore : undefined,
          dots: isNet ? dots : undefined,
          stablefordPoints: points,
        });
      }

      if (playerAudit.length > 0) {
        // Find winner(s) for this hole (highest points)
        const maxPoints = Math.max(...playerAudit.map((p) => p.stablefordPoints ?? 0));
        const winners = playerAudit.filter((p) => p.stablefordPoints === maxPoints);

        auditEntries.push({
          hole: holeNum,
          par,
          players: playerAudit,
          winner: winners.length === 1 ? winners[0].playerId : winners.map((w) => w.playerId),
          notes: playerAudit.map((p) => `${p.playerName}: ${p.stablefordPoints} pts`).join(', '),
        });
      }
    }

    // Determine thru hole and status
    const thruHole = getThruHole(round, playerIds, startHole, endHole);
    const isFinal = isContestFinal(thruHole, endHole);

    // Build standings with ranks
    const sortedPlayers = playerIds
      .map((playerId) => ({
        playerId,
        playerName: playerNames[playerId] ?? playerId,
        totalPoints: playerPoints[playerId],
        thruHole: playerThruHole[playerId] ?? startHole,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    // Assign ranks (handle ties)
    const standings: StablefordStanding[] = [];
    let currentRank = 1;
    for (let i = 0; i < sortedPlayers.length; i++) {
      const player = sortedPlayers[i];
      if (i > 0 && player.totalPoints < sortedPlayers[i - 1].totalPoints) {
        currentRank = i + 1;
      }
      standings.push({
        ...player,
        rank: currentRank,
      });
    }

    // Find winners and losers for settlement
    const highScore = standings[0]?.totalPoints ?? 0;
    const winnerIds = standings.filter((s) => s.totalPoints === highScore).map((s) => s.playerId);
    const loserIds = standings.filter((s) => s.totalPoints < highScore).map((s) => s.playerId);

    // Settlement
    let settlement: ContestSettlement;
    if (isFinal && winnerIds.length > 0 && loserIds.length > 0) {
      const entries = settleStableford(
        config.contestId,
        winnerIds,
        loserIds,
        config.stakesConfig.unit
      );
      settlement = buildSettlement(entries);
    } else {
      settlement = createEmptySettlement();
    }

    const winnerNames = winnerIds.map((id) => playerNames[id] ?? id).join(' & ');

    const summary: ContestSummary = {
      contestId: config.contestId,
      name: config.name,
      type: config.type,
      scoringBasis: config.scoringBasis,
      stakesSummary: `${config.stakesConfig.unit} units`,
      status: isFinal ? 'final' : 'live',
      thruHole,
    };

    const audit: ContestAudit = {
      holeByHole: auditEntries,
      summary: winnerIds.length > 1
        ? `Tied: ${winnerNames} with ${highScore} points`
        : `${winnerNames} wins with ${highScore} points`,
    };

    return {
      summary,
      standings: { type: 'stableford', standings },
      audit,
      settlement,
    };
  },
};
