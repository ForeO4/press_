// Server-only environment variables
// NEVER import this file in client-side code

import 'server-only';

import { isMockMode } from './public';

/**
 * Supabase service role key (bypasses RLS)
 * Server-only - NEVER expose to client
 */
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/**
 * Stripe secret key
 * Server-only - NEVER expose to client
 */
export const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? '';

/**
 * Stripe webhook secret
 * Server-only - NEVER expose to client
 */
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

/**
 * R2 configuration
 * Server-only - NEVER expose to client
 */
export const r2Config = {
  accountId: process.env.R2_ACCOUNT_ID ?? '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  bucketName: process.env.R2_BUCKET_NAME ?? 'press-media',
  publicUrl: process.env.R2_PUBLIC_URL ?? '',
};

/**
 * Validate server environment variables
 * Call this in API routes or server components
 */
export function validateServerEnv(): void {
  if (isMockMode) {
    return; // Skip validation in mock mode
  }

  const required = [
    ['SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey],
  ] as const;

  const missing = required.filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(
      `Missing required server environment variables: ${missing.map(([name]) => name).join(', ')}`
    );
  }
}
