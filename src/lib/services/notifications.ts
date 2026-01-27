import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';

export type NotificationType =
  | 'score_entered'
  | 'press_created'
  | 'game_settled'
  | 'game_created'
  | 'player_joined';

export interface Notification {
  id: string;
  eventId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType?: 'game' | 'post' | 'player';
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

// In-memory store for mock mode
let mockNotifications: Notification[] = [];

/**
 * Get notifications for a user in an event
 */
export async function getNotifications(
  eventId: string,
  userId: string,
  limit: number = 20
): Promise<Notification[]> {
  if (isMockMode || eventId.startsWith('demo-')) {
    return mockNotifications
      .filter((n) => n.eventId === eventId && n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // For Supabase mode, we'll use event_posts with is_system = true as notifications
  // This is a simplified approach - a full implementation would have a dedicated notifications table
  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Get recent system posts as notifications
  const { data, error } = await supabase
    .from('event_posts')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_system', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((post) => ({
    id: post.id,
    eventId: post.event_id,
    userId,
    type: 'game_created' as NotificationType,
    title: 'Event Update',
    message: post.content,
    isRead: false,
    createdAt: post.created_at,
  }));
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(
  eventId: string,
  userId: string
): Promise<number> {
  if (isMockMode || eventId.startsWith('demo-')) {
    return mockNotifications.filter(
      (n) => n.eventId === eventId && n.userId === userId && !n.isRead
    ).length;
  }

  const notifications = await getNotifications(eventId, userId, 100);
  return notifications.filter((n) => !n.isRead).length;
}

/**
 * Mark notification as read
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  if (isMockMode || notificationId.startsWith('notif-')) {
    const notif = mockNotifications.find((n) => n.id === notificationId);
    if (notif && notif.userId === userId) {
      notif.isRead = true;
    }
    return;
  }

  // In production with dedicated notifications table, this would update the record
  // For now, with system posts, we'd need to track read status separately
  console.log(`[notifications] Marked ${notificationId} as read for user ${userId}`);
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(
  eventId: string,
  userId: string
): Promise<void> {
  if (isMockMode || eventId.startsWith('demo-')) {
    mockNotifications
      .filter((n) => n.eventId === eventId && n.userId === userId)
      .forEach((n) => (n.isRead = true));
    return;
  }

  console.log(`[notifications] Marked all as read for user ${userId} in event ${eventId}`);
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  eventId: string,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  reference?: { type: 'game' | 'post' | 'player'; id: string }
): Promise<Notification> {
  const notification: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    eventId,
    userId,
    type,
    title,
    message,
    referenceType: reference?.type,
    referenceId: reference?.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  if (isMockMode || eventId.startsWith('demo-')) {
    mockNotifications.push(notification);
    return notification;
  }

  // In production, this would insert into a notifications table
  // For now, we don't persist - just return the notification
  return notification;
}

/**
 * Create notifications for multiple users
 */
export async function createNotificationForUsers(
  eventId: string,
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  reference?: { type: 'game' | 'post' | 'player'; id: string }
): Promise<void> {
  for (const userId of userIds) {
    await createNotification(eventId, userId, type, title, message, reference);
  }
}

// Helper functions for specific notification types

/**
 * Notify when a score is entered on a game
 */
export async function notifyScoreEntered(
  eventId: string,
  gameId: string,
  playerIds: string[],
  playerName: string,
  holeNumber: number
): Promise<void> {
  await createNotificationForUsers(
    eventId,
    playerIds,
    'score_entered',
    'Score Entered',
    `${playerName} entered score for hole ${holeNumber}`,
    { type: 'game', id: gameId }
  );
}

/**
 * Notify when a press is created
 */
export async function notifyPressCreated(
  eventId: string,
  gameId: string,
  playerIds: string[],
  playerName: string,
  startHole: number
): Promise<void> {
  await createNotificationForUsers(
    eventId,
    playerIds,
    'press_created',
    'Press Created',
    `${playerName} pressed starting hole ${startHole}`,
    { type: 'game', id: gameId }
  );
}

/**
 * Notify when a game is settled
 */
export async function notifyGameSettled(
  eventId: string,
  gameId: string,
  winnerId: string,
  loserId: string,
  winnerName: string,
  loserName: string,
  amount: number
): Promise<void> {
  // Notify winner
  await createNotification(
    eventId,
    winnerId,
    'game_settled',
    'Game Settled',
    `You won ${amount} Bucks from ${loserName}`,
    { type: 'game', id: gameId }
  );

  // Notify loser
  await createNotification(
    eventId,
    loserId,
    'game_settled',
    'Game Settled',
    `You lost ${amount} Bucks to ${winnerName}`,
    { type: 'game', id: gameId }
  );
}

/**
 * Notify when a new game is created
 */
export async function notifyGameCreated(
  eventId: string,
  gameId: string,
  playerIds: string[],
  creatorName: string,
  gameType: string
): Promise<void> {
  await createNotificationForUsers(
    eventId,
    playerIds,
    'game_created',
    'New Game',
    `${creatorName} started a ${gameType} game`,
    { type: 'game', id: gameId }
  );
}
