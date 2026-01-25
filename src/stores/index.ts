import { create } from 'zustand';
import type { MockUser } from '@/types';
import { defaultMockUser } from '@/lib/mock/users';
import { isMockMode } from '@/lib/env/public';

/**
 * Global app store
 */
interface AppStore {
  // Mock mode user (for development)
  mockUser: MockUser | null;
  setMockUser: (user: MockUser | null) => void;

  // Current event ID (for navigation context)
  currentEventId: string | null;
  setCurrentEventId: (id: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Initialize with default mock user if in mock mode
  mockUser: isMockMode ? defaultMockUser : null,
  setMockUser: (mockUser) => set({ mockUser }),

  currentEventId: null,
  setCurrentEventId: (currentEventId) => set({ currentEventId }),
}));

/**
 * Get current user (mock or real)
 * In mock mode, returns the mock user
 * In real mode, would return Supabase user
 */
export function useCurrentUser() {
  const mockUser = useAppStore((state) => state.mockUser);

  if (isMockMode) {
    return mockUser;
  }

  // TODO: Return real Supabase user
  return null;
}
