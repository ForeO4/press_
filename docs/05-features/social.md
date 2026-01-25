# Social Features

## Overview

Press! includes social features to enhance the golf event experience with feed posts and group chat.

## Event Feed

### Features

- Text posts with optional images
- Comments on posts
- Reactions (likes)
- System posts (auto-generated)

### Data Model

```typescript
interface EventPost {
  id: string;
  eventId: string;
  authorId: string;
  content: string;
  mediaIds: string[];  // Attached images
  isSystem: boolean;   // Auto-generated posts
  createdAt: string;
}

interface EventComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

interface EventReaction {
  id: string;
  postId: string;
  userId: string;
  type: 'like';  // Extensible for future
  createdAt: string;
}
```

### System Posts

Automatically generated for significant events:
- "Alex pressed the match with Blake on hole 10"
- "Casey posted a score of 38 on the front 9"
- "Event locked by admin"
- "Settlement computed"

```typescript
async function createSystemPost(
  eventId: string,
  content: string
): Promise<void> {
  await supabase.from('event_posts').insert({
    event_id: eventId,
    author_id: null,  // System
    content,
    is_system: true,
  });
}
```

### Feed Visibility

| Event Visibility | Feed Access |
|------------------|-------------|
| PRIVATE | Members only |
| UNLISTED | Members only |
| PUBLIC | Members only |

Feed is always members-only, even for public events.

## Event Chat

### Features

- Real-time group messaging
- Thread-based conversations
- System messages

### Data Model

```typescript
interface EventThread {
  id: string;
  eventId: string;
  name: string | null;  // null = main thread
  createdAt: string;
}

interface EventMessage {
  id: string;
  threadId: string;
  authorId: string | null;  // null = system
  content: string;
  isSystem: boolean;
  createdAt: string;
}
```

### Real-time Subscription

```typescript
// Subscribe to new messages
supabase
  .channel('chat')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'event_messages',
    filter: `thread_id=eq.${threadId}`
  }, handleNewMessage)
  .subscribe();
```

### Chat Visibility

Same as feed - members only.

## Media Upload

### Upload Flow

1. User selects image
2. Client requests presigned URL
3. Client uploads to R2
4. Client calls complete endpoint
5. Media attached to post/message

### Media Object

```typescript
interface MediaObject {
  id: string;
  eventId: string;
  uploadedBy: string;
  kind: 'posts' | 'chat' | 'avatars' | 'exports';
  contentType: string;
  sizeBytes: number;
  status: 'pending' | 'complete' | 'failed';
  createdAt: string;
}
```

## UI Components

### Feed List

- Infinite scroll
- Post cards with author, content, time
- Comments expandable
- Like button with count

### Post Composer

- Text input
- Image attachment button
- Submit button
- Character limit indicator

### Chat Thread

- Message list (newest at bottom)
- Scroll to bottom button
- Unread indicator
- System messages styled differently

### Chat Input

- Text input
- Send button
- Typing indicator (future)

## Permissions

| Action | OWNER | ADMIN | PLAYER | VIEWER |
|--------|-------|-------|--------|--------|
| View feed | ✓ | ✓ | ✓ | ✓ |
| Create post | ✓ | ✓ | ✓ | ✗ |
| Comment | ✓ | ✓ | ✓ | ✗ |
| React | ✓ | ✓ | ✓ | ✗ |
| Delete own post | ✓ | ✓ | ✓ | ✗ |
| Delete any post | ✓ | ✓ | ✗ | ✗ |
| View chat | ✓ | ✓ | ✓ | ✓ |
| Send message | ✓ | ✓ | ✓ | ✗ |
| Delete message | ✓ | ✓ | ✗ | ✗ |

## Content Guidelines

- No moderation system in v1
- Admin can delete inappropriate content
- System posts cannot be deleted
- Future: Report functionality
