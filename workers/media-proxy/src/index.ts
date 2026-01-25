import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { presignRouter } from './routes/presign';
import { completeRouter } from './routes/complete';
import { serveRouter } from './routes/serve';

// Environment bindings
export interface Env {
  MEDIA_BUCKET: R2Bucket;
  JWT_SECRET?: string;
  SUPABASE_URL?: string;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://press.app'],
    allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
  })
);

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

// Mount routers
app.route('/presign', presignRouter);
app.route('/media', completeRouter);
app.route('/media', serveRouter);

// 404 handler
app.notFound((c) => {
  return c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Worker error:', err);
  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: c.env.ENVIRONMENT === 'development' ? err.message : 'Internal server error',
      },
    },
    500
  );
});

export default app;
