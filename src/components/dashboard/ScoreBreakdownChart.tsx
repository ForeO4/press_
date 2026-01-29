'use client';

import type { CareerStats } from '@/types';

interface ScoreBreakdownChartProps {
  stats: CareerStats;
}

export function ScoreBreakdownChart({ stats }: ScoreBreakdownChartProps) {
  const total = stats.eagles + stats.birdies + stats.pars + stats.bogeys + stats.doubleBogeys + stats.triplePlus;

  if (total === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No scoring data available
      </div>
    );
  }

  const segments = [
    { label: 'Eagle', count: stats.eagles, color: 'bg-amber-500' },
    { label: 'Birdie', count: stats.birdies, color: 'bg-green-500' },
    { label: 'Par', count: stats.pars, color: 'bg-blue-500' },
    { label: 'Bogey', count: stats.bogeys, color: 'bg-orange-500' },
    { label: 'Double', count: stats.doubleBogeys, color: 'bg-red-400' },
    { label: 'Triple+', count: stats.triplePlus, color: 'bg-red-600' },
  ].filter(s => s.count > 0);

  return (
    <div className="space-y-3">
      {/* Horizontal stacked bar */}
      <div className="h-4 flex rounded-full overflow-hidden">
        {segments.map((segment, index) => {
          const percentage = (segment.count / total) * 100;
          return (
            <div
              key={segment.label}
              className={`${segment.color} transition-all`}
              style={{ width: `${percentage}%` }}
              title={`${segment.label}: ${segment.count} (${percentage.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((segment) => {
          const percentage = ((segment.count / total) * 100).toFixed(0);
          return (
            <div key={segment.label} className="flex items-center gap-1.5 text-xs">
              <div className={`h-2 w-2 rounded-full ${segment.color}`} />
              <span className="text-muted-foreground">
                {segment.label}: {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
