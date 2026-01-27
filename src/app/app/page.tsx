'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppStore } from '@/stores';
import { getUserEvents } from '@/lib/services/events';
import { mockTeethBalances } from '@/lib/mock/data';
import { formatDate, formatTeeth } from '@/lib/utils';
import { isMockMode } from '@/lib/env/public';
import type { Event } from '@/types';

export default function DashboardPage() {
  const user = useCurrentUser();
  const mockUser = useAppStore((state) => state.mockUser);

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch events on mount
  useEffect(() => {
    async function fetchEvents() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const userEvents = await getUserEvents(user.id);
        setEvents(userEvents);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();
  }, [user?.id]);

  const userBalance = isMockMode
    ? mockTeethBalances.find((b) => b.userId === mockUser?.id)
    : null;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            Press!
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AuthHeader />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {user?.name ?? 'Guest'}
          </h1>
          {userBalance && (
            <p className="text-muted-foreground">
              Current balance: {formatTeeth(userBalance.balanceInt)}
            </p>
          )}
        </div>

        {/* Mock mode notice */}
        {isMockMode && (
          <div className="mb-8 rounded-md bg-warning/10 p-4 text-warning-foreground">
            <p className="font-medium">Running in Mock Mode</p>
            <p className="text-sm opacity-80">
              No backend connected. Using demo data. Set NEXT_PUBLIC_SUPABASE_URL
              to connect to Supabase.
            </p>
          </div>
        )}

        {/* Events */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Your Events
            </h2>
            <Link href="/app/events/new">
              <Button>Create Event</Button>
            </Link>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Loading events...</p>
              </CardContent>
            </Card>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No events yet. Create one to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <Link key={event.id} href={`/event/${event.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{event.name}</CardTitle>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            event.visibility === 'PUBLIC'
                              ? 'bg-success/20 text-success'
                              : event.visibility === 'UNLISTED'
                                ? 'bg-info/20 text-info'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {event.visibility}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {formatDate(event.date)}
                      </p>
                      {event.isLocked && (
                        <span className="mt-2 inline-block rounded bg-destructive/20 px-2 py-1 text-xs text-destructive">
                          Locked
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

    </main>
  );
}
