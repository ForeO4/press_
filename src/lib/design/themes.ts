/**
 * Clubhouse Theme System
 *
 * 5 themes with semantic tokens:
 * 1. Dark (default) - Standard dark mode
 * 2. Light - Clean morning tee sheet
 * 3. Masters - Augusta green/yellow/azalea
 * 4. Links - Scottish heather/sand/sea
 * 5. Ryder - Navy/gold team colors
 */

import type { ClubhouseTheme } from '@/types';

export interface ThemeColors {
  // Core backgrounds
  bg: string;
  surface1: string;
  surface2: string;

  // Text
  text: string;
  textMuted: string;

  // Borders
  border: string;

  // Primary action color
  primary: string;
  primaryForeground: string;

  // Status colors
  success: string;
  warning: string;
  error: string;

  // Special
  accent: string;
  accentForeground: string;
}

export interface Theme {
  id: ClubhouseTheme;
  name: string;
  description: string;
  colors: ThemeColors;
  isDark: boolean;
}

export const themes: Record<ClubhouseTheme, Theme> = {
  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Standard dark mode',
    isDark: true,
    colors: {
      bg: '224 71% 4%',
      surface1: '224 71% 6%',
      surface2: '222.2 47.4% 15%',
      text: '213 31% 91%',
      textMuted: '215.4 16.3% 56.9%',
      border: '216 34% 17%',
      primary: '142.1 70.6% 45.3%',
      primaryForeground: '144.9 80.4% 10%',
      success: '142.1 70.6% 45.3%',
      warning: '38 92% 50%',
      error: '0 63% 45%',
      accent: '222.2 47.4% 15%',
      accentForeground: '210 40% 98%',
    },
  },

  light: {
    id: 'light',
    name: 'Light',
    description: 'Clean morning tee sheet',
    isDark: false,
    colors: {
      bg: '0 0% 100%',
      surface1: '0 0% 98%',
      surface2: '210 40% 96.1%',
      text: '222.2 84% 4.9%',
      textMuted: '215.4 16.3% 46.9%',
      border: '214.3 31.8% 91.4%',
      primary: '142.1 76.2% 36.3%',
      primaryForeground: '355.7 100% 97.3%',
      success: '142.1 76.2% 36.3%',
      warning: '38 92% 50%',
      error: '0 84.2% 60.2%',
      accent: '210 40% 96.1%',
      accentForeground: '222.2 47.4% 11.2%',
    },
  },

  masters: {
    id: 'masters',
    name: 'Masters',
    description: 'Augusta green, yellow, azalea pink',
    isDark: true,
    colors: {
      bg: '150 60% 5%', // Deep Augusta green
      surface1: '150 50% 8%',
      surface2: '150 40% 12%',
      text: '60 80% 95%', // Warm off-white
      textMuted: '150 20% 60%',
      border: '150 30% 18%',
      primary: '60 80% 55%', // Masters yellow
      primaryForeground: '150 60% 10%',
      success: '150 60% 40%', // Augusta green
      warning: '60 80% 55%', // Yellow
      error: '340 70% 55%', // Azalea pink
      accent: '340 60% 45%', // Azalea
      accentForeground: '0 0% 100%',
    },
  },

  links: {
    id: 'links',
    name: 'Links',
    description: 'Scottish heather, sand, sea',
    isDark: true,
    colors: {
      bg: '220 30% 8%', // Deep sea blue
      surface1: '220 25% 12%',
      surface2: '220 20% 16%',
      text: '45 30% 90%', // Sandy off-white
      textMuted: '220 15% 55%',
      border: '220 20% 22%',
      primary: '280 30% 55%', // Heather purple
      primaryForeground: '0 0% 100%',
      success: '150 40% 45%', // Moss green
      warning: '45 70% 55%', // Sand
      error: '0 50% 50%',
      accent: '45 60% 50%', // Sand dune
      accentForeground: '220 30% 10%',
    },
  },

  ryder: {
    id: 'ryder',
    name: 'Ryder',
    description: 'Navy blue and gold team colors',
    isDark: true,
    colors: {
      bg: '220 60% 8%', // Deep navy
      surface1: '220 55% 12%',
      surface2: '220 45% 18%',
      text: '45 90% 95%', // Golden white
      textMuted: '220 30% 55%',
      border: '220 40% 24%',
      primary: '45 90% 50%', // Gold
      primaryForeground: '220 60% 10%',
      success: '150 50% 45%',
      warning: '45 90% 50%', // Gold
      error: '0 60% 50%',
      accent: '220 60% 45%', // Navy accent
      accentForeground: '45 90% 95%',
    },
  },
};

/**
 * Get theme by ID with fallback to dark
 */
export function getTheme(themeId?: ClubhouseTheme | null): Theme {
  return themes[themeId || 'dark'] || themes.dark;
}

/**
 * Get CSS variable declarations for a theme
 */
export function getThemeCSSVariables(theme: Theme): Record<string, string> {
  const { colors } = theme;
  return {
    '--clubhouse-bg': colors.bg,
    '--clubhouse-surface-1': colors.surface1,
    '--clubhouse-surface-2': colors.surface2,
    '--clubhouse-text': colors.text,
    '--clubhouse-text-muted': colors.textMuted,
    '--clubhouse-border': colors.border,
    '--clubhouse-primary': colors.primary,
    '--clubhouse-primary-foreground': colors.primaryForeground,
    '--clubhouse-success': colors.success,
    '--clubhouse-warning': colors.warning,
    '--clubhouse-error': colors.error,
    '--clubhouse-accent': colors.accent,
    '--clubhouse-accent-foreground': colors.accentForeground,
  };
}

/**
 * Apply theme CSS variables to an element's style
 */
export function getThemeStyle(
  themeId?: ClubhouseTheme | null
): React.CSSProperties {
  const theme = getTheme(themeId);
  const vars = getThemeCSSVariables(theme);

  // Convert to camelCase for React style prop
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(vars)) {
    style[key] = value;
  }

  return style as React.CSSProperties;
}

/**
 * Get all themes as array for selection UI
 */
export function getAllThemes(): Theme[] {
  return Object.values(themes);
}
