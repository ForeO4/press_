'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { AlligatorIcon } from '@/components/ui/AlligatorIcon';
import { cn } from '@/lib/utils';
import { gameTypePillStyles } from '@/lib/design/colors';
import type { MockUser, GameType } from '@/types';

interface CreateGameModalProps {
  eventId: string;
  players: MockUser[];
  onSubmit: (data: CreateGameData) => void;
  onClose: () => void;
}

export interface CreateGameData {
  type: GameType;
  stake: number;
  playerAId: string;
  playerBId: string;
  startHole: number;
  endHole: number;
}

const gameTypes: { value: GameType; label: string }[] = [
  { value: 'match_play', label: 'Match' },
  { value: 'nassau', label: 'Nassau' },
  { value: 'skins', label: 'Skins' },
];

const holePresets = [
  { label: 'Front 9', start: 1, end: 9 },
  { label: 'Back 9', start: 10, end: 18 },
  { label: 'Full 18', start: 1, end: 18 },
];

export function CreateGameModal({
  eventId,
  players,
  onSubmit,
  onClose,
}: CreateGameModalProps) {
  const [type, setType] = useState<GameType>('match_play');
  const [stake, setStake] = useState(10);
  const [playerAId, setPlayerAId] = useState(players[0]?.id ?? '');
  const [playerBId, setPlayerBId] = useState(players[1]?.id ?? '');
  const [startHole, setStartHole] = useState(1);
  const [endHole, setEndHole] = useState(18);
  const [error, setError] = useState<string | null>(null);

  const playerA = players.find((p) => p.id === playerAId);
  const playerB = players.find((p) => p.id === playerBId);

  // Filter players for dropdowns
  const playersForA = players;
  const playersForB = players.filter((p) => p.id !== playerAId);

  const handleSubmit = () => {
    // Validate
    if (stake <= 0) {
      setError('Stake must be positive');
      return;
    }

    if (!Number.isInteger(stake)) {
      setError('Stake must be an integer (Alligator Teeth)');
      return;
    }

    if (!playerAId || !playerBId) {
      setError('Please select both players');
      return;
    }

    if (playerAId === playerBId) {
      setError('Players must be different');
      return;
    }

    if (startHole < 1 || startHole > 18) {
      setError('Start hole must be between 1 and 18');
      return;
    }

    if (endHole < startHole || endHole > 18) {
      setError('End hole must be between start hole and 18');
      return;
    }

    setError(null);
    onSubmit({
      type,
      stake,
      playerAId,
      playerBId,
      startHole,
      endHole,
    });
  };

  const applyPreset = (preset: { start: number; end: number }) => {
    setStartHole(preset.start);
    setEndHole(preset.end);
  };

  const isPresetActive = (preset: { start: number; end: number }) => {
    return startHole === preset.start && endHole === preset.end;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md mx-4 border-border/50 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/90"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle>Create Game</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Game Type Pills */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Game Type
            </label>
            <div className="flex flex-wrap gap-2">
              {gameTypes.map((gt) => {
                const styles = gameTypePillStyles[gt.value];
                const isSelected = type === gt.value;
                return (
                  <button
                    key={gt.value}
                    type="button"
                    onClick={() => setType(gt.value)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200',
                      isSelected
                        ? cn(styles.background, styles.text, styles.border, 'ring-2 ring-offset-2 ring-offset-background')
                        : 'bg-muted/20 text-muted-foreground border-muted/30 hover:bg-muted/30'
                    )}
                    style={isSelected ? { '--tw-ring-color': 'currentColor' } as React.CSSProperties : undefined}
                  >
                    {gt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stake */}
          <div className="space-y-2">
            <label htmlFor="stake" className="text-sm font-medium text-muted-foreground">
              Stake
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <AlligatorIcon size="md" className="text-primary" />
              </div>
              <Input
                id="stake"
                type="number"
                min={1}
                value={stake}
                onChange={(e) => setStake(parseInt(e.target.value, 10) || 0)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Player A */}
          <div className="space-y-2">
            <label htmlFor="playerA" className="text-sm font-medium text-muted-foreground">
              Player 1
            </label>
            <div className="flex items-center gap-3">
              {playerA && (
                <PlayerAvatar name={playerA.name} size="md" color="primary" />
              )}
              <select
                id="playerA"
                value={playerAId}
                onChange={(e) => setPlayerAId(e.target.value)}
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select player...</option>
                {playersForA.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Player B */}
          <div className="space-y-2">
            <label htmlFor="playerB" className="text-sm font-medium text-muted-foreground">
              Player 2
            </label>
            <div className="flex items-center gap-3">
              {playerB && (
                <PlayerAvatar name={playerB.name} size="md" color="secondary" />
              )}
              <select
                id="playerB"
                value={playerBId}
                onChange={(e) => setPlayerBId(e.target.value)}
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select player...</option>
                {playersForB.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hole Presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Holes
            </label>
            <div className="flex gap-2">
              {holePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200',
                    isPresetActive(preset)
                      ? 'bg-primary/20 text-primary border-primary/30'
                      : 'bg-muted/20 text-muted-foreground border-muted/30 hover:bg-muted/30'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Hole Range */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label htmlFor="startHole" className="text-xs text-muted-foreground">
                  Start
                </label>
                <Input
                  id="startHole"
                  type="number"
                  min={1}
                  max={18}
                  value={startHole}
                  onChange={(e) =>
                    setStartHole(parseInt(e.target.value, 10) || 1)
                  }
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="endHole" className="text-xs text-muted-foreground">
                  End
                </label>
                <Input
                  id="endHole"
                  type="number"
                  min={startHole}
                  max={18}
                  value={endHole}
                  onChange={(e) =>
                    setEndHole(parseInt(e.target.value, 10) || 18)
                  }
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Game</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
