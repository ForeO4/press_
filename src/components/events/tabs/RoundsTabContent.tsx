'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, PlayCircle, Clock, CheckCircle, Calendar, ChevronRight } from 'lucide-react';
import type { RoundsTabProps } from './types';

interface RoundSummary {
  id: string;
  date: string;
  courseName: string;
  status: 'upcoming' | 'active' | 'completed';
  playersCount: number;
  currentHole?: number;
  totalHoles: number;
}

// Mock rounds for demo
const mockRounds: RoundSummary[] = [
  {
    id: 'round-1',
    date: new Date().toISOString(),
    courseName: 'Bandon Dunes',
    status: 'active',
    playersCount: 4,
    currentHole: 10,
    totalHoles: 18,
  },
  {
    id: 'round-2',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    courseName: 'Pacific Dunes',
    status: 'upcoming',
    playersCount: 4,
    totalHoles: 18,
  },
  {
    id: 'round-3',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    courseName: 'Old MacDonald',
    status: 'completed',
    playersCount: 4,
    totalHoles: 18,
  },
];

export function RoundsTabContent({
  eventId,
  isLoading = false,
}: RoundsTabProps) {
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching rounds
    const fetchRounds = async () => {
      setLoading(true);
      // In real implementation, fetch from API
      await new Promise((resolve) => setTimeout(resolve, 300));
      setRounds(mockRounds);
      setLoading(false);
    };

    fetchRounds();
  }, [eventId]);

  const activeRounds = rounds.filter((r) => r.status === 'active');
  const upcomingRounds = rounds.filter((r) => r.status === 'upcoming');
  const completedRounds = rounds.filter((r) => r.status === 'completed');

  const getStatusIcon = (status: RoundSummary['status']) => {
    switch (status) {
      case 'active':
        return <PlayCircle className="h-4 w-4 text-green-500" />;
      case 'upcoming':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: RoundSummary['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-500">
            Live
          </span>
        );
      case 'upcoming':
        return (
          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-500">
            Upcoming
          </span>
        );
      case 'completed':
        return (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Complete
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading || isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-muted p-4">
            <div className="mb-2 h-4 w-24 rounded bg-muted-foreground/20" />
            <div className="h-3 w-32 rounded bg-muted-foreground/20" />
          </div>
        ))}
      </div>
    );
  }

  const renderRoundCard = (round: RoundSummary) => (
    <Link key={round.id} href={`/event/${eventId}/round/${round.id}`}>
      <div className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(round.status)}
            <span className="text-sm font-medium text-foreground">
              {round.courseName}
            </span>
          </div>
          {getStatusBadge(round.status)}
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(round.date)}
          </span>
          <span>{round.playersCount} players</span>
          {round.status === 'active' && round.currentHole && (
            <span className="text-green-500">
              Hole {round.currentHole}/{round.totalHoles}
            </span>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-4">
      {/* New Round Button */}
      <Link href={`/event/${eventId}/rounds/new`}>
        <Button className="w-full gap-1.5">
          <Plus className="h-4 w-4" />
          Start New Round
        </Button>
      </Link>

      {/* Active Rounds */}
      {activeRounds.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <PlayCircle className="h-3 w-3" />
            Active ({activeRounds.length})
          </h3>
          <div className="space-y-2">
            {activeRounds.map(renderRoundCard)}
          </div>
        </div>
      )}

      {/* Upcoming Rounds */}
      {upcomingRounds.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <Clock className="h-3 w-3" />
            Upcoming ({upcomingRounds.length})
          </h3>
          <div className="space-y-2">
            {upcomingRounds.map(renderRoundCard)}
          </div>
        </div>
      )}

      {/* Completed Rounds */}
      {completedRounds.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <CheckCircle className="h-3 w-3" />
            Completed ({completedRounds.length})
          </h3>
          <div className="space-y-2">
            {completedRounds.slice(0, 3).map(renderRoundCard)}
          </div>
          {completedRounds.length > 3 && (
            <div className="text-center">
              <Link href={`/event/${eventId}/rounds`}>
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View All Rounds
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {rounds.length === 0 && (
        <div className="py-8 text-center">
          <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No rounds yet. Start a new round to get playing!
          </p>
        </div>
      )}
    </div>
  );
}
