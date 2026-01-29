'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getUserClubhouses } from '@/lib/services/clubhouses';
import type { ClubhouseWithMemberCount } from '@/types';
import { Plus, Users, Calendar, ChevronRight } from 'lucide-react';

export function ClubhouseSelector() {
  const router = useRouter();
  const [clubhouses, setClubhouses] = useState<ClubhouseWithMemberCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadClubhouses() {
      try {
        const data = await getUserClubhouses();
        setClubhouses(data);
      } catch (err) {
        console.error('Failed to load clubhouses:', err);
        setError('Failed to load your clubhouses');
      } finally {
        setLoading(false);
      }
    }

    loadClubhouses();
  }, []);

  const handleSelectClubhouse = (clubhouseId: string) => {
    // For now, redirect to the dashboard showing this clubhouse's events
    router.push(`/app?clubhouse=${clubhouseId}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      {/* Header */}
      <div className="text-center mb-8 mt-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Your Clubhouses
        </h1>
        <p className="text-muted-foreground">
          Select a clubhouse or create a new one
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6 max-w-md mx-auto w-full">
        <Link href="/clubhouse/create" className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </Link>
        <Link href="/clubhouse/join" className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <Users className="h-4 w-4" />
            Join
          </Button>
        </Link>
      </div>

      {/* Clubhouse List */}
      <div className="max-w-md mx-auto w-full space-y-3">
        {loading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse bg-muted rounded-lg" />
            ))}
          </>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">{error}</p>
              <Button variant="link" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : clubhouses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-2">
                No Clubhouses Yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a clubhouse for your golf trip, league, or group of friends
              </p>
              <Link href="/clubhouse/create">
                <Button>Create Your First Clubhouse</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          clubhouses.map((clubhouse) => (
            <ClubhouseListItem
              key={clubhouse.id}
              clubhouse={clubhouse}
              onSelect={() => handleSelectClubhouse(clubhouse.id)}
            />
          ))
        )}
      </div>

      {/* Skip option */}
      {clubhouses.length === 0 && (
        <div className="text-center mt-8">
          <Link href="/app">
            <Button variant="ghost" size="sm">
              Skip for now
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function ClubhouseListItem({
  clubhouse,
  onSelect,
}: {
  clubhouse: ClubhouseWithMemberCount;
  onSelect: () => void;
}) {
  const typeLabels = {
    trip: 'Golf Trip',
    league: 'League',
    event: 'Event',
    social: 'Social',
  };

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onSelect}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-2xl">
            {clubhouse.type === 'trip' ? '🏌️' : clubhouse.type === 'league' ? '🏆' : clubhouse.type === 'event' ? '📅' : '👥'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">
            {clubhouse.name}
          </h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{typeLabels[clubhouse.type]}</span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {clubhouse.memberCount}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {clubhouse.eventCount}
            </span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
