'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlligatorIcon } from '@/components/ui/AlligatorIcon';
import {
  computeHoleResults,
  computeMatchPlayResult,
  computeMatchPlaySettlement,
} from '@/lib/domain/settlement/computeSettlement';
import type { Game, HoleScore } from '@/types';

interface SettleGameModalProps {
  game: Game;
  playerAId: string;
  playerBId: string;
  playerAName: string;
  playerBName: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function SettleGameModal({
  game,
  playerAId,
  playerBId,
  playerAName,
  playerBName,
  playerAScores,
  playerBScores,
  onConfirm,
  onClose,
}: SettleGameModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate match result
  const holeResults = computeHoleResults(
    game,
    playerAId,
    playerBId,
    playerAScores,
    playerBScores
  );
  const matchResult = computeMatchPlayResult(playerAId, playerBId, holeResults);
  const settlement = computeMatchPlaySettlement(
    game,
    playerAId,
    playerBId,
    playerAScores,
    playerBScores
  );

  const holesPlayed = holeResults.length;
  const totalHoles = game.endHole - game.startHole + 1;
  const holesRemaining = totalHoles - holesPlayed;

  // Get player names
  const getPlayerName = (id: string) =>
    id === playerAId ? playerAName : playerBName;

  // Build status text
  const getResultText = () => {
    if (holesPlayed === 0) {
      return 'No holes played';
    }

    if (matchResult.holesUp === 0) {
      return `All Square after ${holesPlayed} holes`;
    }

    const winnerName = getPlayerName(matchResult.winnerId!);
    const firstName = winnerName.split(' ')[0];

    if (holesRemaining === 0) {
      return `${firstName} wins ${matchResult.holesUp} UP`;
    }

    // Check for dormie (up by same number as holes remaining)
    if (matchResult.holesUp === holesRemaining) {
      return `${firstName} is ${matchResult.holesUp} UP with ${holesRemaining} to play (Dormie)`;
    }

    // Check for match already won (up by more than holes remaining)
    if (matchResult.holesUp > holesRemaining) {
      const margin = matchResult.holesUp;
      const through = totalHoles - holesRemaining;
      return `${firstName} wins ${margin} & ${holesRemaining}`;
    }

    return `${firstName} is ${matchResult.holesUp} UP with ${holesRemaining} to play`;
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Settle Game</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Final Result */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Final Result
            </h3>
            <p className="text-lg font-semibold">{getResultText()}</p>
          </div>

          {/* Settlement Box */}
          <div className="rounded-xl border border-border/50 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
            {settlement ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  {getPlayerName(settlement.payerId).split(' ')[0]} owes{' '}
                  {getPlayerName(settlement.payeeId).split(' ')[0]}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <AlligatorIcon size="lg" />
                  <span className="text-4xl font-bold text-primary">
                    {settlement.amountInt}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ({game.stakeTeethInt} teeth × {matchResult.holesUp} holes up)
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg font-semibold text-amber-400">
                  Match Tied
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  No teeth exchanged
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Settling...' : 'Confirm Settlement'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
