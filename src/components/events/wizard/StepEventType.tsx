'use client';

import { useState } from 'react';
import { Flag, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HoleToggle } from './HoleToggle';
import { cn } from '@/lib/utils';

export interface EventTypeFormData {
  style: 'casual' | 'tournament';
  numRounds: number;
  numHoles: 9 | 18;
}

interface StepEventTypeProps {
  data: EventTypeFormData;
  onChange: (data: EventTypeFormData) => void;
  onNext: () => void;
}

const EVENT_STYLES = [
  {
    value: 'casual' as const,
    label: 'Casual Round',
    description: 'A friendly round with friends. No pressure, just fun.',
    icon: Flag,
    defaults: { numRounds: 1, numHoles: 18 as const },
  },
  {
    value: 'tournament' as const,
    label: 'Tournament',
    description: 'Competitive event with multiple rounds and leaderboards.',
    icon: Trophy,
    defaults: { numRounds: 2, numHoles: 18 as const },
  },
];

const ROUND_OPTIONS = [1, 2, 4];

export function StepEventType({ data, onChange, onNext }: StepEventTypeProps) {
  const [customRounds, setCustomRounds] = useState<string>('');
  const [showCustom, setShowCustom] = useState(
    !ROUND_OPTIONS.includes(data.numRounds) && data.numRounds > 0
  );

  const handleStyleChange = (style: 'casual' | 'tournament') => {
    const styleConfig = EVENT_STYLES.find((s) => s.value === style);
    if (styleConfig) {
      onChange({
        style,
        numRounds: styleConfig.defaults.numRounds,
        numHoles: styleConfig.defaults.numHoles,
      });
      setShowCustom(false);
      setCustomRounds('');
    }
  };

  const handleRoundsChange = (rounds: number | 'custom') => {
    if (rounds === 'custom') {
      setShowCustom(true);
      setCustomRounds('');
    } else {
      setShowCustom(false);
      setCustomRounds('');
      onChange({ ...data, numRounds: rounds });
    }
  };

  const handleCustomRoundsChange = (value: string) => {
    setCustomRounds(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
      onChange({ ...data, numRounds: parsed });
    }
  };

  const handleHolesChange = (holes: 9 | 18) => {
    onChange({ ...data, numHoles: holes });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          What kind of event are you creating?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the event style to get started
        </p>
      </div>

      {/* Event Style Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {EVENT_STYLES.map((style) => {
          const Icon = style.icon;
          const isSelected = data.style === style.value;
          return (
            <button
              key={style.value}
              type="button"
              onClick={() => handleStyleChange(style.value)}
              className={cn(
                'flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all',
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-input hover:border-primary/50 hover:bg-accent/50'
              )}
            >
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-full',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{style.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {style.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Number of Rounds */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Number of Rounds
        </label>
        <div className="flex flex-wrap gap-2">
          {ROUND_OPTIONS.map((rounds) => (
            <button
              key={rounds}
              type="button"
              onClick={() => handleRoundsChange(rounds)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
                data.numRounds === rounds && !showCustom
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background text-foreground hover:bg-accent'
              )}
            >
              {rounds}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleRoundsChange('custom')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
              showCustom
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background text-foreground hover:bg-accent'
            )}
          >
            Custom
          </button>
        </div>
        {showCustom && (
          <input
            type="number"
            min={1}
            max={10}
            value={customRounds}
            onChange={(e) => handleCustomRoundsChange(e.target.value)}
            placeholder="Enter number (1-10)"
            className="mt-2 w-40 rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        )}
      </div>

      {/* Holes per Round */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Holes per Round
        </label>
        <div className="w-fit">
          <HoleToggle value={data.numHoles} onChange={handleHolesChange} />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}
