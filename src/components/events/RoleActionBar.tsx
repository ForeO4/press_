'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Play,
  UserPlus,
  Settings,
  Share2,
  Trophy,
  DollarSign,
  Eye,
} from 'lucide-react';
import {
  getDisplayRole,
  getRoleBadgeColor,
  getRoleActions,
  type DisplayRole,
} from '@/lib/roles';
import type { MembershipRole } from '@/types';

interface RoleActionBarProps {
  eventId: string;
  role: MembershipRole;
  isLocked?: boolean;
  onInviteClick?: () => void;
  onShareClick?: () => void;
}

export function RoleActionBar({
  eventId,
  role,
  isLocked = false,
  onInviteClick,
  onShareClick,
}: RoleActionBarProps) {
  const displayRole = getDisplayRole(role);
  const actions = getRoleActions(role);
  const badgeColor = getRoleBadgeColor(displayRole);

  return (
    <div className="space-y-3">
      {/* Role Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}
        >
          {displayRole}
        </span>
        {isLocked && (
          <span className="text-xs text-muted-foreground">
            (Event complete - view only)
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Director Actions */}
        {actions.canStartRound && !isLocked && (
          <Link href={`/event/${eventId}/rounds/new`}>
            <Button size="sm" className="gap-1.5">
              <Play className="h-3.5 w-3.5" />
              Start Round
            </Button>
          </Link>
        )}

        {actions.canInvitePlayers && !isLocked && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={onInviteClick}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Players
          </Button>
        )}

        {actions.canConfigureEvent && (
          <Link href={`/event/${eventId}/settings`}>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Config
            </Button>
          </Link>
        )}

        {/* Player Actions */}
        {actions.canPlayGames && !isLocked && displayRole === 'Player' && (
          <>
            <Link href={`/event/${eventId}/games`}>
              <Button size="sm" className="gap-1.5">
                <Trophy className="h-3.5 w-3.5" />
                Games
              </Button>
            </Link>
            <Link href={`/event/${eventId}/settle`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Settle
              </Button>
            </Link>
          </>
        )}

        {/* Spectator Actions */}
        {displayRole === 'Spectator' && (
          <>
            <Link href={`/event/${eventId}/leaderboard`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Trophy className="h-3.5 w-3.5" />
                Leaderboard
              </Button>
            </Link>
            <Link href={`/event/${eventId}/scores`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Live Scores
              </Button>
            </Link>
          </>
        )}

        {/* Share (all roles) */}
        {onShareClick && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            onClick={onShareClick}
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
