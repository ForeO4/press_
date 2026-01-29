import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import { mockActivityEvents } from '@/lib/mock/data';
import type { ActivityEvent, ActivityType } from '@/types';

/**
 * Get activity events for an event
 */
export async function getActivityEvents(
  eventId: string,
  limit = 20,
  offset = 0
): Promise<ActivityEvent[]> {
  if (isMockMode || eventId.startsWith('demo-')) {
    // Return mock activity events for demo mode
    return mockActivityEvents.slice(offset, offset + limit);
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return (data || []).map(mapActivityEventFromDb);
}

/**
 * Create a new activity event
 */
export async function createActivityEvent(
  eventId: string,
  type: ActivityType,
  metadata: Record<string, unknown> = {},
  referenceType?: string,
  referenceId?: string
): Promise<ActivityEvent> {
  if (isMockMode || eventId.startsWith('demo-')) {
    // Mock creation for demo mode
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      eventId,
      activityType: type,
      referenceType,
      referenceId,
      metadata,
      createdAt: now,
    };
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const { data, error } = await supabase
    .from('activity_events')
    .insert({
      event_id: eventId,
      user_id: userId,
      activity_type: type,
      reference_type: referenceType,
      reference_id: referenceId,
      metadata,
    })
    .select()
    .single();

  if (error) throw error;

  return mapActivityEventFromDb(data);
}

/**
 * Get recent activity for a user across all events
 */
export async function getUserRecentActivity(
  userId: string,
  limit = 10
): Promise<ActivityEvent[]> {
  if (isMockMode) {
    return mockActivityEvents.slice(0, limit);
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map(mapActivityEventFromDb);
}

/**
 * Map database row to ActivityEvent type
 */
function mapActivityEventFromDb(row: Record<string, unknown>): ActivityEvent {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    userId: row.user_id as string | undefined,
    activityType: row.activity_type as ActivityType,
    referenceType: row.reference_type as string | undefined,
    referenceId: row.reference_id as string | undefined,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at as string,
  };
}

/**
 * Get activity icon based on type
 */
export function getActivityIcon(type: ActivityType): string {
  switch (type) {
    case 'birdie':
      return '🐦';
    case 'eagle':
      return '🦅';
    case 'albatross':
      return '🦢';
    case 'ace':
      return '🎯';
    case 'press':
      return '🔥';
    case 'settlement':
      return '💰';
    case 'tee_time':
      return '⏰';
    case 'round_start':
      return '🏌️';
    case 'round_end':
      return '🏁';
    case 'game_start':
      return '🎮';
    case 'game_complete':
      return '🏆';
    case 'player_joined':
      return '👋';
    default:
      return '📌';
  }
}

/**
 * Format activity message for display
 */
export function formatActivityMessage(activity: ActivityEvent): string {
  const { activityType, metadata } = activity;
  const playerName = (metadata.playerName as string) || 'Someone';
  const hole = metadata.hole as number | undefined;
  const amount = metadata.amount as number | undefined;

  switch (activityType) {
    case 'birdie':
      return `${playerName} birdied${hole ? ` #${hole}` : ''}`;
    case 'eagle':
      return `${playerName} eagled${hole ? ` #${hole}` : ''}`;
    case 'albatross':
      return `${playerName} made an albatross${hole ? ` on #${hole}` : ''}`;
    case 'ace':
      return `${playerName} hit a hole-in-one${hole ? ` on #${hole}` : ''}!`;
    case 'press':
      return `Press activated${hole ? ` on #${hole}` : ''}`;
    case 'settlement':
      return `Game settled${amount ? `: ${amount > 0 ? '+' : ''}${amount} Bucks` : ''}`;
    case 'tee_time':
      return `Tee time scheduled${metadata.time ? ` at ${metadata.time}` : ''}`;
    case 'round_start':
      return `${playerName} started their round`;
    case 'round_end':
      return `${playerName} finished their round`;
    case 'game_start':
      return `New game started: ${metadata.gameType || 'Match Play'}`;
    case 'game_complete':
      return `Game completed${metadata.winner ? `: ${metadata.winner} wins!` : ''}`;
    case 'player_joined':
      return `${playerName} joined the clubhouse`;
    default:
      return 'Activity recorded';
  }
}
