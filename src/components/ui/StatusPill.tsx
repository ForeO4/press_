'use client';

import { cn } from '@/lib/utils';
import { gameTypePillStyles, type GameType } from '@/lib/design/colors';

interface StatusPillProps {
  variant: GameType | 'active' | 'completed' | 'press';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<string, { background: string; text: string; border: string }> = {
  ...gameTypePillStyles,
  active: {
    background: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
  },
  completed: {
    background: 'bg-muted/20',
    text: 'text-muted-foreground',
    border: 'border-muted/30',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export function StatusPill({
  variant,
  children,
  className,
  size = 'sm',
}: StatusPillProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        styles.background,
        styles.text,
        styles.border,
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// Game type label mapping
export const gameTypeLabels: Record<string, string> = {
  match_play: 'Match Play',
  nassau: 'Nassau',
  skins: 'Skins',
};

interface GameTypePillProps {
  type: string;
  isPress?: boolean;
  className?: string;
}

export function GameTypePill({ type, isPress, className }: GameTypePillProps) {
  const variant = (isPress ? 'press' : type) as GameType;
  const label = isPress ? 'Press' : (gameTypeLabels[type] || type);

  return (
    <StatusPill variant={variant} className={className}>
      {label}
    </StatusPill>
  );
}

// Status badge for game state
interface GameStatusBadgeProps {
  status: 'active' | 'completed' | 'pending';
  className?: string;
}

export function GameStatusBadge({ status, className }: GameStatusBadgeProps) {
  const labels = {
    active: 'Active',
    completed: 'Complete',
    pending: 'Pending',
  };

  return (
    <StatusPill
      variant={status === 'active' ? 'active' : 'completed'}
      className={className}
    >
      {labels[status]}
    </StatusPill>
  );
}
