'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { HoleSnapshot } from '@/types';
import type { ScorecardPlayer, HoleIndicator, GameStanding } from '../types';

interface SkinsOverlayProps {
  players: ScorecardPlayer[];
  holes: HoleSnapshot[];
  startHole: number;
  endHole: number;
  skinValue: number;
  carryover: boolean;
  scoringBasis: 'net' | 'gross';
}

interface SkinsHoleResult {
  hole: number;
  winnerId: string | null;
  isCarryover: boolean;
  skinsValue: number; // Number of skins this hole is worth (including carryovers)
}

interface SkinsComputationResult {
  holeResults: SkinsHoleResult[];
  indicators: Map<number, HoleIndicator[]>;
  standings: GameStanding[];
  currentCarryover: number;
  holesWithCarryover: number[];
}

export function useSkinsComputation({
  players,
  holes,
  startHole,
  endHole,
  skinValue,
  carryover: enableCarryover,
  scoringBasis,
}: SkinsOverlayProps): SkinsComputationResult {
  return useMemo(() => {
    const holeResults: SkinsHoleResult[] = [];
    const indicators = new Map<number, HoleIndicator[]>();
    const skinsTracker: Record<string, number> = {};
    const holesWithCarryover: number[] = [];

    // Initialize skins for all players
    for (const player of players) {
      skinsTracker[player.id] = 0;
    }

    let currentCarryover = 0;

    // Process each hole
    for (let holeNum = startHole; holeNum <= endHole; holeNum++) {
      const hole = holes.find((h) => h.number === holeNum);
      if (!hole) continue;

      // Get scores for all players
      const playerScores: { playerId: string; score: number }[] = [];
      let allHaveScores = true;

      for (const player of players) {
        const scoreRecord = player.scores.find((s) => s.holeNumber === holeNum);
        if (!scoreRecord) {
          allHaveScores = false;
          break;
        }

        let score = scoreRecord.strokes;
        if (scoringBasis === 'net') {
          const getsStroke = hole.handicap <= player.handicap;
          score = getsStroke ? scoreRecord.strokes - 1 : scoreRecord.strokes;
        }

        playerScores.push({ playerId: player.id, score: Math.max(1, score) });
      }

      if (!allHaveScores) continue;

      // Find the lowest score
      const lowestScore = Math.min(...playerScores.map((s) => s.score));
      const playersWithLowest = playerScores.filter((s) => s.score === lowestScore);

      const holeIndicators: HoleIndicator[] = [];

      if (playersWithLowest.length === 1) {
        // Outright winner - wins the skin plus any carryovers
        const winnerId = playersWithLowest[0].playerId;
        const skinsWon = 1 + currentCarryover;
        skinsTracker[winnerId] += skinsWon;

        holeResults.push({
          hole: holeNum,
          winnerId,
          isCarryover: false,
          skinsValue: skinsWon,
        });

        holeIndicators.push({
          playerId: winnerId,
          type: 'skin',
          label: skinsWon > 1 ? `${skinsWon} SK` : 'SK',
          value: skinsWon,
        });

        currentCarryover = 0;
      } else {
        // Tie - carryover if enabled
        if (enableCarryover) {
          currentCarryover += 1;
          holesWithCarryover.push(holeNum);

          // Add carryover indicator to all tied players
          for (const ps of playersWithLowest) {
            holeIndicators.push({
              playerId: ps.playerId,
              type: 'carryover',
              label: 'C/O',
              value: currentCarryover,
            });
          }
        }

        holeResults.push({
          hole: holeNum,
          winnerId: null,
          isCarryover: enableCarryover,
          skinsValue: 0,
        });
      }

      indicators.set(holeNum, holeIndicators);
    }

    // Handle last hole carryover - split among tied players
    if (currentCarryover > 0 && holeResults.length > 0) {
      const lastHoleResult = holeResults[holeResults.length - 1];
      if (lastHoleResult.winnerId === null) {
        // Find the last hole's tied players
        const lastHole = holes.find((h) => h.number === endHole);
        if (lastHole) {
          const lastHoleScores: { playerId: string; score: number }[] = [];

          for (const player of players) {
            const scoreRecord = player.scores.find((s) => s.holeNumber === endHole);
            if (scoreRecord) {
              let score = scoreRecord.strokes;
              if (scoringBasis === 'net') {
                const getsStroke = lastHole.handicap <= player.handicap;
                score = getsStroke ? scoreRecord.strokes - 1 : scoreRecord.strokes;
              }
              lastHoleScores.push({ playerId: player.id, score: Math.max(1, score) });
            }
          }

          const lowestScore = Math.min(...lastHoleScores.map((s) => s.score));
          const tiedPlayers = lastHoleScores.filter((s) => s.score === lowestScore);

          // Split the carryover among tied players
          const splitSkins = currentCarryover / tiedPlayers.length;
          for (const tp of tiedPlayers) {
            skinsTracker[tp.playerId] += splitSkins;
          }
        }
      }
    }

    // Compute standings
    const standings: GameStanding[] = players.map((player) => {
      const skins = skinsTracker[player.id];
      // Each skin won means you collect from (players.length - 1) other players
      const netSkins = skins - (getTotalSkins(skinsTracker) - skins) / (players.length - 1);
      const value = netSkins * skinValue;

      return {
        playerId: player.id,
        playerName: player.name,
        points: skins,
        value: value,
        breakdown: { skinsWon: skins },
      };
    }).sort((a, b) => b.points - a.points);

    return { holeResults, indicators, standings, currentCarryover, holesWithCarryover };
  }, [players, holes, startHole, endHole, skinValue, enableCarryover, scoringBasis]);
}

function getTotalSkins(tracker: Record<string, number>): number {
  return Object.values(tracker).reduce((sum, s) => sum + s, 0);
}

interface SkinsStandingsSummaryProps {
  standings: GameStanding[];
  skinValue: number;
  currentCarryover: number;
  holesWithCarryover: number[];
  playerCount: number;
}

export function SkinsStandingsSummary({
  standings,
  skinValue,
  currentCarryover,
  holesWithCarryover,
  playerCount,
}: SkinsStandingsSummaryProps) {
  const hasCarryover = currentCarryover > 0;
  const totalSkinsAwarded = standings.reduce((sum, s) => sum + s.points, 0);

  return (
    <div className="rounded-xl border border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20 p-5 shadow-xl">
      <div className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-widest font-medium mb-4 text-center">
        Skins Standings
      </div>

      {/* Carryover alert */}
      {hasCarryover && (
        <div className="mb-4 p-3 rounded-lg bg-orange-100/50 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-800/30">
          <div className="text-sm font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2">
            <span className="text-lg">🔥</span>
            {currentCarryover} skin{currentCarryover > 1 ? 's' : ''} carrying
          </div>
          <div className="text-xs text-orange-500 dark:text-orange-400/70 mt-1">
            From hole{holesWithCarryover.length > 1 ? 's' : ''}: {holesWithCarryover.join(', ')}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {standings.map((standing, index) => {
          const skinsWon = standing.points;
          // Calculate net value: skins won × skinValue × (opponents) - skins lost to others
          const potentialValue = skinsWon * skinValue * (playerCount - 1);

          return (
            <div
              key={standing.playerId}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                index === 0 && standing.points > 0 && 'bg-green-100/50 dark:bg-green-900/20 border border-green-300/50 dark:border-green-700/30',
                standing.points === 0 && 'bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30'
              )}
            >
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200">{standing.playerName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {skinsWon} skin{skinsWon !== 1 ? 's' : ''} won
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
                  {standing.value >= 0 ? '+' : ''}{Math.round(standing.value)}
                </div>
                {skinsWon > 0 && (
                  <div className="text-xs text-slate-500">
                    ({skinsWon} × ${skinValue} × {playerCount - 1})
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-amber-200/50 dark:border-amber-800/30 flex justify-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold rounded px-1.5 py-0.5">SK</span>
          <span>Skin won</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold rounded px-1.5 py-0.5">C/O</span>
          <span>Carryover</span>
        </div>
      </div>

      {totalSkinsAwarded > 0 && (
        <div className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
          {totalSkinsAwarded} skin{totalSkinsAwarded !== 1 ? 's' : ''} awarded • ${skinValue}/skin
        </div>
      )}
    </div>
  );
}
