'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  eventId: string;
  eventName: string;
  authorName: string;
  authorInitial: string;
  content: string;
  createdAt: string;
}

interface RecentMessagesCardProps {
  messages: Message[];
  isLoading?: boolean;
}

export function RecentMessagesCard({ messages, isLoading }: RecentMessagesCardProps) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Recent Messages</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs">
          See All
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No recent messages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.slice(0, 3).map((message) => (
              <Link
                key={message.id}
                href={`/event/${message.eventId}/feed`}
                className="flex items-start gap-3 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary flex-shrink-0">
                  {message.authorInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {message.content}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {message.authorName} in {message.eventName} · {formatTimeAgo(message.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
