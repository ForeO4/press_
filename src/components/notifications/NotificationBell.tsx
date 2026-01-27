'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { NotificationList } from './NotificationList';
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  type Notification,
} from '@/lib/services/notifications';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface NotificationBellProps {
  eventId: string;
}

export function NotificationBell({ eventId }: NotificationBellProps) {
  const user = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load unread count on mount
  useEffect(() => {
    if (user?.id && eventId) {
      loadUnreadCount();
    }
  }, [user?.id, eventId]);

  const loadUnreadCount = async () => {
    if (!user?.id) return;
    try {
      const count = await getUnreadCount(eventId, user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('[NotificationBell] Failed to load count:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await getNotifications(eventId, user.id);
      setNotifications(data);
    } catch (error) {
      console.error('[NotificationBell] Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await markAllAsRead(eventId, user.id);
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('[NotificationBell] Failed to mark all read:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationList
          notifications={notifications}
          isLoading={isLoading}
          onMarkAllRead={handleMarkAllRead}
          onClose={() => setIsOpen(false)}
          eventId={eventId}
        />
      )}
    </div>
  );
}
