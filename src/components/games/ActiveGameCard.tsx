'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { GameTypePill } from '@/components/ui/StatusPill';
import { AlligatorIcon } from '@/components/ui/AlligatorIcon';
import { cn } from '@/lib/utils';
import { matchStatusStyles } from '@/lib/design/colors';
import type { GameWithParticipants, HoleScore } from '@/types';
import { mockUsers } from '@/lib/mock/users';
import { ChevronRight, Play } from 'lucide-react';
import {
  computeHoleResults,
  computeMatchPlayResult,
} from '@/lib/domain/settlement/computeSettlement';

interface ActiveGameCardProps {
  game: GameWithParticipants;
  eventId: string;
  scores?: Record<string, HoleScore[]>;
}

export function ActiveGameCard({
  game,
  eventId,
  scores = {},
}: ActiveGameCardProps) {
  // Get player info
  const playerA = game.participants[0];
  const playerB = game.participants[1];
  const playerAUser = playerA
    ? mockUsers.find((u) => u.id === playerA.userId)
    : null;
  const playerBUser = playerB
    ? mockUsers.find((u) => u.id === playerB.userId)
    : null;
  const playerAName = playerAUser?.name ?? 'Player A';
  const playerBName = playerBUser?.name ?? 'Player B';
  const playerAScores = playerA ? (scores[playerA.userId] ?? []) : [];
  const playerBScores = playerB ? (scores[playerB.userId] ?? []) : [];

  const isPress = game.parentGameId !== null;
  const isMatchPlay = game.type === 'match_play';

  // Calculate current hole (max hole with scores in game range)
  const getCurrentHole = (): number => {
    let maxHole = 0;
    for (const participant of game.participants) {
      const userScores = scores[participant.userId] ?? [];
      for (const score of userScores) {
        if (score.holeNumber >= game.startHole && score.holeNumber <= game.endHole) {
          maxHole = Math.max(maxHole, score.holeNumber);
        }
      }
    }
    return maxHole || game.startHole;
  };

  const currentHole = getCurrentHole();
  const totalHoles = game.endHole - game.startHole + 1;

  // Calculate match status
  const getMatchStatus = () => {
    if (!isMatchPlay || !playerA || !playerB) return null;

    const holeResults = computeHoleResults(
      game,
      playerA.userId,
      playerB.userId,
      playerAScores,
      playerBScores
    );

    if (holeResults.length === 0) return { text: 'All Square', color: 'text-amber-400' };

    const matchResult = computeMatchPlayResult(
      playerA.userId,
      playerB.userId,
      holeResults
    );

    if (matchResult.holesUp === 0) return { text: 'All Square', color: 'text-amber-400' };

    const winnerName = matchResult.winnerId === playerA.userId
      ? playerAName.split(' ')[0]
      : playerBName.split(' ')[0];

    return {
      text: `${winnerName} +${matchResult.holesUp}`,
      color: matchResult.winnerId === playerA.userId ? 'text-primary' : 'text-blue-400',
    };
  };

  // Calculate skins status
  const getSkinsStatus = () => {
    if (game.type !== 'skins') return null;

    const holeResults = computeHoleResults(
      game,
      playerA?.userId ?? '',
      playerB?.userId ?? '',
      playerAScores,
      playerBScores
    );

    const ties = holeResults.filter((r) => r.winner === 'tie').length;
    return ties > 0 ? `${ties} carried` : null;
  };

  const matchStatus = getMatchStatus();
  const skinsStatus = getSkinsStatus();

  // Match status border styling
  const getMatchStatusStyle = () => {
    if (!isMatchPlay || !playerA || !playerB) return '';

    const holeResults = computeHoleResults(
      game,
      playerA.userId,
      playerB.userId,
      playerAScores,
      playerBScores
    );

    if (holeResults.length === 0) return matchStatusStyles.notStarted;

    const matchResult = computeMatchPlayResult(
      playerA.userId,
      playerB.userId,
      holeResults
    );

    if (matchResult.holesUp === 0) return matchStatusStyles.tied;
    return matchResult.winnerId === playerA.userId
      ? matchStatusStyles.winning
      : matchStatusStyles.losing;
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:shadow-black/20',
        'bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm',
        isPress && 'ml-4 border-l-2 border-l-purple-500/50 bg-purple-500/5',
        !isPress && getMatchStatusStyle()
      )}
    >
      {/* Subtle hover glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      </div>

      <CardContent className="relative p-0">
        {/* Header row */}
        <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <GameTypePill type={game.type} isPress={isPress} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Hole {currentHole} of {game.endHole}
            </span>
            {game.stakeTeethInt > 0 && (
              <div className="flex items-center gap-1.5 text-primary">
                <AlligatorIcon size="md" />
                <span className="font-bold tabular-nums">{game.stakeTeethInt}</span>
              </div>
            )}
          </div>
        </div>

        {/* Players and status section */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PlayerAvatar name={playerAName} size="md" color="primary" />
              <span className="font-medium">{playerAName.split(' ')[0]}</span>
              <span className="text-lg text-muted-foreground/50">vs</span>
              <span className="font-medium">{playerBName.split(' ')[0]}</span>
              <PlayerAvatar name={playerBName} size="md" color="secondary" />
            </div>
          </div>

          {/* Status line */}
          <div className="mt-3 flex items-center gap-4 text-sm">
            {matchStatus && (
              <span className={cn('font-semibold', matchStatus.color)}>
                Match: {matchStatus.text}
              </span>
            )}
            {skinsStatus && (
              <span className="text-amber-400">
                Skins: {skinsStatus}
              </span>
            )}
          </div>
        </div>

        {/* Footer with continue button */}
        <div className="flex items-center justify-end border-t border-border/30 bg-black/10 px-4 py-2.5">
          <Link href={`/event/${eventId}/games/${game.id}`}>
            <Button
              size="sm"
              className="gap-1.5 shadow-lg shadow-primary/20"
            >
              <Play className="h-3 w-3" />
              Continue
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
