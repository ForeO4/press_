'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlligatorIcon } from '@/components/ui/AlligatorIcon';
import { cn } from '@/lib/utils';
import { getHLTStandings, computeHLTSettlement, type HLTSettlement } from '@/lib/services/highLowTotal';
import type { Game, HLTTeamStanding } from '@/types';

interface Player {
  id: string;
  name: string;
}

interface HLTSettleModalProps {
  game: Game;
  players: Player[];
  teams: {
    team1: [string, string];
    team2: [string, string];
  };
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function HLTSettleModal({
  game,
  players,
  teams,
  onConfirm,
  onClose,
}: HLTSettleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [standings, setStandings] = useState<{ team1: HLTTeamStanding; team2: HLTTeamStanding } | null>(null);
  const [settlement, setSettlement] = useState<HLTSettlement | null>(null);
  const [loading, setLoading] = useState(true);

  // Load standings and settlement
  useEffect(() => {
    async function loadData() {
      try {
        const [standingsData, settlementData] = await Promise.all([
          getHLTStandings(game.id),
          computeHLTSettlement(game.id),
        ]);
        setStandings(standingsData);
        setSettlement(settlementData);
      } catch (err) {
        console.error('[HLTSettleModal] Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [game.id]);

  const getPlayerName = (id: string): string => {
    const player = players.find((p) => p.id === id);
    return player?.name ?? 'Unknown';
  };

  const getTeamPlayerNames = (playerIds: [string, string]): string => {
    return playerIds.map((id) => getPlayerName(id).split(' ')[0]).join(' & ');
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading results...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!standings || !settlement) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>End HLT Game</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Failed to load game results.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Calculate winner info
  const pointDiff = standings.team1.netPoints - standings.team2.netPoints;
  const isTied = pointDiff === 0;
  const winningTeam = pointDiff > 0 ? 1 : 2;
  const netAmount = Math.abs(pointDiff) * settlement.pointValue;
  const perPlayerAmount = netAmount / 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>End HLT Game</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Names Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 text-sm font-medium">
              <span className="text-blue-500">{getTeamPlayerNames(teams.team1)}</span>
              <span className="text-muted-foreground">vs</span>
              <span className="text-amber-500">{getTeamPlayerNames(teams.team2)}</span>
            </div>
          </div>

          {/* Points Table */}
          <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30">
                  <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="py-2 px-3 text-center text-xs font-medium text-blue-500">
                    Team 1
                  </th>
                  <th className="py-2 px-3 text-center text-xs font-medium text-amber-500">
                    Team 2
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/20">
                  <td className="py-2 px-3 text-sm">Low Ball</td>
                  <td className={cn(
                    'py-2 px-3 text-center font-medium',
                    standings.team1.lowBallPoints > standings.team2.lowBallPoints && 'text-blue-500'
                  )}>
                    {standings.team1.lowBallPoints}
                  </td>
                  <td className={cn(
                    'py-2 px-3 text-center font-medium',
                    standings.team2.lowBallPoints > standings.team1.lowBallPoints && 'text-amber-500'
                  )}>
                    {standings.team2.lowBallPoints}
                  </td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 px-3 text-sm">High Ball</td>
                  <td className={cn(
                    'py-2 px-3 text-center font-medium',
                    standings.team1.highBallPoints > standings.team2.highBallPoints && 'text-blue-500'
                  )}>
                    {standings.team1.highBallPoints}
                  </td>
                  <td className={cn(
                    'py-2 px-3 text-center font-medium',
                    standings.team2.highBallPoints > standings.team1.highBallPoints && 'text-amber-500'
                  )}>
                    {standings.team2.highBallPoints}
                  </td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="py-2 px-3 text-sm">Total</td>
                  <td className={cn(
                    'py-2 px-3 text-center font-medium',
                    standings.team1.totalPoints > standings.team2.totalPoints && 'text-blue-500'
                  )}>
                    {standings.team1.totalPoints}
                  </td>
                  <td className={cn(
                    'py-2 px-3 text-center font-medium',
                    standings.team2.totalPoints > standings.team1.totalPoints && 'text-amber-500'
                  )}>
                    {standings.team2.totalPoints}
                  </td>
                </tr>
                <tr className="bg-muted/20">
                  <td className="py-2 px-3 text-sm font-semibold">Total Points</td>
                  <td className={cn(
                    'py-2 px-3 text-center text-lg font-bold',
                    !isTied && winningTeam === 1 ? 'text-blue-500' : ''
                  )}>
                    {standings.team1.netPoints}
                  </td>
                  <td className={cn(
                    'py-2 px-3 text-center text-lg font-bold',
                    !isTied && winningTeam === 2 ? 'text-amber-500' : ''
                  )}>
                    {standings.team2.netPoints}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Settlement Summary */}
          <div className={cn(
            'rounded-xl border p-6',
            isTied
              ? 'border-amber-500/30 bg-amber-500/10'
              : 'border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5'
          )}>
            {isTied ? (
              <div className="text-center">
                <p className="text-lg font-semibold text-amber-400">Match Tied</p>
                <p className="text-sm text-muted-foreground mt-1">No bucks exchanged</p>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Team {winningTeam} wins {Math.abs(pointDiff)} point{Math.abs(pointDiff) !== 1 ? 's' : ''} net
                </p>
                <div className="flex items-center justify-center gap-2">
                  <AlligatorIcon size="lg" />
                  <span className="text-4xl font-bold text-primary">{netAmount}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ({settlement.pointValue} bucks x {Math.abs(pointDiff)} points)
                </p>
                <div className="pt-2 border-t border-border/30 mt-3">
                  <p className="text-sm text-muted-foreground">
                    Each player on Team {winningTeam} receives:
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <AlligatorIcon size="sm" />
                    <span className="text-xl font-semibold text-primary">{perPlayerAmount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Per-player breakdown */}
          {!isTied && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Settlement</h3>
              <div className="rounded-lg border border-border/50 bg-card/50 p-3 space-y-2">
                {/* Winning team */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {getPlayerName(winningTeam === 1 ? teams.team1[0] : teams.team2[0]).split(' ')[0]}
                  </span>
                  <span className="text-sm font-medium text-green-500">
                    +{perPlayerAmount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {getPlayerName(winningTeam === 1 ? teams.team1[1] : teams.team2[1]).split(' ')[0]}
                  </span>
                  <span className="text-sm font-medium text-green-500">
                    +{perPlayerAmount}
                  </span>
                </div>
                {/* Losing team */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {getPlayerName(winningTeam === 1 ? teams.team2[0] : teams.team1[0]).split(' ')[0]}
                  </span>
                  <span className="text-sm font-medium text-red-500">
                    -{perPlayerAmount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {getPlayerName(winningTeam === 1 ? teams.team2[1] : teams.team1[1]).split(' ')[0]}
                  </span>
                  <span className="text-sm font-medium text-red-500">
                    -{perPlayerAmount}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Ending...' : 'End Game'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
