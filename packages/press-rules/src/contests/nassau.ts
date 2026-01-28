/**
 * Press! Rules Engine - Nassau Contest
 *
 * Nassau: 3 separate match play bets (front 9, back 9, total 18).
 * For 9-hole rounds: front and total only (both cover 1-9).
 *
 * Features:
 * - Each segment is independent match play
 * - Manual presses via config.options.presses OR round.meta.events.presses
 * - Press ends at end of parent segment
 * - Settlement: each segment + each press settles independently
 */

import type {
  Round,
  ContestConfig,
  ContestResult,
  ContestHandler,
  ValidationResult,
  ContestSummary,
  NassauStandings,
  NassauSegmentResult,
  NassauPressResult,
  ContestAudit,
  HoleAuditEntry,
  HolePlayerAudit,
  HoleNumber,
  PlayerId,
  Team,
  Segment,
  PressConfig,
  PressEvent,
  LedgerEntry,
  Units,
} from '../types';
import { isPlayerParticipants, isTeamParticipants } from '../types';
import {
  computeHandicapStrokes,
  computeRelativeHandicaps,
  computeNetScore,
  StrokesPerHole,
} from '../handicap';
import {
  computeHoleMatchResult,
  computeMatchStatus,
  getDefaultSegments,
  getPressEndHole,
  getThruHole,
  getPlayerName,
  buildPlayerNameMap,
  computeBestBallScore,
  HoleMatchResult,
} from '../scoring';
import {
  settleMatchPlay,
  settleTeamMatchPlay,
  buildSettlement,
} from '../settlement';
import { validateBasicConfig, getHolesPlanned, getPressEvents } from '../engine';

// ============================================
// HANDLER
// ============================================

export const nassauHandler: ContestHandler = {
  type: 'nassau',

  validate(config: ContestConfig): ValidationResult {
    const basicValidation = validateBasicConfig(config);
    const errors: string[] = [...basicValidation.errors];

    // Can be 2 players or 2 teams
    if (isPlayerParticipants(config.participants)) {
      if (config.participants.length !== 2) {
        errors.push('Nassau requires exactly 2 players');
      }
    } else if (isTeamParticipants(config.participants)) {
      if (config.participants.length !== 2) {
        errors.push('Nassau requires exactly 2 teams');
      }
    } else {
      errors.push('Nassau requires either 2 players or 2 teams');
    }

    return { valid: errors.length === 0, errors };
  },

  compute(round: Round, config: ContestConfig): ContestResult {
    const holesPlanned = getHolesPlanned(round);
    const isTeamMatch = isTeamParticipants(config.participants);
    const isNet = config.scoringBasis === 'net';
    const playerNames = buildPlayerNameMap(round);

    // Get participants
    let sideA: { id: string; name: string; playerIds: PlayerId[] };
    let sideB: { id: string; name: string; playerIds: PlayerId[] };

    if (isTeamMatch) {
      const teams = config.participants as Team[];
      sideA = {
        id: teams[0].id,
        name: teams[0].name ?? `Team ${teams[0].id}`,
        playerIds: [...teams[0].playerIds],
      };
      sideB = {
        id: teams[1].id,
        name: teams[1].name ?? `Team ${teams[1].id}`,
        playerIds: [...teams[1].playerIds],
      };
    } else {
      const players = config.participants as PlayerId[];
      sideA = {
        id: players[0],
        name: getPlayerName(round, players[0]),
        playerIds: [players[0]],
      };
      sideB = {
        id: players[1],
        name: getPlayerName(round, players[1]),
        playerIds: [players[1]],
      };
    }

    const allPlayerIds = [...sideA.playerIds, ...sideB.playerIds];

    // Get segments
    const segments = config.segments ?? getDefaultSegments(holesPlanned);
    const activeSegments = segments.filter((s) => s.active);

    // Compute handicap strokes if net scoring
    const playerStrokes: Record<PlayerId, StrokesPerHole> = {};
    if (isNet) {
      // Compute relative handicaps for all players
      const handicaps: Record<PlayerId, number> = {};
      for (const playerId of allPlayerIds) {
        const player = round.players.find((p) => p.id === playerId);
        handicaps[playerId] = player?.courseHandicap ?? 0;
      }

      const useRelative = config.handicapConfig.useRelativeHandicap !== false;
      const effectiveHandicaps = useRelative
        ? computeRelativeHandicaps(handicaps)
        : handicaps;

      for (const playerId of allPlayerIds) {
        playerStrokes[playerId] = computeHandicapStrokes(
          round.tee.strokeIndex,
          effectiveHandicaps[playerId]
        );
      }
    }

    // Collect all presses (from config and from round events)
    const configPresses = config.options?.presses ?? [];
    const eventPresses = getPressEvents(round);
    const allPresses = mergePresses(configPresses, eventPresses, holesPlanned);

    // Process each segment
    const segmentResults: NassauSegmentResult[] = [];
    const auditEntriesByHole: Map<HoleNumber, HoleAuditEntry> = new Map();

    for (const segment of activeSegments) {
      const result = computeSegment(
        round,
        segment,
        sideA,
        sideB,
        isTeamMatch,
        isNet,
        playerStrokes,
        playerNames,
        config.handicapConfig,
        auditEntriesByHole
      );
      segmentResults.push(result);
    }

    // Process presses
    const pressResults: NassauPressResult[] = [];
    for (const press of allPresses) {
      const parentSegment = activeSegments.find((s) => s.id === press.parentSegment);
      if (!parentSegment) continue;

      const result = computePress(
        round,
        press,
        parentSegment,
        sideA,
        sideB,
        isTeamMatch,
        isNet,
        playerStrokes,
        playerNames,
        config.handicapConfig,
        holesPlanned
      );
      pressResults.push(result);
    }

    // Determine overall thru hole
    const maxEndHole = Math.max(...activeSegments.map((s) => s.endHole)) as HoleNumber;
    const thruHole = getThruHole(round, allPlayerIds, 1, maxEndHole);
    const allComplete = segmentResults.every((s) => s.status === 'final');
    const isFinal = allComplete && pressResults.every((p) => p.status === 'final');

    // Compute net standings per side
    const netStandingsA = computeNetStandings(sideA.id, sideA.name, segmentResults, pressResults);
    const netStandingsB = computeNetStandings(sideB.id, sideB.name, segmentResults, pressResults);

    // Build standings
    const standings: NassauStandings = {
      type: 'nassau',
      segments: segmentResults,
      presses: pressResults,
      netStandings: [netStandingsA, netStandingsB],
    };

    // Compute settlement
    const ledgerEntries: LedgerEntry[] = [];
    const segmentStakes = config.stakesConfig.segments ?? {
      front: config.stakesConfig.unit,
      back: config.stakesConfig.unit,
      total: config.stakesConfig.unit,
    };

    // Settle each segment
    for (const seg of segmentResults) {
      if (seg.status !== 'final' || seg.holesUp === 0) continue;

      const stake = segmentStakes[seg.segmentId] ?? config.stakesConfig.unit;
      const winnerId = seg.winnerId!;
      const loserId = winnerId === sideA.id ? sideB.id : sideA.id;

      if (isTeamMatch) {
        const winnerTeam = winnerId === sideA.id ? config.participants[0] as Team : config.participants[1] as Team;
        const loserTeam = loserId === sideA.id ? config.participants[0] as Team : config.participants[1] as Team;

        const entries = settleTeamMatchPlay(
          config.contestId,
          winnerTeam,
          loserTeam,
          seg.holesUp,
          stake,
          `${seg.segmentName}: ${seg.winnerName} wins ${seg.result}`
        );
        ledgerEntries.push(...entries);
      } else {
        const entries = settleMatchPlay(
          config.contestId,
          winnerId,
          loserId,
          seg.holesUp,
          stake,
          `${seg.segmentName}: ${seg.winnerName} wins ${seg.result}`
        );
        ledgerEntries.push(...entries);
      }
    }

    // Settle each press
    for (const press of pressResults) {
      if (press.status !== 'final' || press.holesUp === 0) continue;

      const winnerId = press.winnerId!;
      const loserId = winnerId === sideA.id ? sideB.id : sideA.id;

      if (isTeamMatch) {
        const winnerTeam = winnerId === sideA.id ? config.participants[0] as Team : config.participants[1] as Team;
        const loserTeam = loserId === sideA.id ? config.participants[0] as Team : config.participants[1] as Team;

        const entries = settleTeamMatchPlay(
          config.contestId,
          winnerTeam,
          loserTeam,
          press.holesUp,
          press.stake,
          `Press (${press.startHole}-${press.endHole}): ${press.winnerName} wins ${press.result}`
        );
        ledgerEntries.push(...entries);
      } else {
        const entries = settleMatchPlay(
          config.contestId,
          winnerId,
          loserId,
          press.holesUp,
          press.stake,
          `Press (${press.startHole}-${press.endHole}): ${press.winnerName} wins ${press.result}`
        );
        ledgerEntries.push(...entries);
      }
    }

    const settlement = buildSettlement(ledgerEntries);

    // Build summary
    const stakeStr = segmentStakes
      ? `Front: ${segmentStakes.front ?? 0}, Back: ${segmentStakes.back ?? 0}, Total: ${segmentStakes.total ?? 0}`
      : `${config.stakesConfig.unit} units/segment`;

    const summary: ContestSummary = {
      contestId: config.contestId,
      name: config.name,
      type: config.type,
      scoringBasis: config.scoringBasis,
      stakesSummary: stakeStr,
      status: isFinal ? 'final' : 'live',
      thruHole,
    };

    // Build audit
    const sortedAudit = Array.from(auditEntriesByHole.values()).sort((a, b) => a.hole - b.hole);
    const audit: ContestAudit = {
      holeByHole: sortedAudit,
      summary: `${segmentResults.filter((s) => s.status === 'final').length}/${activeSegments.length} segments complete, ${pressResults.length} presses`,
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

function mergePresses(
  configPresses: PressConfig[],
  eventPresses: PressEvent[],
  _holesPlanned: 9 | 18
): Array<PressConfig & { fromEvent?: boolean }> {
  const presses: Array<PressConfig & { fromEvent?: boolean }> = [...configPresses];

  for (const event of eventPresses) {
    // Convert event to config
    const startHole = event.startHole ?? ((event.initiatedOnHole + 1) as HoleNumber);
    presses.push({
      pressId: event.pressId,
      parentSegment: event.parentSegment,
      startHole,
      stake: event.stake,
      fromEvent: true,
    });
  }

  return presses;
}

function computeSegment(
  round: Round,
  segment: Segment,
  sideA: { id: string; name: string; playerIds: PlayerId[] },
  sideB: { id: string; name: string; playerIds: PlayerId[] },
  isTeamMatch: boolean,
  isNet: boolean,
  playerStrokes: Record<PlayerId, StrokesPerHole>,
  playerNames: Record<PlayerId, string>,
  handicapConfig: ContestConfig['handicapConfig'],
  auditEntriesByHole: Map<HoleNumber, HoleAuditEntry>
): NassauSegmentResult {
  const holeResults: HoleMatchResult[] = [];

  for (let hole = segment.startHole; hole <= segment.endHole; hole++) {
    const holeNum = hole as HoleNumber;

    // Get scores
    const scoreA = getScore(round, sideA.playerIds, holeNum, isNet, playerStrokes, handicapConfig, isTeamMatch);
    const scoreB = getScore(round, sideB.playerIds, holeNum, isNet, playerStrokes, handicapConfig, isTeamMatch);

    if (scoreA === null || scoreB === null) continue;

    const result = computeHoleMatchResult(
      holeNum,
      scoreA.score,
      scoreB.score,
      sideA.id,
      sideB.id,
      sideA.name,
      sideB.name
    );
    holeResults.push(result);

    // Build audit entry if not exists
    if (!auditEntriesByHole.has(holeNum)) {
      const playerAudit: HolePlayerAudit[] = [];
      for (const playerId of [...sideA.playerIds, ...sideB.playerIds]) {
        const gross = round.grossStrokes[playerId]?.[holeNum];
        if (gross !== undefined) {
          const dots = playerStrokes[playerId]?.[holeNum] ?? 0;
          playerAudit.push({
            playerId,
            playerName: playerNames[playerId] ?? playerId,
            gross,
            net: isNet ? computeNetScore(gross, dots, handicapConfig) : undefined,
            dots: isNet ? dots : undefined,
            counted: isTeamMatch
              ? (playerId === scoreA.countedPlayer || playerId === scoreB.countedPlayer)
              : true,
          });
        }
      }

      auditEntriesByHole.set(holeNum, {
        hole: holeNum,
        par: round.tee.par[holeNum],
        players: playerAudit,
        winner: result.winner ?? 'halved',
      });
    }
  }

  const totalHoles = segment.endHole - segment.startHole + 1;
  const status = computeMatchStatus(holeResults, totalHoles, sideA.id, sideB.id, sideA.name, sideB.name);

  const segmentName = segment.id === 'front' ? 'Front 9' : segment.id === 'back' ? 'Back 9' : 'Total';

  return {
    segmentId: segment.id,
    segmentName,
    startHole: segment.startHole,
    endHole: segment.endHole,
    winnerId: status.leaderId,
    winnerName: status.leaderName ?? null,
    holesUp: status.holesUp,
    result: status.result ?? (status.holesUp === 0 ? 'A/S' : `${status.holesUp} UP`),
    status: status.isClosed || holeResults.length === totalHoles ? 'final' : 'live',
    thruHole: holeResults.length > 0 ? (holeResults[holeResults.length - 1].hole) : null,
  };
}

function computePress(
  round: Round,
  press: PressConfig,
  _parentSegment: Segment,
  sideA: { id: string; name: string; playerIds: PlayerId[] },
  sideB: { id: string; name: string; playerIds: PlayerId[] },
  isTeamMatch: boolean,
  isNet: boolean,
  playerStrokes: Record<PlayerId, StrokesPerHole>,
  _playerNames: Record<PlayerId, string>,
  handicapConfig: ContestConfig['handicapConfig'],
  holesPlanned: 9 | 18
): NassauPressResult {
  const startHole = press.startHole;
  const endHole = getPressEndHole(press.parentSegment, holesPlanned);

  const holeResults: HoleMatchResult[] = [];

  for (let hole = startHole; hole <= endHole; hole++) {
    const holeNum = hole as HoleNumber;

    const scoreA = getScore(round, sideA.playerIds, holeNum, isNet, playerStrokes, handicapConfig, isTeamMatch);
    const scoreB = getScore(round, sideB.playerIds, holeNum, isNet, playerStrokes, handicapConfig, isTeamMatch);

    if (scoreA === null || scoreB === null) continue;

    const result = computeHoleMatchResult(
      holeNum,
      scoreA.score,
      scoreB.score,
      sideA.id,
      sideB.id,
      sideA.name,
      sideB.name
    );
    holeResults.push(result);
  }

  const totalHoles = endHole - startHole + 1;
  const status = computeMatchStatus(holeResults, totalHoles, sideA.id, sideB.id, sideA.name, sideB.name);

  return {
    pressId: press.pressId,
    parentSegment: press.parentSegment,
    startHole,
    endHole,
    stake: press.stake,
    winnerId: status.leaderId,
    winnerName: status.leaderName ?? null,
    holesUp: status.holesUp,
    result: status.result ?? (status.holesUp === 0 ? 'A/S' : `${status.holesUp} UP`),
    status: status.isClosed || holeResults.length === totalHoles ? 'final' : 'live',
    thruHole: holeResults.length > 0 ? (holeResults[holeResults.length - 1].hole) : null,
  };
}

function getScore(
  round: Round,
  playerIds: PlayerId[],
  hole: HoleNumber,
  isNet: boolean,
  playerStrokes: Record<PlayerId, StrokesPerHole>,
  handicapConfig: ContestConfig['handicapConfig'],
  isTeamMatch: boolean
): { score: number; countedPlayer?: PlayerId } | null {
  if (isTeamMatch) {
    // Best ball
    const scores: Record<PlayerId, number | undefined> = {};
    for (const playerId of playerIds) {
      const gross = round.grossStrokes[playerId]?.[hole];
      if (gross !== undefined) {
        const dots = playerStrokes[playerId]?.[hole] ?? 0;
        scores[playerId] = isNet ? computeNetScore(gross, dots, handicapConfig) : gross;
      }
    }

    const bestBall = computeBestBallScore(scores);
    if (!bestBall) return null;

    return { score: bestBall.score, countedPlayer: bestBall.countedPlayerId };
  } else {
    // Single player
    const playerId = playerIds[0];
    const gross = round.grossStrokes[playerId]?.[hole];
    if (gross === undefined) return null;

    const dots = playerStrokes[playerId]?.[hole] ?? 0;
    const score = isNet ? computeNetScore(gross, dots, handicapConfig) : gross;

    return { score };
  }
}

function computeNetStandings(
  id: string,
  name: string,
  segments: NassauSegmentResult[],
  presses: NassauPressResult[]
): NassauStandings['netStandings'][0] {
  let segmentsWon = 0;
  let segmentsLost = 0;
  let pressesWon = 0;
  let pressesLost = 0;
  let netUnits: Units = 0;

  for (const seg of segments) {
    if (seg.status !== 'final') continue;
    if (seg.winnerId === id) {
      segmentsWon++;
      netUnits += seg.holesUp; // Simplified - actual would use stake
    } else if (seg.winnerId !== null) {
      segmentsLost++;
      netUnits -= seg.holesUp;
    }
  }

  for (const press of presses) {
    if (press.status !== 'final') continue;
    if (press.winnerId === id) {
      pressesWon++;
      netUnits += press.stake * press.holesUp;
    } else if (press.winnerId !== null) {
      pressesLost++;
      netUnits -= press.stake * press.holesUp;
    }
  }

  return {
    id,
    name,
    segmentsWon,
    segmentsLost,
    pressesWon,
    pressesLost,
    netUnits,
  };
}
