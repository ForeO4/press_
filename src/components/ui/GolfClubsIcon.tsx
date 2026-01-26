'use client';

import { cn } from '@/lib/utils';

interface GolfClubsIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-10 w-10',
};

/**
 * Crossed golf clubs icon - custom SVG
 * Replaces the swords icon for golf game context
 */
export function GolfClubsIcon({ className, size = 'md' }: GolfClubsIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(sizeMap[size], className)}
    >
      {/* Left club (iron) - angled from bottom-left to top-right */}
      <path d="M4 20 L17 7" />
      <path d="M17 7 L19 5 L21 6 L18 8" />

      {/* Right club (iron) - angled from bottom-right to top-left */}
      <path d="M20 20 L7 7" />
      <path d="M7 7 L5 5 L3 6 L6 8" />

      {/* Grip details */}
      <line x1="5" y1="19" x2="7" y2="17" />
      <line x1="19" y1="19" x2="17" y2="17" />
    </svg>
  );
}
