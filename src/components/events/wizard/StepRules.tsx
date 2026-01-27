'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { AutoPressConfig } from '@/types';

export interface RulesFormData {
  allowedGameTypes: ('match_play' | 'nassau')[];
  defaultStake: number;
  autoPressConfig: AutoPressConfig;
}

interface StepRulesProps {
  data: RulesFormData;
  onChange: (data: RulesFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepRules({ data, onChange, onNext, onBack }: StepRulesProps) {
  const toggleGameType = (type: 'match_play' | 'nassau') => {
    const current = data.allowedGameTypes;
    if (current.includes(type)) {
      // Don't allow removing the last game type
      if (current.length > 1) {
        onChange({
          ...data,
          allowedGameTypes: current.filter((t) => t !== type),
        });
      }
    } else {
      onChange({
        ...data,
        allowedGameTypes: [...current, type],
      });
    }
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
          Allowed Game Types
        </label>
        <div className="space-y-2">
          {[
            {
              value: 'match_play' as const,
              label: 'Match Play',
              desc: 'Hole-by-hole competition, player with most holes won wins',
            },
            {
              value: 'nassau' as const,
              label: 'Nassau',
              desc: 'Three bets in one: front 9, back 9, and overall 18',
            },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                data.allowedGameTypes.includes(option.value)
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:bg-accent'
              }`}
            >
              <input
                type="checkbox"
                checked={data.allowedGameTypes.includes(option.value)}
                onChange={() => toggleGameType(option.value)}
                className="sr-only"
              />
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    data.allowedGameTypes.includes(option.value)
                      ? 'border-primary bg-primary'
                      : 'border-input'
                  }`}
                >
                  {data.allowedGameTypes.includes(option.value) && (
                    <svg
                      className="h-3 w-3 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <span className="font-medium text-foreground">
                    {option.label}
                  </span>
                  <p className="text-sm text-muted-foreground">{option.desc}</p>
                </div>
              </div>
            </label>
          ))}
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
