'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Expand, ChevronRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorInitial: string;
  content: string;
  createdAt: string;
  isSystem?: boolean;
}

interface EventChatProps {
  eventId: string;
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function EventChat({
  eventId,
  messages,
  currentUserId,
  onSendMessage,
  isLoading = false,
  isExpanded = false,
  onToggleExpand,
}: EventChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const displayMessages = isExpanded ? messages : messages.slice(-3);

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isExpanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          Chat
        </CardTitle>
        <div className="flex items-center gap-1">
          {onToggleExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="text-xs gap-1"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          )}
          <Link href={`/event/${eventId}/feed`}>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              Full
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-start gap-2 animate-pulse">
                <div className="h-7 w-7 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className={`space-y-3 ${isExpanded ? 'max-h-64 overflow-y-auto' : ''}`}>
            {displayMessages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${
                  message.authorId === currentUserId ? 'flex-row-reverse' : ''
                }`}
              >
                {message.authorId !== currentUserId && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary flex-shrink-0">
                    {message.authorInitial}
                  </div>
                )}
                <div
                  className={`rounded-lg px-3 py-2 max-w-[80%] ${
                    message.isSystem
                      ? 'bg-muted/50 text-muted-foreground text-xs italic'
                      : message.authorId === currentUserId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                  }`}
                >
                  {!message.isSystem && message.authorId !== currentUserId && (
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">
                      {message.authorName}
                    </p>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-[10px] mt-1 ${
                    message.authorId === currentUserId
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isSending || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
