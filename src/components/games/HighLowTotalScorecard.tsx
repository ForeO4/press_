'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PlayerScore {
  playerId: string;
  playerName: string;
  grossScores: Record<number, number>;
  netScores: Record<number, number>;
}

interface HoleResult {
  hole: number;
  lowWinnerId: string | null;
  highLoserId: string | null;
  totalWinnerId: string | null;
  carryover: { low: number; high: number; total: number };
}

interface PlayerStanding {
  playerId: string;
  playerName: string;
  lowPoints: number;
  highPoints: number;
  totalPoints: number;
  netPoints: number;
  netValue: number;
}

interface HighLowTotalScorecardProps {
  players: PlayerScore[];
  holeResults: HoleResult[];
  standings: PlayerStanding[];
  isTeamMode: boolean;
  pointValue: number;
  holes?: number[]; // Which holes to display (default: 1-18)
}

export function HighLowTotalScorecard({
  players,
  holeResults,
  standings,
  isTeamMode,
  pointValue,
  holes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
}: HighLowTotalScorecardProps) {
  const getHoleResult = (hole: number) => holeResults.find((r) => r.hole === hole);

  // Get indicator for a player on a hole
  const getIndicator = (playerId: string, hole: number): { type: 'L' | 'H' | 'T' | null; isWin: boolean } => {
    const result = getHoleResult(hole);
    if (!result) return { type: null, isWin: false };

    if (result.lowWinnerId === playerId) {
      return { type: 'L', isWin: true };
    }
    if (result.highLoserId === playerId) {
      return { type: 'H', isWin: false };
    }
    if (result.totalWinnerId === playerId) {
      return { type: 'T', isWin: true };
    }
    return { type: null, isWin: false };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>High-Low-Total Scorecard</span>
          <span className="text-sm font-normal text-muted-foreground">
            {isTeamMode ? 'Team Mode' : 'Individual'} | {pointValue} per point
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Scorecard Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-1 font-medium text-muted-foreground">Player</th>
                {holes.map((hole) => (
                  <th key={hole} className="text-center py-2 px-1 font-medium text-muted-foreground w-8">
                    {hole}
                  </th>
                ))}
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">Net</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const standing = standings.find((s) => s.playerId === player.playerId);
                return (
                  <tr key={player.playerId} className="border-b border-border/30">
                    <td className="py-2 px-1">
                      <div className="font-medium">{player.playerName}</div>
                    </td>
                    {holes.map((hole) => {
                      const netScore = player.netScores[hole];
                      const indicator = getIndicator(player.playerId, hole);

                      return (
                        <td key={hole} className="text-center py-2 px-1">
                          {netScore !== undefined ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-foreground">{netScore}</span>
                              {indicator.type && (
                                <span
                                  className={cn(
                                    'text-[10px] font-bold rounded px-1',
                                    indicator.type === 'L' && 'bg-green-500/20 text-green-400',
                                    indicator.type === 'H' && 'bg-red-500/20 text-red-400',
                                    indicator.type === 'T' && 'bg-blue-500/20 text-blue-400'
                                  )}
                                >
                                  {indicator.type}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center py-2 px-2">
                      <span
                        className={cn(
                          'font-bold',
                          standing && standing.netPoints > 0 && 'text-green-400',
                          standing && standing.netPoints < 0 && 'text-red-400',
                          standing && standing.netPoints === 0 && 'text-muted-foreground'
                        )}
                      >
                        {standing
                          ? `${standing.netPoints >= 0 ? '+' : ''}${standing.netPoints}`
                          : '-'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="bg-green-500/20 text-green-400 font-bold rounded px-1">L</span>
            <span>Low Winner (+1)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-red-500/20 text-red-400 font-bold rounded px-1">H</span>
            <span>High Loser (-1)</span>
          </div>
          {isTeamMode && (
            <div className="flex items-center gap-1">
              <span className="bg-blue-500/20 text-blue-400 font-bold rounded px-1">T</span>
              <span>Total Winner (+1)</span>
            </div>
          )}
        </div>

        {/* Standings Summary */}
        <div className="mt-6 border-t border-border/50 pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Standings</h4>
          <div className="space-y-2">
            {standings.map((standing, index) => (
              <div
                key={standing.playerId}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg',
                  index === 0 && standing.netPoints > 0 && 'bg-green-500/10 border border-green-500/30',
                  standing.netPoints < 0 && 'bg-red-500/5 border border-red-500/20',
                  standing.netPoints === 0 && 'bg-muted/10 border border-muted/20'
                )}
              >
                <div>
                  <span className="font-medium">{standing.playerName}</span>
                  <div className="text-xs text-muted-foreground">
                    L: +{standing.lowPoints} | H: -{standing.highPoints}
                    {isTeamMode && ` | T: +${standing.totalPoints}`}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      'font-bold',
                      standing.netValue > 0 && 'text-green-400',
                      standing.netValue < 0 && 'text-red-400',
                      standing.netValue === 0 && 'text-muted-foreground'
                    )}
                  >
                    {standing.netValue >= 0 ? '+' : ''}
                    {standing.netValue}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ({standing.netPoints >= 0 ? '+' : ''}{standing.netPoints} pts)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
