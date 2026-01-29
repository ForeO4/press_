'use client';

import { useEffect, useState } from 'react';
import { Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { PlayerProfile } from '@/types';

interface PlayerStats {
  userId: string;
  totalRounds: number;
  totalHoles: number;
  birdies: number;
  eagles: number;
  pars: number;
  bogeys: number;
  doublePlus: number;
}

interface StatsTabContentProps {
  eventId: string;
  members: PlayerProfile[];
  isLoading?: boolean;
}

// Mock stats for demo mode
const mockStats: PlayerStats[] = [
  { userId: 'demo-owner', totalRounds: 3, totalHoles: 54, birdies: 8, eagles: 1, pars: 28, bogeys: 12, doublePlus: 5 },
  { userId: 'demo-admin', totalRounds: 3, totalHoles: 54, birdies: 4, eagles: 0, pars: 22, bogeys: 18, doublePlus: 10 },
  { userId: 'demo-player1', totalRounds: 2, totalHoles: 36, birdies: 3, eagles: 0, pars: 18, bogeys: 10, doublePlus: 5 },
  { userId: 'demo-player2', totalRounds: 2, totalHoles: 36, birdies: 2, eagles: 0, pars: 16, bogeys: 12, doublePlus: 6 },
];

export function StatsTabContent({
  eventId,
  members,
  isLoading = false,
}: StatsTabContentProps) {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // For demo events, use mock stats
        if (eventId.startsWith('demo-')) {
          setStats(mockStats);
        } else {
          // TODO: Fetch from RPC when available
          // const { data } = await supabase.rpc('get_player_stats', { p_event_id: eventId });
          setStats(mockStats); // Fallback to mock for now
        }
      } catch (error) {
        console.error('Failed to fetch player stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [eventId]);

  const getPlayerName = (userId: string) => {
    const member = members.find((m) => m.userId === userId);
    return member?.name || 'Unknown';
  };

  const getStatIcon = (value: number, isPositive: boolean) => {
    if (value === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;
    if (isPositive) return <TrendingUp className="h-3 w-3 text-green-500" />;
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  };

  if (loading || isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="mb-2 h-4 w-24 rounded bg-muted" />
            <div className="flex gap-4">
              <div className="h-8 w-16 rounded bg-muted" />
              <div className="h-8 w-16 rounded bg-muted" />
              <div className="h-8 w-16 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="py-8 text-center">
        <Award className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No stats yet. Play some rounds to see your statistics!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Award className="h-4 w-4 text-primary" />
        Player Stats
      </h3>

      <div className="space-y-3">
        {stats.map((playerStat) => (
          <div
            key={playerStat.userId}
            className="rounded-lg border border-border/50 bg-muted/30 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-foreground">
                {getPlayerName(playerStat.userId)}
              </span>
              <span className="text-xs text-muted-foreground">
                {playerStat.totalRounds} {playerStat.totalRounds === 1 ? 'round' : 'rounds'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="rounded bg-amber-500/10 px-2 py-1">
                <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {playerStat.eagles}
                </div>
                <div className="text-[10px] text-muted-foreground">Eagles</div>
              </div>
              <div className="rounded bg-green-500/10 px-2 py-1">
                <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {playerStat.birdies}
                </div>
                <div className="text-[10px] text-muted-foreground">Birdies</div>
              </div>
              <div className="rounded bg-blue-500/10 px-2 py-1">
                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {playerStat.pars}
                </div>
                <div className="text-[10px] text-muted-foreground">Pars</div>
              </div>
              <div className="rounded bg-orange-500/10 px-2 py-1">
                <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                  {playerStat.bogeys}
                </div>
                <div className="text-[10px] text-muted-foreground">Bogeys</div>
              </div>
              <div className="rounded bg-red-500/10 px-2 py-1">
                <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {playerStat.doublePlus}
                </div>
                <div className="text-[10px] text-muted-foreground">2+</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
