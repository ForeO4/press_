'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { formatTeeth } from '@/lib/utils';
import { validatePress, getDefaultPressStake } from '@/lib/domain/games/createPress';
import type { Game, CreatePressInput } from '@/types';

interface CreatePressModalProps {
  parentGame: Game;
  currentHole: number;
  onSubmit: (input: CreatePressInput) => void;
  onClose: () => void;
}

export function CreatePressModal({
  parentGame,
  currentHole,
  onSubmit,
  onClose,
}: CreatePressModalProps) {
  const defaultStake = getDefaultPressStake(parentGame);
  const defaultStartHole = currentHole + 1;

  const [startHole, setStartHole] = useState(defaultStartHole);
  const [stake, setStake] = useState(defaultStake);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const input: CreatePressInput = {
      parentGameId: parentGame.id,
      startHole,
      stake,
    };

    const validation = validatePress(input, parentGame, currentHole);

    if (!validation.valid) {
      setError(validation.error ?? 'Invalid press');
      return;
    }

    setError(null);
    onSubmit(input);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Press</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Creating press for game ending on hole {parentGame.endHole}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="startHole" className="text-sm font-medium">
              Start Hole
            </label>
            <Input
              id="startHole"
              type="number"
              min={currentHole + 1}
              max={parentGame.endHole}
              value={startHole}
              onChange={(e) => setStartHole(parseInt(e.target.value, 10))}
            />
            <p className="text-xs text-muted-foreground">
              Current hole: {currentHole}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="stake" className="text-sm font-medium">
              Stake (Alligator Teeth)
            </label>
            <Input
              id="stake"
              type="number"
              min={1}
              value={stake}
              onChange={(e) => setStake(parseInt(e.target.value, 10))}
            />
            <p className="text-xs text-muted-foreground">
              Default: {formatTeeth(defaultStake)}
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Press</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
