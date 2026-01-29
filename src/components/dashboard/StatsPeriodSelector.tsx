'use client';

import { cn } from '@/lib/utils';
import type { StatsPeriod } from '@/types';

interface StatsPeriodSelectorProps {
  value: StatsPeriod;
  onChange: (period: StatsPeriod) => void;
}

const periods: { value: StatsPeriod; label: string }[] = [
  { value: 'lifetime', label: 'Lifetime' },
  { value: 'ytd', label: 'YTD' },
  { value: 'today', label: 'Today' },
];

export function StatsPeriodSelector({ value, onChange }: StatsPeriodSelectorProps) {
  return (
    <div className="flex rounded-lg bg-muted/50 p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            value === period.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
