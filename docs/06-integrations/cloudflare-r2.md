# Cloudflare R2 Integration

## Overview

Cloudflare R2 provides media storage for Press!:
- User avatars
- Feed post images
- Chat attachments
- Event exports

## Why R2?

- No egress fees (unlike S3)
- S3-compatible API
- Global CDN built-in
- Workers for custom logic

## Architecture

```
Client → Worker (presign) → R2 (upload) → Worker (complete) → Supabase
```

## Worker Setup

### Project Structure

```
/workers/media-proxy/
├── src/
│   ├── index.ts
│   ├── routes/presign.ts
│   ├── routes/complete.ts
│   └── routes/serve.ts
├── wrangler.toml
└── package.json
```

### wrangler.toml

```toml
name = "press-media-proxy"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "press-media"
```

## Key Format

```
events/{event_id}/{kind}/{uuid}
```

Kinds:
- `avatars` - User profile images
- `posts` - Feed post attachments
- `chat` - Chat message attachments
- `exports` - Generated exports (CSV, PDF)

## API Endpoints

### POST /presign/upload

Get presigned URL for upload.

**Request:**
```json
{
  "eventId": "uuid",
  "kind": "posts",
  "contentType": "image/jpeg",
  "filename": "photo.jpg"
}
```

**Response:**
```json
{
  "uploadUrl": "https://...",
  "mediaId": "uuid",
  "expiresAt": "2024-01-15T12:00:00Z"
}
```

### POST /media/complete

Mark upload as complete.

**Request:**
```json
{
  "mediaId": "uuid"
}
```

### GET /media/:mediaId

Stream media file.

**Headers:**
```
Authorization: Bearer <jwt>
```

## Upload Flow

```typescript
// 1. Get presigned URL
const { uploadUrl, mediaId } = await fetch('/presign/upload', {
  method: 'POST',
  body: JSON.stringify({
    eventId,
    kind: 'posts',
    contentType: file.type,
    filename: file.name,
  }),
}).then(r => r.json());

// 2. Upload directly to R2
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type,
  },
});

// 3. Mark complete
await fetch('/media/complete', {
  method: 'POST',
  body: JSON.stringify({ mediaId }),
});

// 4. Use mediaId in post
```

## Security

### Authentication

Worker validates JWT from Supabase:
1. Extract token from Authorization header
2. Validate signature
3. Check user ID exists
4. Optionally check event membership

### Access Control

- Presign requires authentication
- Complete requires authentication
- Serve checks event membership
- Bucket is private (no public access)

## Environment Variables

```bash
# Server-only
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=press-media
```

## Local Development

Use wrangler to run locally:

```bash
cd workers/media-proxy
wrangler dev
```

For local R2 testing, wrangler provides local bucket emulation.

## Deployment

```bash
wrangler deploy
```
