'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { GameTypePill } from '@/components/ui/StatusPill';
import { AlligatorIcon } from '@/components/ui/AlligatorIcon';
import { MatchProgress } from './MatchProgress';
import { cn } from '@/lib/utils';
import { matchStatusStyles } from '@/lib/design/colors';
import type { GameWithParticipants, HoleScore } from '@/types';
import { getParticipantPlayerId } from '@/types';
import { mockUsers } from '@/lib/mock/users';
import { ChevronRight } from 'lucide-react';
import {
  computeHoleResults,
  computeMatchPlayResult,
} from '@/lib/domain/settlement/computeSettlement';

interface GameCardProps {
  game: GameWithParticipants;
  eventId?: string;
  isNested?: boolean;
  scores?: Record<string, HoleScore[]>;
}

export function GameCard({
  game,
  eventId,
  isNested = false,
  scores = {},
}: GameCardProps) {
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

  // Calculate match status for border styling
  const getMatchStatusStyle = () => {
    if (!isMatchPlay || !playerAId || !playerBId) return '';

    const holeResults = computeHoleResults(
      game,
      playerAId,
      playerBId,
      playerAScores,
      playerBScores
    );

    if (holeResults.length === 0) return matchStatusStyles.notStarted;

    const matchResult = computeMatchPlayResult(
      playerAId,
      playerBId,
      holeResults
    );

    if (matchResult.holesUp === 0) return matchStatusStyles.tied;
    // From Player A's perspective (first player listed)
    return matchResult.winnerId === playerAId
      ? matchStatusStyles.winning
      : matchStatusStyles.losing;
  };

  const holeRange =
    game.startHole === 1 && game.endHole === 18
      ? 'Full 18'
      : `Holes ${game.startHole}-${game.endHole}`;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:shadow-black/20',
        'bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm',
        isNested && 'ml-4 border-l-2 border-l-purple-500/50 bg-purple-500/5',
        !isNested && getMatchStatusStyle()
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
            <GameTypePill type={game.type} isPress={isPress} />
            {game.status === 'active' && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
            )}
          </div>
          {game.stakeTeethInt > 0 && (
            <div className="flex items-center gap-1.5 text-primary">
              <AlligatorIcon size="md" />
              <span className="font-bold tabular-nums">{game.stakeTeethInt}</span>
            </div>
          )}
        </div>

        {/* Players section */}
        <div className="px-4 py-4">
          {isMatchPlay ? (
            <MatchPlayContent
              game={game}
              playerAId={playerAId}
              playerBId={playerBId}
              playerAName={playerAName}
              playerBName={playerBName}
              playerAScores={playerAScores}
              playerBScores={playerBScores}
            />
          ) : (
            <StandardContent
              playerAName={playerAName}
              playerBName={playerBName}
              holeRange={holeRange}
            />
          )}
        </div>

        {/* Footer with actions */}
        <div className="flex items-center justify-between border-t border-border/30 bg-black/10 px-4 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">{holeRange}</span>
          <div className="flex items-center gap-2">
            {eventId ? (
              <Link href={`/event/${eventId}/games/${game.id}`}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  Details
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Details
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Nested child games (presses) */}
        {game.childGames && game.childGames.length > 0 && (
          <div className="space-y-2 border-t border-border/30 bg-black/5 p-3">
            {game.childGames.map((childGame) => (
              <GameCard
                key={childGame.id}
                game={childGame}
                eventId={eventId}
                isNested
                scores={scores}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Match Play specific layout with progress bar
interface MatchPlayContentProps {
  game: GameWithParticipants;
  playerAId: string;
  playerBId: string;
  playerAName: string;
  playerBName: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
}

function MatchPlayContent({
  game,
  playerAId,
  playerBId,
  playerAName,
  playerBName,
  playerAScores,
  playerBScores,
}: MatchPlayContentProps) {
  if (!playerAId || !playerBId) {
    return (
      <div className="text-sm text-muted-foreground">
        Waiting for participants...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Player rows */}
      <div className="space-y-3">
        <PlayerRow
          name={playerAName}
          color="primary"
          isLeading={true}
          scores={playerAScores}
        />
        <PlayerRow
          name={playerBName}
          color="secondary"
          isLeading={false}
          scores={playerBScores}
        />
      </div>

      {/* Match progress */}
      <div className="pt-2">
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
    </div>
  );
}

// Standard (non-match-play) content layout
interface StandardContentProps {
  playerAName: string;
  playerBName: string;
  holeRange: string;
}

function StandardContent({
  playerAName,
  playerBName,
}: StandardContentProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <div className="flex items-center gap-2">
        <PlayerAvatar name={playerAName} size="md" color="primary" />
        <span className="font-medium">{playerAName}</span>
      </div>
      <span className="text-lg font-bold text-muted-foreground">vs</span>
      <div className="flex items-center gap-2">
        <PlayerAvatar name={playerBName} size="md" color="secondary" />
        <span className="font-medium">{playerBName}</span>
      </div>
    </div>
  );
}

// Player row component
interface PlayerRowProps {
  name: string;
  color: 'primary' | 'secondary';
  isLeading: boolean;
  scores: HoleScore[];
}

function PlayerRow({ name, color, scores }: PlayerRowProps) {
  const holesPlayed = scores.filter((s) => s.strokes !== null && s.strokes > 0).length;

  return (
    <div className="flex items-center gap-3">
      <PlayerAvatar name={name} size="md" color={color} />
      <div className="flex-1">
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">
          {holesPlayed > 0 ? `${holesPlayed} holes played` : 'Not started'}
        </div>
      </div>
    </div>
  );
}
