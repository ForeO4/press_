'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { GamesList } from '@/components/games/GamesList';
import { Plus } from 'lucide-react';
import { GolfClubsIcon } from '@/components/ui/GolfClubsIcon';
import { CreateGameModal, type CreateGameData } from '@/components/games/CreateGameModal';
import { getGamesForEvent, createGame } from '@/lib/services/games';
import { getScoresForEvent, getEventRounds } from '@/lib/services/scores';
import { getEventMembers } from '@/lib/services/players';
import { useAppStore } from '@/stores';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isMockMode } from '@/lib/env/public';
import { mockUsers } from '@/lib/mock/users';
import type { GameWithParticipants, HoleScore, MockUser } from '@/types';

export default function GamesPage({
  params,
}: {
  params: { eventId: string };
}) {
  const mockUser = useAppStore((state) => state.mockUser);
  const currentUser = useCurrentUser();
  const [games, setGames] = useState<GameWithParticipants[]>([]);
  const [scores, setScores] = useState<Record<string, HoleScore[]>>({});
  const [players, setPlayers] = useState<MockUser[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load games, scores, and event members
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch games, rounds/scores, and members in parallel
      const [gamesData, roundsData, scoresData, membersData] = await Promise.all([
        getGamesForEvent(params.eventId),
        getEventRounds(params.eventId),
        getScoresForEvent(params.eventId),
        getEventMembers(params.eventId),
      ]);

      setGames(gamesData);

      // Convert members to MockUser format for the modal
      const memberPlayers: MockUser[] = membersData.map((m) => ({
        id: m.userId,
        name: m.name || 'Unknown',
        email: m.email || '',
        role: 'PLAYER',
      }));

      // In mock mode, also include mockUsers that might have been added
      if (isMockMode || params.eventId.startsWith('demo-')) {
        // Merge with mockUsers, avoiding duplicates
        const existingIds = new Set(memberPlayers.map((p) => p.id));
        for (const mu of mockUsers) {
          if (!existingIds.has(mu.id)) {
            memberPlayers.push(mu);
          }
        }
      }

      setPlayers(memberPlayers);

      // Convert roundId -> scores to userId -> scores
      const userScores: Record<string, HoleScore[]> = {};
      for (const [roundId, roundScores] of Object.entries(scoresData)) {
        const userId = roundsData.roundToUser[roundId];
        if (userId) {
          userScores[userId] = roundScores;
        }
      }
      setScores(userScores);
    } catch (error) {
      console.error('[GamesPage] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [params.eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const canCreateGame = isMockMode
    ? mockUser?.role === 'OWNER' || mockUser?.role === 'ADMIN'
    : !!currentUser;

  const handleCreateGame = async (data: CreateGameData) => {
    try {
      console.log('[GamesPage] Creating game:', { eventId: params.eventId, data });
      const newGame = await createGame(
        params.eventId,
        data.type,
        data.stake,
        data.playerAId,
        data.playerBId,
        data.startHole,
        data.endHole
      );
      console.log('[GamesPage] Game created:', newGame);
      setShowCreateModal(false);

      // Reload games
      await loadData();
    } catch (error) {
      console.error('[GamesPage] Failed to create game:', error);
      alert('Failed to create game');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading games...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative">
        {/* Subtle glow effect behind header */}
        <div className="absolute -inset-x-4 -top-4 h-32 bg-gradient-to-b from-primary/5 via-primary/2 to-transparent blur-xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
              <GolfClubsIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Games</h1>
              <p className="text-sm text-muted-foreground">Head-to-head matches & side bets</p>
            </div>
          </div>
          {canCreateGame && (
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              className="gap-1.5 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
            >
              <Plus className="h-4 w-4" />
              New Game
            </Button>
          )}
        </div>
      </div>

      <GamesList
        games={games}
        eventId={params.eventId}
        scores={scores}
      />

      {/* Create Game Modal */}
      {showCreateModal && (
        <CreateGameModal
          eventId={params.eventId}
          players={players}
          onSubmit={handleCreateGame}
          onClose={() => setShowCreateModal(false)}
          onAddPlayer={(name) => {
            // Refresh players list after adding a new player
            loadData();
          }}
        />
      )}
    </div>
  );
}
