'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useAppStore } from '@/stores';
import { isMockMode } from '@/lib/env/public';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

export function useCurrentUser(): CurrentUser | null {
  const mockUser = useAppStore((state) => state.mockUser);
  const userProfile = useAppStore((state) => state.userProfile);
  const { user } = useAuth();

  if (isMockMode) {
    return mockUser
      ? {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        }
      : null;
  }

  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? '',
    name: userProfile?.display_name ?? user.email?.split('@')[0] ?? 'User',
  };
}
