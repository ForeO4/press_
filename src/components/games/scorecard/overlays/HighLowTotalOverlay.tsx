'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { HoleSnapshot } from '@/types';
import type { ScorecardPlayer, HoleIndicator, GameStanding } from '../types';

interface HighLowTotalOverlayProps {
  players: ScorecardPlayer[];
  holes: HoleSnapshot[];
  startHole: number;
  endHole: number;
  pointValue: number;
  teams: { id: string; playerIds: string[] }[];
}

interface TeamScore {
  teamId: string;
  playerIds: string[];
  lowBall: number;   // Best individual net
  highBall: number;  // Worst individual net
  total: number;     // Combined net
}

interface HLTHoleResult {
  hole: number;
  lowBallWinner: string | null;   // Team ID that won Low Ball
  highBallWinner: string | null;  // Team ID that won High Ball (avoided worst)
  totalWinner: string | null;     // Team ID that won Total
}

export function useHighLowTotalComputation({
  players,
  holes,
  startHole,
  endHole,
  pointValue,
  teams,
}: HighLowTotalOverlayProps) {
  return useMemo(() => {
    const holeResults: HLTHoleResult[] = [];
    const indicators = new Map<number, HoleIndicator[]>();

    // Initialize points tracking per team
    const teamPoints: Record<string, { low: number; high: number; total: number }> = {};
    for (const team of teams) {
      teamPoints[team.id] = { low: 0, high: 0, total: 0 };
    }

    // Process each hole
    for (let holeNum = startHole; holeNum <= endHole; holeNum++) {
      const hole = holes.find((h) => h.number === holeNum);
      if (!hole) continue;

      // Get net scores for all players
      const playerNetScores: Record<string, number> = {};
      let allHaveScores = true;

      for (const player of players) {
        const scoreRecord = player.scores.find((s) => s.holeNumber === holeNum);
        if (!scoreRecord) {
          allHaveScores = false;
          break;
        }
        const getsStroke = hole.handicap <= player.handicap;
        const net = getsStroke ? scoreRecord.strokes - 1 : scoreRecord.strokes;
        playerNetScores[player.id] = Math.max(1, net);
      }

      if (!allHaveScores) continue;

      // Calculate team scores
      const teamScores: TeamScore[] = teams.map((team) => {
        const scores = team.playerIds.map((pid) => playerNetScores[pid]).filter(s => s !== undefined);
        if (scores.length !== 2) {
          return {
            teamId: team.id,
            playerIds: team.playerIds,
            lowBall: Infinity,
            highBall: Infinity,
            total: Infinity,
          };
        }
        return {
          teamId: team.id,
          playerIds: team.playerIds,
          lowBall: Math.min(...scores),
          highBall: Math.max(...scores),
          total: scores.reduce((a, b) => a + b, 0),
        };
      });

      if (teamScores.length !== 2) continue;

      const [team1, team2] = teamScores;
      const holeIndicators: HoleIndicator[] = [];

      // Determine Low Ball winner (lowest individual score wins)
      let lowBallWinner: string | null = null;
      if (team1.lowBall < team2.lowBall) {
        lowBallWinner = team1.teamId;
        teamPoints[team1.teamId].low += 1;
        // Add indicator to the player(s) with the low ball
        for (const pid of team1.playerIds) {
          if (playerNetScores[pid] === team1.lowBall) {
            holeIndicators.push({
              playerId: pid,
              type: 'low',
              label: 'L',
              value: 1,
            });
          }
        }
      } else if (team2.lowBall < team1.lowBall) {
        lowBallWinner = team2.teamId;
        teamPoints[team2.teamId].low += 1;
        for (const pid of team2.playerIds) {
          if (playerNetScores[pid] === team2.lowBall) {
            holeIndicators.push({
              playerId: pid,
              type: 'low',
              label: 'L',
              value: 1,
            });
          }
        }
      }
      // If tied, lowBallWinner stays null (wash)

      // Determine High Ball winner (lowest high ball wins - avoids the worst score)
      let highBallWinner: string | null = null;
      if (team1.highBall < team2.highBall) {
        highBallWinner = team1.teamId;
        teamPoints[team1.teamId].high += 1;
        // The "loser" is the team with the higher high ball
        for (const pid of team2.playerIds) {
          if (playerNetScores[pid] === team2.highBall) {
            holeIndicators.push({
              playerId: pid,
              type: 'high',
              label: 'H',
              value: -1,
            });
          }
        }
      } else if (team2.highBall < team1.highBall) {
        highBallWinner = team2.teamId;
        teamPoints[team2.teamId].high += 1;
        for (const pid of team1.playerIds) {
          if (playerNetScores[pid] === team1.highBall) {
            holeIndicators.push({
              playerId: pid,
              type: 'high',
              label: 'H',
              value: -1,
            });
          }
        }
      }
      // If tied, highBallWinner stays null (wash)

      // Determine Total winner (lowest combined score wins)
      let totalWinner: string | null = null;
      if (team1.total < team2.total) {
        totalWinner = team1.teamId;
        teamPoints[team1.teamId].total += 1;
        // Add indicator to first player of winning team (representative)
        holeIndicators.push({
          playerId: team1.playerIds[0],
          type: 'total',
          label: 'T',
          value: 1,
        });
      } else if (team2.total < team1.total) {
        totalWinner = team2.teamId;
        teamPoints[team2.teamId].total += 1;
        holeIndicators.push({
          playerId: team2.playerIds[0],
          type: 'total',
          label: 'T',
          value: 1,
        });
      }
      // If tied, totalWinner stays null (wash)

      holeResults.push({
        hole: holeNum,
        lowBallWinner,
        highBallWinner,
        totalWinner,
      });

      indicators.set(holeNum, holeIndicators);
    }

    // Compute team standings
    const teamStandings = teams.map((team) => {
      const pts = teamPoints[team.id];
      const netPoints = pts.low + pts.total - pts.high;
      const teamNames = team.playerIds
        .map((pid) => players.find((p) => p.id === pid)?.name.split(' ')[0] || 'Unknown')
        .join(' & ');

      return {
        teamId: team.id,
        playerIds: team.playerIds,
        teamName: teamNames,
        lowPoints: pts.low,
        highPoints: pts.high,
        totalPoints: pts.total,
        netPoints,
        value: netPoints * pointValue,
      };
    }).sort((a, b) => b.netPoints - a.netPoints);

    // Convert to player standings (split value between teammates)
    const standings: GameStanding[] = [];
    for (const team of teamStandings) {
      for (const playerId of team.playerIds) {
        const player = players.find((p) => p.id === playerId);
        if (player) {
          standings.push({
            playerId: player.id,
            playerName: player.name,
            points: team.netPoints,
            value: team.value / 2, // Split between teammates
            breakdown: {
              low: team.lowPoints,
              high: team.highPoints,
              total: team.totalPoints,
            },
          });
        }
      }
    }

    return {
      holeResults,
      indicators,
      standings,
      teamStandings,
    };
  }, [players, holes, startHole, endHole, pointValue, teams]);
}

interface HLTStandingsSummaryProps {
  standings: GameStanding[];
  pointValue: number;
  teamStandings?: {
    teamId: string;
    teamName: string;
    lowPoints: number;
    highPoints: number;
    totalPoints: number;
    netPoints: number;
    value: number;
  }[];
}

export function HLTStandingsSummary({ standings, pointValue, teamStandings }: HLTStandingsSummaryProps) {
  // Group standings by team if we have team standings
  const displayTeams = teamStandings && teamStandings.length > 0;

  return (
    <div className="rounded-xl border border-pink-200/50 dark:border-pink-900/30 bg-gradient-to-br from-pink-50 via-white to-pink-50/50 dark:from-pink-950/30 dark:via-slate-900 dark:to-pink-950/20 p-5 shadow-xl">
      <div className="text-xs text-pink-600 dark:text-pink-400 uppercase tracking-widest font-medium mb-4 text-center">
        High-Low-Total Standings
      </div>

      {displayTeams ? (
        <div className="space-y-3">
          {teamStandings.map((team, index) => (
            <div
              key={team.teamId}
              className={cn(
                'p-4 rounded-lg border',
                index === 0 && team.netPoints > 0 && 'bg-green-100/50 dark:bg-green-900/20 border-green-300/50 dark:border-green-700/30',
                team.netPoints < 0 && 'bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-800/20',
                team.netPoints === 0 && 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-700/30'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{team.teamName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex gap-3 mt-1">
                    <span className="text-green-600 dark:text-green-400">
                      L: +{team.lowPoints}
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      H: -{team.highPoints}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400">
                      T: +{team.totalPoints}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      'text-xl font-black',
                      team.value > 0 && 'text-green-600 dark:text-green-400',
                      team.value < 0 && 'text-red-600 dark:text-red-400',
                      team.value === 0 && 'text-slate-400'
                    )}
                  >
                    {team.value >= 0 ? '+' : ''}{team.value}
                  </div>
                  <div className="text-xs text-slate-500">
                    ({team.netPoints >= 0 ? '+' : ''}{team.netPoints} pts)
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {standings.map((standing, index) => (
            <div
              key={standing.playerId}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                index === 0 && standing.points > 0 && 'bg-green-100/50 dark:bg-green-900/20 border border-green-300/50 dark:border-green-700/30',
                standing.points < 0 && 'bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/20',
                standing.points === 0 && 'bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30'
              )}
            >
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200">{standing.playerName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex gap-2 mt-1">
                  <span className="text-green-600 dark:text-green-400">L: +{standing.breakdown?.low ?? 0}</span>
                  <span className="text-red-600 dark:text-red-400">H: -{standing.breakdown?.high ?? 0}</span>
                  <span className="text-blue-600 dark:text-blue-400">T: +{standing.breakdown?.total ?? 0}</span>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    'text-xl font-black',
                    standing.value > 0 && 'text-green-600 dark:text-green-400',
                    standing.value < 0 && 'text-red-600 dark:text-red-400',
                    standing.value === 0 && 'text-slate-400'
                  )}
                >
                  {standing.value >= 0 ? '+' : ''}{standing.value}
                </div>
                <div className="text-xs text-slate-500">
                  ({standing.points >= 0 ? '+' : ''}{standing.points} pts)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-pink-200/50 dark:border-pink-800/30">
        <div className="flex justify-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span className="bg-green-500/20 text-green-600 dark:text-green-400 font-bold rounded px-1">L</span>
            <span>Low Ball (+1)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded px-1">H</span>
            <span>High Ball (-1)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold rounded px-1">T</span>
            <span>Total (+1)</span>
          </div>
        </div>
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
          Ties = Wash (no points) • ${pointValue}/point
        </div>
      </div>
    </div>
  );
}
