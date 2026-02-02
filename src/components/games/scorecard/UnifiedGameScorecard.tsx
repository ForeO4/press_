'use client';

import { cn } from '@/lib/utils';
import type { GameType, HoleSnapshot } from '@/types';
import { BaseScoreGrid } from './BaseScoreGrid';
import type { ScorecardPlayer, HoleIndicator, GameStanding } from './types';
import { useHighLowTotalComputation, HLTStandingsSummary } from './overlays/HighLowTotalOverlay';

interface UnifiedGameScorecardProps {
  gameId: string;
  gameType: GameType;
  players: ScorecardPlayer[];
  holes: HoleSnapshot[];
  startHole: number;
  endHole: number;
  gameSettings?: {
    // High-Low-Total settings
    tieRule?: 'push' | 'split' | 'carryover';
    isTeamMode?: boolean;
    pointValue?: number;
    teams?: { id: string; playerIds: string[] }[];
    // Skins settings
    skinValue?: number;
    carryover?: boolean;
    // Match play settings
    stakePerHole?: number;
  };
  onCellClick?: (playerId: string, holeNumber: number) => void;
  className?: string;
}

export function UnifiedGameScorecard({
  gameId,
  gameType,
  players,
  holes,
  startHole,
  endHole,
  gameSettings = {},
  onCellClick,
  className,
}: UnifiedGameScorecardProps) {
  // Compute indicators based on game type
  let indicators: Map<number, HoleIndicator[]> = new Map();
  let standings: GameStanding[] = [];
  let summaryComponent: React.ReactNode = null;

  // High-Low-Total computation
  if (gameType === 'high_low_total') {
    const hltResult = useHighLowTotalComputation({
      players,
      holes,
      startHole,
      endHole,
      tieRule: gameSettings.tieRule ?? 'push',
      isTeamMode: gameSettings.isTeamMode ?? false,
      pointValue: gameSettings.pointValue ?? 1,
      teams: gameSettings.teams,
    });

    indicators = hltResult.indicators;
    standings = hltResult.standings;
    summaryComponent = (
      <HLTStandingsSummary
        standings={hltResult.standings}
        isTeamMode={gameSettings.isTeamMode ?? false}
        pointValue={gameSettings.pointValue ?? 1}
        carryover={hltResult.carryover}
      />
    );
  }

  // TODO: Add computation hooks for other game types
  // if (gameType === 'skins') { ... }
  // if (gameType === 'match_play') { ... }
  // if (gameType === 'nassau') { ... }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Score Grid */}
      <BaseScoreGrid
        players={players}
        holes={holes}
        startHole={startHole}
        endHole={endHole}
        indicators={indicators}
        onCellClick={onCellClick}
      />

      {/* Game-specific summary */}
      {summaryComponent}
    </div>
  );
}

// Export types and components
export type { ScorecardPlayer, HoleIndicator, GameStanding } from './types';
