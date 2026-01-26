import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

// Routes that require authentication
const protectedRoutes = ['/app', '/event'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if Supabase is configured (not mock mode)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Mock mode - allow all routes
    return NextResponse.next();
  }

  // Skip static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareClient(
    request,
    supabaseUrl,
    supabaseAnonKey
  );

  // Refresh session if needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if route requires auth
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users from auth pages to app
  if (pathname.startsWith('/auth') && user) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
