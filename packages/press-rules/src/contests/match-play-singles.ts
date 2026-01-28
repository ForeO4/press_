/**
 * Press! Rules Engine - Match Play Singles Contest
 *
 * Standard match play between 2 players (gross or net).
 * Features:
 * - Hole-by-hole comparison
 * - Net scoring with relative handicap (lowest plays off 0)
 * - Early close detection ("3&2" format)
 * - Proper status tracking (leading, dormie, closed)
 */

import type {
  Round,
  ContestConfig,
  ContestResult,
  ContestHandler,
  ValidationResult,
  ContestSummary,
  MatchPlayStandings,
  MatchPlayStanding,
  ContestAudit,
  HoleAuditEntry,
  HolePlayerAudit,
  ContestSettlement,
  HoleNumber,
  PlayerId,
} from '../types';
import { isPlayerParticipants } from '../types';
import {
  computeHandicapStrokes,
  computeRelativeHandicaps,
  computeNetScore,
  StrokesPerHole,
} from '../handicap';
import {
  computeHoleMatchResult,
  computeMatchStatus,
  getThruHole,
  isContestFinal,
  getPlayerName,
  HoleMatchResult,
} from '../scoring';
import { settleMatchPlay, buildSettlement, createEmptySettlement } from '../settlement';
import { validateBasicConfig, getHolesPlanned } from '../engine';

// ============================================
// HANDLER
// ============================================

export const matchPlaySinglesHandler: ContestHandler = {
  type: 'match_play_singles',

  validate(config: ContestConfig): ValidationResult {
    const basicValidation = validateBasicConfig(config);
    const errors: string[] = [...basicValidation.errors];

    // Must have exactly 2 player participants
    if (!isPlayerParticipants(config.participants)) {
      errors.push('Match Play Singles requires player participants (not teams)');
    } else if (config.participants.length !== 2) {
      errors.push('Match Play Singles requires exactly 2 players');
    }

    return { valid: errors.length === 0, errors };
  },

  compute(round: Round, config: ContestConfig): ContestResult {
    const holesPlanned = getHolesPlanned(round);

    // Get participants
    if (!isPlayerParticipants(config.participants) || config.participants.length !== 2) {
      throw new Error('Match Play Singles requires exactly 2 player participants');
    }

    const [playerAId, playerBId] = config.participants;
    const playerAName = getPlayerName(round, playerAId);
    const playerBName = getPlayerName(round, playerBId);

    // Determine scoring basis
    const isNet = config.scoringBasis === 'net';

    // Get segment bounds
    const startHole: HoleNumber = 1;
    const endHole: HoleNumber = holesPlanned === 9 ? 9 : 18;
    const totalHoles = endHole - startHole + 1;

    // Compute handicap strokes if net scoring
    let strokesA: StrokesPerHole | null = null;
    let strokesB: StrokesPerHole | null = null;

    if (isNet) {
      const playerA = round.players.find((p) => p.id === playerAId);
      const playerB = round.players.find((p) => p.id === playerBId);
      const handicapA = playerA?.courseHandicap ?? 0;
      const handicapB = playerB?.courseHandicap ?? 0;

      // Use relative handicap (lowest plays off 0)
      const useRelative = config.handicapConfig.useRelativeHandicap !== false;
      let effectiveA = handicapA;
      let effectiveB = handicapB;

      if (useRelative) {
        const relative = computeRelativeHandicaps({
          [playerAId]: handicapA,
          [playerBId]: handicapB,
        });
        effectiveA = relative[playerAId];
        effectiveB = relative[playerBId];
      }

      strokesA = computeHandicapStrokes(round.tee.strokeIndex, effectiveA);
      strokesB = computeHandicapStrokes(round.tee.strokeIndex, effectiveB);
    }

    // Process each hole
    const holeResults: HoleMatchResult[] = [];
    const auditEntries: HoleAuditEntry[] = [];

    for (let hole = startHole; hole <= endHole; hole++) {
      const holeNum = hole as HoleNumber;
      const grossA = round.grossStrokes[playerAId]?.[holeNum];
      const grossB = round.grossStrokes[playerBId]?.[holeNum];

      // Skip holes without both scores
      if (grossA === undefined || grossB === undefined) {
        continue;
      }

      // Compute net scores
      const dotsA = strokesA?.[holeNum] ?? 0;
      const dotsB = strokesB?.[holeNum] ?? 0;
      const scoreA = isNet ? computeNetScore(grossA, dotsA, config.handicapConfig) : grossA;
      const scoreB = isNet ? computeNetScore(grossB, dotsB, config.handicapConfig) : grossB;

      // Determine hole winner
      const holeResult = computeHoleMatchResult(
        holeNum,
        scoreA,
        scoreB,
        playerAId,
        playerBId,
        playerAName,
        playerBName
      );
      holeResults.push(holeResult);

      // Compute match state after this hole for audit
      const statusAfterHole = computeMatchStatus(
        holeResults,
        totalHoles,
        playerAId,
        playerBId,
        playerAName,
        playerBName
      );

      // Build audit entry
      const playerAudit: HolePlayerAudit[] = [
        {
          playerId: playerAId,
          playerName: playerAName,
          gross: grossA,
          net: isNet ? scoreA : undefined,
          dots: isNet ? dotsA : undefined,
        },
        {
          playerId: playerBId,
          playerName: playerBName,
          gross: grossB,
          net: isNet ? scoreB : undefined,
          dots: isNet ? dotsB : undefined,
        },
      ];

      const auditEntry: HoleAuditEntry = {
        hole: holeNum,
        par: round.tee.par[holeNum],
        players: playerAudit,
        winner: holeResult.winner ?? 'halved',
        matchState: statusAfterHole.holesUp === 0
          ? 'A/S'
          : `${statusAfterHole.leaderName} ${statusAfterHole.holesUp} UP`,
      };

      auditEntries.push(auditEntry);

      // Check if match is closed (early finish)
      if (statusAfterHole.isClosed) {
        break;
      }
    }

    // Compute final match status
    const matchStatus = computeMatchStatus(
      holeResults,
      totalHoles,
      playerAId,
      playerBId,
      playerAName,
      playerBName
    );

    // Determine thru hole and status
    const thruHole = getThruHole(round, config.participants as PlayerId[], startHole, endHole);
    const isFinal = isContestFinal(thruHole, endHole, matchStatus.isClosed);

    // Build standings
    const standings: MatchPlayStandings = {
      type: 'match_play',
      standings: [
        buildPlayerStanding(
          playerAId,
          playerAName,
          matchStatus,
          holeResults.length,
          totalHoles - holeResults.length
        ),
        buildPlayerStanding(
          playerBId,
          playerBName,
          matchStatus,
          holeResults.length,
          totalHoles - holeResults.length,
          true // Invert perspective for player B
        ),
      ],
    };

    // Compute settlement (only if final with a winner)
    let settlement: ContestSettlement;
    if (isFinal && matchStatus.leaderId && matchStatus.holesUp > 0) {
      const loserId = matchStatus.leaderId === playerAId ? playerBId : playerAId;
      const entries = settleMatchPlay(
        config.contestId,
        matchStatus.leaderId,
        loserId,
        matchStatus.holesUp,
        config.stakesConfig.unit,
        `${config.name}: ${matchStatus.leaderName} wins ${matchStatus.result ?? `${matchStatus.holesUp} UP`}`
      );
      settlement = buildSettlement(entries);
    } else {
      settlement = createEmptySettlement();
    }

    // Build summary
    const summary: ContestSummary = {
      contestId: config.contestId,
      name: config.name,
      type: config.type,
      scoringBasis: config.scoringBasis,
      stakesSummary: `${config.stakesConfig.unit} units/hole`,
      status: isFinal ? 'final' : 'live',
      thruHole,
    };

    // Build audit
    const audit: ContestAudit = {
      holeByHole: auditEntries,
      summary: matchStatus.result
        ? `${matchStatus.leaderName} wins ${matchStatus.result}`
        : matchStatus.holesUp === 0
          ? 'All Square'
          : `${matchStatus.leaderName} ${matchStatus.holesUp} UP`,
    };

    return {
      summary,
      standings,
      audit,
      settlement,
    };
  },
};

// ============================================
// HELPERS
// ============================================

function buildPlayerStanding(
  playerId: PlayerId,
  playerName: string,
  matchStatus: ReturnType<typeof computeMatchStatus>,
  holesPlayed: number,
  holesRemaining: number,
  invertPerspective: boolean = false
): MatchPlayStanding {
  const isLeader = matchStatus.leaderId === playerId;
  const holesUp = invertPerspective
    ? (isLeader ? matchStatus.holesUp : -matchStatus.holesUp)
    : (isLeader ? matchStatus.holesUp : -matchStatus.holesUp);

  let matchStatusStr: MatchPlayStanding['matchStatus'];
  if (matchStatus.isClosed) {
    matchStatusStr = 'closed';
  } else if (matchStatus.status === 'dormie') {
    matchStatusStr = 'dormie';
  } else if (matchStatus.status === 'all_square') {
    matchStatusStr = 'all_square';
  } else if (isLeader) {
    matchStatusStr = 'leading';
  } else {
    matchStatusStr = 'trailing';
  }

  return {
    playerId,
    playerName,
    holesUp,
    holesPlayed,
    holesRemaining,
    matchStatus: matchStatusStr,
    result: matchStatus.result,
  };
}
