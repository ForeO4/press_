'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GameDetailHeader } from '@/components/games/GameDetailHeader';
import { GameScorecard } from '@/components/games/GameScorecard';
import { GameCard } from '@/components/games/GameCard';
import { CreatePressModal } from '@/components/games/CreatePressModal';
import { SettleGameModal } from '@/components/games/SettleGameModal';
import { getGameWithParticipants, createPress, updateGameStatus } from '@/lib/services/games';
import { getScoresForEvent, getEventRounds } from '@/lib/services/scores';
import { getEventTeeSnapshot } from '@/lib/services/courses';
import { mockUsers } from '@/lib/mock/users';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppStore } from '@/stores';
import { isMockMode } from '@/lib/env/public';
import { Zap, Check, AlertCircle } from 'lucide-react';
import type {
  GameWithParticipants,
  HoleScore,
  TeeSnapshot,
  CreatePressInput,
} from '@/types';

export default function GameDetailPage({
  params,
}: {
  params: { eventId: string; gameId: string };
}) {
  const router = useRouter();
  const mockUser = useAppStore((state) => state.mockUser);
  const currentUser = useCurrentUser();

  const [game, setGame] = useState<GameWithParticipants | null>(null);
  const [scores, setScores] = useState<Record<string, HoleScore[]>>({});
  const [courseData, setCourseData] = useState<TeeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPressModal, setShowPressModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);

  // Load game data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [gameData, roundsData, scoresData, teeSnapshot] = await Promise.all([
        getGameWithParticipants(params.gameId),
        getEventRounds(params.eventId),
        getScoresForEvent(params.eventId),
        getEventTeeSnapshot(params.eventId),
      ]);

      if (!gameData) {
        setError('Game not found');
        return;
      }

      setGame(gameData);
      setCourseData(teeSnapshot);

      // Convert roundId -> scores to userId -> scores
      const userScores: Record<string, HoleScore[]> = {};
      for (const [roundId, roundScores] of Object.entries(scoresData)) {
        const userId = roundsData.roundToUser[roundId];
        if (userId) {
          userScores[userId] = roundScores;
        }
      }
      setScores(userScores);
    } catch (err) {
      console.error('[GameDetailPage] Failed to load data:', err);
      setError('Failed to load game data');
    } finally {
      setLoading(false);
    }
  }, [params.eventId, params.gameId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Permission checks
  const canPress = isMockMode
    ? mockUser?.role === 'OWNER' ||
      mockUser?.role === 'ADMIN' ||
      mockUser?.role === 'PLAYER'
    : !!currentUser;

  // Get player info
  const playerA = game?.participants[0];
  const playerB = game?.participants[1];
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

  // Find current hole for press modal
  const getCurrentHole = (): number => {
    if (!game) return 1;
    let maxHole = 0;

    for (const participant of game.participants) {
      const userScores = scores[participant.userId] ?? [];
      for (const score of userScores) {
        if (
          score.holeNumber >= game.startHole &&
          score.holeNumber <= game.endHole
        ) {
          maxHole = Math.max(maxHole, score.holeNumber);
        }
      }
    }

    return maxHole || game.startHole - 1;
  };

  // Handle press creation
  const handleCreatePress = async (input: CreatePressInput) => {
    if (!game) return;

    try {
      await createPress(game, input.stake, input.startHole);
      setShowPressModal(false);
      await loadData();
    } catch (err) {
      console.error('[GameDetailPage] Failed to create press:', err);
      alert('Failed to create press');
    }
  };

  // Handle settle game
  const handleSettle = () => {
    setShowSettleModal(true);
  };

  // Confirm settlement
  const handleConfirmSettle = async () => {
    if (!game) return;

    try {
      await updateGameStatus(game.id, 'complete');
      setShowSettleModal(false);
      await loadData();
    } catch (err) {
      console.error('[GameDetailPage] Failed to settle game:', err);
      alert('Failed to settle game');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading game...</span>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error || 'Game not found'}</span>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <GameDetailHeader
        game={game}
        eventId={params.eventId}
        playerAName={playerAName}
        playerBName={playerBName}
        playerAScores={playerAScores}
        playerBScores={playerBScores}
      />

      {/* Scorecard section */}
      {courseData && playerA && playerB && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Scorecard</h2>
          <GameScorecard
            game={game}
            playerAId={playerA.userId}
            playerBId={playerB.userId}
            playerAName={playerAName}
            playerBName={playerBName}
            playerAScores={playerAScores}
            playerBScores={playerBScores}
            holes={courseData.holes}
          />
        </div>
      )}

      {/* Presses section */}
      {game.childGames && game.childGames.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Presses</h2>
          <div className="space-y-3">
            {game.childGames.map((childGame) => (
              <GameCard
                key={childGame.id}
                game={childGame}
                canPress={false}
                onPress={() => {}}
                isNested
                scores={scores}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <Card className="bg-gradient-to-br from-card/80 to-card/40">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          {canPress && game.status === 'active' && (
            <Button
              variant="outline"
              onClick={() => setShowPressModal(true)}
              className="gap-2 border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300"
            >
              <Zap className="h-4 w-4" />
              Press
            </Button>
          )}
          <div className="flex-1" />
          {game.status === 'active' && (
            <Button
              variant="default"
              onClick={handleSettle}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Settle Game
            </Button>
          )}
          {game.status === 'complete' && (
            <span className="text-sm text-muted-foreground">
              This game has been settled
            </span>
          )}
        </CardContent>
      </Card>

      {/* Press Modal */}
      {showPressModal && (
        <CreatePressModal
          parentGame={game}
          currentHole={getCurrentHole()}
          onSubmit={handleCreatePress}
          onClose={() => setShowPressModal(false)}
        />
      )}

      {/* Settle Modal */}
      {showSettleModal && playerA && playerB && (
        <SettleGameModal
          game={game}
          playerAId={playerA.userId}
          playerBId={playerB.userId}
          playerAName={playerAName}
          playerBName={playerBName}
          playerAScores={playerAScores}
          playerBScores={playerBScores}
          onConfirm={handleConfirmSettle}
          onClose={() => setShowSettleModal(false)}
        />
      )}
    </div>
  );
}
