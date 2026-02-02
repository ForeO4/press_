'use client';

import { cn } from '@/lib/utils';
import type { GameType, HoleSnapshot } from '@/types';
import { BaseScoreGrid } from './BaseScoreGrid';
import type { ScorecardPlayer, HoleIndicator, GameStanding } from './types';
import { useHighLowTotalComputation, HLTStandingsSummary } from './overlays/HighLowTotalOverlay';
import { useSkinsComputation, SkinsStandingsSummary } from './overlays/SkinsOverlay';
import { useNassauComputation, NassauStatusSummary } from './overlays/NassauOverlay';

interface UnifiedGameScorecardProps {
  gameId: string;
  gameType: GameType;
  players: ScorecardPlayer[];
  holes: HoleSnapshot[];
  startHole: number;
  endHole: number;
  gameSettings?: {
    // High-Low-Total settings
    pointValue?: number;
    teams?: { id: string; playerIds: string[] }[];
    // Skins settings
    skinValue?: number;
    carryover?: boolean;
    // Match play / Nassau settings
    stakePerHole?: number;
    stakePerBet?: number;
    // Common settings
    scoringBasis?: 'net' | 'gross';
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
  let summaryComponent: React.ReactNode = null;

  // High-Low-Total computation
  if (gameType === 'high_low_total') {
    // Generate default teams if not provided (first 2 players vs last 2 players)
    const defaultTeams = gameSettings.teams ?? [
      { id: 'team1', playerIds: players.slice(0, 2).map(p => p.id) },
      { id: 'team2', playerIds: players.slice(2, 4).map(p => p.id) },
    ];

    const hltResult = useHighLowTotalComputation({
      players,
      holes,
      startHole,
      endHole,
      pointValue: gameSettings.pointValue ?? 10,
      teams: defaultTeams,
    });

    indicators = hltResult.indicators;
    summaryComponent = (
      <HLTStandingsSummary
        standings={hltResult.standings}
        pointValue={gameSettings.pointValue ?? 10}
        teamStandings={hltResult.teamStandings}
      />
    );
  }

  // Skins computation
  if (gameType === 'skins') {
    const skinsResult = useSkinsComputation({
      players,
      holes,
      startHole,
      endHole,
      skinValue: gameSettings.skinValue ?? 5,
      carryover: gameSettings.carryover ?? true,
      scoringBasis: gameSettings.scoringBasis ?? 'gross',
    });

    indicators = skinsResult.indicators;
    summaryComponent = (
      <SkinsStandingsSummary
        standings={skinsResult.standings}
        skinValue={gameSettings.skinValue ?? 5}
        currentCarryover={skinsResult.currentCarryover}
        holesWithCarryover={skinsResult.holesWithCarryover}
        playerCount={players.length}
      />
    );
  }

  // Nassau computation
  if (gameType === 'nassau') {
    const nassauResult = useNassauComputation({
      players,
      holes,
      startHole,
      endHole,
      stakePerBet: gameSettings.stakePerBet ?? 10,
      scoringBasis: gameSettings.scoringBasis ?? 'net',
    });

    indicators = nassauResult.indicators;
    summaryComponent = (
      <NassauStatusSummary
        frontStatus={nassauResult.frontStatus}
        backStatus={nassauResult.backStatus}
        overallStatus={nassauResult.overallStatus}
        playerA={nassauResult.playerA}
        playerB={nassauResult.playerB}
        stakePerBet={gameSettings.stakePerBet ?? 10}
        standings={nassauResult.standings}
      />
    );
  }

  // Match Play uses same logic as Nassau but simpler (single match)
  if (gameType === 'match_play') {
    const matchResult = useNassauComputation({
      players,
      holes,
      startHole,
      endHole,
      stakePerBet: gameSettings.stakePerHole ?? 10,
      scoringBasis: gameSettings.scoringBasis ?? 'net',
    });

    indicators = matchResult.indicators;
    // For match play, show a simpler summary based on overall status
    const overallStatus = matchResult.overallStatus;
    summaryComponent = (
      <div className="rounded-xl border border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20 p-5 shadow-xl">
        <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-medium mb-4 text-center">
          Match Play Status
        </div>

        <div className="text-center py-4">
          <div className={cn(
            'text-3xl font-black',
            overallStatus.holesUp > 0 && 'text-green-600 dark:text-green-400',
            overallStatus.holesUp < 0 && 'text-red-600 dark:text-red-400',
            overallStatus.holesUp === 0 && 'text-slate-500'
          )}>
            {overallStatus.description}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {overallStatus.holesPlayed} / {endHole - startHole + 1} holes played
          </div>
        </div>

        <div className="space-y-3 mt-4">
          {matchResult.standings.map((standing, index) => (
            <div
              key={standing.playerId}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                standing.value > 0 && 'bg-green-100/50 dark:bg-green-900/20 border border-green-300/50 dark:border-green-700/30',
                standing.value < 0 && 'bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/20',
                standing.value === 0 && 'bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30'
              )}
            >
              <div className="font-bold text-slate-800 dark:text-slate-200">{standing.playerName}</div>
              <div
                className={cn(
                  'text-xl font-black',
                  standing.value > 0 && 'text-green-600 dark:text-green-400',
                  standing.value < 0 && 'text-red-600 dark:text-red-400',
                  standing.value === 0 && 'text-slate-400'
                )}
              >
                {standing.value >= 0 ? '+' : ''}{standing.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-emerald-200/50 dark:border-emerald-800/30 flex justify-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold rounded px-1.5 py-0.5">W</span>
            <span>Hole won</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-slate-500/20 text-slate-600 dark:text-slate-400 font-bold rounded px-1.5 py-0.5">L</span>
            <span>Hole lost</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-slate-300/30 text-slate-500 dark:text-slate-400 font-bold rounded px-1.5 py-0.5">-</span>
            <span>Halved</span>
          </div>
        </div>
      </div>
    );
  }

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
