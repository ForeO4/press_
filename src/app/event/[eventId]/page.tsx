'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { getEvent, updateEvent } from '@/lib/services/events';
import { getEventMembers } from '@/lib/services/players';
import { getEventTeeSnapshot } from '@/lib/services/courses';
import { getLeaderboard } from '@/lib/services/leaderboard';
import { getGamesForEvent } from '@/lib/services/games';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ClubhouseThemeProvider } from '@/components/providers/ClubhouseThemeProvider';
import type { Event, TeeSnapshot, PlayerProfile, MembershipRole, GameWithParticipants, ClubhouseTheme } from '@/types';
import type { LeaderboardEntry } from '@/lib/services/leaderboard';
import type { TabId } from '@/components/events';

import {
  InviteModal,
  ClubhouseHeader,
  RoleActionBar,
  ClubhouseTabs,
  OverviewTabContent,
  RoundsTabContent,
  GamesTabContent,
  StatsTabContent,
  ClubhouseTabContent,
} from '@/components/events';

interface MemberWithRole extends PlayerProfile {
  role?: MembershipRole;
}

export default function EventPage({
  params,
}: {
  params: { eventId: string };
}) {
  const user = useCurrentUser();
  const [event, setEvent] = useState<Event | null>(null);
  const [members, setMembers] = useState<MemberWithRole[]>([]);
  const [teeSnapshot, setTeeSnapshot] = useState<TeeSnapshot | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [games, setGames] = useState<GameWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const isDemoEvent = params.eventId.startsWith('demo-');

  // Get current user's role in the event
  const userMembership = members.find((m) => m.userId === user?.id);
  const userRole: MembershipRole = userMembership?.role || 'VIEWER';

  // Count active players (mock for now)
  const activePlayers = games.filter((g) => g.status === 'active').length > 0 ? members.length : 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch event data
        const eventData = await getEvent(params.eventId);
        setEvent(eventData);

        // Fetch members, tee snapshot, leaderboard, and games in parallel
        if (eventData) {
          const [membersData, snapshot, leaderboardData, gamesData] = await Promise.all([
            getEventMembers(params.eventId).catch(() => []),
            getEventTeeSnapshot(params.eventId).catch(() => null),
            getLeaderboard(params.eventId).catch(() => []),
            getGamesForEvent(params.eventId).catch(() => []),
          ]);

          setMembers(membersData as MemberWithRole[]);
          setTeeSnapshot(snapshot);
          setLeaderboard(leaderboardData);
          setGames(gamesData);
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

  const handleThemeChange = useCallback(async (theme: ClubhouseTheme) => {
    if (!event) return;

    // Optimistic update
    setEvent({ ...event, theme });

    try {
      await updateEvent(params.eventId, { theme });
    } catch (err) {
      console.error('[EventPage] Failed to update theme:', err);
      // Revert on error
      setEvent(event);
    }
  }, [event, params.eventId]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTabContent
            eventId={params.eventId}
            members={members}
            games={games}
            leaderboard={leaderboard}
            courseName={teeSnapshot?.courseName}
            userRole={userRole}
            isLoading={loading}
          />
        );
      case 'rounds':
        return (
          <RoundsTabContent
            eventId={params.eventId}
            courseName={teeSnapshot?.courseName}
            isLoading={loading}
          />
        );
      case 'games':
        return (
          <GamesTabContent
            eventId={params.eventId}
            games={games}
            members={members}
            isLocked={event?.isLocked}
            isLoading={loading}
          />
        );
      case 'stats':
        return (
          <StatsTabContent
            eventId={params.eventId}
            members={members}
            isLoading={loading}
          />
        );
      case 'clubhouse':
        return (
          <ClubhouseTabContent
            eventId={params.eventId}
            members={members}
            userRole={userRole}
            isLoading={loading}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-2 text-muted-foreground">Loading clubhouse...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">{error}</p>
        <Link href="/app" className="mt-4 text-primary hover:underline">
          Back to Clubhouses
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Clubhouse not found</p>
        <Link href="/app" className="mt-4 text-primary hover:underline">
          Back to Clubhouses
        </Link>
      </div>
    );
  }

  return (
    <ClubhouseThemeProvider themeId={event.theme}>
      <div className="space-y-4 pb-20">
        {/* Clubhouse Header */}
        <ClubhouseHeader
          event={event}
          memberCount={members.length}
          activePlayers={activePlayers}
          isLive={games.some((g) => g.status === 'active')}
          onThemeChange={handleThemeChange}
        />

        {/* Role-Based Action Bar */}
        <RoleActionBar
          eventId={params.eventId}
          role={userRole}
          isLocked={event.isLocked}
          onInviteClick={() => setIsInviteModalOpen(true)}
        />

        {/* Clubhouse Tabs */}
        <ClubhouseTabs activeTab={activeTab} onTabChange={setActiveTab}>
          {renderTabContent()}
        </ClubhouseTabs>

        {/* Demo Mode Notice */}
        {isDemoEvent && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="py-4">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>Demo Mode:</strong> This is a demo clubhouse. Create a real one to save your data.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Invite Modal */}
        <InviteModal
          eventId={params.eventId}
          eventName={event.name}
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
        />
      </div>
    </ClubhouseThemeProvider>
  );
}
