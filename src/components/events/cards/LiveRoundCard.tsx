'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle, Clock, MapPin } from 'lucide-react';

interface LiveRoundCardProps {
  eventId: string;
  roundId?: string;
  courseName?: string;
  currentHole?: number;
  totalHoles?: number;
  playersActive?: number;
  startTime?: string;
  isLive?: boolean;
}

export function LiveRoundCard({
  eventId,
  roundId,
  courseName = 'Course TBD',
  currentHole = 1,
  totalHoles = 18,
  playersActive = 0,
  startTime,
  isLive = false,
}: LiveRoundCardProps) {
  const progress = totalHoles > 0 ? (currentHole / totalHoles) * 100 : 0;

  const content = (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {isLive ? 'Live Round' : 'Current Round'}
              </span>
              {isLive && (
                <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-medium text-red-500">
                  <span className="h-1 w-1 rounded-full bg-red-500 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>

            {courseName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {courseName}
              </div>
            )}

            {startTime && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Started {startTime}
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">
              #{currentHole}
            </div>
            <div className="text-xs text-muted-foreground">
              of {totalHoles} holes
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {playersActive > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {playersActive} {playersActive === 1 ? 'player' : 'players'} active
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (roundId) {
    return (
      <Link href={`/event/${eventId}/round/${roundId}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
