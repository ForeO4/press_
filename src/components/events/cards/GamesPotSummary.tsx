'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, ChevronRight, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { GolfClubsIcon } from '@/components/ui/GolfClubsIcon';
import type { GameWithParticipants } from '@/types';

interface GamesPotSummaryProps {
  eventId: string;
  games: GameWithParticipants[];
  userBalance?: number;
  isLoading?: boolean;
}

export function GamesPotSummary({
  eventId,
  games,
  userBalance = 0,
  isLoading = false,
}: GamesPotSummaryProps) {
  const activeGames = games.filter((g) => g.status === 'active');
  const completedGames = games.filter((g) => g.status === 'complete');

  // Calculate total pot (sum of all stakes)
  const totalPot = games.reduce((sum, g) => {
    let gameTotal = g.stakeTeethInt;
    if (g.childGames) {
      gameTotal += g.childGames.reduce((s, c) => s + c.stakeTeethInt, 0);
    }
    return sum + gameTotal;
  }, 0);

  // Count total presses
  const totalPresses = games.reduce(
    (sum, g) => sum + (g.childGames?.length || 0),
    0
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <GolfClubsIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Games</span>
          </div>
          <div className="grid grid-cols-3 gap-2 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-6 w-12 mx-auto rounded bg-muted" />
                <div className="h-3 w-10 mx-auto mt-1 rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GolfClubsIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Games</span>
          </div>
          {activeGames.length > 0 && (
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-500">
              {activeGames.length} Active
            </span>
          )}
        </div>

        {games.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No games yet
          </p>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/30 p-2">
                <div className="text-lg font-bold text-foreground">
                  {totalPot}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Total Pot
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-2">
                <div className="text-lg font-bold text-foreground">
                  {activeGames.length}
                </div>
                <div className="text-[10px] text-muted-foreground">Active</div>
              </div>
              <div className="rounded-lg bg-muted/30 p-2">
                <div className="text-lg font-bold text-amber-500">
                  {totalPresses}
                </div>
                <div className="text-[10px] text-muted-foreground">Presses</div>
              </div>
            </div>

            {/* User Balance (if provided) */}
            {userBalance !== 0 && (
              <div
                className={`mt-3 flex items-center justify-center gap-1 text-sm font-medium ${
                  userBalance > 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {userBalance > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  You're {userBalance > 0 ? '+' : ''}
                  {userBalance} Bucks
                </span>
              </div>
            )}
          </>
        )}

        <div className="mt-3 text-center">
          <Link href={`/event/${eventId}/games`}>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              {games.length === 0 ? 'Start a Game' : 'View All Games'}
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
