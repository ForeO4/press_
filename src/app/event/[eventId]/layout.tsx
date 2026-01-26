'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { BottomNav } from '@/components/nav/BottomNav';
import { cn } from '@/lib/utils';
import { Settings, Shield } from 'lucide-react';

// Header menu items (Settings, Admin moved here)
const headerMenuItems = [
  { name: 'Admin', href: '/admin', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { eventId: string };
}) {
  const pathname = usePathname();
  const baseUrl = `/event/${params.eventId}`;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/app" className="text-2xl font-bold text-primary">
              Press!
            </Link>
            <div className="flex items-center gap-1">
              {/* Header navigation items */}
              {headerMenuItems.map((item) => {
                const href = `${baseUrl}${item.href}`;
                const isActive = pathname === href || pathname.startsWith(href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={href}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                    title={item.name}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                );
              })}
              <div className="ml-2 flex items-center gap-2 border-l border-border/50 pl-3">
                <ThemeToggle />
                <AuthHeader />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">{children}</main>

      {/* Bottom Navigation */}
      <BottomNav eventId={params.eventId} />
    </div>
  );
}
