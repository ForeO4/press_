'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Settings,
  Users,
  Lock,
  Globe,
  Link as LinkIcon,
  Palette,
  ChevronDown,
  Check,
} from 'lucide-react';
import { getAllThemes } from '@/lib/design/themes';
import type { Event, ClubhouseTheme } from '@/types';

interface ClubhouseHeaderProps {
  event: Event;
  memberCount: number;
  activePlayers?: number;
  isLive?: boolean;
  onThemeChange?: (theme: ClubhouseTheme) => void;
}

export function ClubhouseHeader({
  event,
  memberCount,
  activePlayers = 0,
  isLive = false,
  onThemeChange,
}: ClubhouseHeaderProps) {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themes = getAllThemes();
  const currentTheme = themes.find((t) => t.id === event.theme) || themes[0];

  const getVisibilityIcon = () => {
    switch (event.visibility) {
      case 'PUBLIC':
        return <Globe className="h-3 w-3" />;
      case 'UNLISTED':
        return <LinkIcon className="h-3 w-3" />;
      default:
        return <Lock className="h-3 w-3" />;
    }
  };

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

  return (
    <div className="space-y-3">
      {/* Main Header Row */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground truncate">
              {event.name}
            </h1>
            {isLive && (
              <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-500">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            )}
          </div>

          {/* Meta badges */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {/* Visibility */}
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {getVisibilityIcon()}
              {getVisibilityLabel()}
            </span>

            {/* Member count */}
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </span>

            {/* Active players */}
            {activePlayers > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-500">
                {activePlayers} playing
              </span>
            )}

            {/* Locked status */}
            {event.isLocked && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-500">
                Complete
              </span>
            )}
          </div>
        </div>

        {/* Settings button */}
        <Link href={`/event/${event.id}/settings`}>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Theme selector */}
      {onThemeChange && (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
          >
            <Palette className="h-3 w-3" />
            {currentTheme.name} Theme
            <ChevronDown className="h-3 w-3" />
          </Button>

          {/* Theme dropdown */}
          {showThemeMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowThemeMenu(false)}
              />

              {/* Menu */}
              <Card className="absolute left-0 top-full z-50 mt-1 w-48 shadow-lg">
                <CardContent className="p-1">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        onThemeChange(theme.id);
                        setShowThemeMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: `hsl(${theme.colors.primary})`,
                        }}
                      />
                      <span className="flex-1 text-left">{theme.name}</span>
                      {theme.id === currentTheme.id && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </button>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
