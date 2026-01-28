'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { GameTypePill } from '@/components/ui/StatusPill';
import { AlligatorIcon } from '@/components/ui/AlligatorIcon';
import { MatchProgress } from './MatchProgress';
import { cn } from '@/lib/utils';
import type { GameWithParticipants, HoleScore } from '@/types';
import { getParticipantPlayerId } from '@/types';

interface GameDetailHeaderProps {
  game: GameWithParticipants;
  eventId: string;
  playerAName: string;
  playerBName: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
}

export function GameDetailHeader({
  game,
  eventId,
  playerAName,
  playerBName,
  playerAScores,
  playerBScores,
}: GameDetailHeaderProps) {
  const playerA = game.participants[0];
  const playerB = game.participants[1];
  const playerAId = playerA ? getParticipantPlayerId(playerA) : '';
  const playerBId = playerB ? getParticipantPlayerId(playerB) : '';
  const isPress = game.parentGameId !== null;
  const isMatchPlay = game.type === 'match_play';

  const holeRange =
    game.startHole === 1 && game.endHole === 18
      ? 'Full 18'
      : `Holes ${game.startHole}-${game.endHole}`;

  return (
    <div className="space-y-6">
      {/* Back button and game type header */}
      <div className="flex items-center justify-between">
        <Link href={`/event/${eventId}/games`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Games
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <GameTypePill type={game.type} isPress={isPress} />
          {game.stakeTeethInt > 0 && (
            <div className="flex items-center gap-1.5 text-primary">
              <AlligatorIcon size="md" />
              <span className="font-bold tabular-nums">{game.stakeTeethInt}</span>
            </div>
          )}
        </div>
      </div>

      {/* Players and match status */}
      <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Player A */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <PlayerAvatar name={playerAName} size="lg" color="primary" />
            <div className="text-center sm:text-left">
              <div className="text-lg font-semibold">{playerAName}</div>
              <div className="text-xs text-muted-foreground">{holeRange}</div>
            </div>
          </div>

          {/* VS indicator / Match Status */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-2xl font-bold text-muted-foreground/50">vs</div>
            {game.status === 'active' && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
            )}
          </div>

          {/* Player B */}
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <PlayerAvatar name={playerBName} size="lg" color="secondary" />
            <div className="text-center sm:text-right">
              <div className="text-lg font-semibold">{playerBName}</div>
              <div className="text-xs text-muted-foreground">{holeRange}</div>
            </div>
          </div>
        </div>

        {/* Match progress for match play games */}
        {isMatchPlay && playerAId && playerBId && (
          <div className="mt-6 border-t border-border/30 pt-6">
            <MatchProgress
              game={game}
              playerAId={playerAId}
              playerBId={playerBId}
              playerAScores={playerAScores}
              playerBScores={playerBScores}
              playerAName={playerAName}
              playerBName={playerBName}
              showDots={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
