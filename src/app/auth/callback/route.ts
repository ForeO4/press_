import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createServerSupabaseClient();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  // Redirect to app after successful auth
  return NextResponse.redirect(new URL('/app', request.url));
}
