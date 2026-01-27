import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
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

// In-memory stores for mock mode
let mockPostsStore: EventPost[] = [...mockPosts];
let mockCommentsStore: EventComment[] = [];
let mockReactionsStore: PostReaction[] = [];

/**
 * Get all posts for an event
 */
export async function getPosts(eventId: string): Promise<EventPost[]> {
  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    return mockPostsStore
      .filter((p) => p.eventId === eventId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_posts')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapPostFromDb);
}

/**
 * Create a new post
 */
export async function createPost(
  eventId: string,
  authorId: string,
  content: string
): Promise<EventPost> {
  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    const post: EventPost = {
      id: `post-${Date.now()}`,
      eventId,
      authorId,
      content,
      mediaIds: [],
      isSystem: false,
      createdAt: new Date().toISOString(),
    };
    mockPostsStore.push(post);
    return post;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_posts')
    .insert({
      event_id: eventId,
      author_id: authorId,
      content,
      media_ids: [],
      is_system: false,
    })
    .select()
    .single();

  if (error) throw error;

  return mapPostFromDb(data);
}

/**
 * Create a system post (for game events, etc.)
 */
export async function createSystemPost(
  eventId: string,
  content: string
): Promise<EventPost> {
  // Demo events always use mock
  if (isMockMode || eventId.startsWith('demo-')) {
    const post: EventPost = {
      id: `post-${Date.now()}`,
      eventId,
      authorId: null,
      content,
      mediaIds: [],
      isSystem: true,
      createdAt: new Date().toISOString(),
    };
    mockPostsStore.push(post);
    return post;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_posts')
    .insert({
      event_id: eventId,
      author_id: null,
      content,
      media_ids: [],
      is_system: true,
    })
    .select()
    .single();

  if (error) throw error;

  return mapPostFromDb(data);
}

/**
 * Delete a post
 */
export async function deletePost(postId: string): Promise<boolean> {
  if (isMockMode || postId.startsWith('post-')) {
    const index = mockPostsStore.findIndex((p) => p.id === postId);
    if (index === -1) return false;

    mockPostsStore.splice(index, 1);
    mockCommentsStore = mockCommentsStore.filter((c) => c.postId !== postId);
    mockReactionsStore = mockReactionsStore.filter((r) => r.postId !== postId);
    return true;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Cascade delete handles comments and reactions
  const { error } = await supabase
    .from('event_posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;

  return true;
}

/**
 * Get comments for a post
 */
export async function getComments(postId: string): Promise<EventComment[]> {
  if (isMockMode || postId.startsWith('post-')) {
    return mockCommentsStore
      .filter((c) => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapCommentFromDb);
}

/**
 * Add a comment to a post
 */
export async function addComment(
  postId: string,
  authorId: string,
  content: string
): Promise<EventComment> {
  if (isMockMode || postId.startsWith('post-')) {
    const comment: EventComment = {
      id: `comment-${Date.now()}`,
      postId,
      authorId,
      content,
      createdAt: new Date().toISOString(),
    };
    mockCommentsStore.push(comment);
    return comment;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_comments')
    .insert({
      post_id: postId,
      author_id: authorId,
      content,
    })
    .select()
    .single();

  if (error) throw error;

  return mapCommentFromDb(data);
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<boolean> {
  if (isMockMode || commentId.startsWith('comment-')) {
    const index = mockCommentsStore.findIndex((c) => c.id === commentId);
    if (index === -1) return false;

    mockCommentsStore.splice(index, 1);
    return true;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { error } = await supabase
    .from('event_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;

  return true;
}

/**
 * Get reaction count for a post
 */
export async function getReactionCount(postId: string): Promise<number> {
  if (isMockMode || postId.startsWith('post-')) {
    return mockReactionsStore.filter((r) => r.postId === postId).length;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { count, error } = await supabase
    .from('event_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (error) throw error;

  return count ?? 0;
}

/**
 * Check if user has reacted to a post
 */
export async function hasUserReacted(postId: string, userId: string): Promise<boolean> {
  if (isMockMode || postId.startsWith('post-')) {
    return mockReactionsStore.some((r) => r.postId === postId && r.userId === userId);
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('event_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return false; // Not found
    throw error;
  }

  return !!data;
}

/**
 * Toggle reaction on a post
 */
export async function toggleReaction(
  postId: string,
  userId: string
): Promise<{ reacted: boolean; count: number }> {
  if (isMockMode || postId.startsWith('post-')) {
    return toggleMockReaction(postId, userId);
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Check if reaction exists
  const { data: existing, error: checkError } = await supabase
    .from('event_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') throw checkError;

  if (existing) {
    // Remove reaction
    const { error: deleteError } = await supabase
      .from('event_reactions')
      .delete()
      .eq('id', existing.id);

    if (deleteError) throw deleteError;
  } else {
    // Add reaction
    const { error: insertError } = await supabase
      .from('event_reactions')
      .insert({
        post_id: postId,
        user_id: userId,
        type: 'like',
      });

    if (insertError) throw insertError;
  }

  // Get updated count
  const { count, error: countError } = await supabase
    .from('event_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (countError) throw countError;

  return { reacted: !existing, count: count ?? 0 };
}

/**
 * Toggle mock reaction
 */
function toggleMockReaction(
  postId: string,
  userId: string
): { reacted: boolean; count: number } {
  const existingIndex = mockReactionsStore.findIndex(
    (r) => r.postId === postId && r.userId === userId
  );

  if (existingIndex !== -1) {
    mockReactionsStore.splice(existingIndex, 1);
  } else {
    const reaction: PostReaction = {
      id: `reaction-${Date.now()}`,
      postId,
      userId,
      type: 'like',
      createdAt: new Date().toISOString(),
    };
    mockReactionsStore.push(reaction);
  }

  const count = mockReactionsStore.filter((r) => r.postId === postId).length;
  const reacted = mockReactionsStore.some((r) => r.postId === postId && r.userId === userId);

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

/**
 * Map database row to EventPost type
 */
function mapPostFromDb(row: Record<string, unknown>): EventPost {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    authorId: row.author_id as string | null,
    content: row.content as string,
    mediaIds: (row.media_ids as string[]) ?? [],
    isSystem: row.is_system as boolean,
    createdAt: row.created_at as string,
  };
}

/**
 * Map database row to EventComment type
 */
function mapCommentFromDb(row: Record<string, unknown>): EventComment {
  return {
    id: row.id as string,
    postId: row.post_id as string,
    authorId: row.author_id as string | null,
    content: row.content as string,
    createdAt: row.created_at as string,
  };
}
