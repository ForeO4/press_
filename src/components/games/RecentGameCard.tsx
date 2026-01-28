'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { GameTypePill } from '@/components/ui/StatusPill';
import { AlligatorIcon } from '@/components/ui/AlligatorIcon';
import { cn } from '@/lib/utils';
import type { GameWithParticipants, HoleScore } from '@/types';
import { getParticipantPlayerId } from '@/types';
import { mockUsers } from '@/lib/mock/users';
import { Calendar, ChevronRight } from 'lucide-react';
import {
  computeHoleResults,
  computeMatchPlayResult,
} from '@/lib/domain/settlement/computeSettlement';

interface RecentGameCardProps {
  game: GameWithParticipants;
  eventId: string;
  scores?: Record<string, HoleScore[]>;
}

export function RecentGameCard({
  game,
  eventId,
  scores = {},
}: RecentGameCardProps) {
  // Get player info
  const playerA = game.participants[0];
  const playerB = game.participants[1];
  const playerAId = playerA ? getParticipantPlayerId(playerA) : '';
  const playerBId = playerB ? getParticipantPlayerId(playerB) : '';
  const playerAUser = playerA
    ? mockUsers.find((u) => u.id === playerAId)
    : null;
  const playerBUser = playerB
    ? mockUsers.find((u) => u.id === playerBId)
    : null;
  const playerAName = playerAUser?.name ?? 'Player A';
  const playerBName = playerBUser?.name ?? 'Player B';
  const playerAScores = playerAId ? (scores[playerAId] ?? []) : [];
  const playerBScores = playerBId ? (scores[playerBId] ?? []) : [];

  const isPress = game.parentGameId !== null;
  const isMatchPlay = game.type === 'match_play';

  // Calculate result
  const getResult = () => {
    if (!playerAId || !playerBId) return null;

    const holeResults = computeHoleResults(
      game,
      playerAId,
      playerBId,
      playerAScores,
      playerBScores
    );

    if (holeResults.length === 0) return { text: 'No result', teethWon: 0, winnerId: null };

    const matchResult = computeMatchPlayResult(
      playerAId,
      playerBId,
      holeResults
    );

    if (matchResult.holesUp === 0) {
      return { text: 'Halved', teethWon: 0, winnerId: null };
    }

    const winnerName = matchResult.winnerId === playerAId
      ? playerAName.split(' ')[0]
      : playerBName.split(' ')[0];

    const holesRemaining = (game.endHole - game.startHole + 1) - holeResults.length;

    let resultText: string;
    if (holesRemaining > 0 && matchResult.holesUp > holesRemaining) {
      // Match ended early
      resultText = `${winnerName} wins ${matchResult.holesUp}&${holesRemaining}`;
    } else if (holesRemaining === 0) {
      resultText = `${winnerName} wins ${matchResult.holesUp} UP`;
    } else {
      resultText = `${winnerName} +${matchResult.holesUp}`;
    }

    const teethWon = game.stakeTeethInt * matchResult.holesUp;

    return {
      text: resultText,
      teethWon,
      winnerId: matchResult.winnerId,
    };
  };

  const result = getResult();

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link href={`/event/${eventId}/games/${game.id}`}>
      <Card
        className={cn(
          'group relative overflow-hidden transition-all duration-200',
          'hover:bg-muted/10 cursor-pointer',
          'bg-card/30 border-border/30',
          isPress && 'ml-4 border-l-2 border-l-purple-500/30'
        )}
      >
        <CardContent className="relative p-0">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left side: Date, type, players */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(game.createdAt)}
              </div>
              <GameTypePill type={game.type} isPress={isPress} />
              <div className="flex items-center gap-2">
                <PlayerAvatar name={playerAName} size="sm" color="primary" />
                <span className="text-sm text-muted-foreground">vs</span>
                <PlayerAvatar name={playerBName} size="sm" color="secondary" />
              </div>
            </div>

            {/* Right side: Result and teeth */}
            <div className="flex items-center gap-4">
              {result && (
                <>
                  <span className={cn(
                    'text-sm font-medium',
                    result.winnerId === playerA?.userId
                      ? 'text-primary'
                      : result.winnerId === playerB?.userId
                      ? 'text-blue-400'
                      : 'text-muted-foreground'
                  )}>
                    {result.text}
                  </span>
                  {result.teethWon > 0 && (
                    <div className="flex items-center gap-1 text-primary">
                      <span className="text-sm font-bold">+{result.teethWon}</span>
                      <AlligatorIcon size="sm" />
                    </div>
                  )}
                </>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
