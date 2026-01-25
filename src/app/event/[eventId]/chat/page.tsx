'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockMessages } from '@/lib/mock/data';
import { mockUsers } from '@/lib/mock/users';
import { useAppStore } from '@/stores';
import { formatTimeAgo } from '@/lib/utils';
import { isMockMode } from '@/lib/env/public';

export default function ChatPage({
  params,
}: {
  params: { eventId: string };
}) {
  const mockUser = useAppStore((state) => state.mockUser);

  // In mock mode, use demo data
  const messages = isMockMode ? mockMessages : [];
  const canChat = mockUser?.role !== 'VIEWER';

  return (
    <div className="flex h-[calc(100vh-16rem)] flex-col">
      <h1 className="mb-4 text-2xl font-bold">Event Chat</h1>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="flex h-full flex-col p-0">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages
                .sort(
                  (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime()
                )
                .map((message) => {
                  const author = message.authorId
                    ? mockUsers.find((u) => u.id === message.authorId)
                    : null;
                  const isOwn = message.authorId === mockUser?.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.isSystem
                            ? 'bg-gray-100 text-center text-sm italic text-muted-foreground'
                            : isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-gray-100'
                        }`}
                      >
                        {!message.isSystem && !isOwn && (
                          <p className="mb-1 text-xs font-medium">
                            {author?.name ?? 'Unknown'}
                          </p>
                        )}
                        <p>{message.content}</p>
                        <p
                          className={`mt-1 text-xs ${
                            isOwn
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formatTimeAgo(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Input */}
          {canChat && (
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input placeholder="Type a message..." />
                <Button>Send</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
