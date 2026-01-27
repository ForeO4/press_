'use client';

import type { LeaderboardEntry } from '@/lib/services/leaderboard';
import { formatTeeth } from '@/lib/utils';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No players yet. Invite some to get started!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm text-muted-foreground">
            <th className="pb-3 pl-4 font-medium">Rank</th>
            <th className="pb-3 font-medium">Player</th>
            <th className="pb-3 pr-4 text-right font-medium">Net</th>
            <th className="pb-3 pr-4 text-right font-medium hidden sm:table-cell">
              Balance
            </th>
            <th className="pb-3 pr-4 text-right font-medium hidden md:table-cell">
              W-L-P
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;
            const isTop3 = entry.rank <= 3;

            return (
              <tr
                key={entry.userId}
                className={`border-b transition-colors ${
                  isCurrentUser ? 'bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                {/* Rank */}
                <td className="py-3 pl-4">
                  <RankBadge rank={entry.rank} />
                </td>

                {/* Player */}
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        isCurrentUser ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {entry.name}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground">(You)</span>
                    )}
                  </div>
                </td>

                {/* Net Change */}
                <td className="py-3 pr-4 text-right">
                  <span
                    className={`font-mono font-medium ${
                      entry.netChange > 0
                        ? 'text-success'
                        : entry.netChange < 0
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {entry.netChange > 0 ? '+' : ''}
                    {formatTeeth(entry.netChange)}
                  </span>
                </td>

                {/* Balance */}
                <td className="py-3 pr-4 text-right font-mono hidden sm:table-cell">
                  {formatTeeth(entry.balance)}
                </td>

                {/* Record */}
                <td className="py-3 pr-4 text-right text-sm text-muted-foreground hidden md:table-cell">
                  {entry.gamesPlayed > 0
                    ? `${entry.wins}-${entry.losses}-${entry.pushes}`
                    : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const colors = {
    1: 'bg-yellow-500 text-yellow-950',
    2: 'bg-gray-400 text-gray-950',
    3: 'bg-amber-600 text-amber-950',
  };

  const color = colors[rank as keyof typeof colors];

  if (color) {
    return (
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${color}`}
      >
        {rank}
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 w-6 items-center justify-center text-sm text-muted-foreground">
      {rank}
    </span>
  );
}
