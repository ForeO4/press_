'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScoreAdjusterProps {
  currentScore: number | null;
  par: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSetScore: (score: number) => void;
}

/**
 * Score adjustment controls with +/- buttons and quick-select row
 */
export function ScoreAdjuster({
  currentScore,
  par,
  onIncrement,
  onDecrement,
  onSetScore,
}: ScoreAdjusterProps) {
  const score = currentScore ?? par;
  const [inputValue, setInputValue] = useState(String(score));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local input value when currentScore prop changes
  useEffect(() => {
    setInputValue(String(score));
  }, [score]);

  // Quick select buttons: show scores from (par-2) to (par+4)
  const quickScores = Array.from({ length: 7 }, (_, i) => Math.max(1, par - 2 + i));

  return (
    <div className="space-y-4">
      {/* Current score with +/- buttons */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full text-2xl"
          onClick={onDecrement}
          disabled={score <= 1}
          aria-label="Decrease score"
        >
          <Minus className="h-6 w-6" />
        </Button>

        <div className="text-center min-w-[80px]">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={() => {
              const parsed = parseInt(inputValue, 10);
              if (!isNaN(parsed) && parsed >= 1) {
                onSetScore(parsed);
              } else {
                setInputValue(String(score));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="w-full text-5xl font-bold font-mono text-center bg-transparent border-none outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
            aria-label="Score input"
          />
          <div className="text-sm text-muted-foreground mt-1">
            {score - par === 0
              ? 'Par'
              : score - par > 0
                ? `+${score - par}`
                : score - par}
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full text-2xl"
          onClick={onIncrement}
          aria-label="Increase score"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Quick select buttons */}
      <div className="flex justify-center gap-2">
        {quickScores.map((quickScore) => (
          <button
            key={quickScore}
            onClick={() => onSetScore(quickScore)}
            className={cn(
              'h-11 w-11 rounded-full text-sm font-medium transition-colors',
              'hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              score === quickScore
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
            aria-label={`Set score to ${quickScore}`}
          >
            {quickScore}
          </button>
        ))}
      </div>
    </div>
  );
}
