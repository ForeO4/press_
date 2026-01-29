'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, Trophy, Clock } from 'lucide-react';
import { GolfClubsIcon } from '@/components/ui/GolfClubsIcon';
import type { GameWithParticipants, PlayerProfile, GuestPlayer } from '@/types';

interface GamesTabContentProps {
  eventId: string;
  games: GameWithParticipants[];
  members: PlayerProfile[];
  guestPlayers?: GuestPlayer[];
  isLocked?: boolean;
  isLoading?: boolean;
}

const GAME_TYPE_LABELS: Record<string, string> = {
  match_play: 'Match Play',
  nassau: 'Nassau',
  skins: 'Skins',
};

export function GamesTabContent({
  eventId,
  games,
  members,
  guestPlayers = [],
  isLocked = false,
  isLoading = false,
}: GamesTabContentProps) {
  const getPlayerName = (playerId: string | null, guestPlayerId: string | null) => {
    if (playerId) {
      const member = members.find((m) => m.userId === playerId);
      return member?.name || 'Unknown';
    }
    if (guestPlayerId) {
      const guest = guestPlayers.find((g) => g.id === guestPlayerId);
      return guest?.name || 'Guest';
    }
    return 'Unknown';
  };

  const activeGames = games.filter((g) => g.status === 'active');
  const completedGames = games.filter((g) => g.status === 'complete');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-muted p-3">
            <div className="mb-2 h-4 w-24 rounded bg-muted-foreground/20" />
            <div className="h-3 w-32 rounded bg-muted-foreground/20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Game Button */}
      <Link href={`/event/${eventId}/games/new`}>
        <Button
          className="w-full"
          disabled={isLocked}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New Game
        </Button>
      </Link>

      {/* Active Games */}
      {activeGames.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <Clock className="h-3 w-3" />
            Active ({activeGames.length})
          </h3>
          <div className="space-y-2">
            {activeGames.map((game) => {
              const participants = game.participants;
              const playerNames = participants
                .map((p) => getPlayerName(p.userId, p.guestPlayerId))
                .join(' vs ');
              const pressCount = game.childGames?.length || 0;

              return (
                <Link key={game.id} href={`/event/${eventId}/game/${game.id}`}>
                  <div className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GolfClubsIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          {GAME_TYPE_LABELS[game.type] || game.type}
                        </span>
                      </div>
                      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-500">
                        Active
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {playerNames}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>{game.stakeTeethInt} Bucks</span>
                      <span>Holes {game.startHole}-{game.endHole}</span>
                      {pressCount > 0 && (
                        <span className="text-amber-500">
                          {pressCount} {pressCount === 1 ? 'press' : 'presses'}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Games */}
      {completedGames.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <Trophy className="h-3 w-3" />
            Completed ({completedGames.length})
          </h3>
          <div className="space-y-2">
            {completedGames.slice(0, 3).map((game) => {
              const participants = game.participants;
              const playerNames = participants
                .map((p) => getPlayerName(p.userId, p.guestPlayerId))
                .join(' vs ');

              return (
                <Link key={game.id} href={`/event/${eventId}/game/${game.id}`}>
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GolfClubsIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {GAME_TYPE_LABELS[game.type] || game.type}
                        </span>
                      </div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Complete
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {playerNames}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {games.length === 0 && (
        <div className="py-8 text-center">
          <GolfClubsIcon className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No games yet. Start a new game to get playing!
          </p>
        </div>
      )}

      {/* View All Link */}
      {games.length > 0 && (
        <div className="text-center">
          <Link href={`/event/${eventId}/games`}>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              View All Games
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
