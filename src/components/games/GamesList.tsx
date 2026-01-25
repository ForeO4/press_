'use client';

import { GameCard } from './GameCard';
import type { GameWithParticipants } from '@/types';

interface GamesListProps {
  games: GameWithParticipants[];
  canPress: boolean;
  onPress: (gameId: string) => void;
}

export function GamesList({ games, canPress, onPress }: GamesListProps) {
  if (games.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No games yet. Create a game to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          canPress={canPress}
          onPress={() => onPress(game.id)}
        />
      ))}
    </div>
  );
}
