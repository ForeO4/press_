import { describe, it, expect } from 'vitest';
import {
  colors,
  gameTypePillStyles,
  matchStatusStyles,
  holeDotColors,
} from './colors';
import type { GameType, MatchStatusType } from './colors';

describe('colors', () => {
  describe('primary colors', () => {
    it('exports primary color palette', () => {
      expect(colors.primary).toBeDefined();
      expect(colors.primary.DEFAULT).toBe('#10B981');
      expect(colors.primary[500]).toBe('#10B981');
    });

    it('exports secondary color palette', () => {
      expect(colors.secondary).toBeDefined();
      expect(colors.secondary.DEFAULT).toBe('#3B82F6');
    });

    it('exports accent color palette', () => {
      expect(colors.accent).toBeDefined();
      expect(colors.accent.DEFAULT).toBe('#F59E0B');
    });

    it('exports danger color palette', () => {
      expect(colors.danger).toBeDefined();
      expect(colors.danger.DEFAULT).toBe('#EF4444');
    });

    it('exports success color palette', () => {
      expect(colors.success).toBeDefined();
      expect(colors.success.DEFAULT).toBe('#22C55E');
    });

    it('exports muted color palette', () => {
      expect(colors.muted).toBeDefined();
      expect(colors.muted.DEFAULT).toBe('#6B7280');
    });

    it('exports purple color palette', () => {
      expect(colors.purple).toBeDefined();
      expect(colors.purple.DEFAULT).toBe('#8B5CF6');
    });
  });

  describe('background colors', () => {
    it('exports background colors', () => {
      expect(colors.background).toBeDefined();
      expect(colors.background.DEFAULT).toBe('#0F172A');
      expect(colors.background.surface).toBe('#1E293B');
      expect(colors.background.card).toBe('#334155');
      expect(colors.background.elevated).toBe('#475569');
    });
  });

  describe('foreground colors', () => {
    it('exports foreground colors', () => {
      expect(colors.foreground).toBeDefined();
      expect(colors.foreground.DEFAULT).toBe('#F8FAFC');
      expect(colors.foreground.muted).toBe('#94A3B8');
      expect(colors.foreground.subtle).toBe('#64748B');
    });
  });

  describe('color shades', () => {
    it('primary has all shade levels', () => {
      expect(colors.primary[50]).toBeDefined();
      expect(colors.primary[100]).toBeDefined();
      expect(colors.primary[200]).toBeDefined();
      expect(colors.primary[300]).toBeDefined();
      expect(colors.primary[400]).toBeDefined();
      expect(colors.primary[500]).toBeDefined();
      expect(colors.primary[600]).toBeDefined();
      expect(colors.primary[700]).toBeDefined();
      expect(colors.primary[800]).toBeDefined();
      expect(colors.primary[900]).toBeDefined();
    });
  });
});

describe('gameTypePillStyles', () => {
  it('exports match_play style', () => {
    expect(gameTypePillStyles.match_play).toBeDefined();
    expect(gameTypePillStyles.match_play.background).toBe('bg-emerald-500/20');
    expect(gameTypePillStyles.match_play.text).toBe('text-emerald-400');
    expect(gameTypePillStyles.match_play.border).toBe('border-emerald-500/30');
  });

  it('exports nassau style', () => {
    expect(gameTypePillStyles.nassau).toBeDefined();
    expect(gameTypePillStyles.nassau.background).toBe('bg-blue-500/20');
    expect(gameTypePillStyles.nassau.text).toBe('text-blue-400');
    expect(gameTypePillStyles.nassau.border).toBe('border-blue-500/30');
  });

  it('exports skins style', () => {
    expect(gameTypePillStyles.skins).toBeDefined();
    expect(gameTypePillStyles.skins.background).toBe('bg-amber-500/20');
    expect(gameTypePillStyles.skins.text).toBe('text-amber-400');
    expect(gameTypePillStyles.skins.border).toBe('border-amber-500/30');
  });

  it('exports press style', () => {
    expect(gameTypePillStyles.press).toBeDefined();
    expect(gameTypePillStyles.press.background).toBe('bg-purple-500/20');
    expect(gameTypePillStyles.press.text).toBe('text-purple-400');
    expect(gameTypePillStyles.press.border).toBe('border-purple-500/30');
  });

  it('has consistent structure for all styles', () => {
    const keys = Object.keys(gameTypePillStyles) as GameType[];
    keys.forEach((key) => {
      const style = gameTypePillStyles[key];
      expect(style).toHaveProperty('background');
      expect(style).toHaveProperty('text');
      expect(style).toHaveProperty('border');
    });
  });
});

describe('matchStatusStyles', () => {
  it('exports winning style', () => {
    expect(matchStatusStyles.winning).toBe('border-l-4 border-l-green-500 bg-green-500/5');
  });

  it('exports losing style', () => {
    expect(matchStatusStyles.losing).toBe('border-l-4 border-l-red-500 bg-red-500/5');
  });

  it('exports tied style', () => {
    expect(matchStatusStyles.tied).toBe('border-l-4 border-l-amber-500 bg-amber-500/5');
  });

  it('exports notStarted style', () => {
    expect(matchStatusStyles.notStarted).toBe('border-l-4 border-l-muted bg-muted/5');
  });

  it('all styles include border-l-4', () => {
    const keys = Object.keys(matchStatusStyles) as MatchStatusType[];
    keys.forEach((key) => {
      expect(matchStatusStyles[key]).toContain('border-l-4');
    });
  });
});

describe('holeDotColors', () => {
  it('exports unplayed style', () => {
    expect(holeDotColors.unplayed).toBe('bg-muted text-muted-foreground');
  });

  it('exports playerAWon style', () => {
    expect(holeDotColors.playerAWon).toBe('bg-green-500 text-white');
  });

  it('exports playerBWon style', () => {
    expect(holeDotColors.playerBWon).toBe('bg-red-500 text-white');
  });

  it('exports tied style', () => {
    expect(holeDotColors.tied).toBe('bg-gray-400 text-gray-900');
  });
});
