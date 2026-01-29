'use client';

import { LiveRoundCard } from '../cards/LiveRoundCard';
import { LeaderboardPreview } from '../cards/LeaderboardPreview';
import { GamesPotSummary } from '../cards/GamesPotSummary';
import { WhosPlayingModule } from '../cards/WhosPlayingModule';
import { ActivityTimeline } from '../ActivityTimeline';
import type { OverviewTabProps } from './types';

export function OverviewTabContent({
  eventId,
  members,
  games,
  leaderboard,
  courseName,
  isLoading = false,
}: OverviewTabProps) {
  // Convert members to player status format
  const playersWithStatus = members.map((member) => ({
    ...member,
    isActive: false, // TODO: Get from real-time status
    currentHole: undefined,
  }));

  // Check if there's a live round (mock for now)
  const hasLiveRound = games.some((g) => g.status === 'active');

  return (
    <div className="space-y-4">
      {/* Snapshot Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Live Round Card - shown if there's an active round */}
        {hasLiveRound && (
          <LiveRoundCard
            eventId={eventId}
            courseName={courseName}
            currentHole={10}
            totalHoles={18}
            playersActive={members.length}
            isLive={true}
            startTime="8:00 AM"
          />
        )}

        {/* Leaderboard Preview */}
        <LeaderboardPreview
          eventId={eventId}
          entries={leaderboard}
          isLoading={isLoading}
          limit={3}
        />

        {/* Games Pot Summary */}
        <GamesPotSummary
          eventId={eventId}
          games={games}
          isLoading={isLoading}
        />
      </div>

      {/* Who's Playing */}
      <WhosPlayingModule
        players={playersWithStatus}
        maxVisible={8}
        isLoading={isLoading}
      />

      {/* Recent Activity */}
      <ActivityTimeline
        eventId={eventId}
        limit={5}
        showViewAll={true}
      />
    </div>
  );
}
