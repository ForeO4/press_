'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerCountInputProps {
  value: number;
  onChange: (count: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const quickOptions = [2, 4, 8, 12];

export function PlayerCountInput({
  value,
  onChange,
  min = 2,
  max = 100,
  disabled,
}: PlayerCountInputProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleQuickSelect = (count: number) => {
    onChange(Math.min(Math.max(count, min), max));
  };

  return (
    <div className="space-y-3">
      {/* Stepper */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border border-input bg-background transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-16 items-center justify-center rounded-lg border border-input bg-background text-lg font-semibold">
          {value}
        </div>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border border-input bg-background transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Quick select */}
      <div className="flex gap-2">
        {quickOptions.map((count) => (
          <button
            key={count}
            type="button"
            onClick={() => handleQuickSelect(count)}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md border transition-colors',
              value === count
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {count === 12 ? '12+' : count}
          </button>
        ))}
      </div>
    </div>
  );
}
