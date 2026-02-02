/**
 * Press! Rules Engine - High-Low-Total Contest
 *
 * High-Low-Total game for 3-4 players (individual) or 4 players in 2 teams.
 * Features:
 * - Low winner: Player with lowest net score wins 1 point (good!)
 * - High loser: Player with highest net score loses 1 point (penalty!)
 * - Total winner (team mode only): Team with lowest combined net wins 1 point
 * - Tie rules: push (default), split, or carryover
 */

import type {
  Round,
  ContestConfig,
  ContestResult,
  ContestHandler,
  ValidationResult,
  ContestSummary,
  ContestAudit,
  ContestSettlement,
  HoleNumber,
  PlayerId,
  Units,
  HoleAuditEntry,
  HolePlayerAudit,
  HighLowTotalStandings,
  HighLowTotalStanding,
  HighLowTotalHoleResult,
  HighLowTotalTieRule,
  Team,
} from '../types';
import { isPlayerParticipants, isTeamParticipants, getAllPlayerIds } from '../types';
import { computeHandicapStrokes, computeNetScore, StrokesPerHole } from '../handicap';
import { getThruHole, isContestFinal, buildPlayerNameMap } from '../scoring';
import { createLedgerEntry, buildSettlement, createEmptySettlement } from '../settlement';
import { validateBasicConfig, getHolesPlanned } from '../engine';

// ============================================
// TYPES
// ============================================

interface HLTOptions {
  tieRule: HighLowTotalTieRule;
  isTeamMode: boolean;
  pointValue: Units;
}

interface HoleScores {
  playerId: PlayerId;
  gross: number;
  net: number;
  dots: number;
}

// ============================================
// HANDLER
// ============================================

export const highLowTotalHandler: ContestHandler = {
  type: 'high_low_total',

  validate(config: ContestConfig): ValidationResult {
    const basicValidation = validateBasicConfig(config);
    const errors: string[] = [...basicValidation.errors];

    // Check participant configuration
    if (isTeamParticipants(config.participants)) {
      // Team mode: must have exactly 2 teams with 2 players each
      const teams = config.participants as Team[];
      if (teams.length !== 2) {
        errors.push('High-Low-Total team mode requires exactly 2 teams');
      }
      for (const team of teams) {
        if (team.playerIds.length !== 2) {
          errors.push('Each team must have exactly 2 players');
        }
      }
    } else if (isPlayerParticipants(config.participants)) {
      // Individual mode: must have 3-4 players
      if (config.participants.length < 3 || config.participants.length > 4) {
        errors.push('High-Low-Total requires 3-4 players in individual mode');
      }
    } else {
      errors.push('High-Low-Total requires either 3-4 players or 2 teams');
    }

    return { valid: errors.length === 0, errors };
  },

  compute(round: Round, config: ContestConfig): ContestResult {
    const holesPlanned = getHolesPlanned(round);
    const playerIds = getAllPlayerIds(config.participants);
    const playerNames = buildPlayerNameMap(round);

    // Parse options
    const options = parseOptions(config);
    const { tieRule, isTeamMode, pointValue } = options;

    // Get teams if team mode
    const teams = isTeamMode && isTeamParticipants(config.participants)
      ? config.participants as Team[]
      : undefined;

    // Get segment bounds
    const startHole: HoleNumber = 1;
    const endHole: HoleNumber = holesPlanned === 9 ? 9 : 18;

    // Compute handicap strokes for all players
    const playerStrokes: Record<PlayerId, StrokesPerHole> = {};
    for (const playerId of playerIds) {
      const player = round.players.find((p) => p.id === playerId);
      const handicap = player?.courseHandicap ?? 0;
      playerStrokes[playerId] = computeHandicapStrokes(round.tee.strokeIndex, handicap);
    }

    // Initialize point tracking
    const pointsTracker: Record<PlayerId, { low: number; high: number; total: number }> = {};
    for (const playerId of playerIds) {
      pointsTracker[playerId] = { low: 0, high: 0, total: 0 };
    }

    // Carryover tracking
    let carryover = { low: 0, high: 0, total: 0 };

    // Process each hole
    const holeResults: HighLowTotalHoleResult[] = [];
    const auditEntries: HoleAuditEntry[] = [];

    for (let hole = startHole; hole <= endHole; hole++) {
      const holeNum = hole as HoleNumber;

      // Get scores for all players
      const scores: HoleScores[] = [];
      let allHaveScores = true;

      for (const playerId of playerIds) {
        const gross = round.grossStrokes[playerId]?.[holeNum];
        if (gross === undefined) {
          allHaveScores = false;
          break;
        }

        const dots = playerStrokes[playerId][holeNum];
        const net = computeNetScore(gross, dots, config.handicapConfig);
        scores.push({ playerId, gross, net, dots });
      }

      // Skip holes without all scores
      if (!allHaveScores) {
        continue;
      }

      // Compute Low winner (lowest net)
      const lowResult = computeLowWinner(scores, tieRule, carryover.low);

      // Compute High loser (highest net)
      const highResult = computeHighLoser(scores, tieRule, carryover.high);

      // Compute Total winner (team mode only)
      let totalResult: { winnerId: PlayerId | null; points: number; carryover: number } = {
        winnerId: null,
        points: 0,
        carryover: 0,
      };
      if (isTeamMode && teams) {
        totalResult = computeTotalWinner(scores, teams, tieRule, carryover.total);
      }

      // Build hole result
      const holeResult: HighLowTotalHoleResult = {
        hole: holeNum,
        lowWinnerId: lowResult.winnerId,
        highLoserId: highResult.loserId,
        totalWinnerId: totalResult.winnerId,
        carryover: {
          low: lowResult.carryover,
          high: highResult.carryover,
          total: totalResult.carryover,
        },
      };
      holeResults.push(holeResult);

      // Update points
      if (lowResult.winnerId) {
        pointsTracker[lowResult.winnerId].low += lowResult.points;
      }
      if (highResult.loserId) {
        pointsTracker[highResult.loserId].high += highResult.points;
      }
      if (totalResult.winnerId) {
        // In team mode, both players on winning team get points
        const winningTeam = teams?.find(t =>
          t.playerIds.includes(totalResult.winnerId!)
        );
        if (winningTeam) {
          for (const pid of winningTeam.playerIds) {
            pointsTracker[pid].total += totalResult.points / 2;
          }
        }
      }

      // Update carryover
      carryover = {
        low: lowResult.carryover,
        high: highResult.carryover,
        total: totalResult.carryover,
      };

      // Build audit entry
      const playerAudit: HolePlayerAudit[] = scores.map((s) => ({
        playerId: s.playerId,
        playerName: playerNames[s.playerId] ?? s.playerId,
        gross: s.gross,
        net: s.net,
        dots: s.dots,
      }));

      const notes = buildHoleNotes(lowResult, highResult, totalResult, playerNames, isTeamMode);
      auditEntries.push({
        hole: holeNum,
        par: round.tee.par[holeNum],
        players: playerAudit,
        notes,
      });
    }

    // Determine thru hole and status
    const thruHole = getThruHole(round, playerIds, startHole, endHole);
    const isFinal = isContestFinal(thruHole, endHole);

    // Build standings
    const standings: HighLowTotalStanding[] = playerIds.map((playerId) => {
      const pts = pointsTracker[playerId];
      const netPoints = pts.low + pts.total - pts.high;
      return {
        playerId,
        playerName: playerNames[playerId] ?? playerId,
        lowPoints: pts.low,
        highPoints: pts.high,
        totalPoints: pts.total,
        netPoints,
        netValue: netPoints * pointValue,
      };
    }).sort((a, b) => b.netPoints - a.netPoints);

    const standingsResult: HighLowTotalStandings = {
      type: 'high_low_total',
      standings,
      holeResults,
      tieRule,
      isTeamMode,
      pointValue,
    };

    // Compute settlement (only if final)
    let settlement: ContestSettlement;
    if (isFinal) {
      settlement = computeSettlement(config.contestId, standings, pointValue, playerIds);
    } else {
      settlement = createEmptySettlement();
    }

    // Build summary
    const summary: ContestSummary = {
      contestId: config.contestId,
      name: config.name,
      type: config.type,
      scoringBasis: config.scoringBasis,
      stakesSummary: `${pointValue} units/point`,
      status: isFinal ? 'final' : 'live',
      thruHole,
    };

    // Build audit
    const totalPoints = standings.reduce((sum, s) => sum + Math.abs(s.netPoints), 0);
    const audit: ContestAudit = {
      holeByHole: auditEntries,
      summary: `${totalPoints} total points distributed${carryover.low + carryover.high + carryover.total > 0 ? ', carryovers pending' : ''}`,
    };

    return {
      summary,
      standings: standingsResult,
      audit,
      settlement,
    };
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseOptions(config: ContestConfig): HLTOptions {
  const options = config.options as Record<string, unknown> | undefined;
  return {
    tieRule: (options?.tieRule as HighLowTotalTieRule) ?? 'push',
    isTeamMode: (options?.isTeamMode as boolean) ?? false,
    pointValue: (config.stakesConfig.unit as Units) ?? 1,
  };
}

function computeLowWinner(
  scores: HoleScores[],
  tieRule: HighLowTotalTieRule,
  currentCarryover: number
): { winnerId: PlayerId | null; points: number; carryover: number } {
  const lowestNet = Math.min(...scores.map((s) => s.net));
  const playersWithLowest = scores.filter((s) => s.net === lowestNet);
  const pointsAtStake = 1 + currentCarryover;

  if (playersWithLowest.length === 1) {
    // Clear winner
    return {
      winnerId: playersWithLowest[0].playerId,
      points: pointsAtStake,
      carryover: 0,
    };
  }

  // Tie handling
  switch (tieRule) {
    case 'push':
      return { winnerId: null, points: 0, carryover: 0 };
    case 'split':
      // Split doesn't make sense for low - treated as push
      return { winnerId: null, points: 0, carryover: 0 };
    case 'carryover':
      return { winnerId: null, points: 0, carryover: currentCarryover + 1 };
    default:
      return { winnerId: null, points: 0, carryover: 0 };
  }
}

function computeHighLoser(
  scores: HoleScores[],
  tieRule: HighLowTotalTieRule,
  currentCarryover: number
): { loserId: PlayerId | null; points: number; carryover: number } {
  const highestNet = Math.max(...scores.map((s) => s.net));
  const playersWithHighest = scores.filter((s) => s.net === highestNet);
  const pointsAtStake = 1 + currentCarryover;

  if (playersWithHighest.length === 1) {
    // Clear loser
    return {
      loserId: playersWithHighest[0].playerId,
      points: pointsAtStake,
      carryover: 0,
    };
  }

  // Tie handling
  switch (tieRule) {
    case 'push':
      return { loserId: null, points: 0, carryover: 0 };
    case 'split':
      // Split doesn't make sense for high - treated as push
      return { loserId: null, points: 0, carryover: 0 };
    case 'carryover':
      return { loserId: null, points: 0, carryover: currentCarryover + 1 };
    default:
      return { loserId: null, points: 0, carryover: 0 };
  }
}

function computeTotalWinner(
  scores: HoleScores[],
  teams: Team[],
  tieRule: HighLowTotalTieRule,
  currentCarryover: number
): { winnerId: PlayerId | null; points: number; carryover: number } {
  // Compute team totals
  const teamTotals = teams.map((team) => {
    const teamScores = scores.filter((s) => team.playerIds.includes(s.playerId));
    const total = teamScores.reduce((sum, s) => sum + s.net, 0);
    return { team, total };
  });

  const lowestTotal = Math.min(...teamTotals.map((t) => t.total));
  const teamsWithLowest = teamTotals.filter((t) => t.total === lowestTotal);
  const pointsAtStake = 1 + currentCarryover;

  if (teamsWithLowest.length === 1) {
    // Clear winner - return first player as representative
    return {
      winnerId: teamsWithLowest[0].team.playerIds[0],
      points: pointsAtStake,
      carryover: 0,
    };
  }

  // Tie handling
  switch (tieRule) {
    case 'push':
      return { winnerId: null, points: 0, carryover: 0 };
    case 'split':
      return { winnerId: null, points: 0, carryover: 0 };
    case 'carryover':
      return { winnerId: null, points: 0, carryover: currentCarryover + 1 };
    default:
      return { winnerId: null, points: 0, carryover: 0 };
  }
}

function buildHoleNotes(
  lowResult: { winnerId: PlayerId | null; points: number },
  highResult: { loserId: PlayerId | null; points: number },
  totalResult: { winnerId: PlayerId | null; points: number },
  playerNames: Record<PlayerId, string>,
  isTeamMode: boolean
): string {
  const parts: string[] = [];

  if (lowResult.winnerId) {
    const name = playerNames[lowResult.winnerId] ?? lowResult.winnerId;
    parts.push(`L: ${name}${lowResult.points > 1 ? ` (+${lowResult.points})` : ''}`);
  } else {
    parts.push('L: push');
  }

  if (highResult.loserId) {
    const name = playerNames[highResult.loserId] ?? highResult.loserId;
    parts.push(`H: ${name}${highResult.points > 1 ? ` (-${highResult.points})` : ''}`);
  } else {
    parts.push('H: push');
  }

  if (isTeamMode) {
    if (totalResult.winnerId) {
      const name = playerNames[totalResult.winnerId] ?? totalResult.winnerId;
      parts.push(`T: ${name}'s team${totalResult.points > 1 ? ` (+${totalResult.points})` : ''}`);
    } else {
      parts.push('T: push');
    }
  }

  return parts.join(' | ');
}

function computeSettlement(
  contestId: string,
  standings: HighLowTotalStanding[],
  pointValue: Units,
  playerIds: PlayerId[]
): ContestSettlement {
  // Simple settlement: players with positive points collect from players with negative points
  const winners = standings.filter((s) => s.netPoints > 0);
  const losers = standings.filter((s) => s.netPoints < 0);

  if (winners.length === 0 || losers.length === 0) {
    return createEmptySettlement();
  }

  const entries = [];

  // Calculate total positive and negative points
  const totalWinnings = winners.reduce((sum, w) => sum + w.netValue, 0);
  const totalLosses = Math.abs(losers.reduce((sum, l) => sum + l.netValue, 0));

  // Each loser pays their share proportionally to winners
  for (const loser of losers) {
    const loserAmount = Math.abs(loser.netValue);
    for (const winner of winners) {
      // Proportion of winnings this winner gets from this loser
      const winnerShare = winner.netValue / totalWinnings;
      const payment = Math.floor(loserAmount * winnerShare);

      if (payment > 0) {
        entries.push(
          createLedgerEntry(
            contestId,
            `High-Low-Total: ${loser.playerName} to ${winner.playerName}`,
            payment,
            {
              fromPlayerId: loser.playerId,
              toPlayerId: winner.playerId,
            }
          )
        );
      }
    }
  }

  return buildSettlement(entries);
}
