'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Handles Supabase auth redirects that come with tokens in the URL hash.
 * Specifically handles password recovery flow by redirecting to reset-password page.
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

    // If this is a recovery (password reset) flow, redirect to reset password page
    if (accessToken && type === 'recovery') {
      console.log('[AuthRedirectHandler] Redirecting to reset-password');
      router.push('/auth/reset-password');
    }
  }, [router]);

  return null;
}
