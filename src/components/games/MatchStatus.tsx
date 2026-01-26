'use client';

import {
  computeHoleResults,
  computeMatchPlayResult,
  type HoleResult,
} from '@/lib/domain/settlement/computeSettlement';
import type { Game, HoleScore } from '@/types';

interface MatchStatusProps {
  game: Game;
  playerAId: string;
  playerBId: string;
  playerAScores: HoleScore[];
  playerBScores: HoleScore[];
  playerAName: string;
  playerBName: string;
}

/**
 * Displays match play status: who's up, by how many, through how many holes
 */
export function MatchStatus({
  game,
  playerAId,
  playerBId,
  playerAScores,
  playerBScores,
  playerAName,
  playerBName,
}: MatchStatusProps) {
  // Compute hole-by-hole results
  const holeResults = computeHoleResults(
    game,
    playerAId,
    playerBId,
    playerAScores,
    playerBScores
  );

  // Compute overall match result
  const matchResult = computeMatchPlayResult(playerAId, playerBId, holeResults);

  // Find holes played within the game range
  const holesPlayed = holeResults.length;
  const totalHoles = game.endHole - game.startHole + 1;

  // Determine status text
  let statusText: string;
  if (holesPlayed === 0) {
    statusText = 'Not started';
  } else if (matchResult.holesUp === 0) {
    statusText = `All Square thru ${holesPlayed}`;
  } else {
    const winnerName =
      matchResult.winnerId === playerAId ? playerAName : playerBName;
    statusText = `${winnerName} ${matchResult.holesUp} UP thru ${holesPlayed}`;
  }

  return (
    <div className="space-y-2">
      {/* Status text */}
      <div className="text-sm font-medium">{statusText}</div>

      {/* Hole-by-hole dots */}
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: totalHoles }, (_, i) => {
          const holeNumber = game.startHole + i;
          const result = holeResults.find((r) => r.hole === holeNumber);

          return (
            <HoleDot
              key={holeNumber}
              holeNumber={holeNumber}
              result={result}
              playerAId={playerAId}
            />
          );
        })}
      </div>
    </div>
  );
}

interface HoleDotProps {
  holeNumber: number;
  result: HoleResult | undefined;
  playerAId: string;
}

function HoleDot({ holeNumber, result, playerAId }: HoleDotProps) {
  // No score yet
  if (!result) {
    return (
      <div
        className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground"
        title={`Hole ${holeNumber}: Not played`}
      >
        {holeNumber}
      </div>
    );
  }

  // Tie (halved)
  if (result.winner === 'tie') {
    return (
      <div
        className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 text-[10px] text-gray-700"
        title={`Hole ${holeNumber}: Halved`}
      >
        {holeNumber}
      </div>
    );
  }

  // Player A won
  if (result.winner === 'A') {
    return (
      <div
        className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] text-white"
        title={`Hole ${holeNumber}: Player A won`}
      >
        {holeNumber}
      </div>
    );
  }

  // Player B won
  return (
    <div
      className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white"
      title={`Hole ${holeNumber}: Player B won`}
    >
      {holeNumber}
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function MatchStatusCompact({
  game,
  playerAId,
  playerBId,
  playerAScores,
  playerBScores,
  playerAName,
  playerBName,
}: MatchStatusProps) {
  const holeResults = computeHoleResults(
    game,
    playerAId,
    playerBId,
    playerAScores,
    playerBScores
  );

  const matchResult = computeMatchPlayResult(playerAId, playerBId, holeResults);
  const holesPlayed = holeResults.length;

  if (holesPlayed === 0) {
    return <span className="text-sm text-muted-foreground">Not started</span>;
  }

  if (matchResult.holesUp === 0) {
    return <span className="text-sm font-medium">AS thru {holesPlayed}</span>;
  }

  const winnerName =
    matchResult.winnerId === playerAId ? playerAName : playerBName;
  const shortName = winnerName.split(' ')[0]; // First name only

  return (
    <span className="text-sm font-medium">
      {shortName} {matchResult.holesUp} UP thru {holesPlayed}
    </span>
  );
}
