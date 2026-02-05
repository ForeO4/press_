'use client';

import { useState } from 'react';
import {
  LayoutGrid,
  Calendar,
  BarChart3,
  Home,
  Trophy,
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
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'rounds', label: 'Rounds', icon: Calendar },
  { id: 'games', label: 'Games', icon: Trophy },
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
    <div className={cn('', className)}>
      {/* Tab Headers - Underline style matching Figma */}
      <div className="border-b border-border overflow-x-auto">
        <nav className="flex gap-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-1 py-3 border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-6">{children}</div>
    </div>
  );
}
