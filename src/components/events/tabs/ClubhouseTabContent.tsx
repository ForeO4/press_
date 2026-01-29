'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Activity,
  Settings,
  Crown,
  Shield,
  User,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityTimeline } from '../ActivityTimeline';
import { getDisplayRole, getRoleBadgeColor } from '@/lib/roles';
import type { ClubhouseTabProps } from './types';
import type { MembershipRole } from '@/types';

type SubTab = 'activity' | 'members' | 'settings';

export function ClubhouseTabContent({
  eventId,
  members,
  userRole = 'VIEWER',
  isLoading = false,
}: ClubhouseTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('activity');

  const getRoleIcon = (role: MembershipRole) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-3 w-3" />;
      case 'ADMIN':
        return <Shield className="h-3 w-3" />;
      case 'PLAYER':
        return <User className="h-3 w-3" />;
      default:
        return <Eye className="h-3 w-3" />;
    }
  };

  const canViewSettings = userRole === 'OWNER' || userRole === 'ADMIN';

  const tabs: { id: SubTab; label: string; icon: typeof Activity }[] = [
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'members', label: 'Members', icon: Users },
    ...(canViewSettings ? [{ id: 'settings' as const, label: 'Settings', icon: Settings }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Activity Sub-tab */}
      {activeSubTab === 'activity' && (
        <ActivityTimeline
          eventId={eventId}
          limit={20}
          showViewAll={false}
          compact={false}
        />
      )}

      {/* Members Sub-tab */}
      {activeSubTab === 'members' && (
        <>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse p-2">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="mt-1 h-3 w-16 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No members yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const memberRole = (member as { role?: MembershipRole }).role || 'PLAYER';
                const displayRole = getDisplayRole(memberRole);
                const badgeColor = getRoleBadgeColor(displayRole);

                return (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 rounded-lg bg-muted/30 p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {member.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          {member.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badgeColor}`}
                        >
                          {getRoleIcon(memberRole)}
                          {displayRole}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Settings Sub-tab */}
      {activeSubTab === 'settings' && canViewSettings && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              Event settings are managed from the dedicated settings page.
            </p>
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = `/event/${eventId}/settings`;
                }}
              >
                <Settings className="mr-1.5 h-4 w-4" />
                Open Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
