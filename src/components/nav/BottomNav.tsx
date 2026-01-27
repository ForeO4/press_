'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Flag, LayoutGrid, MessageCircle, Wallet } from 'lucide-react';
import { GolfClubsIcon } from '@/components/ui/GolfClubsIcon';

interface NavTab {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: NavTab[] = [
  { name: 'Home', href: '', icon: Flag },
  { name: 'Games', href: '/games', icon: GolfClubsIcon },
  { name: 'Feed', href: '/feed', icon: MessageCircle },
  { name: 'Settle', href: '/settlement', icon: Wallet },
];

interface BottomNavProps {
  eventId: string;
}

export function BottomNav({ eventId }: BottomNavProps) {
  const pathname = usePathname();
  const baseUrl = `/event/${eventId}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
        {tabs.map((tab) => {
          const href = `${baseUrl}${tab.href}`;
          const isActive =
            pathname === href ||
            (tab.href === '' && pathname === baseUrl) ||
            (tab.href !== '' && pathname.startsWith(href));

          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 transition-all duration-200',
                'rounded-xl min-w-[64px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
                  isActive && 'bg-primary/15'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    isActive && 'scale-110'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-all duration-200',
                  isActive && 'font-semibold'
                )}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for notched devices */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </nav>
  );
}
