'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, Circle } from 'lucide-react';
import type { PlayerProfile } from '@/types';

interface PlayerWithStatus extends PlayerProfile {
  isActive?: boolean;
  currentHole?: number;
}

interface WhosPlayingModuleProps {
  players: PlayerWithStatus[];
  maxVisible?: number;
  isLoading?: boolean;
}

function PlayerAvatar({
  name,
  isActive = false,
}: {
  name: string;
  isActive?: boolean;
}) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="relative">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
          isActive
            ? 'bg-green-500/20 text-green-500 ring-2 ring-green-500/50'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {initial}
      </div>
      {isActive && (
        <Circle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 fill-green-500 text-green-500" />
      )}
    </div>
  );
}

export function WhosPlayingModule({
  players,
  maxVisible = 6,
  isLoading = false,
}: WhosPlayingModuleProps) {
  const visiblePlayers = players.slice(0, maxVisible);
  const remainingCount = players.length - maxVisible;
  const activePlayers = players.filter((p) => p.isActive);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Who's Playing</span>
          </div>
          <div className="flex items-center gap-1 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 w-8 rounded-full bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (players.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Who's Playing</span>
          </div>
          <p className="text-sm text-muted-foreground text-center py-2">
            No players yet
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
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Who's Playing</span>
          </div>
          {activePlayers.length > 0 && (
            <span className="text-xs text-green-500">
              {activePlayers.length} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {visiblePlayers.map((player) => (
            <div key={player.userId} className="group relative">
              <PlayerAvatar
                name={player.name}
                isActive={player.isActive}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                <div className="rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-lg whitespace-nowrap">
                  {player.name}
                  {player.isActive && player.currentHole && (
                    <span className="ml-1 text-green-500">
                      #{player.currentHole}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {remainingCount > 0 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              +{remainingCount}
            </div>
          )}
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          {players.length} {players.length === 1 ? 'member' : 'members'} total
        </div>
      </CardContent>
    </Card>
  );
}
