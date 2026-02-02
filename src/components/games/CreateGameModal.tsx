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
import { AddPlayerModal } from '@/components/players/AddPlayerModal';
import { cn } from '@/lib/utils';
import { gameTypePillStyles } from '@/lib/design/colors';
import { createPlayer } from '@/lib/services/players';
import { Plus } from 'lucide-react';
import type { MockUser, GameType, CreatePlayerInput } from '@/types';

interface CreateGameModalProps {
  eventId: string;
  players: MockUser[];
  onSubmit: (data: CreateGameData) => void;
  onClose: () => void;
  onAddPlayer?: (name: string) => void;
}

export type ScoringBasis = 'net' | 'gross';

export interface ContestConfig {
  type: GameType;
  enabled: boolean;
  scoringBasis: ScoringBasis;
}

export interface CreateGameData {
  type: GameType;
  contests: ContestConfig[];
  stake: number;
  playerAId: string;
  playerBId: string;
  startHole: number;
  endHole: number;
  scoringBasis: ScoringBasis;
}

const gameTypes: { value: GameType; label: string; description: string }[] = [
  { value: 'match_play', label: 'Match Play', description: 'Win holes, not strokes' },
  { value: 'nassau', label: 'Nassau', description: 'Front 9 + Back 9 + Overall' },
  { value: 'skins', label: 'Skins', description: 'Win skin per hole' },
  { value: 'high_low_total', label: 'High-Low-Total', description: 'Low wins, High penalty' },
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
  onAddPlayer,
}: CreateGameModalProps) {
  // Game type configuration - single selection (radio buttons)
  const [selectedType, setSelectedType] = useState<GameType>('match_play');
  const [scoringBasis, setScoringBasis] = useState<ScoringBasis>('net');
  const [stakeInput, setStakeInput] = useState('10');
  const [playerAId, setPlayerAId] = useState(players[0]?.id ?? '');
  const [playerBId, setPlayerBId] = useState(players[1]?.id ?? '');
  const [startHole, setStartHole] = useState(1);
  const [endHole, setEndHole] = useState(18);
  const [error, setError] = useState<string | null>(null);

  // Add player modal state
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [addingFor, setAddingFor] = useState<'A' | 'B' | null>(null);
  const [localPlayers, setLocalPlayers] = useState<MockUser[]>(players);

  // Parse stake as integer, allowing empty input
  const stake = stakeInput === '' ? 0 : parseInt(stakeInput, 10) || 0;

  const playerA = localPlayers.find((p) => p.id === playerAId);
  const playerB = localPlayers.find((p) => p.id === playerBId);

  // Filter players for dropdowns
  const playersForA = localPlayers;
  const playersForB = localPlayers.filter((p) => p.id !== playerAId);

  // Toggle scoring basis
  const toggleScoringBasis = () => {
    setScoringBasis((prev) => (prev === 'net' ? 'gross' : 'net'));
  };

  // State for add player loading/error
  const [addPlayerLoading, setAddPlayerLoading] = useState(false);
  const [addPlayerError, setAddPlayerError] = useState<string | null>(null);

  // Handle adding a new player via modal
  const handleAddPlayer = async (input: CreatePlayerInput) => {
    setAddPlayerLoading(true);
    setAddPlayerError(null);

    try {
      console.log('[CreateGameModal] Creating player:', input);
      // Create player using the service
      const { player } = await createPlayer(eventId, input);
      console.log('[CreateGameModal] Player created:', player);

      setLocalPlayers((prev) => [...prev, player]);

      // Auto-select for the appropriate dropdown
      if (addingFor === 'A') {
        setPlayerAId(player.id);
      } else if (addingFor === 'B') {
        setPlayerBId(player.id);
      }

      // Notify parent if callback provided
      onAddPlayer?.(input.name);

      // Close modal
      setShowAddPlayerModal(false);
      setAddingFor(null);
    } catch (err) {
      console.error('[CreateGameModal] Failed to create player:', err);
      const message = err instanceof Error ? err.message : 'Failed to create player';
      setAddPlayerError(message);
      // Keep modal open so user can retry
    } finally {
      setAddPlayerLoading(false);
    }
  };

  const handleSubmit = () => {
    // Validate
    if (stake < 0) {
      setError('Stake cannot be negative');
      return;
    }

    if (!Number.isInteger(stake)) {
      setError('Stake must be an integer (Gator Bucks)');
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
      type: selectedType,
      contests: [{ type: selectedType, enabled: true, scoringBasis }],
      stake,
      playerAId,
      playerBId,
      startHole,
      endHole,
      scoringBasis,
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
        className="w-full max-w-md mx-4 border-border/50 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/90 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle>Create Game</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Game Types - Single selection (radio buttons) */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">
              Game Type
            </label>
            <div className="space-y-2">
              {gameTypes.map((gt) => {
                const styles = gameTypePillStyles[gt.value];
                const isSelected = selectedType === gt.value;
                return (
                  <div
                    key={gt.value}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer',
                      isSelected
                        ? cn(styles.background, styles.border)
                        : 'bg-muted/10 border-muted/20 hover:border-muted/40'
                    )}
                    onClick={() => setSelectedType(gt.value)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                          isSelected
                            ? cn(styles.border, styles.text)
                            : 'border-muted-foreground/30'
                        )}
                      >
                        {isSelected && (
                          <div className={cn('h-2.5 w-2.5 rounded-full', styles.background, styles.text, 'bg-current')} />
                        )}
                      </div>
                      <div>
                        <div className={cn('font-medium text-sm', isSelected ? styles.text : 'text-muted-foreground')}>
                          {gt.label}
                        </div>
                        <div className="text-xs text-muted-foreground">{gt.description}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleScoringBasis();
                        }}
                        className={cn(
                          'px-2 py-1 text-xs rounded font-medium transition-colors',
                          scoringBasis === 'net'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        )}
                      >
                        {scoringBasis === 'net' ? 'Net' : 'Gross'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stake - Fixed to allow deleting */}
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
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={stakeInput}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow empty or numeric only
                  if (val === '' || /^\d+$/.test(val)) {
                    setStakeInput(val);
                  }
                }}
                className="pl-10"
                placeholder="0"
              />
            </div>
          </div>

          {/* Empty state hint */}
          {localPlayers.length === 0 && (
            <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md border border-muted">
              No players loaded. Use the <span className="font-medium">+</span> button to add players.
            </div>
          )}

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
                <option value="">{localPlayers.length === 0 ? 'No players - click + to add' : 'Select player...'}</option>
                {playersForA.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => {
                  setAddingFor('A');
                  setShowAddPlayerModal(true);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
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
                <option value="">{playersForB.length === 0 ? 'No players - click + to add' : 'Select player...'}</option>
                {playersForB.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => {
                  setAddingFor('B');
                  setShowAddPlayerModal(true);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Add Player Modal */}
          {showAddPlayerModal && (
            <AddPlayerModal
              onSubmit={handleAddPlayer}
              onClose={() => {
                setShowAddPlayerModal(false);
                setAddingFor(null);
              }}
            />
          )}

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
