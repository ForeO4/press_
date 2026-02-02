'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { HoleSnapshot } from '@/types';
import type { ScorecardPlayer, HoleIndicator, GameStanding } from '../types';

interface HighLowTotalOverlayProps {
  players: ScorecardPlayer[];
  holes: HoleSnapshot[];
  startHole: number;
  endHole: number;
  tieRule: 'push' | 'split' | 'carryover';
  isTeamMode: boolean;
  pointValue: number;
  teams?: { id: string; playerIds: string[] }[];
}

interface HLTHoleResult {
  hole: number;
  lowWinnerId: string | null;
  highLoserId: string | null;
  totalWinnerId: string | null;
  carryover: { low: number; high: number; total: number };
}

export function useHighLowTotalComputation({
  players,
  holes,
  startHole,
  endHole,
  tieRule,
  isTeamMode,
  pointValue,
  teams,
}: HighLowTotalOverlayProps) {
  return useMemo(() => {
    const holeResults: HLTHoleResult[] = [];
    const indicators = new Map<number, HoleIndicator[]>();
    const pointsTracker: Record<string, { low: number; high: number; total: number }> = {};

    // Initialize points for all players
    for (const player of players) {
      pointsTracker[player.id] = { low: 0, high: 0, total: 0 };
    }

    let carryover = { low: 0, high: 0, total: 0 };

    // Process each hole
    for (let holeNum = startHole; holeNum <= endHole; holeNum++) {
      const hole = holes.find((h) => h.number === holeNum);
      if (!hole) continue;

      // Get net scores for all players
      const netScores: { playerId: string; net: number }[] = [];
      let allHaveScores = true;

      for (const player of players) {
        const scoreRecord = player.scores.find((s) => s.holeNumber === holeNum);
        if (!scoreRecord) {
          allHaveScores = false;
          break;
        }
        const getsStroke = hole.handicap <= player.handicap;
        const net = getsStroke ? scoreRecord.strokes - 1 : scoreRecord.strokes;
        netScores.push({ playerId: player.id, net: Math.max(1, net) });
      }

      if (!allHaveScores) continue;

      const holeIndicators: HoleIndicator[] = [];

      // Compute Low winner
      const lowestNet = Math.min(...netScores.map((s) => s.net));
      const lowPlayers = netScores.filter((s) => s.net === lowestNet);
      let lowWinnerId: string | null = null;

      if (lowPlayers.length === 1) {
        lowWinnerId = lowPlayers[0].playerId;
        const points = 1 + carryover.low;
        pointsTracker[lowWinnerId].low += points;
        holeIndicators.push({
          playerId: lowWinnerId,
          type: 'low',
          label: 'L',
          value: points,
        });
        carryover.low = 0;
      } else if (tieRule === 'carryover') {
        carryover.low += 1;
      }

      // Compute High loser
      const highestNet = Math.max(...netScores.map((s) => s.net));
      const highPlayers = netScores.filter((s) => s.net === highestNet);
      let highLoserId: string | null = null;

      if (highPlayers.length === 1) {
        highLoserId = highPlayers[0].playerId;
        const points = 1 + carryover.high;
        pointsTracker[highLoserId].high += points;
        holeIndicators.push({
          playerId: highLoserId,
          type: 'high',
          label: 'H',
          value: points,
        });
        carryover.high = 0;
      } else if (tieRule === 'carryover') {
        carryover.high += 1;
      }

      // Compute Total winner (team mode only)
      let totalWinnerId: string | null = null;
      if (isTeamMode && teams && teams.length === 2) {
        const teamTotals = teams.map((team) => {
          const teamNet = netScores
            .filter((s) => team.playerIds.includes(s.playerId))
            .reduce((sum, s) => sum + s.net, 0);
          return { teamId: team.id, total: teamNet, playerIds: team.playerIds };
        });

        const lowestTeamTotal = Math.min(...teamTotals.map((t) => t.total));
        const winningTeams = teamTotals.filter((t) => t.total === lowestTeamTotal);

        if (winningTeams.length === 1) {
          const winningTeam = winningTeams[0];
          totalWinnerId = winningTeam.playerIds[0]; // Use first player as representative
          const points = 1 + carryover.total;
          // Both players on winning team get points
          for (const pid of winningTeam.playerIds) {
            pointsTracker[pid].total += points / 2;
          }
          holeIndicators.push({
            playerId: totalWinnerId,
            type: 'total',
            label: 'T',
            value: points,
          });
          carryover.total = 0;
        } else if (tieRule === 'carryover') {
          carryover.total += 1;
        }
      }

      holeResults.push({
        hole: holeNum,
        lowWinnerId,
        highLoserId,
        totalWinnerId,
        carryover: { ...carryover },
      });

      indicators.set(holeNum, holeIndicators);
    }

    // Compute standings
    const standings: GameStanding[] = players.map((player) => {
      const pts = pointsTracker[player.id];
      const netPoints = pts.low + pts.total - pts.high;
      return {
        playerId: player.id,
        playerName: player.name,
        points: netPoints,
        value: netPoints * pointValue,
        breakdown: {
          low: pts.low,
          high: pts.high,
          total: pts.total,
        },
      };
    }).sort((a, b) => b.points - a.points);

    return { holeResults, indicators, standings, carryover };
  }, [players, holes, startHole, endHole, tieRule, isTeamMode, pointValue, teams]);
}

interface HLTStandingsSummaryProps {
  standings: GameStanding[];
  isTeamMode: boolean;
  pointValue: number;
  carryover: { low: number; high: number; total: number };
}

export function HLTStandingsSummary({ standings, isTeamMode, pointValue, carryover }: HLTStandingsSummaryProps) {
  const hasCarryover = carryover.low > 0 || carryover.high > 0 || carryover.total > 0;

  return (
    <div className="rounded-xl border border-pink-200/50 dark:border-pink-900/30 bg-gradient-to-br from-pink-50 via-white to-pink-50/50 dark:from-pink-950/30 dark:via-slate-900 dark:to-pink-950/20 p-5 shadow-xl">
      <div className="text-xs text-pink-600 dark:text-pink-400 uppercase tracking-widest font-medium mb-4 text-center">
        High-Low-Total Standings
      </div>

      <div className="space-y-3">
        {standings.map((standing, index) => (
          <div
            key={standing.playerId}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg',
              index === 0 && standing.points > 0 && 'bg-green-100/50 dark:bg-green-900/20 border border-green-300/50 dark:border-green-700/30',
              standing.points < 0 && 'bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/20',
              standing.points === 0 && 'bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30'
            )}
          >
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">{standing.playerName}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex gap-2 mt-1">
                <span className="text-green-600 dark:text-green-400">L: +{standing.breakdown?.low ?? 0}</span>
                <span className="text-red-600 dark:text-red-400">H: -{standing.breakdown?.high ?? 0}</span>
                {isTeamMode && (
                  <span className="text-blue-600 dark:text-blue-400">T: +{standing.breakdown?.total ?? 0}</span>
                )}
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
                ({standing.points >= 0 ? '+' : ''}{standing.points} pts)
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasCarryover && (
        <div className="mt-4 pt-4 border-t border-pink-200/50 dark:border-pink-800/30">
          <div className="flex justify-center gap-4 text-xs text-pink-600 dark:text-pink-400">
            {carryover.low > 0 && <span>Low carryover: {carryover.low}</span>}
            {carryover.high > 0 && <span>High carryover: {carryover.high}</span>}
            {carryover.total > 0 && <span>Total carryover: {carryover.total}</span>}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-pink-200/50 dark:border-pink-800/30 flex justify-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <span className="bg-green-500/20 text-green-600 dark:text-green-400 font-bold rounded px-1">L</span>
          <span>Low (+1)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded px-1">H</span>
          <span>High (-1)</span>
        </div>
        {isTeamMode && (
          <div className="flex items-center gap-1">
            <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold rounded px-1">T</span>
            <span>Total (+1)</span>
          </div>
        )}
      </div>
    </div>
  );
}
