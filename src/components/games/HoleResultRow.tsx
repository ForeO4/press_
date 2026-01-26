'use client';

import { cn } from '@/lib/utils';
import type { HoleSnapshot } from '@/types';
import type { HoleResult } from '@/lib/domain/settlement/computeSettlement';

interface HoleResultRowProps {
  holes: HoleSnapshot[];
  holeResults: HoleResult[];
  isHoleInRange: (holeNum: number) => boolean;
}

export function HoleResultRow({
  holes,
  holeResults,
  isHoleInRange,
}: HoleResultRowProps) {
  const getResult = (holeNum: number): HoleResult | undefined => {
    return holeResults.find((r) => r.hole === holeNum);
  };

  const getWinnerDisplay = (result: HoleResult | undefined): string => {
    if (!result) return '-';
    if (result.winner === 'A') return 'A';
    if (result.winner === 'B') return 'B';
    return '-'; // Changed from "=" to "-" for halved holes
  };

  const getWinnerColor = (result: HoleResult | undefined): string => {
    if (!result) return 'text-muted-foreground';
    if (result.winner === 'A' || result.winner === 'B') return 'text-amber-400 font-bold';
    return 'text-gray-400';
  };

  // Count wins for this section
  const sectionResults = holes
    .filter((h) => isHoleInRange(h.number))
    .map((h) => getResult(h.number))
    .filter(Boolean);

  const playerAWins = sectionResults.filter((r) => r?.winner === 'A').length;
  const playerBWins = sectionResults.filter((r) => r?.winner === 'B').length;
  const ties = sectionResults.filter((r) => r?.winner === 'tie').length;

  return (
    <tr className="text-xs">
      <td className="sticky left-0 z-10 bg-card/90 backdrop-blur-sm py-1.5 pl-4 pr-2 text-muted-foreground">
        Winner
      </td>
      {holes.map((hole) => {
        const result = getResult(hole.number);
        const inRange = isHoleInRange(hole.number);
        return (
          <td
            key={hole.number}
            className={cn(
              'px-2 py-1.5 text-center',
              !inRange && 'opacity-40',
              getWinnerColor(inRange ? result : undefined)
            )}
          >
            {inRange ? getWinnerDisplay(result) : '-'}
          </td>
        );
      })}
      <td className="px-3 py-1.5 text-center bg-muted/30">
        {(() => {
          const diff = playerAWins - playerBWins;
          if (diff === 0) return <span className="text-muted-foreground">AS</span>;
          // Gold highlight for winner (either direction)
          return <span className="text-amber-400 font-bold">{diff > 0 ? `+${diff}` : diff}</span>;
        })()}
      </td>
    </tr>
  );
}
