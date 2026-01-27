'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReactionButtonProps {
  count: number;
  hasReacted: boolean;
  onToggle: () => void;
}

export function ReactionButton({ count, hasReacted, onToggle }: ReactionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex items-center gap-1.5 text-sm transition-colors',
        hasReacted
          ? 'text-red-500 hover:text-red-600'
          : 'text-muted-foreground hover:text-foreground'
      )}
      onClick={onToggle}
    >
      <Heart
        className={cn('h-4 w-4', hasReacted && 'fill-current')}
      />
      <span>{count > 0 ? count : 'Like'}</span>
    </button>
  );
}
