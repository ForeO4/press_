'use client';

import { ScoreCell } from './ScoreCell';
import { useScorecardStore } from '@/stores/scorecardStore';
import { mockCourse } from '@/lib/mock/course';
import { cn } from '@/lib/utils';

interface ScorecardRowProps {
  playerId: string;
  playerName: string;
}

/**
 * Player row showing all 18 holes with Front/Back/Total summaries
 */
export function ScorecardRow({ playerId, playerName }: ScorecardRowProps) {
  const { scores } = useScorecardStore();
  const playerScores = scores[playerId] ?? {};

  // Calculate totals
  const frontNineTotal = Array.from({ length: 9 }, (_, i) => i + 1).reduce(
    (sum, hole) => sum + (playerScores[hole] ?? 0),
    0
  );

  const backNineTotal = Array.from({ length: 9 }, (_, i) => i + 10).reduce(
    (sum, hole) => sum + (playerScores[hole] ?? 0),
    0
  );

  const totalScore = frontNineTotal + backNineTotal;

  // Format score vs par
  const formatVsPar = (score: number, par: number): string => {
    if (score === 0) return '-';
    const diff = score - par;
    if (diff === 0) return 'E';
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  const totalVsPar = formatVsPar(totalScore, mockCourse.totalPar);

  return (
    <tr className="border-b last:border-0">
      {/* Sticky player name column */}
      <td className="sticky left-0 z-10 bg-background py-2 pr-2 font-medium whitespace-nowrap min-w-[80px]">
        <span className="text-sm">{playerName.split(' ')[0]}</span>
      </td>

      {/* Front 9 scores */}
      {Array.from({ length: 9 }, (_, i) => i + 1).map((hole) => (
        <td key={hole} className="p-0">
          <ScoreCell playerId={playerId} holeNumber={hole} />
        </td>
      ))}

      {/* OUT total */}
      <td className="px-2 py-2 text-center font-mono font-bold bg-muted/50 min-w-[44px]">
        {frontNineTotal || '-'}
      </td>

      {/* Back 9 scores */}
      {Array.from({ length: 9 }, (_, i) => i + 10).map((hole) => (
        <td key={hole} className="p-0">
          <ScoreCell playerId={playerId} holeNumber={hole} />
        </td>
      ))}

      {/* IN total */}
      <td className="px-2 py-2 text-center font-mono font-bold bg-muted/50 min-w-[44px]">
        {backNineTotal || '-'}
      </td>

      {/* TOTAL */}
      <td
        className={cn(
          'px-2 py-2 text-center font-mono font-bold bg-muted min-w-[52px]',
          totalScore > 0 && totalScore <= mockCourse.totalPar && 'text-green-600 dark:text-green-400',
          totalScore > mockCourse.totalPar && 'text-red-500'
        )}
      >
        {totalScore || '-'}
        {totalScore > 0 && (
          <span className="block text-xs opacity-75">{totalVsPar}</span>
        )}
      </td>
    </tr>
  );
}
