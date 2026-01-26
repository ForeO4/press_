'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppStore } from '@/stores';
import { mockEvent, mockTeethBalances } from '@/lib/mock/data';
import { formatDate, formatTeeth } from '@/lib/utils';
import { isMockMode } from '@/lib/env/public';

export default function DashboardPage() {
  const user = useCurrentUser();
  const mockUser = useAppStore((state) => state.mockUser);

  // In mock mode, use demo data
  const events = isMockMode ? [mockEvent] : [];
  const userBalance = isMockMode
    ? mockTeethBalances.find((b) => b.userId === mockUser?.id)
    : null;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            Press!
          </Link>
          <AuthHeader />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
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
          <div className="mb-8 rounded-md bg-amber-50 p-4 text-amber-800">
            <p className="font-medium">Running in Mock Mode</p>
            <p className="text-sm">
              No backend connected. Using demo data. Set NEXT_PUBLIC_SUPABASE_URL
              to connect to Supabase.
            </p>
          </div>
        )}

        {/* Events */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Events</h2>
            <Button>Create Event</Button>
          </div>

          {events.length === 0 ? (
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
                              ? 'bg-green-100 text-green-800'
                              : event.visibility === 'UNLISTED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
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
                        <span className="mt-2 inline-block rounded bg-red-100 px-2 py-1 text-xs text-red-800">
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
