'use client';

import { Input } from '@/components/ui/input';
import type { HighLowTotalTieRule } from '@/types';

export interface HighLowTotalSettingsData {
  tieRule: HighLowTotalTieRule;
  isTeamMode: boolean;
  pointValue: number;
}

interface HighLowTotalSettingsProps {
  settings: HighLowTotalSettingsData;
  onChange: (settings: HighLowTotalSettingsData) => void;
}

const TIE_RULES: { value: HighLowTotalTieRule; label: string; description: string }[] = [
  { value: 'push', label: 'Push', description: 'No points awarded on ties' },
  { value: 'split', label: 'Split', description: 'Points divided among tied players' },
  { value: 'carryover', label: 'Carryover', description: 'Points carry to next hole' },
];

export function HighLowTotalSettings({ settings, onChange }: HighLowTotalSettingsProps) {
  return (
    <div className="space-y-4 border border-border/50 rounded-lg p-4 bg-muted/10">
      <div className="text-sm font-medium text-muted-foreground">
        High-Low-Total Settings
      </div>

      {/* Tie Rule Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Tie Rule</label>
        <div className="grid grid-cols-3 gap-2">
          {TIE_RULES.map((rule) => (
            <button
              key={rule.value}
              type="button"
              onClick={() => onChange({ ...settings, tieRule: rule.value })}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                settings.tieRule === rule.value
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'bg-muted/20 text-muted-foreground border-muted/30 hover:bg-muted/30'
              }`}
              title={rule.description}
            >
              {rule.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {TIE_RULES.find((r) => r.value === settings.tieRule)?.description}
        </p>
      </div>

      {/* Team Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label htmlFor="teamMode" className="text-sm font-medium text-foreground">
            Team Mode (2v2)
          </label>
          <p className="text-xs text-muted-foreground">
            {settings.isTeamMode
              ? 'Teams compete for Low, High, and Total points'
              : 'Individual play: Low and High points only'}
          </p>
        </div>
        <button
          id="teamMode"
          type="button"
          role="switch"
          aria-checked={settings.isTeamMode}
          onClick={() => onChange({ ...settings, isTeamMode: !settings.isTeamMode })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.isTeamMode ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.isTeamMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Point Value */}
      <div className="space-y-2">
        <label htmlFor="pointValue" className="text-sm font-medium text-foreground">
          Gator Bucks per Point
        </label>
        <Input
          id="pointValue"
          type="number"
          min={1}
          value={settings.pointValue}
          onChange={(e) => onChange({ ...settings, pointValue: parseInt(e.target.value) || 1 })}
          className="w-24"
        />
        <p className="text-xs text-muted-foreground">
          {settings.isTeamMode
            ? `3 points per hole (L+H+T) = ${3 * settings.pointValue} max per hole`
            : `2 points per hole (L+H) = ${2 * settings.pointValue} max per hole`}
        </p>
      </div>
    </div>
  );
}
