'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  Target,
  Flag,
  MapPin,
  CircleDot,
  UserPlus,
  Settings,
  Play,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Event, TeeSnapshot, GameType } from '@/types';

interface EventSummaryCardProps {
  event: Event;
  playerCount: number;
  teeSnapshot?: TeeSnapshot | null;
  onInviteClick: () => void;
  isLocked?: boolean;
}

const GAME_TYPE_LABELS: Record<GameType, string> = {
  match_play: 'Match Play',
  nassau: 'Nassau',
  skins: 'Skins',
  high_low_total: 'High-Low-Total',
};

export function EventSummaryCard({
  event,
  playerCount,
  teeSnapshot,
  onInviteClick,
  isLocked = false,
}: EventSummaryCardProps) {
  const formatDateRange = () => {
    if (event.endDate && event.endDate !== event.date) {
      const startDate = new Date(event.date);
      const endDate = new Date(event.endDate);
      const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();

      if (startMonth === endMonth) {
        return `${startMonth} ${startDay}-${endDay}`;
      }
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }
    return formatDate(event.date);
  };

  const settingsItems = [
    {
      icon: Calendar,
      label: 'Dates',
      value: formatDateRange(),
    },
    {
      icon: Users,
      label: 'Players',
      value: `${playerCount} ${playerCount === 1 ? 'Player' : 'Players'}`,
    },
    {
      icon: Target,
      label: 'Game Type',
      value: event.defaultGameType
        ? GAME_TYPE_LABELS[event.defaultGameType]
        : 'Match Play',
    },
    {
      icon: Flag,
      label: 'Rounds',
      value: `${event.numRounds || 1} ${(event.numRounds || 1) === 1 ? 'Round' : 'Rounds'}`,
    },
    {
      icon: MapPin,
      label: 'Course',
      value: teeSnapshot?.courseName || 'No course set',
    },
    {
      icon: CircleDot,
      label: 'Holes',
      value: `${event.numHoles || teeSnapshot?.holes?.length || 18} Holes`,
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Settings Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {settingsItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2"
            >
              <item.icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.value}
                </p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tee Info */}
        {teeSnapshot && (
          <div className="mt-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {teeSnapshot.teeSetName} Tees
              </span>
              <span className="text-xs text-muted-foreground">
                {teeSnapshot.rating}/{teeSnapshot.slope}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onInviteClick}
            className="flex-1 sm:flex-none"
          >
            <UserPlus className="mr-1.5 h-4 w-4" />
            Invite
          </Button>
          <Link href={`/event/${event.id}/settings`} className="flex-1 sm:flex-none">
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="mr-1.5 h-4 w-4" />
              Edit Settings
            </Button>
          </Link>
          <Link
            href={`/event/${event.id}/games/new`}
            className="flex-1 sm:flex-none"
          >
            <Button
              size="sm"
              className="w-full"
              disabled={isLocked}
            >
              <Play className="mr-1.5 h-4 w-4" />
              Start Round
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
