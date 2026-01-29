import type { PlayerProfile, GameWithParticipants, MembershipRole } from '@/types';
import type { LeaderboardEntry } from '@/lib/services/leaderboard';

export interface TabContentProps {
  eventId: string;
  isLoading?: boolean;
}

export interface OverviewTabProps extends TabContentProps {
  members: PlayerProfile[];
  games: GameWithParticipants[];
  leaderboard: LeaderboardEntry[];
  courseName?: string;
  userRole?: MembershipRole;
}

export interface RoundsTabProps extends TabContentProps {
  // Round-specific props will be added as needed
  courseName?: string;
}

export interface ClubhouseTabProps extends TabContentProps {
  members: PlayerProfile[];
  userRole?: MembershipRole;
}
