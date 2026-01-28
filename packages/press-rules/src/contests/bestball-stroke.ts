/**
 * Press! Rules Engine - Best Ball Stroke Play Contest (2v2)
 *
 * Team stroke play where each team's hole score is the best (lowest) of its players.
 * Total = sum of best balls across all holes. Lower total wins.
 */

import type {
  Round,
  ContestConfig,
  ContestResult,
  ContestHandler,
  ValidationResult,
  ContestSummary,
  StrokePlayStandings,
  StrokePlayStanding,
  ContestAudit,
  HoleAuditEntry,
  HolePlayerAudit,
  ContestSettlement,
  HoleNumber,
  PlayerId,
  Team,
} from '../types';
import { isTeamParticipants } from '../types';
import { computeHandicapStrokes, computeNetScore, StrokesPerHole } from '../handicap';
import { computeBestBallScore, getThruHole, isContestFinal, buildPlayerNameMap } from '../scoring';
import { settleTeamMatchPlay, buildSettlement, createEmptySettlement } from '../settlement';
import { validateBasicConfig, getHolesPlanned } from '../engine';

export const bestballStrokeHandler: ContestHandler = {
  type: 'bestball_stroke',

  validate(config: ContestConfig): ValidationResult {
    const basicValidation = validateBasicConfig(config);
    const errors: string[] = [...basicValidation.errors];

    if (!isTeamParticipants(config.participants)) {
      errors.push('Best Ball Stroke requires team participants');
    } else if (config.participants.length !== 2) {
      errors.push('Best Ball Stroke requires exactly 2 teams');
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

    // Compute handicap strokes
    const playerStrokes: Record<PlayerId, StrokesPerHole> = {};
    if (isNet) {
      for (const playerId of allPlayerIds) {
        const player = round.players.find((p) => p.id === playerId);
        const handicap = player?.courseHandicap ?? 0;
        playerStrokes[playerId] = computeHandicapStrokes(round.tee.strokeIndex, handicap);
      }
    }

    // Process holes
    const auditEntries: HoleAuditEntry[] = [];
    let teamATotal = 0;
    let teamBTotal = 0;
    let teamAGrossTotal = 0;
    let teamBGrossTotal = 0;
    let lastCompleteHole: HoleNumber | null = null;

    for (let hole = startHole; hole <= endHole; hole++) {
      const holeNum = hole as HoleNumber;

      // Get team best ball scores
      const teamAScores: Record<PlayerId, number | undefined> = {};
      const teamBScores: Record<PlayerId, number | undefined> = {};
      const teamAGross: Record<PlayerId, number | undefined> = {};
      const teamBGross: Record<PlayerId, number | undefined> = {};

      for (const playerId of teamA.playerIds) {
        const gross = round.grossStrokes[playerId]?.[holeNum];
        if (gross !== undefined) {
          teamAGross[playerId] = gross;
          const dots = playerStrokes[playerId]?.[holeNum] ?? 0;
          teamAScores[playerId] = isNet ? computeNetScore(gross, dots, config.handicapConfig) : gross;
        }
      }

      for (const playerId of teamB.playerIds) {
        const gross = round.grossStrokes[playerId]?.[holeNum];
        if (gross !== undefined) {
          teamBGross[playerId] = gross;
          const dots = playerStrokes[playerId]?.[holeNum] ?? 0;
          teamBScores[playerId] = isNet ? computeNetScore(gross, dots, config.handicapConfig) : gross;
        }
      }

      const bestA = computeBestBallScore(teamAScores, playerNames);
      const bestB = computeBestBallScore(teamBScores, playerNames);
      const bestAGross = computeBestBallScore(teamAGross, playerNames);
      const bestBGross = computeBestBallScore(teamBGross, playerNames);

      if (!bestA || !bestB) continue;

      teamATotal += bestA.score;
      teamBTotal += bestB.score;
      if (bestAGross) teamAGrossTotal += bestAGross.score;
      if (bestBGross) teamBGrossTotal += bestBGross.score;
      lastCompleteHole = holeNum;

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

      auditEntries.push({
        hole: holeNum,
        par: round.tee.par[holeNum],
        players: playerAudit,
        notes: `${teamAName}: ${bestA.countedPlayerName} ${bestA.score} (Total: ${teamATotal}), ${teamBName}: ${bestB.countedPlayerName} ${bestB.score} (Total: ${teamBTotal})`,
      });
    }

    // Determine status
    const thruHole = getThruHole(round, allPlayerIds, startHole, endHole);
    const isFinal = isContestFinal(thruHole, endHole);

    // Determine winner
    let winnerTeam: Team | null = null;
    let loserTeam: Team | null = null;
    const strokeDiff = Math.abs(teamATotal - teamBTotal);

    if (teamATotal < teamBTotal) {
      winnerTeam = teamA;
      loserTeam = teamB;
    } else if (teamBTotal < teamATotal) {
      winnerTeam = teamB;
      loserTeam = teamA;
    }

    // Build standings
    const standings: StrokePlayStandings = {
      type: 'stroke_play',
      standings: [
        {
          teamId: teamA.id,
          name: teamAName,
          grossTotal: teamAGrossTotal,
          netTotal: isNet ? teamATotal : undefined,
          thruHole: lastCompleteHole ?? 1,
          rank: teamATotal <= teamBTotal ? 1 : 2,
        } as StrokePlayStanding,
        {
          teamId: teamB.id,
          name: teamBName,
          grossTotal: teamBGrossTotal,
          netTotal: isNet ? teamBTotal : undefined,
          thruHole: lastCompleteHole ?? 1,
          rank: teamBTotal <= teamATotal ? 1 : 2,
        } as StrokePlayStanding,
      ].sort((a, b) => a.rank - b.rank),
    };

    // Settlement
    let settlement: ContestSettlement;
    if (isFinal && winnerTeam && loserTeam && strokeDiff > 0) {
      const entries = settleTeamMatchPlay(
        config.contestId,
        winnerTeam,
        loserTeam,
        strokeDiff, // Using stroke diff as "holes up" equivalent
        config.stakesConfig.unit,
        `${config.name}: ${winnerTeam.name ?? winnerTeam.id} wins by ${strokeDiff}`
      );
      settlement = buildSettlement(entries);
    } else {
      settlement = createEmptySettlement();
    }

    const winnerName = winnerTeam ? (winnerTeam.name ?? winnerTeam.id) : null;

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
      summary: winnerTeam
        ? `${winnerName} wins by ${strokeDiff} strokes (${teamATotal} vs ${teamBTotal})`
        : `Tied at ${teamATotal}`,
    };

    return { summary, standings, audit, settlement };
  },
};
