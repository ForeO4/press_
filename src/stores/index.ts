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

  // Real auth user profile (from profiles table)
  userProfile: { display_name: string | null } | null;
  setUserProfile: (profile: { display_name: string | null } | null) => void;

  // Current event ID (for navigation context)
  currentEventId: string | null;
  setCurrentEventId: (id: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Initialize with default mock user if in mock mode
  mockUser: isMockMode ? defaultMockUser : null,
  setMockUser: (mockUser) => set({ mockUser }),

  // User profile for real auth
  userProfile: null,
  setUserProfile: (userProfile) => set({ userProfile }),

  currentEventId: null,
  setCurrentEventId: (currentEventId) => set({ currentEventId }),
}));
