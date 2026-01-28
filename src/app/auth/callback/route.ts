import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');

  if (code) {
    const supabase = createServerSupabaseClient();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  // Handle password recovery - redirect to reset password page
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/auth/reset-password', request.url));
  }

  // Redirect to app after successful auth
  return NextResponse.redirect(new URL('/app', request.url));
}
