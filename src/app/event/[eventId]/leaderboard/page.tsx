'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BottomNav } from '@/components/nav/BottomNav';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { getLeaderboard, type LeaderboardEntry } from '@/lib/services/leaderboard';
import { getEvent } from '@/lib/services/events';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatTeeth } from '@/lib/utils';
import type { Event } from '@/types';

export default function LeaderboardPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const user = useCurrentUser();

  const [event, setEvent] = useState<Event | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [eventData, leaderboardData] = await Promise.all([
          getEvent(eventId),
          getLeaderboard(eventId),
        ]);

        setEvent(eventData);
        setEntries(leaderboardData);
      } catch (err) {
        setError('Failed to load leaderboard');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [eventId]);

  // Find current user's position
  const userEntry = entries.find((e) => e.userId === user?.id);
  const totalPot = entries.reduce((sum, e) => sum + e.balance, 0);

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <Link
              href={`/event/${eventId}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; Back to Event
            </Link>
            <h1 className="text-xl font-bold text-foreground">
              {event?.name ?? 'Loading...'}
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span role="img" aria-label="trophy">
              <svg
                className="h-7 w-7 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </span>
            Leaderboard
          </h2>
          <p className="text-muted-foreground">
            Gator Bucks standings for this event
          </p>
        </div>

        {/* Stats Cards */}
        {!isLoading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Players</p>
                <p className="text-2xl font-bold text-foreground">
                  {entries.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Total Pot</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatTeeth(totalPot)}
                </p>
              </CardContent>
            </Card>
            {userEntry && (
              <>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-sm text-muted-foreground">Your Rank</p>
                    <p className="text-2xl font-bold text-foreground">
                      #{userEntry.rank}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-sm text-muted-foreground">Your Net</p>
                    <p
                      className={`text-2xl font-bold ${
                        userEntry.netChange > 0
                          ? 'text-success'
                          : userEntry.netChange < 0
                            ? 'text-destructive'
                            : 'text-foreground'
                      }`}
                    >
                      {userEntry.netChange > 0 ? '+' : ''}
                      {formatTeeth(userEntry.netChange)}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle>Standings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading leaderboard...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">{error}</div>
            ) : (
              <LeaderboardTable entries={entries} currentUserId={user?.id} />
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav eventId={eventId} />
    </main>
  );
}
