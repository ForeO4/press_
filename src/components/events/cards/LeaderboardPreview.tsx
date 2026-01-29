'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/services/leaderboard';

interface LeaderboardPreviewProps {
  eventId: string;
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  limit?: number;
}

export function LeaderboardPreview({
  eventId,
  entries,
  isLoading = false,
  limit = 3,
}: LeaderboardPreviewProps) {
  const topEntries = entries.slice(0, limit);

  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-amber-500/20 text-amber-500';
      case 2:
        return 'bg-slate-400/20 text-slate-400';
      case 3:
        return 'bg-orange-600/20 text-orange-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreDisplay = (entry: LeaderboardEntry) => {
    const diff = entry.netChange;
    if (diff === 0)
      return { text: 'E', icon: Minus, color: 'text-muted-foreground' };
    if (diff > 0)
      return {
        text: `+${diff}`,
        icon: TrendingUp,
        color: 'text-green-500',
      };
    return { text: `${diff}`, icon: TrendingDown, color: 'text-red-500' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Leaderboard</span>
          </div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 animate-pulse">
                <div className="h-6 w-6 rounded-full bg-muted" />
                <div className="flex-1 h-4 rounded bg-muted" />
                <div className="h-4 w-8 rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topEntries.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Leaderboard</span>
          </div>
          <p className="text-sm text-muted-foreground text-center py-2">
            No scores yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Leaderboard</span>
          </div>
        </div>

        <div className="space-y-2">
          {topEntries.map((entry) => {
            const score = getScoreDisplay(entry);
            const ScoreIcon = score.icon;

            return (
              <div
                key={entry.userId}
                className="flex items-center gap-2 rounded-lg bg-muted/30 p-2"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${getPositionStyle(
                    entry.rank
                  )}`}
                >
                  {entry.rank}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-foreground">
                  {entry.name}
                </span>
                <div className={`flex items-center gap-1 ${score.color}`}>
                  <ScoreIcon className="h-3 w-3" />
                  <span className="text-sm font-semibold">{score.text}</span>
                </div>
              </div>
            );
          })}
        </div>

        {entries.length > limit && (
          <div className="mt-3 text-center">
            <Link href={`/event/${eventId}/leaderboard`}>
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View Full Leaderboard
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
