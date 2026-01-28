'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { AutoPressConfig } from '@/types';

export type GameType = 'match_play' | 'nassau';

export interface RulesFormData {
  allowedGameTypes: GameType[];
  defaultStake: number;
  autoPressConfig: AutoPressConfig;
}

interface GameTypeOption {
  value: GameType | string;
  label: string;
  desc: string;
  comingSoon?: boolean;
}

const GAME_TYPE_OPTIONS: GameTypeOption[] = [
  {
    value: 'match_play',
    label: 'Match Play',
    desc: 'Hole-by-hole competition, player with most holes won wins',
  },
  {
    value: 'nassau',
    label: 'Nassau',
    desc: 'Three bets in one: front 9, back 9, and overall 18',
  },
  {
    value: 'skins',
    label: 'Skins',
    desc: 'Win the hole outright to claim the skin',
    comingSoon: true,
  },
  {
    value: 'wolf',
    label: 'Wolf',
    desc: 'Strategic team selection each hole',
    comingSoon: true,
  },
  {
    value: 'round_robin',
    label: 'Round Robin',
    desc: 'Rotate partners every 6 holes',
    comingSoon: true,
  },
  {
    value: 'two_man_low_ball',
    label: '2 Man Low Ball',
    desc: 'Best ball of each team per hole',
    comingSoon: true,
  },
  {
    value: 'banker',
    label: 'Banker',
    desc: 'One player banks against the field each hole',
    comingSoon: true,
  },
  {
    value: 'two_man_scramble',
    label: '2 Man Scramble',
    desc: 'Teams pick best shot and play from there',
    comingSoon: true,
  },
  {
    value: 'nine_point',
    label: '9 Point',
    desc: '9 points distributed each hole among 3 players',
    comingSoon: true,
  },
];

interface StepRulesProps {
  data: RulesFormData;
  onChange: (data: RulesFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepRules({ data, onChange, onNext, onBack }: StepRulesProps) {
  const selectGameType = (type: GameType) => {
    onChange({
      ...data,
      allowedGameTypes: [type],
    });
  };

  const updateAutoPress = (updates: Partial<AutoPressConfig>) => {
    onChange({
      ...data,
      autoPressConfig: { ...data.autoPressConfig, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Game Rules</h2>
        <p className="text-sm text-muted-foreground">
          Configure game types, stakes, and auto-press settings.
        </p>
      </div>

      {/* Game Types */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Game Type
        </label>
        <div className="space-y-2">
          {GAME_TYPE_OPTIONS.map((option) => {
            const isSelected = data.allowedGameTypes.includes(option.value as GameType);
            const isDisabled = option.comingSoon;

            return (
              <label
                key={option.value}
                className={`flex items-center rounded-lg border p-3 transition-colors ${
                  isDisabled
                    ? 'cursor-not-allowed opacity-50 border-input'
                    : isSelected
                    ? 'cursor-pointer border-primary bg-primary/5'
                    : 'cursor-pointer border-input hover:bg-accent'
                }`}
              >
                <input
                  type="radio"
                  name="gameType"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => !isDisabled && selectGameType(option.value as GameType)}
                  className="sr-only"
                />
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-input'
                    }`}
                  >
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">
                      {option.label}
                    </span>
                    <p className="text-sm text-muted-foreground">{option.desc}</p>
                  </div>
                  {option.comingSoon && (
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                      Coming Soon
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Default Stake */}
      <div>
        <label
          htmlFor="defaultStake"
          className="block text-sm font-medium text-foreground"
        >
          Default Stake (Gator Bucks)
        </label>
        <p className="text-sm text-muted-foreground mb-2">
          The default amount wagered per game
        </p>
        <Input
          id="defaultStake"
          type="number"
          min={1}
          max={100}
          value={data.defaultStake}
          onChange={(e) =>
            onChange({
              ...data,
              defaultStake: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)),
            })
          }
          className="w-32"
        />
      </div>

      {/* Auto-Press Settings */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground">Auto-Press</h3>
            <p className="text-sm text-muted-foreground">
              Automatically create a press when a player falls behind
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={data.autoPressConfig.enabled}
              onChange={(e) => updateAutoPress({ enabled: e.target.checked })}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-muted peer-checked:bg-primary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-input after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
          </label>
        </div>

        {data.autoPressConfig.enabled && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label
                htmlFor="trigger"
                className="block text-sm font-medium text-foreground"
              >
                Trigger (holes down)
              </label>
              <Input
                id="trigger"
                type="number"
                min={1}
                max={9}
                value={data.autoPressConfig.trigger}
                onChange={(e) =>
                  updateAutoPress({
                    trigger: Math.max(1, Math.min(9, parseInt(e.target.value) || 2)),
                  })
                }
                className="mt-1 w-20"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Default: 2 down
              </p>
            </div>

            <div>
              <label
                htmlFor="maxPresses"
                className="block text-sm font-medium text-foreground"
              >
                Max presses per game
              </label>
              <Input
                id="maxPresses"
                type="number"
                min={1}
                max={10}
                value={data.autoPressConfig.maxPresses}
                onChange={(e) =>
                  updateAutoPress({
                    maxPresses: Math.max(1, Math.min(10, parseInt(e.target.value) || 3)),
                  })
                }
                className="mt-1 w-20"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Default: 3 presses
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
