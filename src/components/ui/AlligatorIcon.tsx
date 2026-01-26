'use client';

import { cn } from '@/lib/utils';

interface AlligatorIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

/**
 * Gator head with open jaws - clean silhouette showing teeth
 */
export function AlligatorIcon({ className, size = 'md' }: AlligatorIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeClasses[size], className)}
    >
      {/* Upper jaw */}
      <path d="M2 7C2 7 3 5 6 5C9 5 12 5 16 6L22 7C23 7.2 23 8 23 8.5C23 9 22.5 9.5 22 9.5H8L6 9.5L2 10V7Z" />
      {/* Upper teeth */}
      <path
        d="M8 9.5V12M11 9.5V13M14 9.5V12M17 9.5V11.5M20 9V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Lower jaw */}
      <path d="M2 17C2 17 3 19 6 19C9 19 12 19 16 18L20 17C21 16.8 21 16 21 15.5C21 15 20.5 14.5 20 14.5H8L6 14.5L2 14V17Z" />
      {/* Lower teeth */}
      <path
        d="M9.5 14.5V12M12.5 14.5V11M15.5 14.5V12.5M18 14.5V13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Eye */}
      <circle cx="4.5" cy="7.5" r="1" fill="var(--background, #0F172A)" />
    </svg>
  );
}

/**
 * Alligator teeth display with icon and value
 */
interface TeethDisplayProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export function TeethDisplay({ value, size = 'md', className, showLabel }: TeethDisplayProps) {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <AlligatorIcon size={size} className="text-primary" />
      <span className={cn('font-bold', textSizes[size])}>{value}</span>
      {showLabel && <span className="text-xs text-muted-foreground">teeth</span>}
    </div>
  );
}
