'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GamesList } from '@/components/games/GamesList';
import { CreatePressModal } from '@/components/games/CreatePressModal';
import { getGamesWithParticipants, mockGames } from '@/lib/mock/data';
import { useAppStore } from '@/stores';
import { isMockMode } from '@/lib/env/public';
import type { Game, CreatePressInput } from '@/types';

export default function GamesPage({
  params,
}: {
  params: { eventId: string };
}) {
  const mockUser = useAppStore((state) => state.mockUser);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // In mock mode, use demo data
  const gamesWithParticipants = isMockMode ? getGamesWithParticipants() : [];

  // Check if user can create presses
  const canPress =
    mockUser?.role === 'OWNER' ||
    mockUser?.role === 'ADMIN' ||
    mockUser?.role === 'PLAYER';

  const handlePress = (gameId: string) => {
    const game = mockGames.find((g) => g.id === gameId);
    if (game) {
      setSelectedGame(game);
    }
  };

  const handleCreatePress = (input: CreatePressInput) => {
    // In a real app, this would call the API
    console.log('Creating press:', input);
    alert(`Press created! Starting hole ${input.startHole}, stake ${input.stake} Teeth`);
    setSelectedGame(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Games</h1>
        {(mockUser?.role === 'OWNER' || mockUser?.role === 'ADMIN') && (
          <Button>Create Game</Button>
        )}
      </div>

      <GamesList
        games={gamesWithParticipants}
        canPress={canPress}
        onPress={handlePress}
      />

      {/* Press Modal */}
      {selectedGame && (
        <CreatePressModal
          parentGame={selectedGame}
          currentHole={9} // Mock: assume through 9 holes
          onSubmit={handleCreatePress}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
}
