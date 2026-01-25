'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatTeeth } from '@/lib/utils';
import type { GameWithParticipants } from '@/types';
import { mockUsers } from '@/lib/mock/users';

interface GameCardProps {
  game: GameWithParticipants;
  canPress: boolean;
  onPress: () => void;
  isNested?: boolean;
}

const gameTypeLabels = {
  match_play: 'Match Play',
  nassau: 'Nassau',
  skins: 'Skins',
};

export function GameCard({ game, canPress, onPress, isNested = false }: GameCardProps) {
  const participantNames = game.participants
    .map((p) => mockUsers.find((u) => u.id === p.userId)?.name ?? 'Unknown')
    .join(' vs ');

  const holeRange =
    game.startHole === 1 && game.endHole === 18
      ? 'Full 18'
      : `Holes ${game.startHole}-${game.endHole}`;

  const isPress = game.parentGameId !== null;

  return (
    <Card className={cn(isNested && 'ml-6 border-l-4 border-l-primary/30')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                game.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              )}
            >
              {gameTypeLabels[game.type]}
            </span>
            {isPress && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                Press
              </span>
            )}
          </div>
          <span className="font-semibold text-primary">
            {formatTeeth(game.stakeTeethInt)}
          </span>
        </div>
        <CardTitle className="text-lg">{participantNames}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{holeRange}</span>
          {canPress && game.status === 'active' && (
            <Button size="sm" variant="outline" onClick={onPress}>
              Press
            </Button>
          )}
        </div>

        {/* Render child games (presses) */}
        {game.childGames && game.childGames.length > 0 && (
          <div className="mt-4 space-y-3">
            {game.childGames.map((childGame) => (
              <GameCard
                key={childGame.id}
                game={childGame}
                canPress={canPress}
                onPress={() => {}}
                isNested
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
