'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Handles Supabase auth redirects that come with tokens in the URL hash.
 * Specifically handles password recovery flow by redirecting to reset-password page.
 *
 * IMPORTANT: Must let Supabase process the hash tokens and establish session
 * BEFORE redirecting, otherwise the reset-password page won't have an active session.
 */
export function AuthRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    // Check for auth tokens in URL hash (Supabase puts them there)
    const hash = window.location.hash;
    if (!hash) return;

    // Parse hash parameters
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const type = params.get('type');

    console.log('[AuthRedirectHandler] Hash params:', { accessToken: !!accessToken, type });

    // If this is a recovery (password reset) flow, let Supabase process the tokens first
    if (accessToken && type === 'recovery') {
      const supabase = createClient();
      if (!supabase) return;

      // Let Supabase process the hash and establish session
      // getSession() triggers Supabase to read the hash tokens and create a session
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('[AuthRedirectHandler] Session established:', !!session);
        if (session) {
          router.push('/auth/reset-password');
        }
      });
    }
  }, [router]);

  return null;
}
