import { Hono } from 'hono';
import type { Env } from '../index';
import { validateJWT } from '../auth/jwt';

export const serveRouter = new Hono<{ Bindings: Env }>();

/**
 * GET /media/:mediaId
 * Serve a media file from R2
 * Requires authentication and event membership
 */
serveRouter.get('/:mediaId', async (c) => {
  const mediaId = c.req.param('mediaId');

  // Validate auth (optional for public events, required for private)
  const user = await validateJWT(c);

  // TODO: Look up media object to get the key and verify permissions
  // For v1, we'll try to find the object by scanning with prefix
  // In production:
  // 1. Query media_objects table for the mediaId
  // 2. Get the key and event_id
  // 3. Check if user has access to the event
  // 4. Stream the file

  // Try to find the object (inefficient, but works for v1)
  // In production, store key mapping in database
  const list = await c.env.MEDIA_BUCKET.list({
    prefix: 'events/',
    include: ['customMetadata'],
  });

  let foundObject: R2Object | null = null;
  for (const obj of list.objects) {
    if (obj.customMetadata?.mediaId === mediaId) {
      foundObject = obj;
      break;
    }
  }

  // If not found by metadata, try direct key lookup (if mediaId is the key)
  if (!foundObject) {
    const directObj = await c.env.MEDIA_BUCKET.head(mediaId);
    if (directObj) {
      foundObject = directObj;
    }
  }

  if (!foundObject) {
    return c.json(
      { error: { code: 'NOT_FOUND', message: 'Media not found' } },
      404
    );
  }

  // TODO: Check event membership
  // For private events, verify user is a member
  // For public events, allow access

  // Get the actual object
  const object = await c.env.MEDIA_BUCKET.get(foundObject.key);

  if (!object) {
    return c.json(
      { error: { code: 'NOT_FOUND', message: 'Media not found' } },
      404
    );
  }

  // Stream the response
  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Content-Length', object.size.toString());
  headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache
  headers.set('ETag', object.httpEtag);

  return new Response(object.body, { headers });
});

/**
 * GET /media/key/:key
 * Serve a media file by direct key (internal use)
 */
serveRouter.get('/key/*', async (c) => {
  // Get the key from the path (everything after /key/)
  const key = c.req.path.replace('/media/key/', '');

  if (!key) {
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Missing key' } },
      400
    );
  }

  // Validate auth
  const user = await validateJWT(c);
  if (!user) {
    return c.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      401
    );
  }

  // Get the object
  const object = await c.env.MEDIA_BUCKET.get(key);

  if (!object) {
    return c.json(
      { error: { code: 'NOT_FOUND', message: 'Media not found' } },
      404
    );
  }

  // Stream the response
  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Content-Length', object.size.toString());
  headers.set('Cache-Control', 'public, max-age=31536000');
  headers.set('ETag', object.httpEtag);

  return new Response(object.body, { headers });
});
