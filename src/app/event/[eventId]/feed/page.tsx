'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockPosts } from '@/lib/mock/data';
import { mockUsers } from '@/lib/mock/users';
import { useAppStore } from '@/stores';
import { formatTimeAgo } from '@/lib/utils';
import { isMockMode } from '@/lib/env/public';

export default function FeedPage({
  params,
}: {
  params: { eventId: string };
}) {
  const mockUser = useAppStore((state) => state.mockUser);

  // In mock mode, use demo data
  const posts = isMockMode ? mockPosts : [];
  const canPost = mockUser?.role !== 'VIEWER';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Event Feed</h1>

      {/* Post Composer */}
      {canPost && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input placeholder="Share something with the group..." />
              <Button>Post</Button>
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
          posts
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .map((post) => {
              const author = post.authorId
                ? mockUsers.find((u) => u.id === post.authorId)
                : null;

              return (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        {post.isSystem ? (
                          <span className="text-sm font-medium text-muted-foreground">
                            System
                          </span>
                        ) : (
                          <span className="font-medium">
                            {author?.name ?? 'Unknown'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(post.createdAt)}
                      </span>
                    </div>
                    <p
                      className={`mt-2 ${post.isSystem ? 'italic text-muted-foreground' : ''}`}
                    >
                      {post.content}
                    </p>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>
    </div>
  );
}
