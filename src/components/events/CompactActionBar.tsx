'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Play, UserPlus, Trophy, MoreHorizontal } from 'lucide-react';
import { GolfClubsIcon } from '@/components/ui/GolfClubsIcon';

interface CompactActionBarProps {
  eventId: string;
  onInviteClick: () => void;
  isLocked?: boolean;
}

export function CompactActionBar({
  eventId,
  onInviteClick,
  isLocked = false,
}: CompactActionBarProps) {
  const actions = [
    {
      label: 'Start',
      icon: Play,
      href: `/event/${eventId}/games/new`,
      disabled: isLocked,
      primary: true,
    },
    {
      label: 'Invite',
      icon: UserPlus,
      onClick: onInviteClick,
      disabled: false,
    },
    {
      label: 'Games',
      icon: GolfClubsIcon,
      href: `/event/${eventId}/games`,
      disabled: false,
    },
    {
      label: 'More',
      icon: MoreHorizontal,
      href: `/event/${eventId}/settings`,
      disabled: false,
    },
  ];

  return (
    <div className="flex items-center justify-between gap-2 p-2 bg-muted/30 rounded-lg">
      {actions.map((action) => {
        const Icon = action.icon;
        const buttonContent = (
          <div className="flex flex-col items-center gap-1">
            <div className={`p-2 rounded-lg transition-colors ${
              action.primary && !action.disabled
                ? 'bg-primary text-primary-foreground'
                : 'bg-background'
            }`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">{action.label}</span>
          </div>
        );

        if (action.onClick) {
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`flex-1 p-2 rounded-lg transition-colors hover:bg-muted/50 ${
                action.disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {buttonContent}
            </button>
          );
        }

        if (action.disabled) {
          return (
            <div
              key={action.label}
              className="flex-1 p-2 rounded-lg opacity-50 cursor-not-allowed"
            >
              {buttonContent}
            </div>
          );
        }

        return (
          <Link
            key={action.label}
            href={action.href!}
            className="flex-1 p-2 rounded-lg transition-colors hover:bg-muted/50"
          >
            {buttonContent}
          </Link>
        );
      })}
    </div>
  );
}
