// Public environment variables (safe to expose to browser)
// These are prefixed with NEXT_PUBLIC_

/**
 * Check if app is running in mock mode (no backend)
 * When NEXT_PUBLIC_SUPABASE_URL is empty, app uses static demo data
 */
export const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Supabase URL for client-side access
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

/**
 * Supabase anonymous key for client-side access
 */
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Application URL
 */
export const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/**
 * Stripe publishable key (for checkout)
 */
export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

/**
 * Feature flag: Real-time Scoring
 * When enabled, scores sync across devices using Supabase Realtime
 * Default: OFF (requires explicit opt-in)
 */
export const FEATURE_REALTIME_SCORING = process.env.NEXT_PUBLIC_FEATURE_REALTIME_SCORING === 'true';

/**
 * Feature flag: Settlement Live Mode
 * When enabled, settlement UI fetches from real Supabase data
 * Default: OFF (uses mock data)
 */
export const SETTLEMENT_LIVE = process.env.NEXT_PUBLIC_SETTLEMENT_LIVE === 'true';

/**
 * Feature flag: HLT Teams (High-Low-Total 2v2)
 * When enabled, allows creating HLT games with team assignments
 * Default: OFF (requires explicit opt-in)
 */
export const FEATURE_HLT_TEAMS = process.env.NEXT_PUBLIC_FEATURE_HLT_TEAMS === 'true';

/**
 * Validate public environment variables
 * Call this early in app initialization
 */
export function validatePublicEnv(): void {
  if (isMockMode) {
    console.info('[Press!] Running in mock mode - no backend required');
    return;
  }

  const required = [
    ['NEXT_PUBLIC_SUPABASE_URL', supabaseUrl],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey],
  ] as const;

  const missing = required.filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.map(([name]) => name).join(', ')}`
    );
  }
}
