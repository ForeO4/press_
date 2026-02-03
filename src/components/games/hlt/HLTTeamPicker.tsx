'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shuffle, Users } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  handicap?: number;
}

export interface HLTTeamAssignment {
  team1: [string, string];
  team2: [string, string];
}

interface HLTTeamPickerProps {
  players: Player[];
  initialTeams?: HLTTeamAssignment;
  onTeamsChange: (teams: HLTTeamAssignment) => void;
}

export function HLTTeamPicker({ players, initialTeams, onTeamsChange }: HLTTeamPickerProps) {
  const [teams, setTeams] = useState<HLTTeamAssignment>(() => {
    if (initialTeams) return initialTeams;
    // Default: first two vs last two
    return {
      team1: [players[0]?.id ?? '', players[1]?.id ?? ''],
      team2: [players[2]?.id ?? '', players[3]?.id ?? ''],
    };
  });

  const getPlayer = (id: string) => players.find(p => p.id === id);

  const swapPlayers = (team: 1 | 2, index: 0 | 1) => {
    const newTeams = { ...teams };
    const otherTeam = team === 1 ? 'team2' : 'team1';
    const currentTeam = team === 1 ? 'team1' : 'team2';

    // Swap with same index on other team
    const temp = newTeams[currentTeam][index];
    newTeams[currentTeam][index] = newTeams[otherTeam][index];
    newTeams[otherTeam][index] = temp;

    setTeams(newTeams as HLTTeamAssignment);
    onTeamsChange(newTeams as HLTTeamAssignment);
  };

  const shuffle = useCallback(() => {
    const ids = players.map(p => p.id);
    // Fisher-Yates shuffle
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const newTeams: HLTTeamAssignment = {
      team1: [ids[0], ids[1]],
      team2: [ids[2], ids[3]],
    };
    setTeams(newTeams);
    onTeamsChange(newTeams);
  }, [players, onTeamsChange]);

  const PlayerCard = ({ playerId, team, index }: { playerId: string; team: 1 | 2; index: 0 | 1 }) => {
    const player = getPlayer(playerId);
    return (
      <button
        type="button"
        onClick={() => swapPlayers(team, index)}
        className={`w-full p-3 rounded-lg border-2 transition-all hover:scale-105 ${
          team === 1
            ? 'bg-blue-50 border-blue-300 hover:border-blue-500'
            : 'bg-amber-50 border-amber-300 hover:border-amber-500'
        }`}
      >
        <div className="font-medium">{player?.name ?? 'Unknown'}</div>
        {player?.handicap !== undefined && (
          <div className="text-sm text-muted-foreground">HCP: {player.handicap}</div>
        )}
      </button>
    );
  };

  if (players.length !== 4) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          HLT requires exactly 4 players
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Assignment
          </CardTitle>
          <Button variant="outline" size="sm" onClick={shuffle} type="button">
            <Shuffle className="h-4 w-4 mr-1" />
            Shuffle
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Click a player to swap with opponent</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-blue-600 text-center">Team 1</div>
            <div className="space-y-2">
              <PlayerCard playerId={teams.team1[0]} team={1} index={0} />
              <PlayerCard playerId={teams.team1[1]} team={1} index={1} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold text-amber-600 text-center">Team 2</div>
            <div className="space-y-2">
              <PlayerCard playerId={teams.team2[0]} team={2} index={0} />
              <PlayerCard playerId={teams.team2[1]} team={2} index={1} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
