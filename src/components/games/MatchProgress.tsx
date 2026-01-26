'use client';

import { cn } from '@/lib/utils';
import {
  computeHoleResults,
  computeMatchPlayResult,
  type HoleResult,
} from '@/lib/domain/settlement/computeSettlement';
import type { Game, HoleScore } from '@/types';
import { holeDotColors } from '@/lib/design/colors';

interface MatchProgressProps {
  game: Game;
  playerAId: string;
  playerBId: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
  playerAName: string;
  playerBName: string;
  showDots?: boolean;
  className?: string;
}

export function MatchProgress({
  game,
  playerAId,
  playerBId,
  playerAScores,
  playerBScores,
  playerAName,
  playerBName,
  showDots = true,
  className,
}: MatchProgressProps) {
  const holeResults = computeHoleResults(
    game,
    playerAId,
    playerBId,
    playerAScores,
    playerBScores
  );

  const matchResult = computeMatchPlayResult(playerAId, playerBId, holeResults);
  const holesPlayed = holeResults.length;
  const totalHoles = game.endHole - game.startHole + 1;

  // Determine match status
  const getStatusInfo = () => {
    if (holesPlayed === 0) {
      return {
        text: 'Not started',
        isWinning: null,
        statusClass: 'text-muted-foreground',
      };
    }

    if (matchResult.holesUp === 0) {
      return {
        text: `All Square thru ${holesPlayed}`,
        isWinning: null,
        statusClass: 'text-amber-400',
      };
    }

    const winnerName =
      matchResult.winnerId === playerAId ? playerAName : playerBName;
    const firstName = winnerName.split(' ')[0];

    return {
      text: `${firstName} ${matchResult.holesUp} UP thru ${holesPlayed}`,
      isWinning: matchResult.winnerId === playerAId,
      statusClass:
        matchResult.winnerId === playerAId ? 'text-green-400' : 'text-red-400',
    };
  };

  const { text, statusClass } = getStatusInfo();

  return (
    <div className={cn('space-y-2', className)}>
      {/* Status text */}
      <div className={cn('text-sm font-semibold', statusClass)}>{text}</div>

      {/* Progress bar visualization */}
      {showDots && (
        <div className="flex items-center gap-1">
          <ProgressBar
            holeResults={holeResults}
            totalHoles={totalHoles}
            startHole={game.startHole}
            playerAId={playerAId}
          />
        </div>
      )}
    </div>
  );
}

interface ProgressBarProps {
  holeResults: HoleResult[];
  totalHoles: number;
  startHole: number;
  playerAId: string;
}

function ProgressBar({
  holeResults,
  totalHoles,
  startHole,
  playerAId,
}: ProgressBarProps) {
  return (
    <div className="flex w-full gap-0.5">
      {Array.from({ length: totalHoles }, (_, i) => {
        const holeNumber = startHole + i;
        const result = holeResults.find((r) => r.hole === holeNumber);

        return (
          <HoleSegment
            key={holeNumber}
            holeNumber={holeNumber}
            result={result}
            playerAId={playerAId}
            isFirst={i === 0}
            isLast={i === totalHoles - 1}
          />
        );
      })}
    </div>
  );
}

interface HoleSegmentProps {
  holeNumber: number;
  result: HoleResult | undefined;
  playerAId: string;
  isFirst: boolean;
  isLast: boolean;
}

function HoleSegment({ holeNumber, result, playerAId, isFirst, isLast }: HoleSegmentProps) {
  const getColorClass = () => {
    if (!result) return 'bg-muted/30';
    if (result.winner === 'tie') return 'bg-gray-500';
    if (result.winner === 'A') return 'bg-green-500';
    return 'bg-red-500';
  };

  return (
    <div
      className={cn(
        'h-2 flex-1 transition-colors',
        getColorClass(),
        isFirst && 'rounded-l-full',
        isLast && 'rounded-r-full'
      )}
      title={`Hole ${holeNumber}`}
    />
  );
}

// Compact inline version for card headers
interface MatchProgressCompactProps {
  game: Game;
  playerAId: string;
  playerBId: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
  playerAName: string;
  playerBName: string;
}

export function MatchProgressCompact({
  game,
  playerAId,
  playerBId,
  playerAScores,
  playerBScores,
  playerAName,
  playerBName,
}: MatchProgressCompactProps) {
  const holeResults = computeHoleResults(
    game,
    playerAId,
    playerBId,
    playerAScores,
    playerBScores
  );

  const matchResult = computeMatchPlayResult(playerAId, playerBId, holeResults);
  const holesPlayed = holeResults.length;

  if (holesPlayed === 0) {
    return <span className="text-xs text-muted-foreground">Not started</span>;
  }

  if (matchResult.holesUp === 0) {
    return (
      <span className="text-xs font-medium text-amber-400">
        AS thru {holesPlayed}
      </span>
    );
  }

  const winnerName =
    matchResult.winnerId === playerAId ? playerAName : playerBName;
  const firstName = winnerName.split(' ')[0];
  const isPlayerAWinning = matchResult.winnerId === playerAId;

  return (
    <span
      className={cn(
        'text-xs font-medium',
        isPlayerAWinning ? 'text-green-400' : 'text-red-400'
      )}
    >
      {firstName} {matchResult.holesUp} UP thru {holesPlayed}
    </span>
  );
}

// Hole dots version (original style with numbered circles)
interface MatchProgressDotsProps {
  game: Game;
  playerAId: string;
  playerBId: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
}

export function MatchProgressDots({
  game,
  playerAId,
  playerBId,
  playerAScores,
  playerBScores,
}: MatchProgressDotsProps) {
  const holeResults = computeHoleResults(
    game,
    playerAId,
    playerBId,
    playerAScores,
    playerBScores
  );

  const totalHoles = game.endHole - game.startHole + 1;

  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: totalHoles }, (_, i) => {
        const holeNumber = game.startHole + i;
        const result = holeResults.find((r) => r.hole === holeNumber);

        return (
          <HoleDot
            key={holeNumber}
            holeNumber={holeNumber}
            result={result}
            playerAId={playerAId}
          />
        );
      })}
    </div>
  );
}

interface HoleDotProps {
  holeNumber: number;
  result: HoleResult | undefined;
  playerAId: string;
}

function HoleDot({ holeNumber, result }: HoleDotProps) {
  const getColorClass = () => {
    if (!result) return holeDotColors.unplayed;
    if (result.winner === 'tie') return holeDotColors.tied;
    if (result.winner === 'A') return holeDotColors.playerAWon;
    return holeDotColors.playerBWon;
  };

  return (
    <div
      className={cn(
        'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium',
        getColorClass()
      )}
      title={`Hole ${holeNumber}`}
    >
      {holeNumber}
    </div>
  );
}
