'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getGame, getGameResults } from '@/lib/services/games';
import type { GameWithParticipants } from '@/types';
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AlligatorIcon } from '@/components/ui/AlligatorIcon';

interface GameResultsProps {
  gameId: string;
  eventId: string;
}

interface PlayerResult {
  userId: string;
  name: string;
  totalScore: number;
  relativeToPar: number;
  netAmount: number;
  isWinner: boolean;
}

export function GameResults({ gameId, eventId }: GameResultsProps) {
  const [game, setGame] = useState<GameWithParticipants | null>(null);
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResults() {
      try {
        const [gameData, resultsData] = await Promise.all([
          getGame(eventId, gameId),
          getGameResults(eventId, gameId),
        ]);

        setGame(gameData);
        setResults(resultsData);
      } catch (err) {
        console.error('Failed to load results:', err);
        setError('Failed to load game results');
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [gameId, eventId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading results...</div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{error || 'Game not found'}</p>
            <Link href={`/event/${eventId}/games`}>
              <Button variant="link">Go back</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const winner = results.find((r) => r.isWinner);

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/event/${eventId}/games/${gameId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Game Results</h1>
      </div>

      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Winner Banner */}
        {winner && (
          <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
            <CardContent className="py-6 text-center">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-foreground">{winner.name}</h2>
              <p className="text-muted-foreground">Winner</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-2xl font-bold text-green-600">
                <AlligatorIcon className="h-6 w-6" />
                +{winner.netAmount}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Game Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium capitalize">{game.type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stake</span>
              <span className="font-medium flex items-center gap-1">
                {game.stakeTeethInt}
                <AlligatorIcon className="h-4 w-4" />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Holes</span>
              <span className="font-medium">{game.startHole} - {game.endHole}</span>
            </div>
          </CardContent>
        </Card>

        {/* Player Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Final Standings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((result, index) => (
              <div
                key={result.userId}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  result.isWinner ? 'bg-green-500/10' : 'bg-muted'
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{result.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {result.totalScore} ({result.relativeToPar >= 0 ? '+' : ''}{result.relativeToPar})
                  </p>
                </div>
                <div className={`flex items-center gap-1 font-medium ${
                  result.netAmount > 0
                    ? 'text-green-600'
                    : result.netAmount < 0
                    ? 'text-red-600'
                    : 'text-muted-foreground'
                }`}>
                  {result.netAmount > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : result.netAmount < 0 ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : (
                    <Minus className="h-4 w-4" />
                  )}
                  {result.netAmount >= 0 ? '+' : ''}{result.netAmount}
                  <AlligatorIcon className="h-4 w-4" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href={`/event/${eventId}/games`} className="flex-1">
            <Button variant="outline" className="w-full">
              All Games
            </Button>
          </Link>
          <Link href={`/event/${eventId}/settlement`} className="flex-1">
            <Button className="w-full">
              View Settlement
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
