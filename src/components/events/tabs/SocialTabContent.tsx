'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, ChevronRight, Activity, Image } from 'lucide-react';

interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorInitial: string;
  content: string;
  createdAt: string;
  isSystem?: boolean;
}

interface ActivityItem {
  id: string;
  type: 'game_created' | 'game_completed' | 'round_started' | 'press_created' | 'member_joined';
  description: string;
  createdAt: string;
}

interface SocialTabContentProps {
  eventId: string;
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
}

// Mock activity feed
const mockActivity: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'game_completed',
    description: 'Match Play game completed - John wins 2 & 1',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'act-2',
    type: 'press_created',
    description: 'Press created on hole 10 (10 Bucks)',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'act-3',
    type: 'round_started',
    description: 'Round 2 started at Pebble Beach',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export function SocialTabContent({
  eventId,
  messages,
  currentUserId,
  onSendMessage,
  isLoading = false,
}: SocialTabContentProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeSection, setActiveSection] = useState<'chat' | 'activity'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const displayMessages = messages.slice(-5);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

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
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'game_completed':
        return '🏆';
      case 'press_created':
        return '🔥';
      case 'round_started':
        return '⛳';
      case 'member_joined':
        return '👋';
      default:
        return '📌';
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection('chat')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            activeSection === 'chat'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <MessageCircle className="h-3 w-3" />
          Chat
        </button>
        <button
          onClick={() => setActiveSection('activity')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            activeSection === 'activity'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Activity className="h-3 w-3" />
          Activity
        </button>
      </div>

      {/* Chat Section */}
      {activeSection === 'chat' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
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
            <div className="max-h-48 space-y-2 overflow-y-auto">
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
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
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

          <div className="text-center">
            <Link href={`/event/${eventId}/feed`}>
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View Full Chat
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Activity Section */}
      {activeSection === 'activity' && (
        <div className="space-y-2">
          {mockActivity.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No activity yet.
            </div>
          ) : (
            mockActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 rounded-lg bg-muted/30 p-2"
              >
                <span className="text-base">{getActivityIcon(item.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.description}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatTime(item.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
