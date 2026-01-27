'use client';

import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';
import type { Game, HoleScore, HoleSnapshot, GameWithParticipants } from '@/types';
import {
  computeHoleResults,
  computeMatchResultForRange,
  type HoleResult,
  type MatchPlayResult,
} from '@/lib/domain/settlement/computeSettlement';

interface GameScorecardProps {
  game: Game;
  playerAId: string;
  playerBId: string;
  playerAName: string;
  playerBName: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
  playerAHandicap?: number; // Course handicap (e.g., 12)
  playerBHandicap?: number; // Course handicap (e.g., 8)
  holes: HoleSnapshot[];
  className?: string;
  onCellClick?: (playerId: string, holeNumber: number) => void;
  childGames?: GameWithParticipants[];
  canPress?: boolean;
  onPress?: (playerId: string) => void;
}

export function GameScorecard({
  game,
  playerAId,
  playerBId,
  playerAName,
  playerBName,
  playerAScores,
  playerBScores,
  playerAHandicap = 0,
  playerBHandicap = 0,
  holes,
  className,
  onCellClick,
  childGames = [],
  canPress = false,
  onPress,
}: GameScorecardProps) {
  // Helper to check if a player gets a stroke on a specific hole
  // Each player gets strokes on holes where the handicap index <= their course handicap
  const getsStrokeOnHole = (isPlayerA: boolean, holeHandicap: number): boolean => {
    if (isPlayerA) {
      return holeHandicap <= playerAHandicap;
    }
    return holeHandicap <= playerBHandicap;
  };

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

  // Get game type label for the tracking row
  const gameTypeLabel = game.type === 'nassau' ? 'Nassau' : game.type === 'skins' ? 'Skins' : 'Match';

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
        gameTypeLabel={gameTypeLabel}
        canPress={canPress}
        onPress={onPress}
        getsStrokeOnHole={getsStrokeOnHole}
        playerAHandicap={playerAHandicap}
        playerBHandicap={playerBHandicap}
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
        gameTypeLabel={gameTypeLabel}
        canPress={canPress}
        onPress={onPress}
        getsStrokeOnHole={getsStrokeOnHole}
        playerAHandicap={playerAHandicap}
        playerBHandicap={playerBHandicap}
      />

      {/* Match Stats */}
      {(() => {
        // Calculate match stats
        const holesWonA = holeResults.filter(r => r.winner === 'A').length;
        const holesWonB = holeResults.filter(r => r.winner === 'B').length;
        const holesTied = holeResults.filter(r => r.winner === 'tie').length;
        const holesPlayed = holeResults.length;
        const matchStatus = holesWonA - holesWonB;
        const matchStatusStr = matchStatus === 0 ? 'All Square' :
          matchStatus > 0 ? `${playerAName.split(' ')[0]} ${matchStatus} UP` :
          `${playerBName.split(' ')[0]} ${Math.abs(matchStatus)} UP`;

        // Nassau-specific calculations
        const isNassau = game.type === 'nassau';
        const front9Result = isNassau
          ? computeMatchResultForRange(playerAId, playerBId, playerAScores, playerBScores, 1, 9)
          : null;
        const back9Result = isNassau
          ? computeMatchResultForRange(playerAId, playerBId, playerAScores, playerBScores, 10, 18)
          : null;
        const overallResult = isNassau
          ? computeMatchResultForRange(playerAId, playerBId, playerAScores, playerBScores, 1, 18)
          : null;

        const formatNassauStatus = (result: MatchPlayResult, playerA: string, playerB: string) => {
          if (result.holesUp === 0) return 'AS';
          const winnerName = result.winnerId === playerAId ? playerA : playerB;
          return `${winnerName} ${result.holesUp}UP`;
        };

        return (
          <div className="rounded-xl border border-emerald-900/30 bg-gradient-to-br from-emerald-950 via-emerald-950/95 to-emerald-900/90 p-5 shadow-xl">
            <div className="grid grid-cols-2 gap-6">
              {/* Match Status */}
              {isNassau ? (
                <div className="col-span-2 pb-3 border-b border-emerald-800/50">
                  <div className="text-xs text-emerald-400/60 uppercase tracking-widest font-medium mb-3 text-center">Nassau Status</div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Front 9 */}
                    <div className="text-center p-2 rounded-lg bg-emerald-800/20">
                      <div className="text-xs text-emerald-400/60 mb-1">Front 9</div>
                      <div className={cn(
                        'text-sm font-black',
                        front9Result?.winnerId === playerAId && 'text-emerald-400',
                        front9Result?.winnerId === playerBId && 'text-amber-400',
                        !front9Result?.winnerId && 'text-white'
                      )}>
                        {front9Result ? formatNassauStatus(front9Result, playerAName.split(' ')[0], playerBName.split(' ')[0]) : '-'}
                      </div>
                    </div>
                    {/* Back 9 */}
                    <div className="text-center p-2 rounded-lg bg-emerald-800/20">
                      <div className="text-xs text-emerald-400/60 mb-1">Back 9</div>
                      <div className={cn(
                        'text-sm font-black',
                        back9Result?.winnerId === playerAId && 'text-emerald-400',
                        back9Result?.winnerId === playerBId && 'text-amber-400',
                        !back9Result?.winnerId && 'text-white'
                      )}>
                        {back9Result ? formatNassauStatus(back9Result, playerAName.split(' ')[0], playerBName.split(' ')[0]) : '-'}
                      </div>
                    </div>
                    {/* Overall */}
                    <div className="text-center p-2 rounded-lg bg-emerald-800/20">
                      <div className="text-xs text-emerald-400/60 mb-1">Overall</div>
                      <div className={cn(
                        'text-sm font-black',
                        overallResult?.winnerId === playerAId && 'text-emerald-400',
                        overallResult?.winnerId === playerBId && 'text-amber-400',
                        !overallResult?.winnerId && 'text-white'
                      )}>
                        {overallResult ? formatNassauStatus(overallResult, playerAName.split(' ')[0], playerBName.split(' ')[0]) : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="col-span-2 text-center pb-3 border-b border-emerald-800/50">
                  <div className="text-xs text-emerald-400/60 uppercase tracking-widest font-medium mb-1">Match Status</div>
                  <div className={cn(
                    'text-2xl font-black tracking-tight',
                    matchStatus > 0 && 'text-emerald-400',
                    matchStatus < 0 && 'text-amber-400',
                    matchStatus === 0 && 'text-white'
                  )}>
                    {matchStatusStr}
                  </div>
                </div>
              )}

              {/* Player A Stats */}
              <div className="space-y-3 p-3 rounded-lg bg-emerald-800/30 border border-emerald-700/30">
                <div className="text-base font-bold text-emerald-400">{playerAName.split(' ')[0]}</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-emerald-500/60 text-xs">Gross</div>
                    <div className="font-mono font-black text-xl text-white">{playerATotal ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-emerald-500/60 text-xs">Holes Won</div>
                    <div className="font-mono font-black text-xl text-white">{holesWonA}</div>
                  </div>
                </div>
              </div>

              {/* Player B Stats */}
              <div className="space-y-3 p-3 rounded-lg bg-amber-900/20 border border-amber-700/30">
                <div className="text-base font-bold text-amber-400">{playerBName.split(' ')[0]}</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-amber-500/60 text-xs">Gross</div>
                    <div className="font-mono font-black text-xl text-white">{playerBTotal ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-amber-500/60 text-xs">Holes Won</div>
                    <div className="font-mono font-black text-xl text-white">{holesWonB}</div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="col-span-2 pt-3 border-t border-emerald-800/50 flex justify-between text-xs text-emerald-600 font-medium">
                <span>Par: {totalPar}</span>
                <span>Holes Played: {holesPlayed}</span>
                <span>Halved: {holesTied}</span>
              </div>
            </div>
          </div>
        );
      })()}
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
  gameTypeLabel: string;
  canPress?: boolean;
  onPress?: (playerId: string) => void;
  getsStrokeOnHole?: (isPlayerA: boolean, holeHandicap: number) => boolean;
  playerAHandicap?: number;
  playerBHandicap?: number;
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
  gameTypeLabel,
  canPress = false,
  onPress,
  getsStrokeOnHole,
  playerAHandicap,
  playerBHandicap,
}: ScorecardSectionProps) {
  const getScore = (scores: HoleScore[], holeNum: number): number | null => {
    const score = scores.find((s) => s.holeNumber === holeNum);
    return score?.strokes ?? null;
  };

  // Score colors that work in both light and dark modes
  const getScoreStyle = (score: number | null, par: number, isWinner: boolean): string => {
    if (score === null) return 'text-slate-400';
    const diff = score - par;
    // Eagle or better - gold/yellow highlight
    if (diff <= -2) return 'text-amber-500 font-black';
    // Birdie - bright
    if (diff === -1) return 'text-emerald-500 dark:text-emerald-400 font-bold';
    // Par - normal
    if (diff === 0) return 'text-slate-700 dark:text-slate-200';
    // Bogey - slightly muted
    if (diff === 1) return 'text-slate-500 dark:text-slate-400';
    // Double+ - more muted
    return 'text-slate-400 dark:text-slate-500';
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
    <div className="rounded-xl border border-emerald-200/50 dark:border-emerald-900/30 overflow-hidden shadow-lg bg-white dark:bg-slate-900">
      {/* Section Header */}
      <div className="border-b border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/50 dark:to-slate-900 px-4 py-2.5">
        <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {/* Hole numbers */}
            <tr className="border-b border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/20">
              <th className="sticky left-0 z-10 bg-emerald-50/50 dark:bg-emerald-950/30 py-2.5 pl-4 pr-2 text-left font-bold text-emerald-700 dark:text-emerald-400 min-w-[120px]">
                Hole
              </th>
              {holes.map((hole) => (
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
              <th className="px-3 py-2.5 text-center font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-950/40 min-w-[56px]">
                {totalLabel}
              </th>
            </tr>

            {/* Par row */}
            <tr className="border-b border-emerald-100/50 dark:border-emerald-900/20 text-xs">
              <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 py-1.5 pl-4 pr-2 text-slate-500 dark:text-slate-500 font-medium">
                Par
              </td>
              {holes.map((hole) => (
                <td
                  key={hole.number}
                  className={cn(
                    'px-2 py-1.5 text-center text-slate-500 dark:text-slate-500',
                    !isHoleInRange(hole.number) && 'opacity-30'
                  )}
                >
                  {hole.par}
                </td>
              ))}
              <td className="px-3 py-1.5 text-center font-medium text-slate-600 dark:text-slate-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                {parTotal}
              </td>
            </tr>

            {/* Yardage row */}
            <tr className="border-b border-emerald-100/50 dark:border-emerald-900/20 text-xs">
              <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 py-1.5 pl-4 pr-2 text-slate-500 dark:text-slate-500 font-medium">
                Yards
              </td>
              {holes.map((hole) => (
                <td
                  key={hole.number}
                  className={cn(
                    'px-2 py-1.5 text-center text-slate-400 dark:text-slate-600',
                    !isHoleInRange(hole.number) && 'opacity-30'
                  )}
                >
                  {hole.yardage}
                </td>
              ))}
              <td className="px-3 py-1.5 text-center font-medium text-slate-500 dark:text-slate-500 bg-emerald-50/50 dark:bg-emerald-950/20">
                {holes.reduce((sum, h) => sum + h.yardage, 0)}
              </td>
            </tr>

            {/* Handicap row */}
            <tr className="border-b border-emerald-200/50 dark:border-emerald-900/30 text-xs">
              <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 py-1.5 pl-4 pr-2 text-slate-500 dark:text-slate-500 font-medium">
                Hdcp
              </td>
              {holes.map((hole) => (
                <td
                  key={hole.number}
                  className={cn(
                    'px-2 py-1.5 text-center text-slate-400 dark:text-slate-600',
                    !isHoleInRange(hole.number) && 'opacity-30'
                  )}
                >
                  {hole.handicap}
                </td>
              ))}
              <td className="px-3 py-1.5 text-center bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-400">-</td>
            </tr>
          </thead>

          <tbody>
            {/* Player A row */}
            <tr className="border-b border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-r from-emerald-50 via-emerald-50/50 to-transparent dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-transparent">
              <td className="sticky left-0 z-10 bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-950/60 dark:to-emerald-950/40 py-2.5 pl-4 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {playerAName.split(' ')[0]}
                    <span className="text-xs font-normal text-emerald-500 dark:text-emerald-600 ml-1">({playerAHandicap})</span>
                  </span>
                  {canPress && onPress && (
                    <button
                      onClick={() => onPress(playerAId)}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105"
                      title="Press"
                    >
                      <Flame className="h-3 w-3" />
                      <span>PRESS!</span>
                    </button>
                  )}
                </div>
              </td>
              {holes.map((hole) => {
                const score = getScore(playerAScores, hole.number);
                const inRange = isHoleInRange(hole.number);
                const winner = getHoleWinner(hole.number);
                const isWinner = winner === 'A' && score !== null;
                const getsStroke = getsStrokeOnHole?.(true, hole.handicap) ?? false;
                const netScore = score !== null && getsStroke ? score - 1 : null;
                return (
                  <td
                    key={hole.number}
                    onClick={onCellClick && inRange ? () => onCellClick(playerAId, hole.number) : undefined}
                    className={cn(
                      'px-0.5 py-2 text-center font-mono relative',
                      !inRange && 'opacity-30',
                      onCellClick && inRange && 'cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors'
                    )}
                  >
                    {/* Stroke dot indicator */}
                    {getsStroke && inRange && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/50" />
                    )}
                    <span
                      className={cn(
                        'inline-flex items-center justify-center rounded-lg w-9 h-8 text-sm',
                        getScoreStyle(getsStroke ? netScore : score, hole.par, isWinner),
                        isWinner && 'ring-2 ring-amber-400 bg-amber-100 dark:bg-amber-500/20 shadow-md shadow-amber-400/30'
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
                  </td>
                );
              })}
              <td className="px-3 py-2 text-center font-mono font-black text-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                {playerATotal ?? '-'}
              </td>
            </tr>

            {/* Player B row */}
            <tr className="border-b border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-r from-amber-50 via-amber-50/50 to-transparent dark:from-amber-950/30 dark:via-amber-950/15 dark:to-transparent">
              <td className="sticky left-0 z-10 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-950/50 dark:to-amber-950/30 py-2.5 pl-4 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {playerBName.split(' ')[0]}
                    <span className="text-xs font-normal text-amber-500 dark:text-amber-600 ml-1">({playerBHandicap})</span>
                  </span>
                  {canPress && onPress && (
                    <button
                      onClick={() => onPress(playerBId)}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105"
                      title="Press"
                    >
                      <Flame className="h-3 w-3" />
                      <span>PRESS!</span>
                    </button>
                  )}
                </div>
              </td>
              {holes.map((hole) => {
                const score = getScore(playerBScores, hole.number);
                const inRange = isHoleInRange(hole.number);
                const winner = getHoleWinner(hole.number);
                const isWinner = winner === 'B' && score !== null;
                const getsStroke = getsStrokeOnHole?.(false, hole.handicap) ?? false;
                const netScore = score !== null && getsStroke ? score - 1 : null;
                return (
                  <td
                    key={hole.number}
                    onClick={onCellClick && inRange ? () => onCellClick(playerBId, hole.number) : undefined}
                    className={cn(
                      'px-0.5 py-2 text-center font-mono relative',
                      !inRange && 'opacity-30',
                      onCellClick && inRange && 'cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors'
                    )}
                  >
                    {/* Stroke dot indicator */}
                    {getsStroke && inRange && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full shadow-sm shadow-amber-500/50" />
                    )}
                    <span
                      className={cn(
                        'inline-flex items-center justify-center rounded-lg w-9 h-8 text-sm',
                        getScoreStyle(getsStroke ? netScore : score, hole.par, isWinner),
                        isWinner && 'ring-2 ring-amber-400 bg-amber-100 dark:bg-amber-500/20 shadow-md shadow-amber-400/30'
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
                  </td>
                );
              })}
              <td className="px-3 py-2 text-center font-mono font-black text-lg bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                {playerBTotal ?? '-'}
              </td>
            </tr>

            {/* Match/Nassau row with cumulative +/- */}
            <tr className="border-b border-emerald-200/30 dark:border-emerald-900/30 text-xs bg-emerald-50/50 dark:bg-emerald-950/20">
              <td className="sticky left-0 z-10 bg-emerald-50 dark:bg-emerald-950/40 py-2.5 pl-4 pr-2 font-bold text-emerald-700 dark:text-emerald-500">
                {gameTypeLabel}
              </td>
              {holes.map((hole) => {
                const inRange = isHoleInRange(hole.number);
                if (!inRange) {
                  return (
                    <td key={hole.number} className="px-2 py-2.5 text-center opacity-30 text-slate-400">
                      -
                    </td>
                  );
                }
                const cumulative = getCumulativeStatus(hole.number);
                const hasResult = holeResults.some(r => r.hole === hole.number);
                if (!hasResult) {
                  return (
                    <td key={hole.number} className="px-2 py-2.5 text-center text-slate-400">
                      -
                    </td>
                  );
                }
                return (
                  <td
                    key={hole.number}
                    className={cn(
                      'px-2 py-2.5 text-center font-black',
                      cumulative > 0 && 'text-emerald-600 dark:text-emerald-400',
                      cumulative < 0 && 'text-amber-600 dark:text-amber-400',
                      cumulative === 0 && 'text-slate-400'
                    )}
                  >
                    {formatStatus(cumulative)}
                  </td>
                );
              })}
              <td className={cn(
                'px-3 py-2.5 text-center font-black text-sm bg-emerald-100/80 dark:bg-emerald-950/50',
                sectionCumulative > 0 && 'text-emerald-600 dark:text-emerald-400',
                sectionCumulative < 0 && 'text-amber-600 dark:text-amber-400',
                sectionCumulative === 0 && 'text-slate-500'
              )}>
                {formatStatus(sectionCumulative)}
              </td>
            </tr>

            {/* Press rows */}
            {childGames.map((press, index) => {
              const pressStartHole = press.startHole;
              const pressEndHole = press.endHole;

              return (
                <tr key={press.id} className="border-b border-amber-200/30 dark:border-amber-900/20 text-xs bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent">
                  <td className="sticky left-0 z-10 bg-amber-50 dark:bg-amber-950/30 py-2 pl-4 pr-2 font-bold text-amber-600 dark:text-amber-500">
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      Press {index + 1}
                    </span>
                  </td>
                  {holes.map((hole) => {
                    const inPressRange = hole.number >= pressStartHole && hole.number <= pressEndHole;
                    const inSection = holes.some(h => h.number === hole.number);

                    if (!inPressRange || !inSection) {
                      return (
                        <td key={hole.number} className="px-2 py-2 text-center text-slate-300 dark:text-slate-700">
                          -
                        </td>
                      );
                    }

                    const cumulative = getCumulativeForRange(pressStartHole, hole.number);
                    const hasResult = holeResults.some(r => r.hole === hole.number);

                    if (!hasResult) {
                      return (
                        <td key={hole.number} className="px-2 py-2 text-center text-slate-400">
                          -
                        </td>
                      );
                    }

                    return (
                      <td
                        key={hole.number}
                        className={cn(
                          'px-2 py-2 text-center font-black',
                          cumulative > 0 && 'text-emerald-600 dark:text-emerald-400',
                          cumulative < 0 && 'text-amber-600 dark:text-amber-400',
                          cumulative === 0 && 'text-slate-400'
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
                        'px-3 py-2 text-center font-black bg-amber-100/50 dark:bg-amber-950/30',
                        pressCumulative > 0 && 'text-emerald-600 dark:text-emerald-400',
                        pressCumulative < 0 && 'text-amber-600 dark:text-amber-400',
                        pressCumulative === 0 && 'text-amber-500'
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
