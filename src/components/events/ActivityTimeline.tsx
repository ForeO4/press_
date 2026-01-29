'use client';

import { useEffect, useState } from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getActivityEvents,
  getActivityIcon,
  formatActivityMessage,
} from '@/lib/services/activity';
import type { ActivityEvent, ActivityType } from '@/types';

// Activity type → Card style mapping for visual polish
const ACTIVITY_STYLES: Record<
  ActivityType | 'default',
  {
    bg: string;
    border: string;
    header: string | null;
    headerColor: string | null;
    iconSize: string;
  }
> = {
  eagle: {
    bg: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10',
    border: 'border-l-4 border-amber-500',
    header: 'EAGLE!',
    headerColor: 'text-amber-400',
    iconSize: 'text-lg',
  },
  albatross: {
    bg: 'bg-gradient-to-r from-amber-500/25 to-yellow-500/15',
    border: 'border-l-4 border-amber-400',
    header: 'ALBATROSS!',
    headerColor: 'text-amber-300',
    iconSize: 'text-lg',
  },
  ace: {
    bg: 'bg-gradient-to-r from-purple-500/20 to-pink-500/10',
    border: 'border-l-4 border-purple-500',
    header: 'HOLE IN ONE!',
    headerColor: 'text-purple-400',
    iconSize: 'text-xl',
  },
  press: {
    bg: 'bg-gradient-to-r from-red-500/20 to-orange-500/10',
    border: 'border-l-4 border-red-500',
    header: 'PRESS DECLARED!',
    headerColor: 'text-red-400',
    iconSize: 'text-lg',
  },
  birdie: {
    bg: 'bg-muted/30',
    border: 'border-l-4 border-green-500',
    header: null,
    headerColor: null,
    iconSize: 'text-base',
  },
  settlement: {
    bg: 'bg-muted/30',
    border: 'border-l-2 border-muted-foreground/30',
    header: null,
    headerColor: null,
    iconSize: 'text-base',
  },
  game_complete: {
    bg: 'bg-gradient-to-r from-green-500/15 to-emerald-500/10',
    border: 'border-l-4 border-green-500',
    header: null,
    headerColor: null,
    iconSize: 'text-base',
  },
  tee_time: {
    bg: 'bg-muted/30',
    border: '',
    header: null,
    headerColor: null,
    iconSize: 'text-base',
  },
  round_start: {
    bg: 'bg-muted/30',
    border: '',
    header: null,
    headerColor: null,
    iconSize: 'text-base',
  },
  round_end: {
    bg: 'bg-muted/30',
    border: '',
    header: null,
    headerColor: null,
    iconSize: 'text-base',
  },
  game_start: {
    bg: 'bg-muted/30',
    border: '',
    header: null,
    headerColor: null,
    iconSize: 'text-base',
  },
  player_joined: {
    bg: 'bg-muted/30',
    border: '',
    header: null,
    headerColor: null,
    iconSize: 'text-base',
  },
  default: {
    bg: 'bg-muted/30',
    border: '',
    header: null,
    headerColor: null,
    iconSize: 'text-base',
  },
};

function getActivityStyle(type: ActivityType) {
  return ACTIVITY_STYLES[type] || ACTIVITY_STYLES.default;
}

interface ActivityTimelineProps {
  eventId: string;
  limit?: number;
  showViewAll?: boolean;
  compact?: boolean;
  onViewAll?: () => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ActivityTimeline({
  eventId,
  limit = 5,
  showViewAll = true,
  compact = false,
  onViewAll,
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const data = await getActivityEvents(eventId, limit);
        setActivities(data);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [eventId, limit]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(compact ? 3 : 5)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 animate-pulse">
            <div className="h-6 w-6 rounded-full bg-muted" />
            <div className="flex-1">
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-4 text-center">
        <Clock className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-1 text-sm text-muted-foreground">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!compact && (
        <h3 className="text-sm font-semibold text-foreground">
          Recent Activity
        </h3>
      )}

      <div className="space-y-2">
        {activities.map((activity) => {
          const style = getActivityStyle(activity.activityType);
          const isCelebratory = ['eagle', 'albatross', 'ace', 'press'].includes(
            activity.activityType
          );

          return (
            <div
              key={activity.id}
              className={`flex items-start gap-2 rounded-lg p-2.5 transition-all ${style.bg} ${style.border} ${
                isCelebratory ? 'animate-shimmer' : ''
              }`}
            >
              <span
                className={`${style.iconSize} shrink-0`}
                role="img"
                aria-label={activity.activityType}
              >
                {getActivityIcon(activity.activityType)}
              </span>
              <div className="flex-1 min-w-0">
                {style.header && (
                  <p className={`text-xs font-bold ${style.headerColor} mb-0.5`}>
                    {style.header}
                  </p>
                )}
                <p className="text-sm text-foreground leading-tight">
                  {formatActivityMessage(activity)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatRelativeTime(activity.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {showViewAll && activities.length >= limit && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={onViewAll}
          >
            View All Activity
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
