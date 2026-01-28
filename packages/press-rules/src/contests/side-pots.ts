/**
 * Press! Rules Engine - Side Pots
 *
 * Includes: CTP, Long Drive, Birdie Pool, Snake
 * These use Round.meta.events for input data.
 */

import type {
  Round,
  ContestConfig,
  ContestResult,
  ContestHandler,
  ValidationResult,
  ContestSummary,
  SidePotStandings,
  ContestAudit,
  HoleAuditEntry,
  ContestSettlement,
  HoleNumber,
  PlayerId,
} from '../types';
import { getAllPlayerIds } from '../types';
import { buildPlayerNameMap, getThruHole, isContestFinal } from '../scoring';
import { computeHandicapStrokes, computeNetScore, StrokesPerHole } from '../handicap';
import { settlePerHolePot, settlePot, settleSnake, buildSettlement, createEmptySettlement } from '../settlement';
import { validateBasicConfig, getHolesPlanned, getCtpEvents, getLongDriveEvents, getThreePuttEvents } from '../engine';

// ============================================
// CTP HANDLER
// ============================================

export const ctpHandler: ContestHandler = {
  type: 'ctp',

  validate(config: ContestConfig): ValidationResult {
    const basicValidation = validateBasicConfig(config);
    return { valid: basicValidation.errors.length === 0, errors: basicValidation.errors };
  },

  compute(round: Round, config: ContestConfig): ContestResult {
    const playerIds = getAllPlayerIds(config.participants);
    const playerNames = buildPlayerNameMap(round);
    const ctpEvents = getCtpEvents(round);

    const designatedHoles = config.options?.designatedHoles ?? [];
    const perHoleValue = config.stakesConfig.unit;
    const potTotal = config.stakesConfig.potTotal;

    // Collect winners
    const holeWinners: Record<number, PlayerId> = {};
    const holeResults: SidePotStandings['holeResults'] = [];
    const winsPerPlayer: Record<PlayerId, number> = {};

    for (const id of playerIds) {
      winsPerPlayer[id] = 0;
    }

    for (const event of ctpEvents) {
      // Only count if designated hole (or no designation means all par 3s)
      if (designatedHoles.length > 0 && !designatedHoles.includes(event.hole)) {
        continue;
      }

      holeWinners[event.hole] = event.winnerPlayerId;
      winsPerPlayer[event.winnerPlayerId] = (winsPerPlayer[event.winnerPlayerId] ?? 0) + 1;

      holeResults.push({
        hole: event.hole,
        winnerId: event.winnerPlayerId,
        winnerName: playerNames[event.winnerPlayerId] ?? event.winnerPlayerId,
        value: perHoleValue,
        details: event.distanceFt ? `${event.distanceFt} ft` : undefined,
      });
    }

    // Determine status (final if all designated holes have results)
    const expectedHoles = designatedHoles.length || ctpEvents.length;
    const completedHoles = Object.keys(holeWinners).length;
    const isFinal = completedHoles >= expectedHoles && expectedHoles > 0;

    // Build standings
    const standings: SidePotStandings = {
      type: 'side_pot',
      potType: 'ctp',
      standings: playerIds.map((playerId) => ({
        playerId,
        playerName: playerNames[playerId] ?? playerId,
        wins: winsPerPlayer[playerId] ?? 0,
        totalWinnings: (winsPerPlayer[playerId] ?? 0) * perHoleValue * (playerIds.length - 1),
      })).sort((a, b) => b.wins - a.wins),
      potTotal: potTotal ?? perHoleValue * completedHoles,
      holeResults,
    };

    // Settlement
    let settlement: ContestSettlement;
    if (isFinal && completedHoles > 0) {
      const entries = settlePerHolePot(config.contestId, perHoleValue, holeWinners, playerIds, 'CTP');
      settlement = buildSettlement(entries);
    } else {
      settlement = createEmptySettlement();
    }

    const summary: ContestSummary = {
      contestId: config.contestId,
      name: config.name,
      type: 'ctp',
      scoringBasis: 'gross',
      stakesSummary: `${perHoleValue} units/hole`,
      status: isFinal ? 'final' : 'live',
      thruHole: holeResults.length > 0 ? Math.max(...holeResults.map((r) => r.hole)) as HoleNumber : null,
    };

    const audit: ContestAudit = {
      holeByHole: holeResults.map((r) => ({
        hole: r.hole,
        par: round.tee.par[r.hole],
        players: [],
        winner: r.winnerId ?? undefined,
        notes: r.details ? `${r.winnerName}: ${r.details}` : r.winnerName ?? undefined,
      })),
      summary: `${completedHoles} CTP winners`,
    };

    return { summary, standings, audit, settlement };
  },
};

// ============================================
// LONG DRIVE HANDLER
// ============================================

export const longDriveHandler: ContestHandler = {
  type: 'long_drive',

  validate(config: ContestConfig): ValidationResult {
    const basicValidation = validateBasicConfig(config);
    return { valid: basicValidation.errors.length === 0, errors: basicValidation.errors };
  },

  compute(round: Round, config: ContestConfig): ContestResult {
    const playerIds = getAllPlayerIds(config.participants);
    const playerNames = buildPlayerNameMap(round);
    const events = getLongDriveEvents(round);

    const designatedHoles = config.options?.designatedHoles ?? [];
    const perHoleValue = config.stakesConfig.unit;

    // Collect winners
    const holeWinners: Record<number, PlayerId> = {};
    const holeResults: SidePotStandings['holeResults'] = [];
    const winsPerPlayer: Record<PlayerId, number> = {};

    for (const id of playerIds) {
      winsPerPlayer[id] = 0;
    }

    for (const event of events) {
      if (designatedHoles.length > 0 && !designatedHoles.includes(event.hole)) {
        continue;
      }

      holeWinners[event.hole] = event.winnerPlayerId;
      winsPerPlayer[event.winnerPlayerId] = (winsPerPlayer[event.winnerPlayerId] ?? 0) + 1;

      holeResults.push({
        hole: event.hole,
        winnerId: event.winnerPlayerId,
        winnerName: playerNames[event.winnerPlayerId] ?? event.winnerPlayerId,
        value: perHoleValue,
        details: event.distanceYds ? `${event.distanceYds} yds` : undefined,
      });
    }

    const expectedHoles = designatedHoles.length || events.length;
    const completedHoles = Object.keys(holeWinners).length;
    const isFinal = completedHoles >= expectedHoles && expectedHoles > 0;

    const standings: SidePotStandings = {
      type: 'side_pot',
      potType: 'long_drive',
      standings: playerIds.map((playerId) => ({
        playerId,
        playerName: playerNames[playerId] ?? playerId,
        wins: winsPerPlayer[playerId] ?? 0,
        totalWinnings: (winsPerPlayer[playerId] ?? 0) * perHoleValue * (playerIds.length - 1),
      })).sort((a, b) => b.wins - a.wins),
      potTotal: perHoleValue * completedHoles,
      holeResults,
    };

    let settlement: ContestSettlement;
    if (isFinal && completedHoles > 0) {
      const entries = settlePerHolePot(config.contestId, perHoleValue, holeWinners, playerIds, 'Long Drive');
      settlement = buildSettlement(entries);
    } else {
      settlement = createEmptySettlement();
    }

    const summary: ContestSummary = {
      contestId: config.contestId,
      name: config.name,
      type: 'long_drive',
      scoringBasis: 'gross',
      stakesSummary: `${perHoleValue} units/hole`,
      status: isFinal ? 'final' : 'live',
      thruHole: holeResults.length > 0 ? Math.max(...holeResults.map((r) => r.hole)) as HoleNumber : null,
    };

    const audit: ContestAudit = {
      holeByHole: holeResults.map((r) => ({
        hole: r.hole,
        par: round.tee.par[r.hole],
        players: [],
        winner: r.winnerId ?? undefined,
        notes: r.details ? `${r.winnerName}: ${r.details}` : r.winnerName ?? undefined,
      })),
      summary: `${completedHoles} Long Drive winners`,
    };

    return { summary, standings, audit, settlement };
  },
};

// ============================================
// BIRDIE POOL HANDLER
// ============================================

export const birdiePoolHandler: ContestHandler = {
  type: 'birdie_pool',

  validate(config: ContestConfig): ValidationResult {
    const basicValidation = validateBasicConfig(config);
    return { valid: basicValidation.errors.length === 0, errors: basicValidation.errors };
  },

  compute(round: Round, config: ContestConfig): ContestResult {
    const holesPlanned = getHolesPlanned(round);
    const playerIds = getAllPlayerIds(config.participants);
    const playerNames = buildPlayerNameMap(round);
    const isNet = config.scoringBasis === 'net';

    const startHole: HoleNumber = 1;
    const endHole: HoleNumber = holesPlanned === 9 ? 9 : 18;

    const perPlayerBuyIn = config.options?.perPlayerBuyIn ?? config.stakesConfig.unit;
    const potTotal = config.stakesConfig.potTotal ?? perPlayerBuyIn * playerIds.length;

    // Compute handicap strokes if net
    const playerStrokes: Record<PlayerId, StrokesPerHole> = {};
    if (isNet) {
      for (const playerId of playerIds) {
        const player = round.players.find((p) => p.id === playerId);
        const handicap = player?.courseHandicap ?? 0;
        playerStrokes[playerId] = computeHandicapStrokes(round.tee.strokeIndex, handicap);
      }
    }

    // Count birdies (score < par)
    const birdiesPerPlayer: Record<PlayerId, number> = {};
    const auditEntries: HoleAuditEntry[] = [];

    for (const id of playerIds) {
      birdiesPerPlayer[id] = 0;
    }

    for (let hole = startHole; hole <= endHole; hole++) {
      const holeNum = hole as HoleNumber;
      const par = round.tee.par[holeNum];
      const birdieWinners: PlayerId[] = [];

      for (const playerId of playerIds) {
        const gross = round.grossStrokes[playerId]?.[holeNum];
        if (gross === undefined) continue;

        const dots = playerStrokes[playerId]?.[holeNum] ?? 0;
        const score = isNet ? computeNetScore(gross, dots, config.handicapConfig) : gross;

        if (score < par) {
          birdiesPerPlayer[playerId]++;
          birdieWinners.push(playerId);
        }
      }

      if (birdieWinners.length > 0) {
        auditEntries.push({
          hole: holeNum,
          par,
          players: [],
          winner: birdieWinners.length === 1 ? birdieWinners[0] : birdieWinners,
          notes: `Birdies: ${birdieWinners.map((id) => playerNames[id] ?? id).join(', ')}`,
        });
      }
    }

    // Determine status
    const thruHole = getThruHole(round, playerIds, startHole, endHole);
    const isFinal = isContestFinal(thruHole, endHole);

    // Calculate total birdies
    const totalBirdies = Object.values(birdiesPerPlayer).reduce((sum, count) => sum + count, 0);

    // Calculate winnings (pot split among birdie-makers proportionally)
    const perBirdie = totalBirdies > 0 ? Math.floor(potTotal / totalBirdies) : 0;

    const standings: SidePotStandings = {
      type: 'side_pot',
      potType: 'birdie_pool',
      standings: playerIds.map((playerId) => ({
        playerId,
        playerName: playerNames[playerId] ?? playerId,
        wins: birdiesPerPlayer[playerId] ?? 0,
        totalWinnings: (birdiesPerPlayer[playerId] ?? 0) * perBirdie,
      })).sort((a, b) => b.wins - a.wins),
      potTotal,
    };

    // Settlement
    let settlement: ContestSettlement;
    if (isFinal && totalBirdies > 0) {
      const birdieWinnerIds = playerIds.filter((id) => birdiesPerPlayer[id] > 0);
      const entries = settlePot(
        config.contestId,
        potTotal,
        birdieWinnerIds,
        playerIds,
        'Birdie Pool'
      );
      settlement = buildSettlement(entries);
    } else {
      settlement = createEmptySettlement();
    }

    const summary: ContestSummary = {
      contestId: config.contestId,
      name: config.name,
      type: 'birdie_pool',
      scoringBasis: config.scoringBasis,
      stakesSummary: `${potTotal} unit pot`,
      status: isFinal ? 'final' : 'live',
      thruHole,
    };

    const audit: ContestAudit = {
      holeByHole: auditEntries,
      summary: `${totalBirdies} birdies made, pot = ${potTotal} units`,
    };

    return { summary, standings, audit, settlement };
  },
};

// ============================================
// SNAKE HANDLER
// ============================================

export const snakeHandler: ContestHandler = {
  type: 'snake',

  validate(config: ContestConfig): ValidationResult {
    const basicValidation = validateBasicConfig(config);
    return { valid: basicValidation.errors.length === 0, errors: basicValidation.errors };
  },

  compute(round: Round, config: ContestConfig): ContestResult {
    const holesPlanned = getHolesPlanned(round);
    const playerIds = getAllPlayerIds(config.participants);
    const playerNames = buildPlayerNameMap(round);
    const threePutts = getThreePuttEvents(round);

    const potTotal = config.stakesConfig.potTotal ?? config.stakesConfig.unit * playerIds.length;

    const startHole: HoleNumber = 1;
    const endHole: HoleNumber = holesPlanned === 9 ? 9 : 18;

    // Track snake holder per hole
    let currentHolder: PlayerId | null = null;
    const threePuttsPerPlayer: Record<PlayerId, number> = {};
    const auditEntries: HoleAuditEntry[] = [];

    for (const id of playerIds) {
      threePuttsPerPlayer[id] = 0;
    }

    // Sort three-putts by hole
    const sortedPutts = [...threePutts].sort((a, b) => a.hole - b.hole);

    for (const event of sortedPutts) {
      currentHolder = event.playerId;
      threePuttsPerPlayer[event.playerId]++;

      auditEntries.push({
        hole: event.hole,
        par: round.tee.par[event.hole],
        players: [],
        winner: event.playerId, // "winner" of snake = person who holds it
        notes: `${playerNames[event.playerId] ?? event.playerId} 3-putted (holds snake)`,
      });
    }

    // Determine status
    const thruHole = getThruHole(round, playerIds, startHole, endHole);
    const isFinal = isContestFinal(thruHole, endHole);

    const standings: SidePotStandings = {
      type: 'side_pot',
      potType: 'snake',
      standings: playerIds.map((playerId) => ({
        playerId,
        playerName: playerNames[playerId] ?? playerId,
        wins: threePuttsPerPlayer[playerId] ?? 0,
        isHolding: playerId === currentHolder,
        totalWinnings: isFinal && playerId === currentHolder ? -potTotal : 0,
      })).sort((a, b) => {
        // Holder at bottom
        if (a.isHolding) return 1;
        if (b.isHolding) return -1;
        return a.wins - b.wins;
      }),
      potTotal,
    };

    // Settlement - holder pays everyone else
    let settlement: ContestSettlement;
    if (isFinal && currentHolder) {
      const entries = settleSnake(config.contestId, currentHolder, potTotal, playerIds);
      settlement = buildSettlement(entries);
    } else {
      settlement = createEmptySettlement();
    }

    const holderName = currentHolder ? (playerNames[currentHolder] ?? currentHolder) : 'No one';

    const summary: ContestSummary = {
      contestId: config.contestId,
      name: config.name,
      type: 'snake',
      scoringBasis: 'gross',
      stakesSummary: `${potTotal} unit pot`,
      status: isFinal ? 'final' : 'live',
      thruHole,
    };

    const audit: ContestAudit = {
      holeByHole: auditEntries,
      summary: currentHolder
        ? `${holderName} holds the snake (${threePuttsPerPlayer[currentHolder]} 3-putts)`
        : 'No three-putts yet',
    };

    return { summary, standings, audit, settlement };
  },
};
