'use client';

import { cn } from '@/lib/utils';
import { useScorecardStore } from '@/stores/scorecardStore';
import { getHolePar } from '@/lib/mock/course';

interface ScoreCellProps {
  playerId: string;
  holeNumber: number;
}

/**
 * Tappable score cell with par-relative coloring
 */
export function ScoreCell({ playerId, holeNumber }: ScoreCellProps) {
  const { scores, selectedCell, selectCell } = useScorecardStore();

  const score = scores[playerId]?.[holeNumber] ?? null;
  const par = getHolePar(holeNumber);
  const isSelected =
    selectedCell?.playerId === playerId &&
    selectedCell?.holeNumber === holeNumber;

  const handleClick = () => {
    selectCell(playerId, holeNumber);
  };

  // Determine score color based on relation to par
  const getScoreColor = () => {
    if (score === null) return '';

    const diff = score - par;
    if (diff <= -2) return 'text-green-600 dark:text-green-400 font-bold'; // Eagle or better
    if (diff === -1) return 'text-green-600 dark:text-green-400'; // Birdie
    if (diff === 0) return ''; // Par
    if (diff === 1) return 'text-red-500 dark:text-red-400'; // Bogey
    return 'text-red-600 dark:text-red-500 font-bold'; // Double+ bogey
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'min-w-[44px] h-[44px] px-2 py-2 text-center font-mono text-sm',
        'transition-all duration-150 ease-in-out',
        'hover:bg-accent/50 active:scale-95',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected && 'ring-2 ring-primary bg-primary/10 scale-105',
        getScoreColor()
      )}
      aria-label={`Hole ${holeNumber} score: ${score ?? 'empty'}`}
    >
      {score ?? '-'}
    </button>
  );
}
