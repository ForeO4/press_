import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import { getAllBalances } from './gatorBucks';
import { getEventMembers } from './players';
import type { PlayerProfile } from '@/types';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  balance: number;
  netChange: number; // From starting balance (default 100)
  gamesPlayed: number;
  wins: number;
  losses: number;
  pushes: number;
}

/**
 * Get leaderboard standings for an event
 */
export async function getLeaderboard(
  eventId: string,
  defaultStartingBalance: number = 100
): Promise<LeaderboardEntry[]> {
  // Get all balances
  const balances = await getAllBalances(eventId);

  // Get all members with their profiles
  const members = await getEventMembers(eventId);
  const memberMap = new Map<string, PlayerProfile>(
    members.map((m) => [m.userId, m])
  );

  // Get game stats
  const gameStats = await getGameStats(eventId);

  // Build leaderboard entries
  const entries: Omit<LeaderboardEntry, 'rank'>[] = balances.map((b) => {
    const member = memberMap.get(b.userId);
    const stats = gameStats.get(b.userId) ?? { wins: 0, losses: 0, pushes: 0 };

    return {
      userId: b.userId,
      name: member?.name ?? 'Unknown Player',
      balance: b.balanceInt,
      netChange: b.balanceInt - defaultStartingBalance,
      gamesPlayed: stats.wins + stats.losses + stats.pushes,
      wins: stats.wins,
      losses: stats.losses,
      pushes: stats.pushes,
    };
  });

  // Sort by net change (highest first), then by balance
  entries.sort((a, b) => {
    if (b.netChange !== a.netChange) return b.netChange - a.netChange;
    return b.balance - a.balance;
  });

  // Add ranks (handle ties)
  let currentRank = 1;
  let previousNetChange = Number.MAX_VALUE;
  let sameRankCount = 0;

  return entries.map((entry, index) => {
    if (entry.netChange < previousNetChange) {
      currentRank = index + 1;
      sameRankCount = 1;
    } else {
      sameRankCount++;
    }
    previousNetChange = entry.netChange;

    return {
      rank: currentRank,
      ...entry,
    };
  });
}

interface GameStats {
  wins: number;
  losses: number;
  pushes: number;
}

/**
 * Get game win/loss/push stats for all users in an event
 */
async function getGameStats(
  eventId: string
): Promise<Map<string, GameStats>> {
  const statsMap = new Map<string, GameStats>();

  if (isMockMode || eventId.startsWith('demo-')) {
    // Mock mode - return empty stats
    return statsMap;
  }

  const supabase = createClient();
  if (!supabase) return statsMap;

  try {
    // Get all completed games with settlements
    const { data: settlements } = await supabase
      .from('settlements')
      .select('payer_id, payee_id, amount_int')
      .eq('event_id', eventId);

    if (!settlements) return statsMap;

    // Count wins/losses
    for (const settlement of settlements) {
      // Payee won (received money)
      const winnerId = settlement.payee_id as string;
      const loserId = settlement.payer_id as string;
      const amount = settlement.amount_int as number;

      // Winner stats
      if (!statsMap.has(winnerId)) {
        statsMap.set(winnerId, { wins: 0, losses: 0, pushes: 0 });
      }
      const winnerStats = statsMap.get(winnerId)!;
      winnerStats.wins++;

      // Loser stats
      if (!statsMap.has(loserId)) {
        statsMap.set(loserId, { wins: 0, losses: 0, pushes: 0 });
      }
      const loserStats = statsMap.get(loserId)!;
      loserStats.losses++;

      // If amount is 0, it's a push
      if (amount === 0) {
        winnerStats.wins--;
        winnerStats.pushes++;
        loserStats.losses--;
        loserStats.pushes++;
      }
    }
  } catch (error) {
    console.error('[leaderboard] Failed to get game stats:', error);
  }

  return statsMap;
}

/**
 * Get just the top N players
 */
export async function getTopPlayers(
  eventId: string,
  limit: number = 5
): Promise<LeaderboardEntry[]> {
  const leaderboard = await getLeaderboard(eventId);
  return leaderboard.slice(0, limit);
}
