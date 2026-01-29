'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ChevronRight } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/services/leaderboard';

interface EventLeaderboardProps {
  eventId: string;
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  limit?: number;
}

export function EventLeaderboard({
  eventId,
  entries,
  isLoading = false,
  limit = 3,
}: EventLeaderboardProps) {
  const displayEntries = entries.slice(0, limit);

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}.`;
    }
  };

  const formatChange = (change: number) => {
    if (change === 0) return <span className="text-muted-foreground">E</span>;
    if (change > 0) return <span className="text-green-500">+{change}</span>;
    return <span className="text-red-500">{change}</span>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Leaderboard
        </CardTitle>
        <Link href={`/event/${eventId}/leaderboard`}>
          <Button variant="ghost" size="sm" className="text-xs gap-1">
            Full
            <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : displayEntries.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No leaderboard data yet. Play some games to see standings!
          </div>
        ) : (
          <div className="space-y-2">
            {displayEntries.map((entry) => (
              <div
                key={entry.userId}
                className="flex items-center justify-between py-1"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base w-6">{getRankEmoji(entry.rank)}</span>
                  <span className="font-medium text-foreground">{entry.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold">
                    {formatChange(entry.netChange)}
                  </span>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {entry.wins}-{entry.losses}-{entry.pushes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
