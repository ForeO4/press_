'use client';

import Link from 'next/link';
import type { Notification } from '@/lib/services/notifications';

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAllRead: () => void;
  onClose: () => void;
  eventId: string;
}

export function NotificationList({
  notifications,
  isLoading,
  onMarkAllRead,
  onClose,
  eventId,
}: NotificationListProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'score_entered':
        return (
          <div className="h-8 w-8 rounded-full bg-info/20 flex items-center justify-center">
            <svg className="h-4 w-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case 'press_created':
        return (
          <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center">
            <svg className="h-4 w-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        );
      case 'game_settled':
        return (
          <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
            <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'game_created':
        return (
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.referenceType === 'game' && notification.referenceId) {
      return `/event/${eventId}/games/${notification.referenceId}`;
    }
    return `/event/${eventId}`;
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-card shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold text-foreground">Notifications</h3>
        {hasUnread && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-primary hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <ul className="divide-y">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <Link
                  href={getNotificationLink(notification)}
                  onClick={onClose}
                  className={`flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="mt-2">
                      <span className="h-2 w-2 rounded-full bg-primary block" />
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t px-4 py-2">
          <Link
            href={`/event/${eventId}`}
            onClick={onClose}
            className="block text-center text-sm text-primary hover:underline"
          >
            View all activity
          </Link>
        </div>
      )}
    </div>
  );
}
