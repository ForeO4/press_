'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings, Users } from 'lucide-react';
import type { Event } from '@/types';

interface ClubhouseHeaderProps {
  event: Event;
  memberCount: number;
  activePlayers?: number;
  isLive?: boolean;
}

export function ClubhouseHeader({
  event,
  memberCount,
  activePlayers = 0,
  isLive = false,
}: ClubhouseHeaderProps) {
  const getVisibilityLabel = () => {
    switch (event.visibility) {
      case 'PUBLIC':
        return 'Public';
      case 'UNLISTED':
        return 'Unlisted';
      default:
        return 'Private';
    }
  };

  // Get first letter for avatar
  const initial = event.name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
      {/* Clubhouse Avatar */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-primary-foreground border-4 border-border shrink-0">
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="text-3xl font-bold text-foreground mb-1">{event.name}</h1>
        <p className="text-muted-foreground">
          {getVisibilityLabel()} • {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </p>
        <div className="flex gap-2 mt-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 border border-primary/30 px-2.5 py-0.5 text-xs font-medium text-primary">
            <Users className="h-3 w-3" />
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
          {activePlayers > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 border border-green-500/30 px-2.5 py-0.5 text-xs font-medium text-green-500">
              {activePlayers} playing
            </span>
          )}
        </div>
      </div>

      <Link href={`/event/${event.id}/settings`} className="shrink-0 md:self-start">
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </Link>
    </div>
  );
}
