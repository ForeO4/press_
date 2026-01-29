'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { PlayerRoundStats, RecentGameResult } from '@/types';

interface StatsOverviewProps {
  lastRound: PlayerRoundStats | null;
  recentGame: RecentGameResult | null;
  currentUserId: string;
}

export function StatsOverview({ lastRound, recentGame, currentUserId }: StatsOverviewProps) {
  if (!lastRound && !recentGame) {
    return null;
  }

  const formatRelativeToPar = (score: number) => {
    if (score === 0) return 'E';
    return score > 0 ? `+${score}` : `${score}`;
  };

  const isWinner = recentGame && recentGame.winner.id === currentUserId;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="py-4">
        {lastRound && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Last Round
              </p>
              <p className="text-lg font-semibold text-foreground">
                {lastRound.courseName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {lastRound.totalScore}
              </p>
              <p className={`text-sm font-medium ${
                lastRound.relativeToPar < 0
                  ? 'text-green-500'
                  : lastRound.relativeToPar > 0
                    ? 'text-red-500'
                    : 'text-muted-foreground'
              }`}>
                {formatRelativeToPar(lastRound.relativeToPar)} ({lastRound.par} par)
              </p>
            </div>
          </div>
        )}

        {recentGame && (
          <div className={`${lastRound ? 'mt-3 pt-3 border-t border-border/50' : ''}`}>
            <p className="text-sm text-muted-foreground">
              {isWinner ? (
                <>
                  <span className="text-green-500 font-medium">Won</span>{' '}
                  <span className="font-semibold text-foreground">${recentGame.amount}</span>{' '}
                  vs {recentGame.loser.name}
                </>
              ) : (
                <>
                  <span className="text-red-500 font-medium">Lost</span>{' '}
                  <span className="font-semibold text-foreground">${recentGame.amount}</span>{' '}
                  to {recentGame.winner.name}
                </>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
