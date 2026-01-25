import type { MockUser, MembershipRole } from '@/types';

/**
 * Mock users for development without backend
 * Use the user switcher in header to switch between users
 */
export const mockUsers: MockUser[] = [
  {
    id: 'demo-owner',
    name: 'Alex Owner',
    email: 'owner@demo.press',
    role: 'OWNER',
  },
  {
    id: 'demo-admin',
    name: 'Blake Admin',
    email: 'admin@demo.press',
    role: 'ADMIN',
  },
  {
    id: 'demo-player1',
    name: 'Casey Player',
    email: 'player1@demo.press',
    role: 'PLAYER',
  },
  {
    id: 'demo-player2',
    name: 'Dana Player',
    email: 'player2@demo.press',
    role: 'PLAYER',
  },
];

/**
 * Get mock user by ID
 */
export function getMockUser(id: string): MockUser | undefined {
  return mockUsers.find((user) => user.id === id);
}

/**
 * Get mock user by role
 */
export function getMockUserByRole(role: MembershipRole): MockUser | undefined {
  return mockUsers.find((user) => user.role === role);
}

/**
 * Default mock user (owner)
 */
export const defaultMockUser = mockUsers[0];
