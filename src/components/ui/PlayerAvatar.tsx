'use client';

import { cn, getInitials } from '@/lib/utils';

interface PlayerAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'muted';
}

const sizeClasses = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

const colorClasses = {
  primary: 'bg-primary/20 text-primary border-primary/30',
  secondary: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  accent: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  muted: 'bg-muted/20 text-muted-foreground border-muted/30',
};

export function PlayerAvatar({
  name,
  size = 'md',
  className,
  color = 'primary',
}: PlayerAvatarProps) {
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold border',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
}

interface PlayerAvatarGroupProps {
  names: string[];
  size?: 'sm' | 'md' | 'lg';
  max?: number;
  className?: string;
}

export function PlayerAvatarGroup({
  names,
  size = 'md',
  max = 4,
  className,
}: PlayerAvatarGroupProps) {
  const visibleNames = names.slice(0, max);
  const remaining = names.length - max;
  const colors: Array<'primary' | 'secondary' | 'accent' | 'muted'> = [
    'primary',
    'secondary',
    'accent',
    'muted',
  ];

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleNames.map((name, i) => (
        <PlayerAvatar
          key={`${name}-${i}`}
          name={name}
          size={size}
          color={colors[i % colors.length]}
          className="ring-2 ring-background"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'inline-flex items-center justify-center rounded-full font-semibold border ring-2 ring-background',
            'bg-muted/30 text-muted-foreground border-muted/30',
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
