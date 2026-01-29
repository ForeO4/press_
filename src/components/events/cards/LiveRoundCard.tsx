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

// Get round context label
function getRoundContext(hole: number, total: number): string {
  if (total === 9) {
    if (hole <= 3) return 'Starting';
    if (hole <= 6) return 'Mid Round';
    return 'Final Holes';
  }
  // 18 holes
  if (hole <= 9) return 'Front 9';
  if (hole <= 15) return 'Back 9';
  return 'Final Holes';
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
  const roundContext = getRoundContext(currentHole, totalHoles);

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
                <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-500/20 to-red-600/10 px-2 py-0.5 text-[10px] font-semibold animate-glow-pulse">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                  </span>
                  <span className="text-red-400">LIVE</span>
                  <span className="text-red-500/50">|</span>
                  <span className="text-red-300">{roundContext}</span>
                </div>
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

        {/* Hole marker dots */}
        <div className="mt-3">
          <div className="flex items-center justify-between gap-0.5">
            {Array.from({ length: totalHoles }, (_, i) => {
              const holeNum = i + 1;
              const isCompleted = holeNum < currentHole;
              const isCurrent = holeNum === currentHole;
              const isTurnMarker = totalHoles === 18 && holeNum === 10; // Back 9 starts

              return (
                <div key={holeNum} className="flex items-center">
                  {/* Turn marker separator for 18 holes */}
                  {isTurnMarker && (
                    <div className="w-1 h-3 mx-0.5 rounded-full bg-muted-foreground/30" />
                  )}
                  <div
                    className={`h-2 w-2 rounded-full transition-all ${
                      isCurrent
                        ? 'bg-primary ring-2 ring-primary/50 animate-hole-pulse'
                        : isCompleted
                        ? 'bg-primary/70'
                        : 'bg-muted'
                    }`}
                    title={`Hole ${holeNum}`}
                  />
                </div>
              );
            })}
          </div>
          {/* Progress text */}
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Hole 1</span>
            <span className="font-medium text-foreground">{roundContext}</span>
            <span>Hole {totalHoles}</span>
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
