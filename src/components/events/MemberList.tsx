'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Settings, ChevronRight } from 'lucide-react';
import type { PlayerProfile, MembershipRole } from '@/types';

interface MemberWithRole extends PlayerProfile {
  role?: MembershipRole;
}

interface MemberListProps {
  eventId: string;
  members: MemberWithRole[];
  onInviteClick: () => void;
  isLoading?: boolean;
  showManageButton?: boolean;
  maxDisplay?: number;
}

export function MemberList({
  eventId,
  members,
  onInviteClick,
  isLoading = false,
  showManageButton = true,
  maxDisplay = 8,
}: MemberListProps) {
  const displayMembers = members.slice(0, maxDisplay);
  const remainingCount = members.length - maxDisplay;

  const getRoleBadge = (role?: MembershipRole) => {
    if (!role || role === 'PLAYER') return null;
    const colors = {
      OWNER: 'bg-amber-500/20 text-amber-500',
      ADMIN: 'bg-blue-500/20 text-blue-500',
      VIEWER: 'bg-gray-500/20 text-gray-400',
    };
    return (
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors[role]}`}>
        {role.toLowerCase()}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          Members ({members.length})
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onInviteClick}
            className="text-xs gap-1"
          >
            <UserPlus className="h-3 w-3" />
            Add
          </Button>
          {showManageButton && (
            <Link href={`/event/${eventId}/members`}>
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                Manage
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-10 w-10 animate-pulse bg-muted rounded-full"
              />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">No members yet</p>
            <Button variant="outline" size="sm" onClick={onInviteClick}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite players
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {displayMembers.map((member) => (
              <div
                key={member.id}
                className="group relative"
                title={member.name}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary transition-transform group-hover:scale-110">
                  {member.name?.charAt(0) || '?'}
                </div>
                {member.role && member.role !== 'PLAYER' && (
                  <div className="absolute -bottom-1 -right-1">
                    {getRoleBadge(member.role)}
                  </div>
                )}
              </div>
            ))}
            {remainingCount > 0 && (
              <Link
                href={`/event/${eventId}/members`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                +{remainingCount}
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
