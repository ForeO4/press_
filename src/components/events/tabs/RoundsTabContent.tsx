'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  PlayCircle,
  Clock,
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  Pencil,
  ChevronRight,
} from 'lucide-react';
import { getEventRounds } from '@/lib/services/scores';
import { getEventTeeSnapshot } from '@/lib/services/courses';
import { getEventMembers } from '@/lib/services/players';
import type { RoundsTabProps } from './types';

interface RoundSummary {
  id: string;
  name: string;
  course: string;
  date: string;
  time: string;
  playersCount: number;
  status: 'upcoming' | 'in-progress' | 'completed';
  currentHole?: number;
  totalHoles: number;
}

export function RoundsTabContent({
  eventId,
  courseName: propCourseName,
  isLoading = false,
}: RoundsTabProps) {
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState<string>(propCourseName || 'Course');

  useEffect(() => {
    // Fetch rounds specific to this event
    const fetchRounds = async () => {
      setLoading(true);
      try {
        // Get course name from tee snapshot if not provided
        if (!propCourseName) {
          const snapshot = await getEventTeeSnapshot(eventId).catch(() => null);
          if (snapshot?.courseName) {
            setCourseName(snapshot.courseName);
          }
        }

        // Get rounds and members for this event
        const [roundsData, membersData] = await Promise.all([
          getEventRounds(eventId),
          getEventMembers(eventId).catch(() => []),
        ]);

        // If we have rounds data, convert to RoundSummary format
        if (roundsData.rounds.length > 0) {
          // Group rounds by date to create "round" entries
          const eventRound: RoundSummary = {
            id: `event-round-${eventId}`,
            name: 'Current Round',
            course: propCourseName || courseName,
            date: new Date().toISOString().split('T')[0],
            time: '10:00',
            playersCount: membersData.length || roundsData.rounds.length,
            status: 'in-progress',
            currentHole: 10,
            totalHoles: 18,
          };
          setRounds([eventRound]);
        } else {
          // No rounds for this event yet
          setRounds([]);
        }
      } catch (err) {
        console.error('[RoundsTabContent] Failed to fetch rounds:', err);
        setRounds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRounds();
  }, [eventId, propCourseName, courseName]);

  const activeRounds = rounds.filter((r) => r.status === 'in-progress');
  const upcomingRounds = rounds.filter((r) => r.status === 'upcoming');
  const completedRounds = rounds.filter((r) => r.status === 'completed');

  const getStatusBadge = (status: RoundSummary['status']) => {
    switch (status) {
      case 'in-progress':
        return (
          <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-500 border border-green-500/30">
            Live
          </span>
        );
      case 'upcoming':
        return (
          <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-500 border border-blue-500/30">
            Upcoming
          </span>
        );
      case 'completed':
        return (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border">
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading || isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="h-10 w-36 animate-pulse rounded bg-muted" />
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-5">
            <div className="mb-4 h-5 w-40 rounded bg-muted" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const renderRoundCard = (round: RoundSummary, canEdit: boolean = false) => (
    <Card
      key={round.id}
      className="border-border bg-card hover:border-primary/50 transition-all cursor-pointer group"
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Link href={`/event/${eventId}/scorecard`} className="flex-1">
                <h4 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {round.name}
                </h4>
              </Link>
              {getStatusBadge(round.status)}
            </div>
          </div>
          {canEdit && (
            <Link href={`/event/${eventId}/scorecard`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit round</span>
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm">{round.course}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm">{formatDate(round.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm">{round.time}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm">
              {round.playersCount} player{round.playersCount !== 1 ? 's' : ''}
            </span>
            {round.status === 'in-progress' && round.currentHole && (
              <span className="ml-2 text-sm text-green-500">
                • Hole {round.currentHole}/{round.totalHoles}
              </span>
            )}
          </div>
          <Link href={`/event/${eventId}/scorecard`}>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              View Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Rounds & Events</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {rounds.length} scheduled round{rounds.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href={`/event/${eventId}/rounds/new`}>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Start New Round
          </Button>
        </Link>
      </div>

      {/* Empty State */}
      {rounds.length === 0 ? (
        <Card className="border-dashed border-border">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No rounds yet. Start a new round to get playing!
            </p>
            <Link href={`/event/${eventId}/rounds/new`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Start New Round
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active/In-Progress Rounds */}
          {activeRounds.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                <PlayCircle className="h-3.5 w-3.5 text-green-500" />
                In Progress ({activeRounds.length})
              </h4>
              <div className="grid gap-4">
                {activeRounds.map((round) => renderRoundCard(round, true))}
              </div>
            </div>
          )}

          {/* Upcoming Rounds */}
          {upcomingRounds.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                Upcoming ({upcomingRounds.length})
              </h4>
              <div className="grid gap-4">
                {upcomingRounds.map((round) => renderRoundCard(round, true))}
              </div>
            </div>
          )}

          {/* Completed Rounds */}
          {completedRounds.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5" />
                Completed ({completedRounds.length})
              </h4>
              <div className="grid gap-4">
                {completedRounds.slice(0, 3).map((round) => renderRoundCard(round, false))}
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
        </div>
      )}
    </div>
  );
}
