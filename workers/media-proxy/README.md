# Press! Media Proxy Worker

Cloudflare Worker for handling media uploads and serving via R2.

## Overview

This worker provides:
- Presigned URL generation for uploads
- Direct upload handling
- Media serving with auth checks

## Setup

### Prerequisites

- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with R2 enabled

### Installation

```bash
cd workers/media-proxy
npm install
```

### Configuration

1. Create R2 bucket:
   ```bash
   wrangler r2 bucket create press-media
   ```

2. Set secrets:
   ```bash
   wrangler secret put JWT_SECRET
   wrangler secret put SUPABASE_URL
   ```

### Development

```bash
npm run dev
```

This starts the worker locally with R2 emulation.

### Deployment

```bash
npm run deploy
```

## API Endpoints

### Health Check

```
GET /health
```

Returns worker status.

### Get Presigned URL

```
POST /presign/upload
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "eventId": "uuid",
  "kind": "posts",
  "contentType": "image/jpeg",
  "filename": "photo.jpg"
}
```

Response:
```json
{
  "uploadUrl": "...",
  "mediaId": "uuid",
  "key": "events/{eventId}/{kind}/{mediaId}",
  "expiresAt": "2024-01-15T12:00:00Z"
}
```

### Upload File

```
PUT /media/upload/{mediaId}?key={key}&contentType={type}
Authorization: Bearer <jwt>
Content-Type: {type}

[binary data]
```

### Mark Complete

```
POST /media/complete
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "mediaId": "uuid"
}
```

### Serve Media

```
GET /media/{mediaId}
Authorization: Bearer <jwt> (optional for public)
```

## Key Format

```
events/{event_id}/{kind}/{uuid}
```

Kinds:
- `avatars` - User profile images
- `posts` - Feed post attachments
- `chat` - Chat message attachments
- `exports` - Generated exports

## Security

### Authentication

JWT validation with Supabase tokens. In development mode, tokens are loosely validated.

**TODO for production:**
- Implement proper JWT signature verification
- Add event membership checks
- Rate limiting

### Access Control

- Private bucket (no public access)
- Auth required for all operations
- Event membership verification (TODO)

## TODOs

- [ ] Proper JWT validation with Supabase
- [ ] Event membership verification
- [ ] Database integration for media_objects
- [ ] Proper presigned URL generation
- [ ] Rate limiting
- [ ] Image resizing/optimization
