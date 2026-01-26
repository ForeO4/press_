/**
 * Press! Design System - Color Palette
 *
 * Inspired by Golf Genius & Squabbit with modern UI trends
 * Dark mode focused for premium feel
 */

// Core palette
export const colors = {
  // Primary - Golf green (emerald)
  primary: {
    DEFAULT: '#10B981',
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Secondary - Water hazard (blue)
  secondary: {
    DEFAULT: '#3B82F6',
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Accent - Sand trap (amber)
  accent: {
    DEFAULT: '#F59E0B',
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Danger - Out of bounds (red)
  danger: {
    DEFAULT: '#EF4444',
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Success - Birdie! (green)
  success: {
    DEFAULT: '#22C55E',
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  // Muted - Inactive (gray)
  muted: {
    DEFAULT: '#6B7280',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Purple - Press games
  purple: {
    DEFAULT: '#8B5CF6',
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },

  // Dark backgrounds
  background: {
    DEFAULT: '#0F172A',  // Dark slate
    surface: '#1E293B', // Elevated surface
    card: '#334155',    // Card background
    elevated: '#475569', // Higher elevation
  },

  // Light text on dark
  foreground: {
    DEFAULT: '#F8FAFC',
    muted: '#94A3B8',
    subtle: '#64748B',
  },
} as const;

// Status pill variants for game types
export const gameTypePillStyles = {
  match_play: {
    background: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  nassau: {
    background: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  skins: {
    background: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  press: {
    background: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
} as const;

// Match status card styles
export const matchStatusStyles = {
  winning: 'border-l-4 border-l-green-500 bg-green-500/5',
  losing: 'border-l-4 border-l-red-500 bg-red-500/5',
  tied: 'border-l-4 border-l-amber-500 bg-amber-500/5',
  notStarted: 'border-l-4 border-l-muted bg-muted/5',
} as const;

// Hole result dot colors
export const holeDotColors = {
  unplayed: 'bg-muted text-muted-foreground',
  playerAWon: 'bg-green-500 text-white',
  playerBWon: 'bg-red-500 text-white',
  tied: 'bg-gray-400 text-gray-900',
} as const;

export type GameType = keyof typeof gameTypePillStyles;
export type MatchStatusType = keyof typeof matchStatusStyles;
