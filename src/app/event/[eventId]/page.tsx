'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { getEvent } from '@/lib/services/events';
import { getEventMembers } from '@/lib/services/players';
import { getEventTeeSnapshot } from '@/lib/services/courses';
import type { Event, TeeSnapshot, PlayerProfile } from '@/types';

export default function EventPage({
  params,
}: {
  params: { eventId: string };
}) {
  const [event, setEvent] = useState<Event | null>(null);
  const [members, setMembers] = useState<PlayerProfile[]>([]);
  const [teeSnapshot, setTeeSnapshot] = useState<TeeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDemoEvent = params.eventId.startsWith('demo-');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch event data
        const eventData = await getEvent(params.eventId);
        setEvent(eventData);

        // Fetch members (will return mock data for demo events)
        if (eventData) {
          try {
            const membersData = await getEventMembers(params.eventId);
            setMembers(membersData);
          } catch (err) {
            console.warn('[EventPage] Failed to fetch members:', err);
          }

          // Fetch tee snapshot for course info
          try {
            const snapshot = await getEventTeeSnapshot(params.eventId);
            setTeeSnapshot(snapshot);
          } catch (err) {
            console.warn('[EventPage] Failed to fetch tee snapshot:', err);
          }
        }
      } catch (err) {
        console.error('[EventPage] Failed to fetch event:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.eventId]);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-2 text-muted-foreground">Loading event...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">{error}</p>
        <Link href="/app" className="mt-4 text-primary hover:underline">
          Back to Events
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Event not found</p>
        <Link href="/app" className="mt-4 text-primary hover:underline">
          Back to Events
        </Link>
      </div>
    );
  }

  const playerCount = members.length;

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{event.name}</h1>
          <p className="text-muted-foreground">{formatDate(event.date)}</p>
          {teeSnapshot && (
            <p className="mt-1 text-sm text-muted-foreground">
              {teeSnapshot.courseName} • {teeSnapshot.teeSetName} Tees
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                event.visibility === 'PUBLIC'
                  ? 'bg-green-500/20 text-green-400'
                  : event.visibility === 'UNLISTED'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {event.visibility === 'PRIVATE' ? 'Private' : event.visibility === 'UNLISTED' ? 'Unlisted' : 'Public'}
            </span>
            {event.isLocked && (
              <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs font-medium text-red-400">
                Locked
              </span>
            )}
          </div>
        </div>
        <Link href={`/event/${params.eventId}/settings`}>
          <Button variant="outline" size="sm">
            Settings
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href={`/event/${params.eventId}/games/new`} className="block">
          <Card className="h-full cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="mb-3 rounded-full bg-primary/10 p-4">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground">Start a Game</h3>
              <p className="mt-1 text-sm text-muted-foreground">Create a new round</p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/event/${params.eventId}/members`} className="block">
          <Card className="h-full cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="mb-3 rounded-full bg-blue-500/10 p-4">
                <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground">Invite Players</h3>
              <p className="mt-1 text-sm text-muted-foreground">{playerCount} players joined</p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/event/${params.eventId}/games`} className="block">
          <Card className="h-full cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="mb-3 rounded-full bg-green-500/10 p-4">
                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground">View Games</h3>
              <p className="mt-1 text-sm text-muted-foreground">See all rounds</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{playerCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {event.isLocked ? 'Complete' : 'Active'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Course
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-foreground truncate">
              {teeSnapshot?.courseName || 'Not set'}
            </p>
            {teeSnapshot && (
              <p className="text-sm text-muted-foreground">
                {teeSnapshot.teeSetName} • {teeSnapshot.rating}/{teeSnapshot.slope}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Members</CardTitle>
          <Link href={`/event/${params.eventId}/members`}>
            <Button variant="ghost" size="sm">
              Manage
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No members yet</p>
              <Link href={`/event/${params.eventId}/members`}>
                <Button variant="link" className="mt-2">
                  Invite players to get started
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {members.slice(0, 6).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {member.name?.charAt(0) || '?'}
                    </div>
                    <span className="font-medium text-foreground">
                      {member.name || 'Unknown'}
                    </span>
                  </div>
                  {member.handicapIndex !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      HCP {member.handicapIndex}
                    </span>
                  )}
                </div>
              ))}
              {members.length > 6 && (
                <Link
                  href={`/event/${params.eventId}/members`}
                  className="flex items-center justify-center rounded-lg border border-dashed border-border p-3 text-muted-foreground hover:border-primary hover:text-primary"
                >
                  +{members.length - 6} more
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demo Mode Notice */}
      {isDemoEvent && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="py-4">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>Demo Mode:</strong> This is a demo event. Create a real event to save your data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
