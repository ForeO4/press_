'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { getTheme, getThemeStyle, type Theme } from '@/lib/design/themes';
import type { ClubhouseTheme } from '@/types';

interface ClubhouseThemeContextValue {
  theme: Theme;
  themeId: ClubhouseTheme;
}

const ClubhouseThemeContext = createContext<ClubhouseThemeContextValue | null>(
  null
);

interface ClubhouseThemeProviderProps {
  themeId?: ClubhouseTheme | null;
  children: ReactNode;
}

/**
 * Provider component that applies clubhouse-specific theme CSS variables
 * Wraps content with theme context and inline styles
 */
export function ClubhouseThemeProvider({
  themeId,
  children,
}: ClubhouseThemeProviderProps) {
  const theme = useMemo(() => getTheme(themeId), [themeId]);
  const style = useMemo(() => getThemeStyle(themeId), [themeId]);

  const contextValue = useMemo(
    () => ({
      theme,
      themeId: theme.id,
    }),
    [theme]
  );

  return (
    <ClubhouseThemeContext.Provider value={contextValue}>
      <div
        style={style}
        className={theme.isDark ? 'clubhouse-dark' : 'clubhouse-light'}
        data-clubhouse-theme={theme.id}
      >
        {children}
      </div>
    </ClubhouseThemeContext.Provider>
  );
}

/**
 * Hook to access current clubhouse theme
 */
export function useClubhouseTheme(): ClubhouseThemeContextValue {
  const context = useContext(ClubhouseThemeContext);
  if (!context) {
    // Return default if not in provider
    const defaultTheme = getTheme('dark');
    return {
      theme: defaultTheme,
      themeId: defaultTheme.id,
    };
  }
  return context;
}
