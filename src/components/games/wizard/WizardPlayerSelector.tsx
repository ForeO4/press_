'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useGameWizardStore, GuestPlayerInput } from '@/stores/gameWizardStore';
import { getEventMembers } from '@/lib/services/members';
import { createGameWithPlayers } from '@/lib/services/games';
import type { EventMembership } from '@/types';
import { ArrowLeft, Plus, X, User, Check, Loader2 } from 'lucide-react';

export function WizardPlayerSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');

  const {
    playerIds,
    guestPlayers,
    gameType,
    stakeBucks,
    courseId,
    teeSetId,
    addPlayer,
    removePlayer,
    addGuestPlayer,
    removeGuestPlayer,
    getTotalPlayerCount,
    canProceed,
    prevStep,
    reset,
    setSubmitting,
    isSubmitting,
    error,
    setError,
  } = useGameWizardStore();

  const [members, setMembers] = useState<EventMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestHandicap, setGuestHandicap] = useState('');

  // Load event members
  useEffect(() => {
    async function loadMembers() {
      if (!eventId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getEventMembers(eventId);
        setMembers(data);
      } catch (err) {
        console.error('Failed to load members:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, [eventId]);

  const handleTogglePlayer = (userId: string) => {
    if (playerIds.includes(userId)) {
      removePlayer(userId);
    } else {
      addPlayer(userId);
    }
  };

  const handleAddGuest = () => {
    if (!guestName.trim()) return;

    const guest: GuestPlayerInput = {
      tempId: crypto.randomUUID(),
      name: guestName.trim(),
      handicapIndex: guestHandicap ? parseFloat(guestHandicap) : undefined,
    };

    addGuestPlayer(guest);
    setGuestName('');
    setGuestHandicap('');
    setShowAddGuest(false);
  };

  const handleBack = () => {
    prevStep();
    router.push(`/game/new/course${eventId ? `?eventId=${eventId}` : ''}`);
  };

  const handleCreateGame = async () => {
    if (!gameType || !eventId) {
      setError('Missing required fields');
      return;
    }

    if (getTotalPlayerCount() < 2) {
      setError('Select at least 2 players');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Create the game
      const game = await createGameWithPlayers({
        eventId,
        type: gameType,
        stakeTeethInt: stakeBucks,
        startHole: 1,
        endHole: 18,
        playerIds,
        guestNames: guestPlayers.map((g) => g.name),
      });

      // Reset wizard and redirect to game
      reset();
      router.push(`/event/${eventId}/games/${game.id}`);
    } catch (err) {
      console.error('Failed to create game:', err);
      setError(err instanceof Error ? err.message : 'Failed to create game');
      setSubmitting(false);
    }
  };

  const playerCount = getTotalPlayerCount();

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">New Game</h1>
          <p className="text-sm text-muted-foreground">Step 3 of 3: Players</p>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Selected Players Count */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">Players selected</span>
          <span className={`font-medium ${playerCount >= 2 ? 'text-green-600' : 'text-orange-500'}`}>
            {playerCount} / 2+
          </span>
        </div>

        {/* Event Members */}
        {eventId && (
          <Card>
            <CardHeader>
              <CardTitle>Event Members</CardTitle>
              <CardDescription>Tap to add players</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse bg-muted rounded" />
                  ))}
                </div>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No members found
                </p>
              ) : (
                members.map((member) => (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => handleTogglePlayer(member.userId)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors flex items-center gap-3 ${
                      playerIds.includes(member.userId)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {member.userId.substring(0, 8)}...
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {member.role.toLowerCase()}
                      </p>
                    </div>
                    {playerIds.includes(member.userId) && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Guest Players */}
        <Card>
          <CardHeader>
            <CardTitle>Guest Players</CardTitle>
            <CardDescription>Add players without accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {guestPlayers.map((guest) => (
              <div
                key={guest.tempId}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{guest.name}</p>
                    {guest.handicapIndex !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        Handicap: {guest.handicapIndex}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeGuestPlayer(guest.tempId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {showAddGuest ? (
              <div className="space-y-3 p-3 border rounded-lg">
                <Input
                  placeholder="Guest name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  autoFocus
                />
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Handicap (optional)"
                  value={guestHandicap}
                  onChange={(e) => setGuestHandicap(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowAddGuest(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleAddGuest}
                    disabled={!guestName.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowAddGuest(true)}
              >
                <Plus className="h-4 w-4" />
                Add Guest Player
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {/* Create Game Button */}
        <Button
          className="w-full"
          size="lg"
          disabled={playerCount < 2 || isSubmitting}
          onClick={handleCreateGame}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Game...
            </>
          ) : (
            'Create Game'
          )}
        </Button>
      </div>
    </div>
  );
}
