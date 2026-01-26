'use client';

import { cn } from '@/lib/utils';
import { HoleResultRow } from './HoleResultRow';
import type { Game, HoleScore, HoleSnapshot } from '@/types';
import {
  computeHoleResults,
  type HoleResult,
} from '@/lib/domain/settlement/computeSettlement';

interface GameScorecardProps {
  game: Game;
  playerAId: string;
  playerBId: string;
  playerAName: string;
  playerBName: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
  holes: HoleSnapshot[];
  className?: string;
  onCellClick?: (playerId: string, holeNumber: number) => void;
}

export function GameScorecard({
  game,
  playerAId,
  playerBId,
  playerAName,
  playerBName,
  playerAScores,
  playerBScores,
  holes,
  className,
  onCellClick,
}: GameScorecardProps) {
  const frontNine = holes.filter((h) => h.number <= 9);
  const backNine = holes.filter((h) => h.number > 9);

  // Calculate totals
  const frontPar = frontNine.reduce((sum, h) => sum + h.par, 0);
  const backPar = backNine.reduce((sum, h) => sum + h.par, 0);
  const totalPar = frontPar + backPar;

  // Get score for a specific hole
  const getScore = (scores: HoleScore[], holeNum: number): number | null => {
    const score = scores.find((s) => s.holeNumber === holeNum);
    return score?.strokes ?? null;
  };

  // Calculate score totals
  const calcTotal = (scores: HoleScore[], holeRange: number[]): number | null => {
    let total = 0;
    let hasScore = false;
    for (const holeNum of holeRange) {
      const score = getScore(scores, holeNum);
      if (score !== null) {
        total += score;
        hasScore = true;
      }
    }
    return hasScore ? total : null;
  };

  const frontHoleNums = frontNine.map((h) => h.number);
  const backHoleNums = backNine.map((h) => h.number);
  const allHoleNums = [...frontHoleNums, ...backHoleNums];

  const playerAFront = calcTotal(playerAScores, frontHoleNums);
  const playerABack = calcTotal(playerAScores, backHoleNums);
  const playerATotal = calcTotal(playerAScores, allHoleNums);

  const playerBFront = calcTotal(playerBScores, frontHoleNums);
  const playerBBack = calcTotal(playerBScores, backHoleNums);
  const playerBTotal = calcTotal(playerBScores, allHoleNums);

  // Calculate hole results for winner row
  const holeResults = computeHoleResults(
    game,
    playerAId,
    playerBId,
    playerAScores,
    playerBScores
  );

  // Check if hole is within game range
  const isHoleInRange = (holeNum: number) =>
    holeNum >= game.startHole && holeNum <= game.endHole;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Front 9 */}
      <ScorecardSection
        title="Front 9"
        holes={frontNine}
        parTotal={frontPar}
        playerAId={playerAId}
        playerBId={playerBId}
        playerAName={playerAName}
        playerBName={playerBName}
        playerAScores={playerAScores}
        playerBScores={playerBScores}
        playerATotal={playerAFront}
        playerBTotal={playerBFront}
        holeResults={holeResults}
        isHoleInRange={isHoleInRange}
        totalLabel="OUT"
        onCellClick={onCellClick}
      />

      {/* Back 9 */}
      <ScorecardSection
        title="Back 9"
        holes={backNine}
        parTotal={backPar}
        playerAId={playerAId}
        playerBId={playerBId}
        playerAName={playerAName}
        playerBName={playerBName}
        playerAScores={playerAScores}
        playerBScores={playerBScores}
        playerATotal={playerABack}
        playerBTotal={playerBBack}
        holeResults={holeResults}
        isHoleInRange={isHoleInRange}
        totalLabel="IN"
        onCellClick={onCellClick}
      />

      {/* Grand Total */}
      <div className="flex justify-end gap-4 rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
        <div className="text-sm text-muted-foreground">Total</div>
        <div className="flex gap-8">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Par</div>
            <div className="font-mono font-bold">{totalPar}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-primary">{playerAName.split(' ')[0]}</div>
            <div className="font-mono font-bold text-primary">
              {playerATotal ?? '-'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-blue-400">{playerBName.split(' ')[0]}</div>
            <div className="font-mono font-bold text-blue-400">
              {playerBTotal ?? '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScorecardSectionProps {
  title: string;
  holes: HoleSnapshot[];
  parTotal: number;
  playerAId: string;
  playerBId: string;
  playerAName: string;
  playerBName: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
  playerATotal: number | null;
  playerBTotal: number | null;
  holeResults: HoleResult[];
  isHoleInRange: (holeNum: number) => boolean;
  totalLabel: string;
  onCellClick?: (playerId: string, holeNumber: number) => void;
}

function ScorecardSection({
  title,
  holes,
  parTotal,
  playerAId,
  playerBId,
  playerAName,
  playerBName,
  playerAScores,
  playerBScores,
  playerATotal,
  playerBTotal,
  holeResults,
  isHoleInRange,
  totalLabel,
  onCellClick,
}: ScorecardSectionProps) {
  const getScore = (scores: HoleScore[], holeNum: number): number | null => {
    const score = scores.find((s) => s.holeNumber === holeNum);
    return score?.strokes ?? null;
  };

  const getScoreColor = (score: number | null, par: number): string => {
    if (score === null) return 'text-muted-foreground';
    const diff = score - par;
    if (diff <= -2) return 'text-green-600 dark:text-green-400 font-bold'; // Eagle+
    if (diff === -1) return 'text-green-600 dark:text-green-400'; // Birdie
    if (diff === 0) return ''; // Par
    if (diff === 1) return 'text-red-500 dark:text-red-400'; // Bogey
    return 'text-red-600 dark:text-red-500 font-bold'; // Double+
  };

  return (
    <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 overflow-hidden">
      <div className="border-b border-border/30 bg-muted/30 px-4 py-2">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {/* Hole numbers */}
            <tr className="border-b border-border/30">
              <th className="sticky left-0 z-10 bg-card/90 backdrop-blur-sm py-2 pl-4 pr-2 text-left font-medium text-muted-foreground min-w-[60px]">
                Hole
              </th>
              {holes.map((hole) => (
                <th
                  key={hole.number}
                  className={cn(
                    'px-2 py-2 text-center font-medium min-w-[36px]',
                    !isHoleInRange(hole.number) && 'opacity-40'
                  )}
                >
                  {hole.number}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-bold bg-muted/30 min-w-[44px]">
                {totalLabel}
              </th>
            </tr>

            {/* Par row */}
            <tr className="border-b border-border/30 text-xs text-muted-foreground">
              <td className="sticky left-0 z-10 bg-card/90 backdrop-blur-sm py-1.5 pl-4 pr-2">
                Par
              </td>
              {holes.map((hole) => (
                <td
                  key={hole.number}
                  className={cn(
                    'px-2 py-1.5 text-center',
                    !isHoleInRange(hole.number) && 'opacity-40'
                  )}
                >
                  {hole.par}
                </td>
              ))}
              <td className="px-3 py-1.5 text-center font-medium bg-muted/30">
                {parTotal}
              </td>
            </tr>
          </thead>

          <tbody>
            {/* Player A row */}
            <tr className="border-b border-border/30 bg-primary/5">
              <td className="sticky left-0 z-10 bg-primary/10 backdrop-blur-sm py-2 pl-4 pr-2 font-medium text-primary">
                {playerAName.split(' ')[0]}
              </td>
              {holes.map((hole) => {
                const score = getScore(playerAScores, hole.number);
                const inRange = isHoleInRange(hole.number);
                return (
                  <td
                    key={hole.number}
                    onClick={onCellClick && inRange ? () => onCellClick(playerAId, hole.number) : undefined}
                    className={cn(
                      'px-2 py-2 text-center font-mono',
                      !inRange && 'opacity-40',
                      getScoreColor(score, hole.par),
                      onCellClick && inRange && 'cursor-pointer hover:bg-primary/20 transition-colors'
                    )}
                  >
                    {score ?? '-'}
                  </td>
                );
              })}
              <td className="px-3 py-2 text-center font-mono font-bold bg-muted/30 text-primary">
                {playerATotal ?? '-'}
              </td>
            </tr>

            {/* Player B row */}
            <tr className="border-b border-border/30 bg-blue-500/5">
              <td className="sticky left-0 z-10 bg-blue-500/10 backdrop-blur-sm py-2 pl-4 pr-2 font-medium text-blue-400">
                {playerBName.split(' ')[0]}
              </td>
              {holes.map((hole) => {
                const score = getScore(playerBScores, hole.number);
                const inRange = isHoleInRange(hole.number);
                return (
                  <td
                    key={hole.number}
                    onClick={onCellClick && inRange ? () => onCellClick(playerBId, hole.number) : undefined}
                    className={cn(
                      'px-2 py-2 text-center font-mono',
                      !inRange && 'opacity-40',
                      getScoreColor(score, hole.par),
                      onCellClick && inRange && 'cursor-pointer hover:bg-blue-500/20 transition-colors'
                    )}
                  >
                    {score ?? '-'}
                  </td>
                );
              })}
              <td className="px-3 py-2 text-center font-mono font-bold bg-muted/30 text-blue-400">
                {playerBTotal ?? '-'}
              </td>
            </tr>

            {/* Winner row */}
            <HoleResultRow
              holes={holes}
              holeResults={holeResults}
              isHoleInRange={isHoleInRange}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
