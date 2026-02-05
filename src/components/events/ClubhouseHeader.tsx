'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings, Users, Palette, Check, ChevronDown } from 'lucide-react';
import { getAllThemes } from '@/lib/design/themes';
import type { Event, ClubhouseTheme } from '@/types';

interface ClubhouseHeaderProps {
  event: Event;
  memberCount: number;
  activePlayers?: number;
  isLive?: boolean;
  currentTheme?: ClubhouseTheme;
  onThemeChange?: (theme: ClubhouseTheme) => void;
}

export function ClubhouseHeader({
  event,
  memberCount,
  activePlayers = 0,
  isLive = false,
  currentTheme = 'dark',
  onThemeChange,
}: ClubhouseHeaderProps) {
  const themes = getAllThemes();
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      <div className="flex gap-2 shrink-0 md:self-start">
        {/* Theme Selector */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setIsThemeOpen(!isThemeOpen)}
          >
            <Palette className="h-4 w-4" />
            Theme
            <ChevronDown className={`h-3 w-3 transition-transform ${isThemeOpen ? 'rotate-180' : ''}`} />
          </Button>
          {isThemeOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] rounded-md border border-border bg-card shadow-lg">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    onThemeChange?.(theme.id);
                    setIsThemeOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/50 first:rounded-t-md last:rounded-b-md"
                >
                  <div>
                    <span className="font-medium text-foreground">{theme.name}</span>
                    <p className="text-xs text-muted-foreground">{theme.description}</p>
                  </div>
                  {currentTheme === theme.id && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link href={`/event/${event.id}/settings`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}
