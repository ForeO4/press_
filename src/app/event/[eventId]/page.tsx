'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getEvent } from '@/lib/services/events';
import { getEventMembers } from '@/lib/services/players';
import { getEventTeeSnapshot } from '@/lib/services/courses';
import { getLeaderboard } from '@/lib/services/leaderboard';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Settings } from 'lucide-react';
import type { Event, TeeSnapshot, PlayerProfile, MembershipRole } from '@/types';
import type { LeaderboardEntry } from '@/lib/services/leaderboard';

import {
  InviteModal,
  CompactActionBar,
  QuickSettingsPanel,
  EventLeaderboard,
  EventChat,
  MemberList,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  const isDemoEvent = params.eventId.startsWith('demo-');

  // Mock chat messages (would come from a real-time service)
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'msg-1',
      authorId: 'user-2',
      authorName: 'Mike',
      authorInitial: 'M',
      content: 'Great round today! That birdie on 18 was clutch.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'msg-2',
      authorId: 'user-3',
      authorName: 'John',
      authorInitial: 'J',
      content: "Who's playing this weekend?",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch event data
        const eventData = await getEvent(params.eventId);
        setEvent(eventData);

        // Fetch members, tee snapshot, and leaderboard in parallel
        if (eventData) {
          const [membersData, snapshot, leaderboardData] = await Promise.all([
            getEventMembers(params.eventId).catch(() => []),
            getEventTeeSnapshot(params.eventId).catch(() => null),
            getLeaderboard(params.eventId).catch(() => []),
          ]);

          setMembers(membersData as MemberWithRole[]);
          setTeeSnapshot(snapshot);
          setLeaderboard(leaderboardData);
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

  const handleSendMessage = useCallback(async (content: string) => {
    // Mock sending - would integrate with real-time service
    const newMessage = {
      id: `msg-${Date.now()}`,
      authorId: user?.id || 'current-user',
      authorName: user?.name || 'You',
      authorInitial: user?.name?.charAt(0) || 'Y',
      content,
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, newMessage]);
  }, [user]);

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
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{event.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
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
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                Complete
              </span>
            )}
          </div>
        </div>
        <Link href={`/event/${params.eventId}/settings`}>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Compact Action Bar */}
      <CompactActionBar
        eventId={params.eventId}
        onInviteClick={() => setIsInviteModalOpen(true)}
        isLocked={event.isLocked}
      />

      {/* Quick Settings */}
      <QuickSettingsPanel
        date={event.date}
        playerCount={members.length}
        teeSnapshot={teeSnapshot}
        gameType="Match Play"
      />

      {/* Leaderboard Preview */}
      <EventLeaderboard
        eventId={params.eventId}
        entries={leaderboard}
        isLoading={loading}
        limit={3}
      />

      {/* Members */}
      <MemberList
        eventId={params.eventId}
        members={members}
        onInviteClick={() => setIsInviteModalOpen(true)}
        isLoading={loading}
      />

      {/* Chat */}
      <EventChat
        eventId={params.eventId}
        messages={chatMessages}
        currentUserId={user?.id || ''}
        onSendMessage={handleSendMessage}
        isExpanded={isChatExpanded}
        onToggleExpand={() => setIsChatExpanded(!isChatExpanded)}
      />

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
  );
}
