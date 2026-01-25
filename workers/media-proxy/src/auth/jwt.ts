import type { Context } from 'hono';
import type { Env } from '../index';

/**
 * User info extracted from JWT
 */
export interface JWTUser {
  id: string;
  email?: string;
}

/**
 * Validate JWT from Authorization header
 * Returns user info if valid, null if invalid
 *
 * TODO: Implement actual JWT validation with Supabase
 * For v1, this is a stub that accepts any Bearer token
 */
export async function validateJWT(c: Context<{ Bindings: Env }>): Promise<JWTUser | null> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);

  if (!token) {
    return null;
  }

  // TODO: Actual JWT validation
  // 1. Decode the JWT
  // 2. Verify signature with JWT_SECRET or Supabase public key
  // 3. Check expiration
  // 4. Extract user ID

  // For v1/development, accept any token and extract user ID
  // In production, this MUST be replaced with proper validation
  if (c.env.ENVIRONMENT === 'development') {
    // Dev mode: trust the token, extract mock user ID
    try {
      // Simple base64 decode of payload (NOT secure, dev only)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        return {
          id: payload.sub || 'dev-user',
          email: payload.email,
        };
      }
    } catch {
      // If token parsing fails, return a dev user
      return { id: 'dev-user' };
    }
  }

  // Production: Require proper JWT validation
  // TODO: Implement with Supabase JWT verification
  console.warn('JWT validation not implemented for production');
  return null;
}

/**
 * Require authentication middleware helper
 */
export async function requireAuth(c: Context<{ Bindings: Env }>): Promise<JWTUser> {
  const user = await validateJWT(c);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
