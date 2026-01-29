'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  LayoutDashboard,
  Flag,
  Gamepad2,
  BarChart3,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabId = 'overview' | 'rounds' | 'games' | 'stats' | 'clubhouse';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ClubhouseTabsProps {
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  children: React.ReactNode;
  className?: string;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'rounds', label: 'Rounds', icon: Flag },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'clubhouse', label: 'Clubhouse', icon: Home },
];

export function ClubhouseTabs({
  activeTab: controlledTab,
  onTabChange,
  children,
  className,
}: ClubhouseTabsProps) {
  const [internalTab, setInternalTab] = useState<TabId>('overview');
  const activeTab = controlledTab ?? internalTab;

  const handleTabClick = (tabId: TabId) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalTab(tabId);
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Tab Headers - Scrollable on mobile */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max border-b border-border">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors whitespace-nowrap',
                  'min-w-[80px] sm:min-w-0',
                  isActive
                    ? 'border-b-2 border-primary bg-muted/30 text-foreground'
                    : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}
