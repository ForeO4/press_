'use client';

import { cn } from '@/lib/utils';
import type { Game, HoleScore, HoleSnapshot, GameWithParticipants } from '@/types';
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
  childGames?: GameWithParticipants[];
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
  childGames = [],
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
        childGames={childGames}
        gameStartHole={game.startHole}
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
        childGames={childGames}
        gameStartHole={game.startHole}
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
  childGames?: GameWithParticipants[];
  gameStartHole: number;
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
  childGames = [],
  gameStartHole,
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

  // Get winner for a hole
  const getHoleWinner = (holeNum: number): 'A' | 'B' | 'tie' | null => {
    const result = holeResults.find((r) => r.hole === holeNum);
    return result?.winner ?? null;
  };

  // Calculate cumulative match status up to and including each hole
  const getCumulativeStatus = (upToHole: number): number => {
    let status = 0;
    for (const result of holeResults) {
      if (result.hole <= upToHole) {
        if (result.winner === 'A') status += 1;
        else if (result.winner === 'B') status -= 1;
      }
    }
    return status;
  };

  // Calculate cumulative for a specific range (for presses)
  const getCumulativeForRange = (startHole: number, upToHole: number): number => {
    let status = 0;
    for (const result of holeResults) {
      if (result.hole >= startHole && result.hole <= upToHole) {
        if (result.winner === 'A') status += 1;
        else if (result.winner === 'B') status -= 1;
      }
    }
    return status;
  };

  // Format cumulative status
  const formatStatus = (status: number): string => {
    if (status === 0) return 'AS';
    return status > 0 ? `+${status}` : `${status}`;
  };

  // Calculate section total for cumulative
  const sectionHoles = holes.filter((h) => isHoleInRange(h.number));
  const lastSectionHole = sectionHoles.length > 0
    ? Math.max(...sectionHoles.map(h => h.number))
    : 0;
  const sectionCumulative = lastSectionHole > 0 ? getCumulativeStatus(lastSectionHole) : 0;

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
              <th className="sticky left-0 z-10 bg-card/90 backdrop-blur-sm py-2 pl-4 pr-2 text-left font-medium text-muted-foreground min-w-[80px]">
                Hole
              </th>
              {holes.map((hole) => (
                <th
                  key={hole.number}
                  className={cn(
                    'px-2 py-2 text-center font-medium min-w-[40px]',
                    !isHoleInRange(hole.number) && 'opacity-40'
                  )}
                >
                  {hole.number}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-bold bg-muted/30 min-w-[50px]">
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

            {/* HCP (Handicap) row */}
            <tr className="border-b border-border/30 text-xs text-muted-foreground">
              <td className="sticky left-0 z-10 bg-card/90 backdrop-blur-sm py-1.5 pl-4 pr-2">
                HCP
              </td>
              {holes.map((hole) => (
                <td
                  key={hole.number}
                  className={cn(
                    'px-2 py-1.5 text-center',
                    !isHoleInRange(hole.number) && 'opacity-40'
                  )}
                >
                  {hole.handicap}
                </td>
              ))}
              <td className="px-3 py-1.5 text-center bg-muted/30">-</td>
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
                const winner = getHoleWinner(hole.number);
                const isWinner = winner === 'A' && score !== null;
                return (
                  <td
                    key={hole.number}
                    onClick={onCellClick && inRange ? () => onCellClick(playerAId, hole.number) : undefined}
                    className={cn(
                      'px-1 py-2 text-center font-mono',
                      !inRange && 'opacity-40',
                      onCellClick && inRange && 'cursor-pointer hover:bg-primary/20 transition-colors'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-full',
                        getScoreColor(score, hole.par),
                        isWinner && 'ring-2 ring-amber-400 bg-amber-400/20'
                      )}
                    >
                      {score ?? '-'}
                    </span>
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
                const winner = getHoleWinner(hole.number);
                const isWinner = winner === 'B' && score !== null;
                return (
                  <td
                    key={hole.number}
                    onClick={onCellClick && inRange ? () => onCellClick(playerBId, hole.number) : undefined}
                    className={cn(
                      'px-1 py-2 text-center font-mono',
                      !inRange && 'opacity-40',
                      onCellClick && inRange && 'cursor-pointer hover:bg-blue-500/20 transition-colors'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-full',
                        getScoreColor(score, hole.par),
                        isWinner && 'ring-2 ring-amber-400 bg-amber-400/20'
                      )}
                    >
                      {score ?? '-'}
                    </span>
                  </td>
                );
              })}
              <td className="px-3 py-2 text-center font-mono font-bold bg-muted/30 text-blue-400">
                {playerBTotal ?? '-'}
              </td>
            </tr>

            {/* Winner row with cumulative +/- */}
            <tr className="border-b border-border/30 text-xs bg-amber-500/5">
              <td className="sticky left-0 z-10 bg-amber-500/10 backdrop-blur-sm py-2 pl-4 pr-2 font-semibold text-amber-400">
                Match
              </td>
              {holes.map((hole) => {
                const inRange = isHoleInRange(hole.number);
                if (!inRange) {
                  return (
                    <td key={hole.number} className="px-2 py-2 text-center opacity-40">
                      -
                    </td>
                  );
                }
                const cumulative = getCumulativeStatus(hole.number);
                const hasResult = holeResults.some(r => r.hole === hole.number);
                if (!hasResult) {
                  return (
                    <td key={hole.number} className="px-2 py-2 text-center text-muted-foreground">
                      -
                    </td>
                  );
                }
                return (
                  <td
                    key={hole.number}
                    className={cn(
                      'px-2 py-2 text-center font-bold',
                      cumulative > 0 && 'text-primary',
                      cumulative < 0 && 'text-blue-400',
                      cumulative === 0 && 'text-amber-400'
                    )}
                  >
                    {formatStatus(cumulative)}
                  </td>
                );
              })}
              <td className={cn(
                'px-3 py-2 text-center font-bold bg-muted/30',
                sectionCumulative > 0 && 'text-primary',
                sectionCumulative < 0 && 'text-blue-400',
                sectionCumulative === 0 && 'text-amber-400'
              )}>
                {formatStatus(sectionCumulative)}
              </td>
            </tr>

            {/* Press rows */}
            {childGames.map((press, index) => {
              const pressStartHole = press.startHole;
              const pressEndHole = press.endHole;

              return (
                <tr key={press.id} className="border-b border-border/30 text-xs bg-purple-500/5">
                  <td className="sticky left-0 z-10 bg-purple-500/10 backdrop-blur-sm py-2 pl-4 pr-2 font-semibold text-purple-400">
                    Press {index + 1}
                  </td>
                  {holes.map((hole) => {
                    const inPressRange = hole.number >= pressStartHole && hole.number <= pressEndHole;
                    const inSection = holes.some(h => h.number === hole.number);

                    if (!inPressRange || !inSection) {
                      return (
                        <td key={hole.number} className="px-2 py-2 text-center text-muted-foreground/30">
                          -
                        </td>
                      );
                    }

                    const cumulative = getCumulativeForRange(pressStartHole, hole.number);
                    const hasResult = holeResults.some(r => r.hole === hole.number);

                    if (!hasResult) {
                      return (
                        <td key={hole.number} className="px-2 py-2 text-center text-muted-foreground">
                          -
                        </td>
                      );
                    }

                    return (
                      <td
                        key={hole.number}
                        className={cn(
                          'px-2 py-2 text-center font-bold',
                          cumulative > 0 && 'text-primary',
                          cumulative < 0 && 'text-blue-400',
                          cumulative === 0 && 'text-purple-400'
                        )}
                      >
                        {formatStatus(cumulative)}
                      </td>
                    );
                  })}
                  {(() => {
                    const lastPressHoleInSection = Math.min(
                      pressEndHole,
                      Math.max(...holes.map(h => h.number))
                    );
                    const pressCumulative = getCumulativeForRange(pressStartHole, lastPressHoleInSection);
                    return (
                      <td className={cn(
                        'px-3 py-2 text-center font-bold bg-muted/30',
                        pressCumulative > 0 && 'text-primary',
                        pressCumulative < 0 && 'text-blue-400',
                        pressCumulative === 0 && 'text-purple-400'
                      )}>
                        {formatStatus(pressCumulative)}
                      </td>
                    );
                  })()}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
