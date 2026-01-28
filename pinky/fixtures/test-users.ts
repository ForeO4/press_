/**
 * Test User Personas for Pinky Tests
 *
 * These personas represent different user types and behaviors
 * for testing the Press! golf app.
 */

export interface TestUser {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'PLAYER';
  persona: string;
  behavior: UserBehavior;
}

export interface UserBehavior {
  /** How quickly the user types (ms per character) */
  typingSpeed: number;
  /** Likelihood of making mistakes (0-1) */
  errorProne: number;
  /** Whether the user reads instructions */
  readsInstructions: boolean;
  /** How patient the user is (affects waiting for loading) */
  patience: 'low' | 'medium' | 'high';
}

/**
 * Demo mode users - matches the mock users in src/lib/mock/users.ts
 */
export const DEMO_USERS: TestUser[] = [
  {
    id: 'demo-owner',
    name: 'Alex Owner',
    email: 'owner@demo.press',
    role: 'OWNER',
    persona: 'Event Organizer',
    behavior: {
      typingSpeed: 50,
      errorProne: 0.1,
      readsInstructions: true,
      patience: 'high',
    },
  },
  {
    id: 'demo-admin',
    name: 'Blake Admin',
    email: 'admin@demo.press',
    role: 'ADMIN',
    persona: 'Tech-Savvy Admin',
    behavior: {
      typingSpeed: 30,
      errorProne: 0.05,
      readsInstructions: true,
      patience: 'medium',
    },
  },
  {
    id: 'demo-player1',
    name: 'Casey Player',
    email: 'player1@demo.press',
    role: 'PLAYER',
    persona: 'Casual Golfer',
    behavior: {
      typingSpeed: 100,
      errorProne: 0.2,
      readsInstructions: false,
      patience: 'low',
    },
  },
  {
    id: 'demo-player2',
    name: 'Dana Player',
    email: 'player2@demo.press',
    role: 'PLAYER',
    persona: 'Experienced Player',
    behavior: {
      typingSpeed: 60,
      errorProne: 0.1,
      readsInstructions: true,
      patience: 'medium',
    },
  },
];

/**
 * Test personas for different user behaviors
 */
export const TEST_PERSONAS = {
  /** First-time user who doesn't know the app */
  naive: {
    typingSpeed: 150,
    errorProne: 0.3,
    readsInstructions: false,
    patience: 'low' as const,
  },

  /** Power user who knows the app well */
  expert: {
    typingSpeed: 20,
    errorProne: 0.02,
    readsInstructions: false, // Doesn't need to
    patience: 'high' as const,
  },

  /** User in a hurry, skips steps */
  rusher: {
    typingSpeed: 10,
    errorProne: 0.4,
    readsInstructions: false,
    patience: 'low' as const,
  },

  /** Careful user who reads everything */
  methodical: {
    typingSpeed: 200,
    errorProne: 0.05,
    readsInstructions: true,
    patience: 'high' as const,
  },
};

/**
 * Get the owner user for event creation tests
 */
export function getOwnerUser(): TestUser {
  return DEMO_USERS.find((u) => u.role === 'OWNER')!;
}

/**
 * Get players for game creation tests
 */
export function getPlayers(): TestUser[] {
  return DEMO_USERS.filter((u) => u.role === 'PLAYER');
}

/**
 * Get user by ID
 */
export function getUserById(id: string): TestUser | undefined {
  return DEMO_USERS.find((u) => u.id === id);
}

/**
 * Get user by role
 */
export function getUserByRole(role: TestUser['role']): TestUser | undefined {
  return DEMO_USERS.find((u) => u.role === role);
}

/**
 * Simulate human-like typing delay based on persona
 */
export async function humanDelay(persona: UserBehavior): Promise<void> {
  const base = persona.patience === 'low' ? 100 : persona.patience === 'medium' ? 300 : 500;
  const variance = Math.random() * 200;
  await new Promise((resolve) => setTimeout(resolve, base + variance));
}
