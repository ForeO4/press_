/**
 * Press! Rules Engine - Best Ball Match Play Contest (2v2)
 *
 * Team match play where each team's hole score is the best (lowest) of its players.
 */

import type {
  Round,
  ContestConfig,
  ContestResult,
  ContestHandler,
  ValidationResult,
  ContestSummary,
  TeamMatchPlayStandings,
  TeamMatchPlayStanding,
  ContestAudit,
  HoleAuditEntry,
  HolePlayerAudit,
  ContestSettlement,
  HoleNumber,
  PlayerId,
  Team,
} from '../types';
import { isTeamParticipants } from '../types';
import { computeHandicapStrokes, computeRelativeHandicaps, computeNetScore, StrokesPerHole } from '../handicap';
import {
  computeHoleMatchResult,
  computeMatchStatus,
  computeBestBallScore,
  getThruHole,
  isContestFinal,
  buildPlayerNameMap,
  HoleMatchResult,
} from '../scoring';
import { settleTeamMatchPlay, buildSettlement, createEmptySettlement } from '../settlement';
import { validateBasicConfig, getHolesPlanned } from '../engine';

export const matchPlayBestballHandler: ContestHandler = {
  type: 'match_play_bestball',

  validate(config: ContestConfig): ValidationResult {
    const basicValidation = validateBasicConfig(config);
    const errors: string[] = [...basicValidation.errors];

    if (!isTeamParticipants(config.participants)) {
      errors.push('Best Ball Match Play requires team participants');
    } else if (config.participants.length !== 2) {
      errors.push('Best Ball Match Play requires exactly 2 teams');
    }

    return { valid: errors.length === 0, errors };
  },

  compute(round: Round, config: ContestConfig): ContestResult {
    const holesPlanned = getHolesPlanned(round);
    const teams = config.participants as Team[];
    const teamA = teams[0];
    const teamB = teams[1];
    const teamAName = teamA.name ?? `Team ${teamA.id}`;
    const teamBName = teamB.name ?? `Team ${teamB.id}`;

    const allPlayerIds = [...teamA.playerIds, ...teamB.playerIds];
    const playerNames = buildPlayerNameMap(round);
    const isNet = config.scoringBasis === 'net';

    const startHole: HoleNumber = 1;
    const endHole: HoleNumber = holesPlanned === 9 ? 9 : 18;
    const totalHoles = endHole - startHole + 1;

    // Compute handicap strokes
    const playerStrokes: Record<PlayerId, StrokesPerHole> = {};
    if (isNet) {
      const handicaps: Record<PlayerId, number> = {};
      for (const playerId of allPlayerIds) {
        const player = round.players.find((p) => p.id === playerId);
        handicaps[playerId] = player?.courseHandicap ?? 0;
      }

      const useRelative = config.handicapConfig.useRelativeHandicap !== false;
      const effective = useRelative ? computeRelativeHandicaps(handicaps) : handicaps;

      for (const playerId of allPlayerIds) {
        playerStrokes[playerId] = computeHandicapStrokes(round.tee.strokeIndex, effective[playerId]);
      }
    }

    // Process holes
    const holeResults: HoleMatchResult[] = [];
    const auditEntries: HoleAuditEntry[] = [];

    for (let hole = startHole; hole <= endHole; hole++) {
      const holeNum = hole as HoleNumber;

      // Get team best ball scores
      const teamAScores: Record<PlayerId, number | undefined> = {};
      const teamBScores: Record<PlayerId, number | undefined> = {};

      for (const playerId of teamA.playerIds) {
        const gross = round.grossStrokes[playerId]?.[holeNum];
        if (gross !== undefined) {
          const dots = playerStrokes[playerId]?.[holeNum] ?? 0;
          teamAScores[playerId] = isNet ? computeNetScore(gross, dots, config.handicapConfig) : gross;
        }
      }

      for (const playerId of teamB.playerIds) {
        const gross = round.grossStrokes[playerId]?.[holeNum];
        if (gross !== undefined) {
          const dots = playerStrokes[playerId]?.[holeNum] ?? 0;
          teamBScores[playerId] = isNet ? computeNetScore(gross, dots, config.handicapConfig) : gross;
        }
      }

      const bestA = computeBestBallScore(teamAScores, playerNames);
      const bestB = computeBestBallScore(teamBScores, playerNames);

      if (!bestA || !bestB) continue;

      const result = computeHoleMatchResult(holeNum, bestA.score, bestB.score, teamA.id, teamB.id, teamAName, teamBName);
      holeResults.push(result);

      // Build audit
      const playerAudit: HolePlayerAudit[] = [];
      for (const playerId of allPlayerIds) {
        const gross = round.grossStrokes[playerId]?.[holeNum];
        if (gross !== undefined) {
          const dots = playerStrokes[playerId]?.[holeNum] ?? 0;
          const isTeamA = teamA.playerIds.includes(playerId);
          const counted = isTeamA
            ? playerId === bestA.countedPlayerId
            : playerId === bestB.countedPlayerId;

          playerAudit.push({
            playerId,
            playerName: playerNames[playerId] ?? playerId,
            gross,
            net: isNet ? computeNetScore(gross, dots, config.handicapConfig) : undefined,
            dots: isNet ? dots : undefined,
            counted,
          });
        }
      }

      const status = computeMatchStatus(holeResults, totalHoles, teamA.id, teamB.id, teamAName, teamBName);

      auditEntries.push({
        hole: holeNum,
        par: round.tee.par[holeNum],
        players: playerAudit,
        winner: result.winner ?? 'halved',
        matchState: status.holesUp === 0 ? 'A/S' : `${status.leaderName} ${status.holesUp} UP`,
        notes: `${teamAName}: ${bestA.countedPlayerName} ${bestA.score}, ${teamBName}: ${bestB.countedPlayerName} ${bestB.score}`,
      });

      if (status.isClosed) break;
    }

    // Final status
    const matchStatus = computeMatchStatus(holeResults, totalHoles, teamA.id, teamB.id, teamAName, teamBName);
    const thruHole = getThruHole(round, allPlayerIds, startHole, endHole);
    const isFinal = isContestFinal(thruHole, endHole, matchStatus.isClosed);

    // Build standings
    const standings: TeamMatchPlayStandings = {
      type: 'team_match_play',
      standings: [
        buildTeamStanding(teamA, teamAName, matchStatus, holeResults.length, totalHoles - holeResults.length),
        buildTeamStanding(teamB, teamBName, matchStatus, holeResults.length, totalHoles - holeResults.length, true),
      ],
    };

    // Settlement
    let settlement: ContestSettlement;
    if (isFinal && matchStatus.leaderId && matchStatus.holesUp > 0) {
      const winnerTeam = matchStatus.leaderId === teamA.id ? teamA : teamB;
      const loserTeam = matchStatus.leaderId === teamA.id ? teamB : teamA;

      const entries = settleTeamMatchPlay(
        config.contestId,
        winnerTeam,
        loserTeam,
        matchStatus.holesUp,
        config.stakesConfig.unit,
        `${config.name}: ${matchStatus.leaderName} wins ${matchStatus.result ?? `${matchStatus.holesUp} UP`}`
      );
      settlement = buildSettlement(entries);
    } else {
      settlement = createEmptySettlement();
    }

    const summary: ContestSummary = {
      contestId: config.contestId,
      name: config.name,
      type: config.type,
      scoringBasis: config.scoringBasis,
      stakesSummary: `${config.stakesConfig.unit} units/hole`,
      status: isFinal ? 'final' : 'live',
      thruHole,
    };

    const audit: ContestAudit = {
      holeByHole: auditEntries,
      summary: matchStatus.result
        ? `${matchStatus.leaderName} wins ${matchStatus.result}`
        : matchStatus.holesUp === 0 ? 'All Square' : `${matchStatus.leaderName} ${matchStatus.holesUp} UP`,
    };

    return { summary, standings, audit, settlement };
  },
};

function buildTeamStanding(
  team: Team,
  teamName: string,
  matchStatus: ReturnType<typeof computeMatchStatus>,
  holesPlayed: number,
  holesRemaining: number,
  invert: boolean = false
): TeamMatchPlayStanding {
  const isLeader = matchStatus.leaderId === team.id;
  const holesUp = invert ? (isLeader ? matchStatus.holesUp : -matchStatus.holesUp) : (isLeader ? matchStatus.holesUp : -matchStatus.holesUp);

  let status: TeamMatchPlayStanding['matchStatus'];
  if (matchStatus.isClosed) status = 'closed';
  else if (matchStatus.status === 'dormie') status = 'dormie';
  else if (matchStatus.status === 'all_square') status = 'all_square';
  else if (isLeader) status = 'leading';
  else status = 'trailing';

  return {
    teamId: team.id,
    teamName,
    playerIds: [...team.playerIds],
    holesUp,
    holesPlayed,
    holesRemaining,
    matchStatus: status,
    result: matchStatus.result,
  };
}
