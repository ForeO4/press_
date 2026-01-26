'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScoreAdjuster } from './ScoreAdjuster';
import { useScorecardStore } from '@/stores/scorecardStore';
import { getHolePar } from '@/lib/mock/course';
import { mockUsers } from '@/lib/mock/users';
import { cn } from '@/lib/utils';

/**
 * Bottom sheet for editing hole scores
 * Includes prev/next navigation without closing
 */
export function ScoreEditorSheet() {
  const {
    selectedCell,
    isEditorOpen,
    closeEditor,
    clearSelection,
    setScore,
    incrementScore,
    decrementScore,
    getScore,
  } = useScorecardStore();

  if (!selectedCell) return null;

  const { playerId, holeNumber } = selectedCell;
  const currentScore = getScore(playerId, holeNumber);
  const par = getHolePar(holeNumber);
  const player = mockUsers.find((u) => u.id === playerId);
  const playerName = player?.name.split(' ')[0] ?? 'Player';

  const handleClose = () => {
    clearSelection();
  };

  const handleSetScore = (score: number) => {
    setScore(playerId, holeNumber, score);
  };

  const handleIncrement = () => {
    incrementScore(playerId, holeNumber);
  };

  const handleDecrement = () => {
    decrementScore(playerId, holeNumber);
  };

  // Navigate to previous hole
  const goToPrevHole = () => {
    if (holeNumber > 1) {
      useScorecardStore.getState().selectCell(playerId, holeNumber - 1);
    }
  };

  // Navigate to next hole
  const goToNextHole = () => {
    if (holeNumber < 18) {
      useScorecardStore.getState().selectCell(playerId, holeNumber + 1);
    }
  };

  return (
    <Dialog.Root open={isEditorOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'bg-background rounded-t-xl shadow-lg',
            'animate-in slide-in-from-bottom duration-300',
            'focus:outline-none'
          )}
        >
          {/* Header with close button and hole navigation */}
          <div className="flex items-center justify-between p-4 border-b">
            <Dialog.Title className="text-lg font-semibold">
              {playerName} - Hole {holeNumber}
            </Dialog.Title>
            <div className="flex items-center gap-1">
              {/* Prev/Next navigation */}
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevHole}
                disabled={holeNumber === 1}
                aria-label="Previous hole"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-sm text-muted-foreground w-12 text-center">
                {holeNumber}/18
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextHole}
                disabled={holeNumber === 18}
                aria-label="Next hole"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close">
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>
          </div>

          {/* Hole info */}
          <div className="text-center text-sm text-muted-foreground py-2">
            Par {par}
          </div>

          {/* Score adjuster */}
          <div className="p-4 pb-8">
            <ScoreAdjuster
              currentScore={currentScore}
              par={par}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onSetScore={handleSetScore}
            />
          </div>

          {/* Safe area padding for mobile */}
          <div className="h-safe-area-inset-bottom" />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
