'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockRounds, mockScores } from '@/lib/mock/data';
import { mockUsers } from '@/lib/mock/users';
import { isMockMode } from '@/lib/env/public';

export default function ScorecardPage({
  params,
}: {
  params: { eventId: string };
}) {
  // In mock mode, use demo data
  const rounds = isMockMode ? mockRounds : [];
  const scores = isMockMode ? mockScores : [];

  const holes = Array.from({ length: 9 }, (_, i) => i + 1);

  // Get scores for a player on a specific hole
  const getScore = (userId: string, hole: number): number | null => {
    const round = rounds.find((r) => r.userId === userId);
    if (!round) return null;
    const score = scores.find(
      (s) => s.roundId === round.id && s.holeNumber === hole
    );
    return score?.strokes ?? null;
  };

  // Calculate total for a player
  const getTotal = (userId: string): number => {
    const round = rounds.find((r) => r.userId === userId);
    if (!round) return 0;
    return scores
      .filter((s) => s.roundId === round.id)
      .reduce((sum, s) => sum + s.strokes, 0);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Scorecard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Front 9</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-medium">Hole</th>
                  {holes.map((hole) => (
                    <th
                      key={hole}
                      className="px-3 py-2 text-center font-medium"
                    >
                      {hole}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center font-medium">OUT</th>
                </tr>
                <tr className="border-b bg-gray-50 text-xs text-muted-foreground">
                  <td className="py-1">Par</td>
                  {[4, 4, 3, 4, 3, 4, 5, 4, 4].map((par, i) => (
                    <td key={i} className="px-3 py-1 text-center">
                      {par}
                    </td>
                  ))}
                  <td className="px-3 py-1 text-center">35</td>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">
                      {user.name.split(' ')[0]}
                    </td>
                    {holes.map((hole) => {
                      const score = getScore(user.id, hole);
                      return (
                        <td
                          key={hole}
                          className="px-3 py-3 text-center font-mono"
                        >
                          {score ?? '-'}
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center font-mono font-bold">
                      {getTotal(user.id) || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Score entry coming soon. For now, viewing sample scores.
      </p>
    </div>
  );
}
