'use client';

import { cn } from '@/lib/utils';
import type { HoleSnapshot } from '@/types';
import type { ScorecardPlayer, HoleIndicator } from './types';

interface BaseScoreGridProps {
  players: ScorecardPlayer[];
  holes: HoleSnapshot[];
  startHole: number;
  endHole: number;
  indicators?: Map<number, HoleIndicator[]>;
  onCellClick?: (playerId: string, holeNumber: number) => void;
  className?: string;
  /** Additional rows to render after player rows (for game-specific tracking) */
  additionalRows?: React.ReactNode;
}

// Player colors for up to 4 players
const PLAYER_COLORS = [
  { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/30' },
  { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/30' },
  { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/30' },
  { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/30' },
];

export function BaseScoreGrid({
  players,
  holes,
  startHole,
  endHole,
  indicators = new Map(),
  onCellClick,
  className,
  additionalRows,
}: BaseScoreGridProps) {
  const frontNine = holes.filter((h) => h.number <= 9);
  const backNine = holes.filter((h) => h.number > 9);

  const frontPar = frontNine.reduce((sum, h) => sum + h.par, 0);
  const backPar = backNine.reduce((sum, h) => sum + h.par, 0);

  const isHoleInRange = (holeNum: number) => holeNum >= startHole && holeNum <= endHole;

  const getScore = (player: ScorecardPlayer, holeNum: number): number | null => {
    const score = player.scores.find((s) => s.holeNumber === holeNum);
    return score?.strokes ?? null;
  };

  const calcTotal = (player: ScorecardPlayer, holeNums: number[]): number | null => {
    let total = 0;
    let hasScore = false;
    for (const holeNum of holeNums) {
      const score = getScore(player, holeNum);
      if (score !== null) {
        total += score;
        hasScore = true;
      }
    }
    return hasScore ? total : null;
  };

  const getsStrokeOnHole = (player: ScorecardPlayer, holeHandicap: number): boolean => {
    return holeHandicap <= player.handicap;
  };

  const getScoreStyle = (score: number | null, par: number): string => {
    if (score === null) return 'text-slate-400';
    const diff = score - par;
    if (diff <= -2) return 'text-amber-500 font-black'; // Eagle+
    if (diff === -1) return 'text-emerald-500 dark:text-emerald-400 font-bold'; // Birdie
    if (diff === 0) return 'text-slate-700 dark:text-slate-200'; // Par
    if (diff === 1) return 'text-slate-500 dark:text-slate-400'; // Bogey
    return 'text-slate-400 dark:text-slate-500'; // Double+
  };

  const getPlayerIndicator = (playerId: string, holeNum: number): HoleIndicator | null => {
    const holeIndicators = indicators.get(holeNum);
    if (!holeIndicators) return null;
    return holeIndicators.find((i) => i.playerId === playerId) ?? null;
  };

  const renderSection = (sectionHoles: HoleSnapshot[], title: string, totalLabel: string) => {
    const sectionPar = sectionHoles.reduce((sum, h) => sum + h.par, 0);
    const sectionHoleNums = sectionHoles.map((h) => h.number);

    return (
      <div className="rounded-xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-lg bg-white dark:bg-slate-900">
        {/* Section Header */}
        <div className="border-b border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 px-4 py-2.5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300">{title}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {/* Hole numbers */}
              <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="sticky left-0 z-10 bg-slate-50/80 dark:bg-slate-900/80 py-2.5 pl-4 pr-2 text-left font-bold text-slate-700 dark:text-slate-400 min-w-[100px]">
                  Hole
                </th>
                {sectionHoles.map((hole) => (
                  <th
                    key={hole.number}
                    className={cn(
                      'px-2 py-2.5 text-center font-bold text-slate-600 dark:text-slate-300 min-w-[44px]',
                      !isHoleInRange(hole.number) && 'opacity-30'
                    )}
                  >
                    {hole.number}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-center font-black text-slate-800 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/40 min-w-[56px]">
                  {totalLabel}
                </th>
              </tr>

              {/* Par row */}
              <tr className="border-b border-slate-100/50 dark:border-slate-800/30 text-xs">
                <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 py-1.5 pl-4 pr-2 text-slate-500 font-medium">
                  Par
                </td>
                {sectionHoles.map((hole) => (
                  <td
                    key={hole.number}
                    className={cn(
                      'px-2 py-1.5 text-center text-slate-500',
                      !isHoleInRange(hole.number) && 'opacity-30'
                    )}
                  >
                    {hole.par}
                  </td>
                ))}
                <td className="px-3 py-1.5 text-center font-medium text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">
                  {sectionPar}
                </td>
              </tr>

              {/* Handicap row */}
              <tr className="border-b border-slate-200/50 dark:border-slate-800/30 text-xs">
                <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 py-1.5 pl-4 pr-2 text-slate-500 font-medium">
                  Hdcp
                </td>
                {sectionHoles.map((hole) => (
                  <td
                    key={hole.number}
                    className={cn(
                      'px-2 py-1.5 text-center text-slate-400',
                      !isHoleInRange(hole.number) && 'opacity-30'
                    )}
                  >
                    {hole.handicap}
                  </td>
                ))}
                <td className="px-3 py-1.5 text-center bg-slate-50/50 dark:bg-slate-800/20 text-slate-400">-</td>
              </tr>
            </thead>

            <tbody>
              {/* Player rows */}
              {players.map((player, playerIndex) => {
                const colors = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
                const playerTotal = calcTotal(player, sectionHoleNums);

                return (
                  <tr
                    key={player.id}
                    className={cn('border-b', colors.border, colors.bg)}
                  >
                    <td className={cn('sticky left-0 z-10 py-2.5 pl-4 pr-2', colors.bg)}>
                      <div className="flex items-center gap-2">
                        <span className={cn('font-bold', colors.text)}>
                          {player.name.split(' ')[0]}
                          <span className="text-xs font-normal opacity-60 ml-1">({player.handicap})</span>
                        </span>
                      </div>
                    </td>
                    {sectionHoles.map((hole) => {
                      const score = getScore(player, hole.number);
                      const inRange = isHoleInRange(hole.number);
                      const getsStroke = getsStrokeOnHole(player, hole.handicap);
                      const netScore = score !== null && getsStroke ? score - 1 : null;
                      const indicator = getPlayerIndicator(player.id, hole.number);

                      return (
                        <td
                          key={hole.number}
                          onClick={onCellClick && inRange ? () => onCellClick(player.id, hole.number) : undefined}
                          className={cn(
                            'px-0.5 py-2 text-center font-mono relative',
                            !inRange && 'opacity-30',
                            onCellClick && inRange && 'cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors'
                          )}
                        >
                          {/* Stroke dot */}
                          {getsStroke && inRange && (
                            <span className={cn('absolute top-1 right-1 w-1.5 h-1.5 rounded-full', colors.text.replace('text-', 'bg-'))} />
                          )}

                          <div className="flex flex-col items-center gap-0.5">
                            <span
                              className={cn(
                                'inline-flex items-center justify-center rounded-lg w-9 h-7 text-sm',
                                getScoreStyle(getsStroke ? netScore : score, hole.par)
                              )}
                            >
                              {score !== null ? (
                                getsStroke ? (
                                  <span className="text-xs leading-none font-bold">
                                    <span className="opacity-50">{score}</span>
                                    <span className="opacity-30">/</span>
                                    <span>{netScore}</span>
                                  </span>
                                ) : (
                                  <span className="font-bold">{score}</span>
                                )
                              ) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                            </span>

                            {/* Indicator badge */}
                            {indicator && (
                              <span
                                className={cn(
                                  'text-[9px] font-bold rounded px-1 leading-tight',
                                  indicator.type === 'low' && 'bg-green-500/20 text-green-500',
                                  indicator.type === 'high' && 'bg-red-500/20 text-red-500',
                                  indicator.type === 'total' && 'bg-blue-500/20 text-blue-500',
                                  indicator.type === 'win' && 'bg-amber-500/20 text-amber-500',
                                  indicator.type === 'loss' && 'bg-slate-500/20 text-slate-500',
                                  indicator.type === 'skin' && 'bg-amber-500/20 text-amber-500',
                                  indicator.type === 'carryover' && 'bg-orange-500/20 text-orange-500',
                                  indicator.type === 'tie' && 'bg-slate-500/20 text-slate-500'
                                )}
                              >
                                {indicator.label}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className={cn('px-3 py-2 text-center font-mono font-black text-lg', colors.bg, colors.text)}>
                      {playerTotal ?? '-'}
                    </td>
                  </tr>
                );
              })}

              {/* Additional rows (game-specific tracking) */}
              {additionalRows}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {frontNine.length > 0 && renderSection(frontNine, 'Front 9', 'OUT')}
      {backNine.length > 0 && renderSection(backNine, 'Back 9', 'IN')}
    </div>
  );
}
