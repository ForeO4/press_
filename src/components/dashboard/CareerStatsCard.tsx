'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsPeriodSelector } from './StatsPeriodSelector';
import type { CareerStats, StatsPeriod } from '@/types';

interface CareerStatsCardProps {
  stats: CareerStats;
  period: StatsPeriod;
  onPeriodChange: (period: StatsPeriod) => void;
  isLoading?: boolean;
}

export function CareerStatsCard({
  stats,
  period,
  onPeriodChange,
  isLoading
}: CareerStatsCardProps) {
  const statItems = [
    { label: 'Eagles', value: stats.eagles, color: 'text-amber-500' },
    { label: 'Birdies', value: stats.birdies, color: 'text-green-500' },
    { label: 'Pars', value: stats.pars, color: 'text-blue-500' },
    { label: 'Bogeys', value: stats.bogeys, color: 'text-orange-500' },
    { label: 'Doubles', value: stats.doubleBogeys, color: 'text-red-400' },
    { label: 'Triple+', value: stats.triplePlus, color: 'text-red-600' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Career Stats</CardTitle>
        <StatsPeriodSelector value={period} onChange={onPeriodChange} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-muted rounded mb-1" />
                <div className="h-3 bg-muted rounded w-12" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {statItems.map((item) => (
                <div key={item.label} className="text-center">
                  <p className={`text-2xl font-bold ${item.color}`}>
                    {item.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Summary row */}
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-sm">
              <div className="text-center">
                <p className="font-semibold text-foreground">
                  {stats.wins}-{stats.losses}
                </p>
                <p className="text-xs text-muted-foreground">Record</p>
              </div>
              <div className="text-center">
                <p className={`font-semibold ${
                  stats.totalWinnings > 0
                    ? 'text-green-500'
                    : stats.totalWinnings < 0
                      ? 'text-red-500'
                      : 'text-foreground'
                }`}>
                  {stats.totalWinnings >= 0 ? '+' : ''}{stats.totalWinnings}
                </p>
                <p className="text-xs text-muted-foreground">Winnings</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">
                  {stats.avgScore ?? '-'}
                </p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">
                  {stats.totalRounds}
                </p>
                <p className="text-xs text-muted-foreground">Rounds</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
