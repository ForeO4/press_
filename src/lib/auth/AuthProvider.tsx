'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import { useAppStore } from '@/stores';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!isMockMode);
  const setUserProfile = useAppStore((state) => state.setUserProfile);

  useEffect(() => {
    if (isMockMode) return;

    const supabase = createClient();
    if (!supabase) return;

    // Fetch profile for a user
    const fetchProfile = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', userId)
          .single();

        if (profile) {
          setUserProfile({
            display_name: profile.display_name,
          });
        }
      } catch (error) {
        console.error('[AuthProvider] Error fetching profile:', error);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Fetch profile if user is logged in
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Fetch profile on login, clear on logout
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUserProfile]);

  const signOut = async () => {
    console.log('[AuthProvider] signOut called');
    const supabase = createClient();

    // Always clear local state, even if Supabase signOut fails
    setUser(null);
    setSession(null);
    setUserProfile(null);

    if (!supabase) {
      console.error('[AuthProvider] signOut: Supabase client is null, cleared local state only');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      // Log but don't throw - we've already cleared local state
      // Common error: "Auth session missing" when session is already gone
      console.warn('[AuthProvider] signOut warning:', error.message);
    } else {
      console.log('[AuthProvider] signOut successful');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
