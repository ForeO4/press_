'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PostCard } from '@/components/feed/PostCard';
import { useAppStore } from '@/stores';
import { isMockMode } from '@/lib/env/public';
import {
  getPosts,
  createPost,
  toggleReaction,
  addComment,
  getAuthorName,
} from '@/lib/services/posts';
import type { EventPost, EventComment } from '@/types';

export default function FeedPage({
  params,
}: {
  params: { eventId: string };
}) {
  const mockUser = useAppStore((state) => state.mockUser);
  const [posts, setPosts] = useState<EventPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const canPost = mockUser?.role !== 'VIEWER';

  // Load posts on mount
  useEffect(() => {
    const loadPosts = async () => {
      if (isMockMode) {
        const loaded = await getPosts(params.eventId);
        setPosts(loaded);
      }
    };
    loadPosts();
  }, [params.eventId]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !mockUser) return;

    setIsPosting(true);
    try {
      const post = await createPost(params.eventId, mockUser.id, newPostContent.trim());
      setPosts((prev) => [post, ...prev]);
      setNewPostContent('');
    } finally {
      setIsPosting(false);
    }
  };

  const handleReactionToggle = async (postId: string) => {
    if (!mockUser) return { reacted: false, count: 0 };
    return toggleReaction(postId, mockUser.id);
  };

  const handleAddComment = async (postId: string, content: string): Promise<EventComment> => {
    if (!mockUser) throw new Error('Not logged in');
    return addComment(postId, mockUser.id, content);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Event Feed</h1>

      {/* Post Composer */}
      {canPost && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Share something with the group..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreatePost();
                  }
                }}
                disabled={isPosting}
              />
              <Button onClick={handleCreatePost} disabled={!newPostContent.trim() || isPosting}>
                {isPosting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No posts yet. Be the first to share!
              </p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              authorName={getAuthorName(post.authorId)}
              currentUserId={mockUser?.id ?? ''}
              onReactionToggle={handleReactionToggle}
              onAddComment={handleAddComment}
            />
          ))
        )}
      </div>
    </div>
  );
}
