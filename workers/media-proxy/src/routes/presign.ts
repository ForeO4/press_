import { Hono } from 'hono';
import type { Env } from '../index';
import { requireAuth } from '../auth/jwt';

export const presignRouter = new Hono<{ Bindings: Env }>();

/**
 * Key format: events/{event_id}/{kind}/{uuid}
 */
type MediaKind = 'avatars' | 'posts' | 'chat' | 'exports';

interface PresignRequest {
  eventId: string;
  kind: MediaKind;
  contentType: string;
  filename: string;
}

interface PresignResponse {
  uploadUrl: string;
  mediaId: string;
  key: string;
  expiresAt: string;
}

/**
 * POST /presign/upload
 * Get a presigned URL for uploading media to R2
 */
presignRouter.post('/upload', async (c) => {
  // Validate auth
  let user;
  try {
    user = await requireAuth(c);
  } catch {
    return c.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      401
    );
  }

  // Parse request body
  let body: PresignRequest;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      { error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' } },
      400
    );
  }

  // Validate required fields
  const { eventId, kind, contentType, filename } = body;

  if (!eventId || !kind || !contentType || !filename) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: eventId, kind, contentType, filename',
        },
      },
      400
    );
  }

  // Validate kind
  const validKinds: MediaKind[] = ['avatars', 'posts', 'chat', 'exports'];
  if (!validKinds.includes(kind)) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid kind. Must be one of: ${validKinds.join(', ')}`,
        },
      },
      400
    );
  }

  // Validate content type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];
  if (!allowedTypes.includes(contentType)) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid content type. Allowed: ${allowedTypes.join(', ')}`,
        },
      },
      400
    );
  }

  // Generate media ID and key
  const mediaId = crypto.randomUUID();
  const key = `events/${eventId}/${kind}/${mediaId}`;

  // TODO: Check event membership
  // In production, verify user is a member of the event
  // This would require calling Supabase to check event_memberships

  // Generate presigned URL
  // Note: R2 presigned URLs require the AWS SDK or custom implementation
  // For v1, we'll use a workaround with a signed upload endpoint

  // For now, return the key and let the client use a different upload method
  // In production, implement proper presigned URLs with @aws-sdk/s3-request-presigner

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

  // Workaround: Return a signed endpoint URL that the worker will handle
  const uploadUrl = `${c.req.url.split('/presign')[0]}/media/upload/${mediaId}?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`;

  const response: PresignResponse = {
    uploadUrl,
    mediaId,
    key,
    expiresAt,
  };

  return c.json(response);
});
