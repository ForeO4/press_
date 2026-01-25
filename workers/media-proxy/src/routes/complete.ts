import { Hono } from 'hono';
import type { Env } from '../index';
import { requireAuth } from '../auth/jwt';

export const completeRouter = new Hono<{ Bindings: Env }>();

interface CompleteRequest {
  mediaId: string;
}

/**
 * POST /media/complete
 * Mark an upload as complete and create media_objects record
 */
completeRouter.post('/complete', async (c) => {
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
  let body: CompleteRequest;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      { error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' } },
      400
    );
  }

  const { mediaId } = body;

  if (!mediaId) {
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Missing mediaId' } },
      400
    );
  }

  // TODO: Verify the object exists in R2
  // TODO: Create media_objects record in Supabase

  // For v1, just acknowledge the completion
  // In production:
  // 1. Check if object exists in R2 with the mediaId
  // 2. Get object metadata (size, content type)
  // 3. Insert into media_objects table via Supabase

  return c.json({
    success: true,
    mediaId,
    message: 'Upload marked as complete',
  });
});

/**
 * PUT /media/upload/:mediaId
 * Direct upload endpoint (workaround for presigned URLs)
 * In production, use proper presigned URLs instead
 */
completeRouter.put('/upload/:mediaId', async (c) => {
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

  const mediaId = c.req.param('mediaId');
  const key = c.req.query('key');
  const contentType = c.req.query('contentType');

  if (!key || !contentType) {
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Missing key or contentType' } },
      400
    );
  }

  // Get the file body
  const body = await c.req.arrayBuffer();

  if (!body || body.byteLength === 0) {
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Empty file body' } },
      400
    );
  }

  // Upload to R2
  try {
    await c.env.MEDIA_BUCKET.put(key, body, {
      httpMetadata: {
        contentType,
      },
      customMetadata: {
        uploadedBy: user.id,
        mediaId,
      },
    });
  } catch (err) {
    console.error('R2 upload error:', err);
    return c.json(
      { error: { code: 'UPLOAD_FAILED', message: 'Failed to upload to storage' } },
      500
    );
  }

  return c.json({
    success: true,
    mediaId,
    key,
    size: body.byteLength,
  });
});
