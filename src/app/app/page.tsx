'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppStore } from '@/stores';
import { getUserEvents } from '@/lib/services/events';
import { getPlayerCareerStats, getLastRoundStats, getRecentGameResult } from '@/lib/services/playerStats';
import { getFavoriteClubhouses, toggleFavorite } from '@/lib/services/favorites';
import { isMockMode } from '@/lib/env/public';
import { Plus } from 'lucide-react';
import type { Event, CareerStats, PlayerRoundStats, RecentGameResult, StatsPeriod, FavoriteClubhouse } from '@/types';

import {
  StatsOverview,
  CareerStatsCard,
  RecentMessagesCard,
  FavoriteClubhousesSection,
  ClubhouseCard,
} from '@/components/dashboard';

export default function DashboardPage() {
  const user = useCurrentUser();
  const mockUser = useAppStore((state) => state.mockUser);

  // State
  const [events, setEvents] = useState<Event[]>([]);
  const [favoriteClubhouses, setFavoriteClubhouses] = useState<FavoriteClubhouse[]>([]);
  const [careerStats, setCareerStats] = useState<CareerStats | null>(null);
  const [lastRound, setLastRound] = useState<PlayerRoundStats | null>(null);
  const [recentGame, setRecentGame] = useState<RecentGameResult | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('lifetime');

  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Fetch events
  useEffect(() => {
    async function fetchData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const [userEvents, favorites, stats, round, game] = await Promise.all([
          getUserEvents(user.id),
          getFavoriteClubhouses(user.id),
          getPlayerCareerStats(user.id, statsPeriod),
          getLastRoundStats(user.id),
          getRecentGameResult(user.id),
        ]);

        setEvents(userEvents);
        setFavoriteClubhouses(favorites);
        setCareerStats(stats);
        setLastRound(round);
        setRecentGame(game);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user?.id]);

  // Refetch stats when period changes
  useEffect(() => {
    async function fetchStats() {
      if (!user?.id) return;

      setIsStatsLoading(true);
      try {
        const stats = await getPlayerCareerStats(user.id, statsPeriod);
        setCareerStats(stats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsStatsLoading(false);
      }
    }

    fetchStats();
  }, [user?.id, statsPeriod]);

  const handleToggleFavorite = useCallback(async (eventId: string) => {
    if (!user?.id) return;

    try {
      const isFavorited = await toggleFavorite(user.id, eventId);

      if (isFavorited) {
        // Refetch favorites to get the full data
        const favorites = await getFavoriteClubhouses(user.id);
        setFavoriteClubhouses(favorites);
      } else {
        // Remove from state
        setFavoriteClubhouses(prev => prev.filter(f => f.eventId !== eventId));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [user?.id]);

  // Mock messages for now (would come from a service)
  const recentMessages = [
    {
      id: 'msg-1',
      eventId: events[0]?.id || 'demo-event-1',
      eventName: events[0]?.name || 'Saturday Group',
      authorName: 'Mike',
      authorInitial: 'M',
      content: 'Great round today! That birdie on 18 was clutch.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'msg-2',
      eventId: events[0]?.id || 'demo-event-1',
      eventName: events[0]?.name || 'Saturday Group',
      authorName: 'John',
      authorInitial: 'J',
      content: 'Who\'s playing this weekend?',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  // Filter out favorites from main list
  const favoriteEventIds = new Set(favoriteClubhouses.map(f => f.eventId));
  const nonFavoriteEvents = events.filter(e => !favoriteEventIds.has(e.id));

  return (
    <main className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-2xl font-bold text-primary">
            Press!
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AuthHeader />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {user?.name ?? 'Guest'}
          </h1>
        </div>

        {/* Mock mode notice */}
        {isMockMode && (
          <div className="rounded-lg bg-warning/10 p-4 text-warning-foreground">
            <p className="font-medium">Running in Mock Mode</p>
            <p className="text-sm opacity-80">
              No backend connected. Using demo data.
            </p>
          </div>
        )}

        {/* Last Round Stats Banner */}
        {!isLoading && (lastRound || recentGame) && (
          <StatsOverview
            lastRound={lastRound}
            recentGame={recentGame}
            currentUserId={user?.id || ''}
          />
        )}

        {/* Career Stats */}
        {careerStats && (
          <CareerStatsCard
            stats={careerStats}
            period={statsPeriod}
            onPeriodChange={setStatsPeriod}
            isLoading={isStatsLoading}
          />
        )}

        {/* Recent Messages */}
        <RecentMessagesCard
          messages={events.length > 0 ? recentMessages : []}
          isLoading={isLoading}
        />

        {/* Favorite Clubhouses */}
        <FavoriteClubhousesSection
          favorites={favoriteClubhouses}
          onToggleFavorite={handleToggleFavorite}
          isLoading={isLoading}
        />

        {/* Your Clubhouses */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Your Clubhouses
            </h2>
            <Link href="/app/events/new">
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : nonFavoriteEvents.length === 0 && favoriteClubhouses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No clubhouses yet. Create one to get started!
                </p>
                <Link href="/app/events/new">
                  <Button variant="link" className="mt-2">
                    Create your first clubhouse
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {nonFavoriteEvents.map((event) => (
                <ClubhouseCard
                  key={event.id}
                  event={event}
                  showFavoriteButton={true}
                  isFavorite={false}
                  onToggleFavorite={() => handleToggleFavorite(event.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
