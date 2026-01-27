'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { ReactionButton } from './ReactionButton';
import { CommentSection } from './CommentSection';
import { formatTimeAgo } from '@/lib/utils';
import { getReactionCount, hasUserReacted, getComments } from '@/lib/services/posts';
import type { EventPost, EventComment } from '@/types';

interface PostCardProps {
  post: EventPost;
  authorName: string;
  currentUserId: string;
  onReactionToggle: (postId: string) => Promise<{ reacted: boolean; count: number }>;
  onAddComment: (postId: string, content: string) => Promise<EventComment>;
}

export function PostCard({
  post,
  authorName,
  currentUserId,
  onReactionToggle,
  onAddComment,
}: PostCardProps) {
  const [reactionCount, setReactionCount] = useState(0);
  const [hasReacted, setHasReacted] = useState(false);
  const [comments, setComments] = useState<EventComment[]>([]);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    // Load initial reaction state
    const loadReactionState = async () => {
      const count = await getReactionCount(post.id);
      const reacted = await hasUserReacted(post.id, currentUserId);
      setReactionCount(count);
      setHasReacted(reacted);
    };
    loadReactionState();
  }, [post.id, currentUserId]);

  useEffect(() => {
    // Load comments when section is shown
    const loadComments = async () => {
      if (showComments) {
        const loaded = await getComments(post.id);
        setComments(loaded);
      }
    };
    loadComments();
  }, [showComments, post.id]);

  const handleReactionToggle = async () => {
    const result = await onReactionToggle(post.id);
    setReactionCount(result.count);
    setHasReacted(result.reacted);
  };

  const handleAddComment = async (content: string) => {
    const comment = await onAddComment(post.id, content);
    setComments((prev) => [...prev, comment]);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Post Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {post.isSystem ? (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
            ) : (
              <PlayerAvatar name={authorName} size="md" />
            )}
            <div>
              {post.isSystem ? (
                <span className="text-sm font-medium text-muted-foreground">
                  System
                </span>
              ) : (
                <span className="font-medium">{authorName}</span>
              )}
              <p className="text-xs text-muted-foreground">
                {formatTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <p className={post.isSystem ? 'italic text-muted-foreground' : ''}>
          {post.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/30">
          <ReactionButton
            count={reactionCount}
            hasReacted={hasReacted}
            onToggle={handleReactionToggle}
          />
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowComments(!showComments)}
          >
            {comments.length > 0
              ? `${comments.length} comment${comments.length !== 1 ? 's' : ''}`
              : 'Comment'}
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <CommentSection
            comments={comments}
            currentUserId={currentUserId}
            onAddComment={handleAddComment}
          />
        )}
      </CardContent>
    </Card>
  );
}
