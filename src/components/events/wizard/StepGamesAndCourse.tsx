'use client';

import { useState } from 'react';
import { AlertTriangle, Check, Coins, Swords, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CourseSelector } from '@/components/courses/CourseSelector';
import { ManualCourseData } from '@/components/courses/CourseSelector';
import { GameType } from '@/types';
import { cn } from '@/lib/utils';

export interface GamesAndCourseFormData {
  allowedGameTypes: GameType[];
  defaultStake: number;
  teeSetId?: string;
  manualCourse?: ManualCourseData;
}

interface StepGamesAndCourseProps {
  data: GamesAndCourseFormData;
  onChange: (data: GamesAndCourseFormData) => void;
  onNext: () => void;
  onBack: () => void;
  numHoles: 9 | 18;
}

const GAME_TYPE_OPTIONS: {
  value: GameType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
}[] = [
  {
    value: 'match_play',
    label: 'Match Play',
    description: 'Hole-by-hole competition',
    icon: Swords,
  },
  {
    value: 'nassau',
    label: 'Nassau',
    description: 'Front 9, Back 9, and Overall',
    icon: Target,
  },
  {
    value: 'skins',
    label: 'Skins',
    description: 'Win hole outright to win skin',
    icon: Coins,
  },
];

const STAKE_OPTIONS = [5, 10, 25, 50];

interface Errors {
  gameTypes?: string;
  stake?: string;
}

export function StepGamesAndCourse({
  data,
  onChange,
  onNext,
  onBack,
  numHoles,
}: StepGamesAndCourseProps) {
  const [errors, setErrors] = useState<Errors>({});

  const handleGameTypeToggle = (gameType: GameType) => {
    const current = data.allowedGameTypes;
    const newTypes = current.includes(gameType)
      ? current.filter((t) => t !== gameType)
      : [...current, gameType];
    onChange({ ...data, allowedGameTypes: newTypes });
    if (errors.gameTypes) {
      setErrors({ ...errors, gameTypes: undefined });
    }
  };

  const handleStakeChange = (stake: number) => {
    onChange({ ...data, defaultStake: stake });
    if (errors.stake) {
      setErrors({ ...errors, stake: undefined });
    }
  };

  const handleStakeInputChange = (value: string) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      handleStakeChange(parsed);
    } else if (value === '') {
      onChange({ ...data, defaultStake: 0 });
    }
  };

  const handleTeeSetChange = (teeSetId: string | undefined) => {
    onChange({ ...data, teeSetId, manualCourse: undefined });
  };

  const handleManualCourseChange = (course: ManualCourseData | undefined) => {
    onChange({ ...data, manualCourse: course, teeSetId: undefined });
  };

  const validate = (): boolean => {
    const newErrors: Errors = {};

    if (data.allowedGameTypes.length === 0) {
      newErrors.gameTypes = 'Select at least one game type';
    }

    if (data.defaultStake < 0) {
      newErrors.stake = 'Stake cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  // Warning for Nassau with 9 holes
  const showNassauWarning =
    numHoles === 9 && data.allowedGameTypes.includes('nassau');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Games & Course
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the game formats and optionally select a course
        </p>
      </div>

      {/* Game Types - Multi-select */}
      <div>
        <label className="block text-sm font-medium text-foreground">
          Game Types
        </label>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Select all formats you want to allow
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {GAME_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = data.allowedGameTypes.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleGameTypeToggle(option.value)}
                disabled={option.comingSoon}
                className={cn(
                  'relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:border-primary/50 hover:bg-accent/50',
                  option.comingSoon && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSelected && (
                  <div className="absolute right-2 top-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
                <Icon
                  className={cn(
                    'h-6 w-6',
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <div>
                  <span className="font-medium text-foreground">
                    {option.label}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                {option.comingSoon && (
                  <span className="text-xs text-muted-foreground">
                    Coming Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {errors.gameTypes && (
          <p className="mt-2 text-sm text-destructive">{errors.gameTypes}</p>
        )}
      </div>

      {/* Nassau Warning */}
      {showNassauWarning && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Nassau requires 18 holes
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400/80">
              Nassau divides the round into front 9, back 9, and overall. With 9
              holes, you won&apos;t be able to play the full Nassau format.
            </p>
          </div>
        </div>
      )}

      {/* Default Stake */}
      <div>
        <label className="block text-sm font-medium text-foreground">
          Default Stake
        </label>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Set the default bet amount (players can adjust per game)
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              value={data.defaultStake || ''}
              onChange={(e) => handleStakeInputChange(e.target.value)}
              className={cn('w-24 pl-7', errors.stake && 'border-destructive')}
              min={0}
            />
          </div>
          <div className="flex gap-2">
            {STAKE_OPTIONS.map((stake) => (
              <button
                key={stake}
                type="button"
                onClick={() => handleStakeChange(stake)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md border transition-colors',
                  data.defaultStake === stake
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                ${stake}
              </button>
            ))}
          </div>
        </div>
        {errors.stake && (
          <p className="mt-2 text-sm text-destructive">{errors.stake}</p>
        )}
      </div>

      {/* Course Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground">
          Course
          <span className="ml-1 text-muted-foreground">(optional)</span>
        </label>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Select a course or skip for now
        </p>
        <div className="mt-3">
          <CourseSelector
            value={data.teeSetId}
            onChange={handleTeeSetChange}
            onManualCourseChange={handleManualCourseChange}
            manualCourse={data.manualCourse}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );
}
