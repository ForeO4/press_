'use client';

import { useState, useEffect } from 'react';
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
import {
  getAvailableGameTypes,
  getGameTypeConfig,
  validatePlayerCount,
  validateGameLength,
  supportsScoringBasis,
  getSupportedLengths,
  getGatorBucksExamples,
  getPlayerSlotCount,
  getMinPlayerCount,
  type GameTypeConfig,
} from '@/lib/games/gameTypeConfig';

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
  playerIds?: string[]; // For 3-4 player games like HLT
  startHole: number;
  endHole: number;
  scoringBasis: ScoringBasis;
  // HLT-specific settings
  hltSettings?: {
    tieRule: 'push' | 'split' | 'carryover';
    isTeamMode: boolean;
    pointValue: number;
  };
}

// Get available game types from config (single source of truth)
const gameTypeConfigs = getAvailableGameTypes();

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

  // HLT-specific state
  const [hltPlayerIds, setHltPlayerIds] = useState<string[]>([
    players[0]?.id ?? '',
    players[1]?.id ?? '',
    players[2]?.id ?? '',
  ]);
  const [hltTieRule, setHltTieRule] = useState<'push' | 'split' | 'carryover'>('push');
  const [hltTeamMode, setHltTeamMode] = useState(false);
  const [hltPointValue, setHltPointValue] = useState(10);

  const isHLT = selectedType === 'high_low_total';
  const isNassau = selectedType === 'nassau';

  // Check if game type requires 18 holes
  const requires18Holes = isHLT || isNassau;

  // Auto-select Full 18 when Nassau or HLT is selected
  const supportedLengths = getSupportedLengths(selectedType);
  const is9HoleDisabled = !supportedLengths.includes(9);

  // Auto-select Full 18 when a game type that requires 18 holes is selected
  useEffect(() => {
    if (requires18Holes) {
      setStartHole(1);
      setEndHole(18);
    }
  }, [requires18Holes]);

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
    // Get config for selected game type
    const config = getGameTypeConfig(selectedType);

    // Validate stake
    if (stake < 0) {
      setError('Stake cannot be negative');
      return;
    }

    if (!Number.isInteger(stake)) {
      setError('Stake must be an integer (Gator Bucks)');
      return;
    }

    // Validate scoring basis using config
    if (!supportsScoringBasis(selectedType, scoringBasis)) {
      setError(`${config.label} only supports ${config.scoringBasis} scoring`);
      return;
    }

    // Get player count and validate using config
    let playerCount: number;
    let playerList: string[];

    if (isHLT) {
      const validPlayers = hltPlayerIds.filter(id => id !== '');
      playerCount = validPlayers.length;
      playerList = validPlayers;

      // Check for duplicate players
      if (new Set(validPlayers).size !== validPlayers.length) {
        setError('All players must be different');
        return;
      }

      // Team mode requires exactly 4 players
      if (hltTeamMode && validPlayers.length !== 4) {
        setError('Team mode requires exactly 4 players');
        return;
      }
    } else {
      playerCount = 2;
      playerList = [playerAId, playerBId].filter(id => id !== '');

      if (!playerAId || !playerBId) {
        setError('Please select both players');
        return;
      }
      if (playerAId === playerBId) {
        setError('Players must be different');
        return;
      }
    }

    // Validate player count using config-driven validation
    const playerValidation = validatePlayerCount(selectedType, playerCount);
    if (!playerValidation.valid) {
      setError(playerValidation.error || 'Invalid player count');
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

    // Validate game length for game type
    const gameLength = endHole - startHole + 1;
    const lengthValidation = validateGameLength(selectedType, gameLength);
    if (!lengthValidation.valid) {
      setError(lengthValidation.error || 'Invalid game length');
      return;
    }

    setError(null);

    onSubmit({
      type: selectedType,
      contests: [{ type: selectedType, enabled: true, scoringBasis }],
      stake,
      playerAId: isHLT ? playerList[0] : playerAId,
      playerBId: isHLT ? playerList[1] : playerBId,
      playerIds: isHLT ? playerList : undefined,
      startHole,
      endHole,
      scoringBasis,
      hltSettings: isHLT ? {
        tieRule: hltTieRule,
        isTeamMode: hltTeamMode,
        pointValue: hltPointValue,
      } : undefined,
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
              {gameTypeConfigs.map((config) => {
                const styles = gameTypePillStyles[config.type];
                const isSelected = selectedType === config.type;
                const showScoringToggle = isSelected && config.scoringBasis === 'both';
                return (
                  <div
                    key={config.type}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer',
                      isSelected
                        ? cn(styles.background, styles.border)
                        : 'bg-muted/10 border-muted/20 hover:border-muted/40'
                    )}
                    onClick={() => setSelectedType(config.type)}
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
                          {config.label}
                        </div>
                        <div className="text-xs text-muted-foreground">{config.shortDescription}</div>
                      </div>
                    </div>
                    {showScoringToggle && (
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

          {/* HLT Player Selection (3-4 players) */}
          {isHLT ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Players ({hltPlayerIds.filter(id => id !== '').length}/{hltTeamMode ? 4 : '3-4'})
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setAddingFor('A');
                    setShowAddPlayerModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Player
                </Button>
              </div>

              {/* Player slots */}
              {[0, 1, 2, 3].map((idx) => {
                const playerId = hltPlayerIds[idx] ?? '';
                const player = localPlayers.find(p => p.id === playerId);
                const usedIds = hltPlayerIds.filter((id, i) => i !== idx && id !== '');
                const availablePlayers = localPlayers.filter(p => !usedIds.includes(p.id));
                const isRequired = idx < 3;
                const isTeamSlot = hltTeamMode || idx < 4;

                // In non-team mode, 4th player is optional
                if (!hltTeamMode && idx === 3 && hltPlayerIds[3] === '' && hltPlayerIds.filter(id => id !== '').length < 4) {
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const newIds = [...hltPlayerIds];
                        if (newIds.length <= idx) {
                          newIds.push('');
                        }
                        setHltPlayerIds(newIds);
                      }}
                      className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Add 4th Player (optional)
                    </button>
                  );
                }

                if (idx > hltPlayerIds.length - 1 && idx >= 3) return null;

                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {idx + 1}
                    </div>
                    {player && (
                      <PlayerAvatar name={player.name} size="md" color={idx % 2 === 0 ? 'primary' : 'secondary'} />
                    )}
                    <select
                      value={playerId}
                      onChange={(e) => {
                        const newIds = [...hltPlayerIds];
                        newIds[idx] = e.target.value;
                        setHltPlayerIds(newIds);
                      }}
                      className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">
                        {localPlayers.length === 0
                          ? 'No players - click Add Player'
                          : isRequired
                            ? 'Select player...'
                            : 'Select player (optional)...'}
                      </option>
                      {availablePlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {idx === 3 && !hltTeamMode && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const newIds = hltPlayerIds.slice(0, 3);
                          setHltPlayerIds(newIds);
                        }}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                );
              })}

              {/* HLT Settings */}
              <div className="pt-3 mt-3 border-t border-muted/30 space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                  High-Low-Total Settings
                </label>

                {/* Tie Rule */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Tie Rule</label>
                  <div className="flex gap-2">
                    {(['push', 'split', 'carryover'] as const).map((rule) => (
                      <button
                        key={rule}
                        type="button"
                        onClick={() => setHltTieRule(rule)}
                        className={cn(
                          'flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 capitalize',
                          hltTieRule === rule
                            ? 'bg-pink-500/20 text-pink-400 border-pink-500/30'
                            : 'bg-muted/20 text-muted-foreground border-muted/30 hover:bg-muted/30'
                        )}
                      >
                        {rule}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hltTieRule === 'push' && 'Ties are void - no points awarded'}
                    {hltTieRule === 'split' && 'Tied players split the point'}
                    {hltTieRule === 'carryover' && 'Point carries to next hole'}
                  </p>
                </div>

                {/* Team Mode Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-muted/30">
                  <div>
                    <div className="text-sm font-medium">Team Mode (2v2)</div>
                    <div className="text-xs text-muted-foreground">Adds Total point for team combined score</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHltTeamMode(!hltTeamMode);
                      // If enabling team mode, ensure we have 4 player slots
                      if (!hltTeamMode && hltPlayerIds.length < 4) {
                        setHltPlayerIds([...hltPlayerIds, '']);
                      }
                    }}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors',
                      hltTeamMode ? 'bg-pink-500' : 'bg-muted'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                        hltTeamMode && 'translate-x-5'
                      )}
                    />
                  </button>
                </div>

                {/* Point Value */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Gator Bucks per Point</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <AlligatorIcon size="md" className="text-primary" />
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={hltPointValue}
                      onChange={(e) => setHltPointValue(parseInt(e.target.value, 10) || 1)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}

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
              {requires18Holes && (
                <span className="ml-2 text-xs text-muted-foreground/70 font-normal">
                  ({getGameTypeConfig(selectedType).label} requires 18 holes)
                </span>
              )}
            </label>
            <div className="flex gap-2">
              {holePresets.map((preset) => {
                const isNineHolePreset = preset.end - preset.start + 1 === 9;
                const isDisabled = isNineHolePreset && is9HoleDisabled;

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => !isDisabled && applyPreset(preset)}
                    disabled={isDisabled}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200',
                      isPresetActive(preset)
                        ? 'bg-primary/20 text-primary border-primary/30'
                        : isDisabled
                          ? 'bg-muted/10 text-muted-foreground/40 border-muted/20 cursor-not-allowed'
                          : 'bg-muted/20 text-muted-foreground border-muted/30 hover:bg-muted/30'
                    )}
                    title={isDisabled ? `${getGameTypeConfig(selectedType).label} requires 18 holes` : undefined}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Hole Range - only show if game type allows custom ranges */}
            {!requires18Holes && (
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
            )}
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
