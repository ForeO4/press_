'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { Delete, Check, Save } from 'lucide-react';
import { useScorecardStore } from '@/stores/scorecardStore';
import type { HoleSnapshot } from '@/types';

interface Player {
  id: string;
  name: string;
  handicap?: number;
  getsStroke?: boolean;
}

interface ScoreEntryProps {
  hole: HoleSnapshot;
  players: Player[];
  scores: Record<string, number | null>;
  onScoreChange: (playerId: string, score: number) => void;
  onComplete?: () => void;
}

export function ScoreEntry({
  hole,
  players,
  scores: propScores,
  onScoreChange,
  onComplete,
}: ScoreEntryProps) {
  // Use store directly for score display to avoid race conditions
  const storeScores = useScorecardStore((state) => state.scores);

  const [activePlayerId, setActivePlayerId] = useState<string | null>(
    players[0]?.id ?? null
  );
  const [inputValue, setInputValue] = useState('');

  // Combine prop scores with store scores, preferring store for latest values
  const scores = useMemo(() => {
    const combined: Record<string, number | null> = { ...propScores };
    for (const player of players) {
      const storeScore = storeScores[player.id]?.[hole.number];
      if (storeScore !== undefined) {
        combined[player.id] = storeScore;
      }
    }
    return combined;
  }, [propScores, storeScores, players, hole.number]);

  // When active player changes, load their current score
  useEffect(() => {
    if (activePlayerId) {
      const currentScore = scores[activePlayerId];
      setInputValue(currentScore !== null && currentScore !== undefined ? String(currentScore) : '');
    }
  }, [activePlayerId, scores]);

  // Handle number pad input
  const handleNumberPress = useCallback((num: number) => {
    if (!activePlayerId) return;

    const newValue = inputValue + String(num);
    // Limit to 2 digits
    if (newValue.length <= 2) {
      setInputValue(newValue);
    }
  }, [activePlayerId, inputValue]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    setInputValue((prev) => prev.slice(0, -1));
  }, []);

  // Handle enter/save
  const handleEnter = useCallback(() => {
    if (!activePlayerId || inputValue === '') return;

    const score = parseInt(inputValue, 10);
    if (!isNaN(score) && score > 0) {
      onScoreChange(activePlayerId, score);

      // Auto-advance to next player
      const currentIndex = players.findIndex((p) => p.id === activePlayerId);
      if (currentIndex < players.length - 1) {
        setActivePlayerId(players[currentIndex + 1].id);
        setInputValue('');
      } else {
        // All players entered, trigger complete
        onComplete?.();
      }
    }
  }, [activePlayerId, inputValue, onScoreChange, players, onComplete]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumberPress(parseInt(e.key, 10));
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleEnter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumberPress, handleBackspace, handleEnter]);

  const getScoreColor = (score: number | null) => {
    if (score === null) return '';
    const diff = score - hole.par;
    if (diff <= -2) return 'text-green-500 bg-green-500/20'; // Eagle+
    if (diff === -1) return 'text-green-400 bg-green-500/10'; // Birdie
    if (diff === 0) return 'text-foreground'; // Par
    if (diff === 1) return 'text-red-400 bg-red-500/10'; // Bogey
    return 'text-red-500 bg-red-500/20'; // Double+
  };

  return (
    <div className="space-y-4">
      {/* Players with score inputs */}
      <div className="space-y-2">
        {players.map((player, index) => {
          const score = scores[player.id];
          const isActive = activePlayerId === player.id;
          const hasScore = score !== null && score !== undefined;

          return (
            <button
              key={player.id}
              onClick={() => {
                setActivePlayerId(player.id);
                setInputValue(hasScore ? String(score) : '');
              }}
              className={cn(
                'flex w-full items-center justify-between p-3 rounded-lg border transition-all',
                isActive
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'border-border/30 bg-card/50 hover:bg-card/80'
              )}
            >
              <div className="flex items-center gap-3">
                <PlayerAvatar
                  name={player.name}
                  size="md"
                  color={index === 0 ? 'primary' : 'secondary'}
                />
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.name}</span>
                    {player.handicap !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        ({player.handicap})
                      </span>
                    )}
                  </div>
                  {player.getsStroke && (
                    <span className="text-xs text-primary">Gets stroke</span>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  'flex h-12 w-16 items-center justify-center rounded-lg border-2 font-mono text-2xl font-bold',
                  isActive ? 'border-primary' : 'border-border/30',
                  hasScore && getScoreColor(score)
                )}
              >
                {isActive ? (inputValue || '_') : (hasScore ? score : '-')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Number pad */}
      <div className="rounded-xl border border-border/30 bg-card/50 p-3 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="ghost"
              size="lg"
              onClick={() => handleNumberPress(num)}
              className="h-14 text-xl font-semibold hover:bg-muted/50"
            >
              {num}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="lg"
            onClick={handleBackspace}
            className="h-14 text-muted-foreground hover:bg-muted/50"
          >
            <Delete className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => handleNumberPress(0)}
            className="h-14 text-xl font-semibold hover:bg-muted/50"
          >
            0
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={handleEnter}
            disabled={!inputValue}
            className="h-14"
          >
            <Check className="h-6 w-6" />
          </Button>
        </div>

        {/* Visible Save button */}
        <Button
          onClick={handleEnter}
          disabled={!inputValue}
          className="w-full h-12 gap-2 text-base font-semibold bg-primary hover:bg-primary/90"
        >
          <Save className="h-5 w-5" />
          Save Score
        </Button>
      </div>
    </div>
  );
}
