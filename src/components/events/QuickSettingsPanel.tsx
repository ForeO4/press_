'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Flag, Repeat } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { TeeSnapshot } from '@/types';

interface QuickSettingsPanelProps {
  date: string;
  playerCount: number;
  teeSnapshot?: TeeSnapshot | null;
  roundNumber?: number;
  totalRounds?: number;
  gameType?: string;
}

export function QuickSettingsPanel({
  date,
  playerCount,
  teeSnapshot,
  roundNumber,
  totalRounds,
  gameType = 'Match Play',
}: QuickSettingsPanelProps) {
  const settings = [
    {
      icon: Flag,
      label: teeSnapshot
        ? `${teeSnapshot.holes?.length || 18} holes`
        : '18 holes',
    },
    {
      icon: Calendar,
      label: formatDate(date),
    },
    {
      icon: null,
      label: gameType,
    },
  ];

  const stats = [
    ...(roundNumber && totalRounds
      ? [{ icon: Repeat, label: `Round ${roundNumber}/${totalRounds}` }]
      : []),
    {
      icon: Users,
      label: `${playerCount} ${playerCount === 1 ? 'player' : 'players'}`,
    },
  ];

  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {/* Settings */}
          <div className="flex items-center gap-3 text-muted-foreground">
            {settings.map((setting, index) => (
              <span key={index} className="flex items-center gap-1">
                {setting.icon && <setting.icon className="h-3.5 w-3.5" />}
                {setting.label}
              </span>
            ))}
          </div>

          {/* Separator */}
          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Stats */}
          <div className="flex items-center gap-3 text-muted-foreground">
            {stats.map((stat, index) => (
              <span key={index} className="flex items-center gap-1">
                {stat.icon && <stat.icon className="h-3.5 w-3.5" />}
                {stat.label}
              </span>
            ))}
          </div>
        </div>

        {/* Course info */}
        {teeSnapshot && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-sm font-medium text-foreground">
              {teeSnapshot.courseName}
            </p>
            <p className="text-xs text-muted-foreground">
              {teeSnapshot.teeSetName} Tees • {teeSnapshot.rating}/{teeSnapshot.slope}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
