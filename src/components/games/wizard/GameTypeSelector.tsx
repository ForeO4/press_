'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useGameWizardStore } from '@/stores/gameWizardStore';
import type { GameType } from '@/types';
import { ArrowLeft, Check } from 'lucide-react';
import { AlligatorIcon } from '@/components/ui/AlligatorIcon';
import { getAvailableGameTypes } from '@/lib/games/gameTypeConfig';

// Get game types from config (single source of truth)
const GAME_TYPE_CONFIGS = getAvailableGameTypes();

interface GameTypeSelectorProps {
  eventId?: string;
  onBack?: string;
}

export function GameTypeSelector({ eventId, onBack = '/app' }: GameTypeSelectorProps) {
  const router = useRouter();
  const { gameType, stakeBucks, setGameType, setStakeBucks, setContext, nextStep } = useGameWizardStore();

  // Set context if eventId provided
  if (eventId) {
    setContext(eventId);
  }

  const handleContinue = () => {
    if (!gameType) return;
    nextStep();
    router.push(`/game/new/course${eventId ? `?eventId=${eventId}` : ''}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={onBack}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">New Game</h1>
          <p className="text-sm text-muted-foreground">Step 1 of 3: Game Type</p>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Game Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Choose Game Type</CardTitle>
            <CardDescription>Select how you want to play</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {GAME_TYPE_CONFIGS.map((config) => (
              <button
                key={config.type}
                type="button"
                onClick={() => setGameType(config.type)}
                className={`relative w-full p-4 rounded-lg border text-left transition-colors ${
                  gameType === config.type
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {gameType === config.type && (
                  <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <h3 className="font-medium text-foreground">{config.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                {config.status === 'beta' && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400">
                    Beta
                  </span>
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Stake Amount */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Stake
              <AlligatorIcon className="h-5 w-5 text-primary" />
            </CardTitle>
            <CardDescription>Gator Bucks per bet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="0"
                step="5"
                value={stakeBucks}
                onChange={(e) => setStakeBucks(parseInt(e.target.value) || 0)}
                className="text-lg font-medium"
              />
              <div className="flex gap-2">
                {[5, 10, 25, 50].map((amount) => (
                  <Button
                    key={amount}
                    variant={stakeBucks === amount ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStakeBucks(amount)}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Continue Button */}
        <Button
          className="w-full"
          size="lg"
          disabled={!gameType}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
