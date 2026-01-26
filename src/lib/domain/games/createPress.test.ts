import { describe, it, expect } from 'vitest';
import { validatePress, createPress, canCreatePress } from './createPress';
import type { Game, CreatePressInput } from '@/types';

const mockParentGame: Game = {
  id: 'game-1',
  eventId: 'event-1',
  type: 'match_play',
  stakeTeethInt: 10,
  parentGameId: null,
  startHole: 1,
  endHole: 18,
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
};

describe('validatePress', () => {
  it('rejects negative stake', () => {
    const input: CreatePressInput = {
      parentGameId: 'game-1',
      startHole: 10,
      stake: -5,
    };

    const result = validatePress(input, mockParentGame, 9);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('negative');
  });

  it('accepts zero stake', () => {
    const input: CreatePressInput = {
      parentGameId: 'game-1',
      startHole: 10,
      stake: 0,
    };

    const result = validatePress(input, mockParentGame, 9);

    expect(result.valid).toBe(true);
  });

  it('rejects non-integer stake', () => {
    const input: CreatePressInput = {
      parentGameId: 'game-1',
      startHole: 10,
      stake: 5.5,
    };

    const result = validatePress(input, mockParentGame, 9);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('integer');
  });

  it('rejects press starting on current hole', () => {
    const input: CreatePressInput = {
      parentGameId: 'game-1',
      startHole: 9,
      stake: 10,
    };

    const result = validatePress(input, mockParentGame, 9);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('after current hole');
  });

  it('rejects press starting before current hole', () => {
    const input: CreatePressInput = {
      parentGameId: 'game-1',
      startHole: 5,
      stake: 10,
    };

    const result = validatePress(input, mockParentGame, 9);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('after current hole');
  });

  it('rejects press starting after parent ends', () => {
    const shortGame: Game = { ...mockParentGame, endHole: 9 };
    const input: CreatePressInput = {
      parentGameId: 'game-1',
      startHole: 10,
      stake: 10,
    };

    const result = validatePress(input, shortGame, 8);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('after parent game ends');
  });

  it('rejects press on completed game', () => {
    const completedGame: Game = { ...mockParentGame, status: 'complete' };
    const input: CreatePressInput = {
      parentGameId: 'game-1',
      startHole: 10,
      stake: 10,
    };

    const result = validatePress(input, completedGame, 9);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('completed game');
  });

  it('accepts valid press', () => {
    const input: CreatePressInput = {
      parentGameId: 'game-1',
      startHole: 10,
      stake: 10,
    };

    const result = validatePress(input, mockParentGame, 9);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts press on last hole', () => {
    const input: CreatePressInput = {
      parentGameId: 'game-1',
      startHole: 18,
      stake: 10,
    };

    const result = validatePress(input, mockParentGame, 17);

    expect(result.valid).toBe(true);
  });
});

describe('createPress', () => {
  it('creates press with correct properties', () => {
    const input: CreatePressInput = {
      parentGameId: 'game-1',
      startHole: 10,
      stake: 15,
    };

    const result = createPress(input, mockParentGame);

    expect(result.parentGameId).toBe('game-1');
    expect(result.startHole).toBe(10);
    expect(result.endHole).toBe(18); // Inherited from parent
    expect(result.stake).toBe(15);
  });

  it('inherits end hole from parent', () => {
    const shortGame: Game = { ...mockParentGame, endHole: 9 };
    const input: CreatePressInput = {
      parentGameId: 'game-1',
      startHole: 7,
      stake: 10,
    };

    const result = createPress(input, shortGame);

    expect(result.endHole).toBe(9);
  });
});

describe('canCreatePress', () => {
  it('returns false for completed game', () => {
    const completedGame: Game = { ...mockParentGame, status: 'complete' };
    expect(canCreatePress(completedGame, 9, true, false, true)).toBe(false);
  });

  it('returns false when no holes remaining', () => {
    expect(canCreatePress(mockParentGame, 18, true, false, true)).toBe(false);
  });

  it('returns true for admin regardless of settings', () => {
    expect(canCreatePress(mockParentGame, 9, false, true, false)).toBe(true);
  });

  it('returns true for participant when self-press allowed', () => {
    expect(canCreatePress(mockParentGame, 9, true, false, true)).toBe(true);
  });

  it('returns false for participant when self-press disabled', () => {
    expect(canCreatePress(mockParentGame, 9, false, false, true)).toBe(false);
  });

  it('returns false for non-participant', () => {
    expect(canCreatePress(mockParentGame, 9, true, false, false)).toBe(false);
  });
});
