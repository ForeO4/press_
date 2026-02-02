import type { GameType, HoleSnapshot, HoleScore } from '@/types';

/** Player data for scorecard display */
export interface ScorecardPlayer {
  id: string;
  name: string;
  scores: HoleScore[];
  handicap: number;
  teamId?: string; // For team games
}

/** Game indicator for a specific hole */
export interface HoleIndicator {
  playerId: string;
  type: 'win' | 'loss' | 'tie' | 'low' | 'high' | 'total' | 'skin' | 'carryover';
  label: string;
  value?: number; // Points or skins value
}

/** Props for game-specific overlay components */
export interface GameOverlayProps {
  gameType: GameType;
  players: ScorecardPlayer[];
  holes: HoleSnapshot[];
  startHole: number;
  endHole: number;
  gameSettings?: Record<string, unknown>;
  onIndicatorsComputed?: (indicators: Map<number, HoleIndicator[]>) => void;
}

/** Computed result for a single hole */
export interface HoleGameResult {
  hole: number;
  indicators: HoleIndicator[];
  notes?: string;
}

/** Standing for game summary display */
export interface GameStanding {
  playerId: string;
  playerName: string;
  points: number;
  value: number;
  breakdown?: Record<string, number>;
}

/** Props for the unified scorecard */
export interface UnifiedScorecardProps {
  gameId: string;
  gameType: GameType;
  players: ScorecardPlayer[];
  holes: HoleSnapshot[];
  startHole: number;
  endHole: number;
  gameSettings?: Record<string, unknown>;
  onCellClick?: (playerId: string, holeNumber: number) => void;
  className?: string;
}
