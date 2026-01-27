'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { formatTimeAgo } from '@/lib/utils';
import { getAuthorName } from '@/lib/services/posts';
import type { EventComment } from '@/types';

interface CommentSectionProps {
  comments: EventComment[];
  currentUserId: string;
  onAddComment: (content: string) => Promise<void>;
}

export function CommentSection({
  comments,
  currentUserId,
  onAddComment,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-border/30">
      {/* Existing Comments */}
      {comments.map((comment) => {
        const authorName = getAuthorName(comment.authorId);
        return (
          <div key={comment.id} className="flex gap-2">
            <PlayerAvatar name={authorName} size="sm" />
            <div className="flex-1 bg-muted/30 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm mt-1">{comment.content}</p>
            </div>
          </div>
        );
      })}

      {/* Add Comment Form */}
      <div className="flex gap-2">
        <Input
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          disabled={isSubmitting}
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!newComment.trim() || isSubmitting}
        >
          Post
        </Button>
      </div>
    </div>
  );
}
