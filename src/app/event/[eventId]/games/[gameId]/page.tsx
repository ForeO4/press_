'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GameScorecard } from '@/components/games/GameScorecard';
import { ScoreEntry } from '@/components/games/ScoreEntry';
import { SettleGameModal } from '@/components/games/SettleGameModal';
import { ScoreEditorSheet } from '@/components/scorecard/ScoreEditorSheet';
import { useScorecardStore } from '@/stores/scorecardStore';
import { getGameWithParticipants, createPress, updateGameStatus } from '@/lib/services/games';
import { getScoresForEvent, getEventRounds } from '@/lib/services/scores';
import { getEventTeeSnapshot } from '@/lib/services/courses';
import { getHandicapSnapshot } from '@/lib/services/handicaps';
import { mockUsers } from '@/lib/mock/users';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppStore } from '@/stores';
import { isMockMode } from '@/lib/env/public';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TableProperties,
} from 'lucide-react';
import type {
  GameWithParticipants,
  HoleScore,
  TeeSnapshot,
  HoleSnapshot,
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
  const [handicaps, setHandicaps] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [currentHole, setCurrentHole] = useState(1);
  const [showFullScorecard, setShowFullScorecard] = useState(true); // Default to visible

  // Scorecard store for inline editing
  const selectCell = useScorecardStore((state) => state.selectCell);
  const initializeEventScores = useScorecardStore((state) => state.initializeEventScores);
  const scorecardScores = useScorecardStore((state) => state.scores);

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

      // Load handicaps for all participants
      const handicapPromises = gameData.participants.map(async (p) => {
        const snapshot = await getHandicapSnapshot(params.eventId, p.userId);
        return { userId: p.userId, handicap: snapshot?.courseHandicap ?? 0 };
      });
      const handicapResults = await Promise.all(handicapPromises);
      const handicapMap: Record<string, number> = {};
      for (const { userId, handicap } of handicapResults) {
        handicapMap[userId] = handicap;
      }
      setHandicaps(handicapMap);
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

  // Initialize scorecard store for editing
  useEffect(() => {
    initializeEventScores(params.eventId);
  }, [params.eventId, initializeEventScores]);

  // Convert scorecard store format to HoleScore[] for display
  // This allows us to show live updates from the editor
  const getPlayerScoresFromStore = useCallback((playerId: string): HoleScore[] => {
    const playerScores = scorecardScores[playerId];
    if (!playerScores) return scores[playerId] ?? [];

    const now = new Date().toISOString();
    return Object.entries(playerScores).map(([holeNum, strokes]) => ({
      id: `${playerId}-${holeNum}`,
      roundId: '',
      holeNumber: parseInt(holeNum, 10),
      strokes,
      createdAt: now,
      updatedAt: now,
    }));
  }, [scorecardScores, scores]);

  // Handle score cell click
  const handleCellClick = useCallback((playerId: string, holeNumber: number) => {
    selectCell(playerId, holeNumber);
  }, [selectCell]);

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
  // Get handicaps from loaded data (defaults to 0 for scratch golfers)
  const playerAHandicap = playerA ? (handicaps[playerA.userId] ?? 0) : 0;
  const playerBHandicap = playerB ? (handicaps[playerB.userId] ?? 0) : 0;
  // Use store scores for live updates, fall back to loaded scores
  const playerAScores = playerA ? getPlayerScoresFromStore(playerA.userId) : [];
  const playerBScores = playerB ? getPlayerScoresFromStore(playerB.userId) : [];

  // Auto-navigate to current hole based on scores
  useEffect(() => {
    if (!game) return;
    let maxHole = game.startHole;

    for (const participant of game.participants) {
      const userScores = scores[participant.userId] ?? [];
      for (const score of userScores) {
        if (
          score.holeNumber >= game.startHole &&
          score.holeNumber <= game.endHole
        ) {
          maxHole = Math.max(maxHole, score.holeNumber + 1);
        }
      }
    }

    // Don't go past end hole
    const nextHole = Math.min(maxHole, game.endHole);
    setCurrentHole(nextHole);
  }, [game, scores]);

  // Get current hole data
  const currentHoleData: HoleSnapshot | undefined = courseData?.holes.find(
    (h) => h.number === currentHole
  );

  // Navigate to previous hole
  const goToPrevHole = () => {
    if (game && currentHole > game.startHole) {
      setCurrentHole(currentHole - 1);
    }
  };

  // Navigate to next hole
  const goToNextHole = () => {
    if (game && currentHole < game.endHole) {
      setCurrentHole(currentHole + 1);
    }
  };

  // Handle score entry
  const handleScoreChange = useCallback((playerId: string, score: number) => {
    useScorecardStore.getState().setScore(playerId, currentHole, score);
  }, [currentHole]);

  // Handle press creation
  const handlePress = async (multiplier: number) => {
    if (!game) return;

    try {
      const pressStake = game.stakeTeethInt * multiplier;
      await createPress(game, pressStake, currentHole);
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

  // Build score entry players with proper handicap stroke calculation
  const handicapDiff = Math.abs(playerAHandicap - playerBHandicap);
  const playerAGetsStrokes = playerAHandicap > playerBHandicap;
  const playerBGetsStrokes = playerBHandicap > playerAHandicap;

  const scoreEntryPlayers = [
    {
      id: playerA?.userId ?? '',
      name: playerAName,
      handicap: playerAHandicap,
      getsStroke: currentHoleData?.handicap && playerAGetsStrokes
        ? currentHoleData.handicap <= handicapDiff
        : false,
    },
    {
      id: playerB?.userId ?? '',
      name: playerBName,
      handicap: playerBHandicap,
      getsStroke: currentHoleData?.handicap && playerBGetsStrokes
        ? currentHoleData.handicap <= handicapDiff
        : false,
    },
  ];

  // Get current scores for entry
  const currentScores: Record<string, number | null> = {};
  if (playerA) {
    const score = playerAScores.find((s) => s.holeNumber === currentHole);
    currentScores[playerA.userId] = score?.strokes ?? null;
  }
  if (playerB) {
    const score = playerBScores.find((s) => s.holeNumber === currentHole);
    currentScores[playerB.userId] = score?.strokes ?? null;
  }

  return (
    <div className="space-y-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 -mx-4 bg-background/95 backdrop-blur-lg border-b border-border/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href={`/event/${params.eventId}/games`}>
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground">
              {courseData?.courseName ?? 'Course'}
            </div>
            <div className="text-lg font-bold">
              Hole {currentHole} of {game.endHole}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullScorecard(!showFullScorecard)}
            className={cn(
              'gap-1.5 -mr-2',
              showFullScorecard && 'text-primary'
            )}
          >
            <TableProperties className="h-4 w-4" />
          </Button>
        </div>

        {/* Hole info */}
        {currentHoleData && (
          <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>Par {currentHoleData.par}</span>
            <span>{currentHoleData.yardage} yds</span>
            <span>HCP: {currentHoleData.handicap}</span>
          </div>
        )}
      </div>

      {/* Full Scorecard (collapsible) */}
      {showFullScorecard && courseData && playerA && playerB && (
        <div className="space-y-4">
          <GameScorecard
            game={game}
            playerAId={playerA.userId}
            playerBId={playerB.userId}
            playerAName={playerAName}
            playerBName={playerBName}
            playerAScores={playerAScores}
            playerBScores={playerBScores}
            playerAHandicap={playerAHandicap}
            playerBHandicap={playerBHandicap}
            holes={courseData.holes}
            onCellClick={handleCellClick}
            childGames={game.childGames}
            canPress={canPress && game.status === 'active'}
            onPress={() => handlePress(1)}
          />
        </div>
      )}

      {/* Score Entry Section */}
      {!showFullScorecard && currentHoleData && game.status === 'active' && (
        <Card className="border-border/30">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground mb-3">
              ENTER SCORES
            </div>
            <ScoreEntry
              hole={currentHoleData}
              players={scoreEntryPlayers}
              scores={currentScores}
              onScoreChange={handleScoreChange}
              onComplete={goToNextHole}
            />
          </CardContent>
        </Card>
      )}

      {/* Navigation and Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={goToPrevHole}
          disabled={!game || currentHole <= game.startHole}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>

        {game.status === 'active' ? (
          <Button
            variant="default"
            onClick={handleSettle}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            End Game
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">
            Game Complete
          </span>
        )}

        <Button
          variant="outline"
          onClick={goToNextHole}
          disabled={!game || currentHole >= game.endHole}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

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
          holes={courseData?.holes}
          onConfirm={handleConfirmSettle}
          onClose={() => setShowSettleModal(false)}
        />
      )}

      {/* Score Editor Sheet for inline editing */}
      <ScoreEditorSheet />
    </div>
  );
}
