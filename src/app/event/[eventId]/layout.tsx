'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Overview', href: '' },
  { name: 'Scorecard', href: '/scorecard' },
  { name: 'Games', href: '/games' },
  { name: 'Settlement', href: '/settlement' },
  { name: 'Feed', href: '/feed' },
  { name: 'Chat', href: '/chat' },
  { name: 'Admin', href: '/admin' },
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/app" className="text-2xl font-bold text-primary">
              Press!
            </Link>
            <AuthHeader />
          </div>
        </div>

        {/* Tabs */}
        <div className="container mx-auto px-4">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const href = `${baseUrl}${tab.href}`;
              const isActive =
                pathname === href ||
                (tab.href === '' && pathname === baseUrl);

              return (
                <Link
                  key={tab.name}
                  href={href}
                  className={cn(
                    'whitespace-nowrap border-b-2 py-4 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                  )}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
