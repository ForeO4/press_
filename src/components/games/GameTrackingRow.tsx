'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { gameTypePillStyles } from '@/lib/design/colors';
import type { GameType, HoleScore } from '@/types';
import type { HoleResult } from '@/lib/domain/settlement/computeSettlement';

interface GameTrackingRowProps {
  type: GameType;
  label: string;
  startHole: number;
  endHole: number;
  holeResults: HoleResult[];
  currentStatus: string;
  statusColor?: string;
  isPress?: boolean;
  pressMultiplier?: number;
}

export function GameTrackingRow({
  type,
  label,
  startHole,
  endHole,
  holeResults,
  currentStatus,
  statusColor = 'text-foreground',
  isPress = false,
  pressMultiplier,
}: GameTrackingRowProps) {
  const [showPerHole, setShowPerHole] = useState(false);
  const styles = gameTypePillStyles[type];

  // Get result for a specific hole
  const getHoleResult = (holeNum: number): HoleResult | undefined => {
    return holeResults.find((r) => r.hole === holeNum);
  };

  // Get display symbol for hole result
  const getHoleDisplay = (holeNum: number): string => {
    const result = getHoleResult(holeNum);
    if (!result) return '_';
    if (result.winner === 'A') return showPerHole ? 'A' : '+1';
    if (result.winner === 'B') return showPerHole ? 'B' : '-1';
    return '-'; // Changed from "=" to "-" per spec
  };

  // Get color for hole result
  const getHoleColor = (holeNum: number): string => {
    const result = getHoleResult(holeNum);
    if (!result) return 'text-muted-foreground';
    if (result.winner === 'A') return 'text-green-500';
    if (result.winner === 'B') return 'text-red-500';
    return 'text-muted-foreground';
  };

  // Calculate cumulative for per-hole mode
  const getCumulativeDisplay = (holeNum: number): string => {
    let cumulative = 0;
    for (const result of holeResults) {
      if (result.hole <= holeNum) {
        if (result.winner === 'A') cumulative++;
        else if (result.winner === 'B') cumulative--;
      }
    }
    if (cumulative === 0) return 'AS';
    return cumulative > 0 ? `+${cumulative}` : String(cumulative);
  };

  const holes = Array.from(
    { length: endHole - startHole + 1 },
    (_, i) => startHole + i
  );

  // Determine if this is front 9 or back 9
  const isFrontNine = startHole <= 9 && endHole <= 9;
  const isBackNine = startHole >= 10;
  const displayHoles = isFrontNine
    ? holes
    : isBackNine
    ? holes
    : holes.slice(0, 9); // Show first 9 if full 18

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors',
        isPress ? 'border-purple-500/30 bg-purple-500/5' : 'border-border/30 bg-card/30'
      )}
    >
      {/* Header with label and status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              isPress ? 'bg-purple-500/20 text-purple-400' : cn(styles.background, styles.text)
            )}
          >
            {label}
            {pressMultiplier && pressMultiplier > 1 && ` (${pressMultiplier}x)`}
          </span>
        </div>
        <button
          onClick={() => setShowPerHole(!showPerHole)}
          className={cn('font-semibold text-sm', statusColor)}
        >
          {currentStatus}
        </button>
      </div>

      {/* Hole-by-hole results */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {displayHoles.map((holeNum) => (
          <div
            key={holeNum}
            className="flex flex-col items-center min-w-[24px]"
          >
            <span className="text-[10px] text-muted-foreground">{holeNum}</span>
            <span
              className={cn(
                'text-xs font-mono font-medium',
                getHoleColor(holeNum)
              )}
            >
              {showPerHole ? getCumulativeDisplay(holeNum) : getHoleDisplay(holeNum)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
