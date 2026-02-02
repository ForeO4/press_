'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { HoleSnapshot } from '@/types';
import type { ScorecardPlayer, HoleIndicator, GameStanding } from '../types';

interface NassauOverlayProps {
  players: ScorecardPlayer[];
  holes: HoleSnapshot[];
  startHole: number;
  endHole: number;
  stakePerBet: number;
  scoringBasis: 'net' | 'gross';
}

interface MatchStatus {
  holesUp: number; // Positive = Player A up, Negative = Player B up
  holesPlayed: number;
  description: string; // e.g., "2 Up", "All Square", "1 Down"
}

interface NassauHoleResult {
  hole: number;
  winnerId: string | null;
  loserId: string | null;
  isTie: boolean;
}

interface NassauComputationResult {
  holeResults: NassauHoleResult[];
  indicators: Map<number, HoleIndicator[]>;
  standings: GameStanding[];
  frontStatus: MatchStatus;
  backStatus: MatchStatus;
  overallStatus: MatchStatus;
  playerA: ScorecardPlayer;
  playerB: ScorecardPlayer;
}

function formatMatchStatus(holesUp: number, playerAName: string, playerBName: string): string {
  if (holesUp === 0) return 'All Square';
  if (holesUp > 0) return `${playerAName} ${holesUp} Up`;
  return `${playerBName} ${Math.abs(holesUp)} Up`;
}

function getStatusColor(holesUp: number, isPlayerA: boolean): string {
  if (holesUp === 0) return 'text-slate-500';
  if ((holesUp > 0 && isPlayerA) || (holesUp < 0 && !isPlayerA)) {
    return 'text-green-600 dark:text-green-400';
  }
  return 'text-red-600 dark:text-red-400';
}

export function useNassauComputation({
  players,
  holes,
  startHole,
  endHole,
  stakePerBet,
  scoringBasis,
}: NassauOverlayProps): NassauComputationResult {
  return useMemo(() => {
    // Nassau requires exactly 2 players
    const playerA = players[0];
    const playerB = players[1];

    if (!playerA || !playerB) {
      return {
        holeResults: [],
        indicators: new Map(),
        standings: [],
        frontStatus: { holesUp: 0, holesPlayed: 0, description: 'All Square' },
        backStatus: { holesUp: 0, holesPlayed: 0, description: 'All Square' },
        overallStatus: { holesUp: 0, holesPlayed: 0, description: 'All Square' },
        playerA: players[0] || { id: '', name: '', scores: [], handicap: 0 },
        playerB: players[1] || { id: '', name: '', scores: [], handicap: 0 },
      };
    }

    const holeResults: NassauHoleResult[] = [];
    const indicators = new Map<number, HoleIndicator[]>();

    // Track match play status for each segment
    let frontHolesUp = 0;
    let frontHolesPlayed = 0;
    let backHolesUp = 0;
    let backHolesPlayed = 0;

    // Process each hole
    for (let holeNum = startHole; holeNum <= endHole; holeNum++) {
      const hole = holes.find((h) => h.number === holeNum);
      if (!hole) continue;

      // Get scores for both players
      const scoreA = playerA.scores.find((s) => s.holeNumber === holeNum);
      const scoreB = playerB.scores.find((s) => s.holeNumber === holeNum);

      if (!scoreA || !scoreB) continue;

      // Calculate net scores if needed
      let netA = scoreA.strokes;
      let netB = scoreB.strokes;

      if (scoringBasis === 'net') {
        const getsStrokeA = hole.handicap <= playerA.handicap;
        const getsStrokeB = hole.handicap <= playerB.handicap;
        netA = getsStrokeA ? scoreA.strokes - 1 : scoreA.strokes;
        netB = getsStrokeB ? scoreB.strokes - 1 : scoreB.strokes;
      }

      // Determine hole winner
      const holeIndicators: HoleIndicator[] = [];
      let winnerId: string | null = null;
      let loserId: string | null = null;
      const isTie = netA === netB;

      if (netA < netB) {
        winnerId = playerA.id;
        loserId = playerB.id;
        holeIndicators.push({
          playerId: playerA.id,
          type: 'win',
          label: 'W',
        });
        holeIndicators.push({
          playerId: playerB.id,
          type: 'loss',
          label: 'L',
        });
      } else if (netB < netA) {
        winnerId = playerB.id;
        loserId = playerA.id;
        holeIndicators.push({
          playerId: playerB.id,
          type: 'win',
          label: 'W',
        });
        holeIndicators.push({
          playerId: playerA.id,
          type: 'loss',
          label: 'L',
        });
      } else {
        // Tie
        holeIndicators.push({
          playerId: playerA.id,
          type: 'tie',
          label: '-',
        });
        holeIndicators.push({
          playerId: playerB.id,
          type: 'tie',
          label: '-',
        });
      }

      holeResults.push({
        hole: holeNum,
        winnerId,
        loserId,
        isTie,
      });

      indicators.set(holeNum, holeIndicators);

      // Update match status
      const holeResult = winnerId === playerA.id ? 1 : winnerId === playerB.id ? -1 : 0;

      if (holeNum <= 9) {
        frontHolesUp += holeResult;
        frontHolesPlayed++;
      } else {
        backHolesUp += holeResult;
        backHolesPlayed++;
      }
    }

    // Calculate overall status
    const overallHolesUp = frontHolesUp + backHolesUp;
    const overallHolesPlayed = frontHolesPlayed + backHolesPlayed;

    // Create status objects
    const frontStatus: MatchStatus = {
      holesUp: frontHolesUp,
      holesPlayed: frontHolesPlayed,
      description: formatMatchStatus(frontHolesUp, playerA.name.split(' ')[0], playerB.name.split(' ')[0]),
    };

    const backStatus: MatchStatus = {
      holesUp: backHolesUp,
      holesPlayed: backHolesPlayed,
      description: formatMatchStatus(backHolesUp, playerA.name.split(' ')[0], playerB.name.split(' ')[0]),
    };

    const overallStatus: MatchStatus = {
      holesUp: overallHolesUp,
      holesPlayed: overallHolesPlayed,
      description: formatMatchStatus(overallHolesUp, playerA.name.split(' ')[0], playerB.name.split(' ')[0]),
    };

    // Calculate standings
    // For Nassau: each bet is worth stakePerBet
    // Front 9 bet: winner is who has more holes up on front 9
    // Back 9 bet: winner is who has more holes up on back 9
    // Overall bet: winner is who has more holes up overall

    let playerABets = 0;
    let playerBBets = 0;

    if (frontStatus.holesUp > 0) playerABets++;
    else if (frontStatus.holesUp < 0) playerBBets++;

    if (backStatus.holesUp > 0) playerABets++;
    else if (backStatus.holesUp < 0) playerBBets++;

    if (overallStatus.holesUp > 0) playerABets++;
    else if (overallStatus.holesUp < 0) playerBBets++;

    const playerAValue = (playerABets - playerBBets) * stakePerBet;
    const playerBValue = -playerAValue;

    const standings: GameStanding[] = [
      {
        playerId: playerA.id,
        playerName: playerA.name,
        points: playerABets,
        value: playerAValue,
        breakdown: {
          front: frontStatus.holesUp > 0 ? 1 : frontStatus.holesUp < 0 ? -1 : 0,
          back: backStatus.holesUp > 0 ? 1 : backStatus.holesUp < 0 ? -1 : 0,
          overall: overallStatus.holesUp > 0 ? 1 : overallStatus.holesUp < 0 ? -1 : 0,
        },
      },
      {
        playerId: playerB.id,
        playerName: playerB.name,
        points: playerBBets,
        value: playerBValue,
        breakdown: {
          front: frontStatus.holesUp < 0 ? 1 : frontStatus.holesUp > 0 ? -1 : 0,
          back: backStatus.holesUp < 0 ? 1 : backStatus.holesUp > 0 ? -1 : 0,
          overall: overallStatus.holesUp < 0 ? 1 : overallStatus.holesUp > 0 ? -1 : 0,
        },
      },
    ].sort((a, b) => b.value - a.value);

    return {
      holeResults,
      indicators,
      standings,
      frontStatus,
      backStatus,
      overallStatus,
      playerA,
      playerB,
    };
  }, [players, holes, startHole, endHole, stakePerBet, scoringBasis]);
}

interface NassauStatusSummaryProps {
  frontStatus: MatchStatus;
  backStatus: MatchStatus;
  overallStatus: MatchStatus;
  playerA: ScorecardPlayer;
  playerB: ScorecardPlayer;
  stakePerBet: number;
  standings: GameStanding[];
}

export function NassauStatusSummary({
  frontStatus,
  backStatus,
  overallStatus,
  playerA,
  playerB,
  stakePerBet,
  standings,
}: NassauStatusSummaryProps) {
  const playerAFirst = playerA.name.split(' ')[0];
  const playerBFirst = playerB.name.split(' ')[0];

  const getBetResult = (holesUp: number) => {
    if (holesUp === 0) return { winner: 'Push', color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800/50' };
    if (holesUp > 0) return { winner: playerAFirst, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' };
    return { winner: playerBFirst, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' };
  };

  const frontResult = getBetResult(frontStatus.holesUp);
  const backResult = getBetResult(backStatus.holesUp);
  const overallResult = getBetResult(overallStatus.holesUp);

  return (
    <div className="rounded-xl border border-blue-200/50 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 via-white to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/20 p-5 shadow-xl">
      <div className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-widest font-medium mb-4 text-center">
        Nassau Status
      </div>

      {/* Three-column bet status */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Front 9 */}
        <div className={cn('rounded-lg p-3 text-center', frontResult.bg, 'border border-slate-200/50 dark:border-slate-700/30')}>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Front 9</div>
          <div className={cn('text-lg font-bold', frontResult.color)}>
            {frontStatus.description}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {frontStatus.holesPlayed} / 9 holes
          </div>
        </div>

        {/* Back 9 */}
        <div className={cn('rounded-lg p-3 text-center', backResult.bg, 'border border-slate-200/50 dark:border-slate-700/30')}>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Back 9</div>
          <div className={cn('text-lg font-bold', backResult.color)}>
            {backStatus.description}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {backStatus.holesPlayed} / 9 holes
          </div>
        </div>

        {/* Overall */}
        <div className={cn('rounded-lg p-3 text-center', overallResult.bg, 'border border-slate-200/50 dark:border-slate-700/30')}>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Overall</div>
          <div className={cn('text-lg font-bold', overallResult.color)}>
            {overallStatus.description}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {overallStatus.holesPlayed} / 18 holes
          </div>
        </div>
      </div>

      {/* Player standings */}
      <div className="space-y-3">
        {standings.map((standing, index) => {
          const breakdown = standing.breakdown || {};
          const betsWon = Object.values(breakdown).filter(v => v === 1).length;
          const betsLost = Object.values(breakdown).filter(v => v === -1).length;

          return (
            <div
              key={standing.playerId}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                standing.value > 0 && 'bg-green-100/50 dark:bg-green-900/20 border border-green-300/50 dark:border-green-700/30',
                standing.value < 0 && 'bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/20',
                standing.value === 0 && 'bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30'
              )}
            >
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200">{standing.playerName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex gap-2 mt-1">
                  <span className="text-green-600 dark:text-green-400">{betsWon} won</span>
                  <span className="text-red-600 dark:text-red-400">{betsLost} lost</span>
                  <span className="text-slate-400">{3 - betsWon - betsLost} push</span>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    'text-xl font-black',
                    standing.value > 0 && 'text-green-600 dark:text-green-400',
                    standing.value < 0 && 'text-red-600 dark:text-red-400',
                    standing.value === 0 && 'text-slate-400'
                  )}
                >
                  {standing.value >= 0 ? '+' : ''}{standing.value}
                </div>
                <div className="text-xs text-slate-500">
                  @ ${stakePerBet}/bet
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-blue-200/50 dark:border-blue-800/30 flex justify-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold rounded px-1.5 py-0.5">W</span>
          <span>Hole won</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-slate-500/20 text-slate-600 dark:text-slate-400 font-bold rounded px-1.5 py-0.5">L</span>
          <span>Hole lost</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-slate-300/30 text-slate-500 dark:text-slate-400 font-bold rounded px-1.5 py-0.5">-</span>
          <span>Halved</span>
        </div>
      </div>
    </div>
  );
}
