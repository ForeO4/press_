'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlligatorIcon } from '@/components/ui/AlligatorIcon';
import { cn } from '@/lib/utils';
import {
  computeHoleResults,
  computeMatchPlayResult,
  computeMatchPlaySettlement,
  computeNassauSettlement,
  computeMatchResultForRange,
  type NassauSettlement,
} from '@/lib/domain/settlement/computeSettlement';
import type { Game, HoleScore, HoleSnapshot, Settlement } from '@/types';

interface SettleGameModalProps {
  game: Game;
  playerAId: string;
  playerBId: string;
  playerAName: string;
  playerBName: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
  holes?: HoleSnapshot[];
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

interface PlayerStats {
  totalStrokes: number;
  eagles: number;
  birdies: number;
  pars: number;
  bogeys: number;
  doublePlus: number;
}

function calculatePlayerStats(
  scores: HoleScore[],
  holes: HoleSnapshot[],
  startHole: number,
  endHole: number
): PlayerStats {
  const stats: PlayerStats = {
    totalStrokes: 0,
    eagles: 0,
    birdies: 0,
    pars: 0,
    bogeys: 0,
    doublePlus: 0,
  };

  for (let holeNum = startHole; holeNum <= endHole; holeNum++) {
    const score = scores.find((s) => s.holeNumber === holeNum);
    const holeData = holes.find((h) => h.number === holeNum);

    if (score?.strokes && holeData) {
      stats.totalStrokes += score.strokes;
      const diff = score.strokes - holeData.par;

      if (diff <= -2) stats.eagles++;
      else if (diff === -1) stats.birdies++;
      else if (diff === 0) stats.pars++;
      else if (diff === 1) stats.bogeys++;
      else stats.doublePlus++;
    }
  }

  return stats;
}

export function SettleGameModal({
  game,
  playerAId,
  playerBId,
  playerAName,
  playerBName,
  playerAScores,
  playerBScores,
  holes = [],
  onConfirm,
  onClose,
}: SettleGameModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isNassau = game.type === 'nassau';

  // Calculate match result
  const holeResults = computeHoleResults(
    game,
    playerAId,
    playerBId,
    playerAScores,
    playerBScores
  );
  const matchResult = computeMatchPlayResult(playerAId, playerBId, holeResults);

  // Standard match play settlement
  const settlement = computeMatchPlaySettlement(
    game,
    playerAId,
    playerBId,
    playerAScores,
    playerBScores
  );

  // Nassau settlement (3 bets)
  const nassauSettlement = isNassau
    ? computeNassauSettlement(game, playerAId, playerBId, playerAScores, playerBScores)
    : null;

  // Nassau match results for each segment
  const front9Result = isNassau
    ? computeMatchResultForRange(playerAId, playerBId, playerAScores, playerBScores, 1, 9)
    : null;
  const back9Result = isNassau
    ? computeMatchResultForRange(playerAId, playerBId, playerAScores, playerBScores, 10, 18)
    : null;
  const overallResult = isNassau
    ? computeMatchResultForRange(playerAId, playerBId, playerAScores, playerBScores, 1, 18)
    : null;

  const holesPlayed = holeResults.length;
  const totalHoles = game.endHole - game.startHole + 1;
  const holesRemaining = totalHoles - holesPlayed;

  // Calculate total bucks for Nassau
  const nassauTotalBucks = nassauSettlement
    ? (nassauSettlement.front9?.amountInt ?? 0) +
      (nassauSettlement.back9?.amountInt ?? 0) +
      (nassauSettlement.overall?.amountInt ?? 0)
    : 0;

  // Calculate player stats
  const playerAStats = holes.length > 0
    ? calculatePlayerStats(playerAScores, holes, game.startHole, game.endHole)
    : null;
  const playerBStats = holes.length > 0
    ? calculatePlayerStats(playerBScores, holes, game.startHole, game.endHole)
    : null;

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

  // Stats display component
  const StatsRow = ({ label, playerA, playerB, highlight = false }: {
    label: string;
    playerA: number;
    playerB: number;
    highlight?: boolean;
  }) => (
    <div className={cn(
      'flex items-center justify-between py-1.5',
      highlight && 'font-semibold'
    )}>
      <span className={cn(
        'w-12 text-center',
        highlight ? 'text-primary' : 'text-muted-foreground'
      )}>
        {playerA}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn(
        'w-12 text-center',
        highlight ? 'text-blue-400' : 'text-muted-foreground'
      )}>
        {playerB}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>End Game</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Final Result */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Final Result
            </h3>
            <p className="text-lg font-semibold">{getResultText()}</p>
          </div>

          {/* Settlement Box(es) */}
          {isNassau && nassauSettlement ? (
            <div className="space-y-4">
              {/* Nassau 3-box display */}
              <div className="grid grid-cols-3 gap-3">
                {/* Front 9 */}
                <NassauSettlementBox
                  label="Front 9"
                  settlement={nassauSettlement.front9}
                  matchResult={front9Result!}
                  stake={game.stakeTeethInt}
                  getPlayerName={getPlayerName}
                />
                {/* Back 9 */}
                <NassauSettlementBox
                  label="Back 9"
                  settlement={nassauSettlement.back9}
                  matchResult={back9Result!}
                  stake={game.stakeTeethInt}
                  getPlayerName={getPlayerName}
                />
                {/* Overall */}
                <NassauSettlementBox
                  label="Overall"
                  settlement={nassauSettlement.overall}
                  matchResult={overallResult!}
                  stake={game.stakeTeethInt}
                  getPlayerName={getPlayerName}
                />
              </div>

              {/* Total settlement summary */}
              {nassauTotalBucks > 0 && (
                <NassauTotalSummary
                  nassauSettlement={nassauSettlement}
                  getPlayerName={getPlayerName}
                />
              )}
            </div>
          ) : (
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
                    ({game.stakeTeethInt} bucks × {matchResult.holesUp} holes up)
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-semibold text-amber-400">
                    Match Tied
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No bucks exchanged
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Player Stats */}
          {playerAStats && playerBStats && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Round Stats
              </h3>
              <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                {/* Player names header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/30">
                  <span className="w-12 text-center text-sm font-medium text-primary">
                    {playerAName.split(' ')[0]}
                  </span>
                  <span className="text-xs text-muted-foreground">vs</span>
                  <span className="w-12 text-center text-sm font-medium text-blue-400">
                    {playerBName.split(' ')[0]}
                  </span>
                </div>

                <StatsRow
                  label="Total"
                  playerA={playerAStats.totalStrokes}
                  playerB={playerBStats.totalStrokes}
                  highlight
                />
                {(playerAStats.eagles > 0 || playerBStats.eagles > 0) && (
                  <StatsRow
                    label="Eagles"
                    playerA={playerAStats.eagles}
                    playerB={playerBStats.eagles}
                  />
                )}
                <StatsRow
                  label="Birdies"
                  playerA={playerAStats.birdies}
                  playerB={playerBStats.birdies}
                />
                <StatsRow
                  label="Pars"
                  playerA={playerAStats.pars}
                  playerB={playerBStats.pars}
                />
                <StatsRow
                  label="Bogeys"
                  playerA={playerAStats.bogeys}
                  playerB={playerBStats.bogeys}
                />
                {(playerAStats.doublePlus > 0 || playerBStats.doublePlus > 0) && (
                  <StatsRow
                    label="Double+"
                    playerA={playerAStats.doublePlus}
                    playerB={playerBStats.doublePlus}
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Ending...' : 'End Game'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Nassau Settlement Box component
interface NassauSettlementBoxProps {
  label: string;
  settlement: Omit<Settlement, 'id' | 'createdAt'> | null;
  matchResult: { winnerId: string | null; holesUp: number };
  stake: number;
  getPlayerName: (id: string) => string;
}

function NassauSettlementBox({
  label,
  settlement,
  matchResult,
  stake,
  getPlayerName,
}: NassauSettlementBoxProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-gradient-to-br from-primary/10 to-primary/5 p-3 text-center">
      <div className="text-xs font-medium text-muted-foreground mb-2">{label}</div>
      {settlement ? (
        <>
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlligatorIcon size="sm" />
            <span className="text-xl font-bold text-primary">{settlement.amountInt}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {getPlayerName(settlement.payeeId).split(' ')[0]} wins
          </div>
          <div className="text-xs text-muted-foreground/70">
            {matchResult.holesUp} UP
          </div>
        </>
      ) : (
        <div className="py-2">
          <span className="text-sm font-medium text-amber-400">Tied</span>
        </div>
      )}
    </div>
  );
}

// Nassau Total Summary component
interface NassauTotalSummaryProps {
  nassauSettlement: NassauSettlement;
  getPlayerName: (id: string) => string;
}

function NassauTotalSummary({ nassauSettlement, getPlayerName }: NassauTotalSummaryProps) {
  // Calculate net position for each player
  const playerTotals: Record<string, number> = {};

  const addToTotal = (settlement: Omit<Settlement, 'id' | 'createdAt'> | null) => {
    if (!settlement) return;
    playerTotals[settlement.payeeId] = (playerTotals[settlement.payeeId] ?? 0) + settlement.amountInt;
    playerTotals[settlement.payerId] = (playerTotals[settlement.payerId] ?? 0) - settlement.amountInt;
  };

  addToTotal(nassauSettlement.front9);
  addToTotal(nassauSettlement.back9);
  addToTotal(nassauSettlement.overall);

  // Find the net winner and loser
  let netWinner: string | null = null;
  let netLoser: string | null = null;
  let netAmount = 0;

  for (const playerId of Object.keys(playerTotals)) {
    const total = playerTotals[playerId];
    if (total > 0) {
      netWinner = playerId;
      netAmount = total;
    } else if (total < 0) {
      netLoser = playerId;
    }
  }

  if (!netWinner || !netLoser || netAmount === 0) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
        <span className="text-lg font-semibold text-amber-400">All Square</span>
        <p className="text-sm text-muted-foreground mt-1">No net bucks exchanged</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-4">
      <div className="text-center">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          NASSAU TOTAL
        </div>
        <p className="text-sm text-muted-foreground mb-1">
          {getPlayerName(netLoser).split(' ')[0]} owes{' '}
          {getPlayerName(netWinner).split(' ')[0]}
        </p>
        <div className="flex items-center justify-center gap-2">
          <AlligatorIcon size="lg" />
          <span className="text-3xl font-bold text-primary">{netAmount}</span>
        </div>
      </div>
    </div>
  );
}
