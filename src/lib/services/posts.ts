import type { EventPost, EventComment } from '@/types';
import { mockPosts } from '@/lib/mock/data';
import { mockUsers } from '@/lib/mock/users';

// Reaction type
export interface PostReaction {
  id: string;
  postId: string;
  userId: string;
  type: 'like';
  createdAt: string;
}

// In-memory stores
let postsStore: EventPost[] = [...mockPosts];
let commentsStore: EventComment[] = [];
let reactionsStore: PostReaction[] = [];

/**
 * Get all posts for an event
 */
export async function getPosts(eventId: string): Promise<EventPost[]> {
  return postsStore
    .filter((p) => p.eventId === eventId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Create a new post
 */
export async function createPost(
  eventId: string,
  authorId: string,
  content: string
): Promise<EventPost> {
  const post: EventPost = {
    id: `post-${Date.now()}`,
    eventId,
    authorId,
    content,
    mediaIds: [],
    isSystem: false,
    createdAt: new Date().toISOString(),
  };

  postsStore.push(post);
  return post;
}

/**
 * Create a system post (for game events, etc.)
 */
export async function createSystemPost(
  eventId: string,
  content: string
): Promise<EventPost> {
  const post: EventPost = {
    id: `post-${Date.now()}`,
    eventId,
    authorId: null,
    content,
    mediaIds: [],
    isSystem: true,
    createdAt: new Date().toISOString(),
  };

  postsStore.push(post);
  return post;
}

/**
 * Delete a post
 */
export async function deletePost(postId: string): Promise<boolean> {
  const index = postsStore.findIndex((p) => p.id === postId);
  if (index === -1) return false;

  postsStore.splice(index, 1);
  // Also delete associated comments and reactions
  commentsStore = commentsStore.filter((c) => c.postId !== postId);
  reactionsStore = reactionsStore.filter((r) => r.postId !== postId);

  return true;
}

/**
 * Get comments for a post
 */
export async function getComments(postId: string): Promise<EventComment[]> {
  return commentsStore
    .filter((c) => c.postId === postId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/**
 * Add a comment to a post
 */
export async function addComment(
  postId: string,
  authorId: string,
  content: string
): Promise<EventComment> {
  const comment: EventComment = {
    id: `comment-${Date.now()}`,
    postId,
    authorId,
    content,
    createdAt: new Date().toISOString(),
  };

  commentsStore.push(comment);
  return comment;
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<boolean> {
  const index = commentsStore.findIndex((c) => c.id === commentId);
  if (index === -1) return false;

  commentsStore.splice(index, 1);
  return true;
}

/**
 * Get reaction count for a post
 */
export async function getReactionCount(postId: string): Promise<number> {
  return reactionsStore.filter((r) => r.postId === postId).length;
}

/**
 * Check if user has reacted to a post
 */
export async function hasUserReacted(postId: string, userId: string): Promise<boolean> {
  return reactionsStore.some((r) => r.postId === postId && r.userId === userId);
}

/**
 * Toggle reaction on a post
 */
export async function toggleReaction(
  postId: string,
  userId: string
): Promise<{ reacted: boolean; count: number }> {
  const existingIndex = reactionsStore.findIndex(
    (r) => r.postId === postId && r.userId === userId
  );

  if (existingIndex !== -1) {
    // Remove reaction
    reactionsStore.splice(existingIndex, 1);
  } else {
    // Add reaction
    const reaction: PostReaction = {
      id: `reaction-${Date.now()}`,
      postId,
      userId,
      type: 'like',
      createdAt: new Date().toISOString(),
    };
    reactionsStore.push(reaction);
  }

  const count = reactionsStore.filter((r) => r.postId === postId).length;
  const reacted = reactionsStore.some((r) => r.postId === postId && r.userId === userId);

  return { reacted, count };
}

/**
 * Get author name from user ID
 */
export function getAuthorName(authorId: string | null): string {
  if (!authorId) return 'System';
  return mockUsers.find((u) => u.id === authorId)?.name ?? 'Unknown';
}

/**
 * Create a settlement post
 */
export async function createSettlementPost(
  eventId: string,
  winnerName: string,
  loserName: string,
  amount: number
): Promise<EventPost> {
  return createSystemPost(
    eventId,
    `Game settled: ${winnerName} wins ${amount} Bucks from ${loserName}`
  );
}

/**
 * Create a birdie/eagle post
 */
export async function createScorePost(
  eventId: string,
  playerName: string,
  holeNumber: number,
  scoreType: 'eagle' | 'birdie'
): Promise<EventPost> {
  const emoji = scoreType === 'eagle' ? '🦅' : '🐦';
  return createSystemPost(
    eventId,
    `${emoji} ${playerName} made ${scoreType === 'eagle' ? 'an eagle' : 'a birdie'} on hole ${holeNumber}!`
  );
}

/**
 * Create an auto-press post
 */
export async function createAutoPressPost(
  eventId: string,
  playerName: string,
  holesDown: number,
  startHole: number
): Promise<EventPost> {
  return createSystemPost(
    eventId,
    `${playerName} is ${holesDown} down - auto-press starting hole ${startHole}`
  );
}
