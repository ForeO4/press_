'use client';

import { useState } from 'react';
import { ActiveGameCard } from './ActiveGameCard';
import { RecentGameCard } from './RecentGameCard';
import { GameSummaryHeader } from './GameSummaryHeader';
import { cn } from '@/lib/utils';
import type { GameWithParticipants, HoleScore } from '@/types';
import { Flame, ChevronDown, History } from 'lucide-react';
import { GolfClubsIcon } from '@/components/ui/GolfClubsIcon';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface GamesListProps {
  games: GameWithParticipants[];
  eventId?: string;
  scores?: Record<string, HoleScore[]>;
}

export function GamesList({ games, eventId, scores = {} }: GamesListProps) {
  const [showRecent, setShowRecent] = useState(true);

  // Separate games by status - only show parent games (not presses)
  const parentGames = games.filter((game) => game.parentGameId === null);
  const activeGames = parentGames.filter((game) => game.status === 'active');
  const completedGames = parentGames.filter((game) => game.status === 'complete');

  // Show only 3 most recent completed games
  const recentGames = completedGames.slice(0, 3);
  const hasMoreHistory = completedGames.length > 3;

  // Calculate totals for header
  const totalTeeth = games.reduce((sum, game) => sum + game.stakeTeethInt, 0);

  if (parentGames.length === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center py-20 text-center">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_60%)]" />

        <div className="relative">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            <GolfClubsIcon size="lg" className="text-primary/60" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">No games yet</h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            Create a game to start competing with your group and put some teeth on the line.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <GameSummaryHeader
        activeCount={activeGames.length}
        completedCount={completedGames.length}
        totalTeeth={totalTeeth}
      />

      {/* Active games section */}
      {activeGames.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            icon={<Flame className="h-4 w-4" />}
            iconColor="text-orange-400"
            title="Active Games"
            count={activeGames.length}
          />
          <div className="space-y-3">
            {activeGames.map((game, index) => (
              <div
                key={game.id}
                className="animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
                <ActiveGameCard
                  game={game}
                  eventId={eventId ?? ''}
                  scores={scores}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent games section */}
      {recentGames.length > 0 && (
        <section>
          <button
            onClick={() => setShowRecent(!showRecent)}
            className="flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-left transition-all duration-200 hover:bg-muted/10"
          >
            <SectionHeader
              icon={<History className="h-4 w-4" />}
              iconColor="text-muted-foreground"
              title="Recent"
              count={recentGames.length}
            />
            <div className={cn(
              'flex h-6 w-6 items-center justify-center rounded-lg bg-muted/20 transition-transform duration-200',
              showRecent && 'rotate-180'
            )}>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>

          <div className={cn(
            'grid transition-all duration-300 ease-out',
            showRecent ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}>
            <div className="overflow-hidden">
              <div className="mt-3 space-y-2 pt-1">
                {recentGames.map((game, index) => (
                  <div
                    key={game.id}
                    className={cn(
                      showRecent && 'animate-in fade-in slide-in-from-top-2'
                    )}
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                  >
                    <RecentGameCard
                      game={game}
                      eventId={eventId ?? ''}
                      scores={scores}
                    />
                  </div>
                ))}

                {/* View All History link */}
                {hasMoreHistory && (
                  <div className="pt-2 text-center">
                    <Link href={eventId ? `/event/${eventId}/games/history` : '#'}>
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <History className="mr-2 h-4 w-4" />
                        View All History ({completedGames.length})
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  count: number;
}

function SectionHeader({ icon, iconColor, title, count }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={iconColor}>{icon}</span>
      <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-md bg-muted/20 px-1.5 text-xs font-bold tabular-nums">
        {count}
      </span>
    </div>
  );
}
