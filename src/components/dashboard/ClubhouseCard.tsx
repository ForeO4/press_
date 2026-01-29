'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Users, Calendar } from 'lucide-react';
import type { Event } from '@/types';
import { formatDate } from '@/lib/utils';

interface ClubhouseCardProps {
  event: Event;
  memberCount?: number;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  showFavoriteButton?: boolean;
}

export function ClubhouseCard({
  event,
  memberCount,
  isFavorite,
  onToggleFavorite,
  showFavoriteButton = false,
}: ClubhouseCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.();
  };

  return (
    <Link href={`/event/${event.id}`}>
      <Card className="transition-all hover:shadow-md hover:border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">
                  {event.name}
                </h3>
                {event.isLocked && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Complete
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                {memberCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(event.date)}
                </span>
              </div>
            </div>

            {showFavoriteButton && (
              <button
                onClick={handleFavoriteClick}
                className={`p-1.5 rounded-full transition-colors ${
                  isFavorite
                    ? 'text-amber-500 hover:text-amber-600'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Star
                  className="h-4 w-4"
                  fill={isFavorite ? 'currentColor' : 'none'}
                />
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                event.visibility === 'PUBLIC'
                  ? 'bg-green-500/20 text-green-500'
                  : event.visibility === 'UNLISTED'
                    ? 'bg-blue-500/20 text-blue-500'
                    : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {event.visibility === 'PRIVATE' ? 'Private' : event.visibility === 'UNLISTED' ? 'Unlisted' : 'Public'}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
