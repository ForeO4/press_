'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, Check } from 'lucide-react';
import type { PlayerProfile } from '@/types';

interface PlayerWithStatus extends PlayerProfile {
  isActive?: boolean;
  currentHole?: number;
  score?: number; // Relative to par (negative = under par)
  isFinished?: boolean;
}

interface WhosPlayingModuleProps {
  players: PlayerWithStatus[];
  maxVisible?: number;
  isLoading?: boolean;
}

function PlayerAvatar({
  name,
  isActive = false,
  score,
  isFinished = false,
}: {
  name: string;
  isActive?: boolean;
  score?: number;
  isFinished?: boolean;
}) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  // Score badge styling
  const getScoreBadgeStyle = () => {
    if (score === undefined) return null;
    if (score < 0) return 'bg-green-500 text-white'; // Under par
    if (score > 0) return 'bg-red-500 text-white'; // Over par
    return 'bg-muted-foreground/80 text-white'; // Even par
  };

  const formatScore = (s: number) => {
    if (s === 0) return 'E';
    return s > 0 ? `+${s}` : `${s}`;
  };

  const scoreBadgeStyle = getScoreBadgeStyle();

  return (
    <div className="relative">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all ${
          isActive
            ? 'bg-green-500/20 text-green-500 ring-2 ring-green-500/50 animate-ring-pulse'
            : isFinished
            ? 'bg-muted text-muted-foreground ring-1 ring-muted-foreground/30'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {initial}
      </div>
      {/* Score badge overlay */}
      {score !== undefined && (
        <span
          className={`absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold ${scoreBadgeStyle} animate-badge-pop`}
        >
          {formatScore(score)}
        </span>
      )}
      {/* Finished checkmark */}
      {isFinished && score === undefined && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500 text-white">
          <Check className="h-2.5 w-2.5" />
        </span>
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

        <div className="flex items-center gap-2 flex-wrap">
          {visiblePlayers.map((player) => (
            <div key={player.userId} className="group relative">
              <PlayerAvatar
                name={player.name}
                isActive={player.isActive}
                score={player.score}
                isFinished={player.isFinished}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="rounded-lg bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-lg whitespace-nowrap border border-border">
                  <div className="font-medium">{player.name}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                    {player.isFinished ? (
                      <span className="text-green-500">Finished</span>
                    ) : player.isActive && player.currentHole ? (
                      <span className="text-green-500">On #{player.currentHole}</span>
                    ) : null}
                    {player.score !== undefined && (
                      <span className={player.score < 0 ? 'text-green-500' : player.score > 0 ? 'text-red-500' : ''}>
                        {player.score === 0 ? 'E' : player.score > 0 ? `+${player.score}` : player.score}
                      </span>
                    )}
                  </div>
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
