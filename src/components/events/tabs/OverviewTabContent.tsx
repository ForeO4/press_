'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Users,
  BarChart3,
  Plus,
  Mail,
  UserMinus,
} from 'lucide-react';
import type { OverviewTabProps } from './types';

interface QuickStatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  iconBgColor?: string;
}

function QuickStatCard({ icon, value, label, iconBgColor = 'bg-primary/20' }: QuickStatCardProps) {
  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface Member {
  id: string;
  name: string;
  email?: string;
  role?: string;
  status: 'active' | 'invited';
  avatarUrl?: string;
}

export function OverviewTabContent({
  eventId,
  members,
  games,
  leaderboard,
  courseName,
  userRole,
  isLoading = false,
}: OverviewTabProps) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // Convert members to display format
  const displayMembers: Member[] = members.map((m) => ({
    id: m.userId || m.id,
    name: m.name || 'Unknown',
    email: m.email || `${(m.name || 'user').toLowerCase().replace(/\s+/g, '')}@example.com`,
    role: (m as any).role === 'OWNER' || (m as any).role === 'ADMIN' ? 'admin' : 'member',
    status: 'active' as const,
  }));

  // Calculate stats
  const upcomingRounds = 0; // TODO: Calculate from real data
  const roundsPlayed = 0; // TODO: Calculate from real data

  // Check if user can manage members
  const canManageMembers = userRole === 'OWNER' || userRole === 'ADMIN';

  const handleInvite = () => {
    if (inviteEmail && inviteEmail.includes('@')) {
      // TODO: Implement actual invite
      console.log('Inviting:', inviteEmail);
      setInviteEmail('');
      setShowInviteForm(false);
    }
  };

  const activeMembers = displayMembers.filter((m) => m.status === 'active');
  const invitedMembers = displayMembers.filter((m) => m.status === 'invited');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div>
                  <div className="h-6 w-8 rounded bg-muted mb-1" />
                  <div className="h-4 w-24 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="animate-pulse rounded-lg border border-border bg-card p-6">
          <div className="h-6 w-32 rounded bg-muted mb-4" />
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickStatCard
          icon={<Calendar className="h-5 w-5 text-primary" />}
          value={upcomingRounds}
          label="Upcoming Rounds"
          iconBgColor="bg-primary/20"
        />
        <QuickStatCard
          icon={<Users className="h-5 w-5 text-primary" />}
          value={members.length}
          label="Total Members"
          iconBgColor="bg-primary/20"
        />
        <QuickStatCard
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
          value={roundsPlayed}
          label="Rounds Played"
          iconBgColor="bg-primary/20"
        />
      </div>

      {/* Membership Section */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Membership</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''}
                  {invitedMembers.length > 0 && `, ${invitedMembers.length} pending`}
                </p>
              </div>
              {canManageMembers && (
                <Button
                  size="sm"
                  onClick={() => setShowInviteForm(!showInviteForm)}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Invite
                </Button>
              )}
            </div>

            {/* Invite Form */}
            {showInviteForm && (
              <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                <Input
                  placeholder="Enter email address"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInvite();
                  }}
                />
                <div className="flex gap-2">
                  <Button onClick={handleInvite} size="sm" className="flex-1 gap-1.5">
                    <Mail className="h-4 w-4" />
                    Send Invite
                  </Button>
                  <Button onClick={() => setShowInviteForm(false)} size="sm" variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Active Members */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Active Members</h4>
              <div className="space-y-2">
                {activeMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">
                          {member.name}
                        </p>
                        {member.role === 'admin' && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                    </div>
                    {canManageMembers && member.role !== 'admin' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Invites */}
            {invitedMembers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Pending Invites</h4>
                <div className="space-y-2">
                  {invitedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:bg-muted/30 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground opacity-60">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">
                            {member.name}
                          </p>
                          <span className="rounded border border-border px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Invited
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                      </div>
                      {canManageMembers && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href={`/event/${eventId}/rounds/new`}>
          <Card className="border-border hover:border-primary/50 transition-all cursor-pointer group h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Schedule Round
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Create a new round or event with tee times, courses, and games
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/event/${eventId}/stats`}>
          <Card className="border-border hover:border-primary/50 transition-all cursor-pointer group h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  View Stats
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Check leaderboards, handicaps, and performance metrics
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
