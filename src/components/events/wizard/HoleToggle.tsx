'use client';

import { cn } from '@/lib/utils';

interface HoleToggleProps {
  value: 9 | 18;
  onChange: (holes: 9 | 18) => void;
  disabled?: boolean;
}

const options: { value: 9 | 18; label: string }[] = [
  { value: 9, label: '9 Holes' },
  { value: 18, label: '18 Holes' },
];

export function HoleToggle({ value, onChange, disabled }: HoleToggleProps) {
  return (
    <div className="flex rounded-lg bg-muted/50 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          disabled={disabled}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            value === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
