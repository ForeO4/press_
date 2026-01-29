import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import type { FavoriteClubhouse, Event } from '@/types';

// In-memory store for mock mode
let mockFavorites: { userId: string; eventId: string; createdAt: string }[] = [];

/**
 * Get all favorite clubhouses for a user
 */
export async function getFavoriteClubhouses(
  userId: string
): Promise<FavoriteClubhouse[]> {
  if (isMockMode) {
    return getMockFavorites(userId);
  }

  const supabase = createClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        id,
        event_id,
        created_at,
        events (
          id,
          name,
          date,
          visibility,
          is_locked,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => {
      // events is a single object from the join, but TypeScript thinks it might be an array
      const eventData = Array.isArray(row.events) ? row.events[0] : row.events;
      return {
        id: row.id as string,
        eventId: row.event_id as string,
        event: mapEventFromDb(eventData as Record<string, unknown>),
        createdAt: row.created_at as string,
      };
    });
  } catch (error) {
    console.error('[favorites] Failed to get favorites:', error);
    return [];
  }
}

/**
 * Check if an event is favorited by a user
 */
export async function isFavorite(
  userId: string,
  eventId: string
): Promise<boolean> {
  if (isMockMode) {
    return mockFavorites.some(f => f.userId === userId && f.eventId === eventId);
  }

  const supabase = createClient();
  if (!supabase) return false;

  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('[favorites] Failed to check favorite status:', error);
    return false;
  }
}

/**
 * Toggle favorite status for an event
 * Returns true if now favorited, false if unfavorited
 */
export async function toggleFavorite(
  userId: string,
  eventId: string
): Promise<boolean> {
  if (isMockMode) {
    return toggleMockFavorite(userId, eventId);
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  try {
    // Check if already favorited
    const { data: existing } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (existing) {
      // Remove favorite
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;
      return false;
    } else {
      // Add favorite
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          event_id: eventId,
        });

      if (error) throw error;
      return true;
    }
  } catch (error) {
    console.error('[favorites] Failed to toggle favorite:', error);
    throw error;
  }
}

/**
 * Add an event to favorites
 */
export async function addFavorite(
  userId: string,
  eventId: string
): Promise<void> {
  if (isMockMode) {
    if (!mockFavorites.some(f => f.userId === userId && f.eventId === eventId)) {
      mockFavorites.push({
        userId,
        eventId,
        createdAt: new Date().toISOString(),
      });
    }
    return;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { error } = await supabase
    .from('user_favorites')
    .upsert({
      user_id: userId,
      event_id: eventId,
    }, { onConflict: 'user_id,event_id' });

  if (error) throw error;
}

/**
 * Remove an event from favorites
 */
export async function removeFavorite(
  userId: string,
  eventId: string
): Promise<void> {
  if (isMockMode) {
    mockFavorites = mockFavorites.filter(
      f => !(f.userId === userId && f.eventId === eventId)
    );
    return;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId);

  if (error) throw error;
}

// ============================================
// MOCK DATA FUNCTIONS
// ============================================

function getMockFavorites(userId: string): FavoriteClubhouse[] {
  // Return some mock favorites for demo
  const mockEvents: Event[] = [
    {
      id: 'demo-event-1',
      name: 'Saturday Morning Group',
      date: '2026-01-25',
      visibility: 'PRIVATE',
      isLocked: false,
      createdBy: userId,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-25T00:00:00Z',
    },
  ];

  return mockFavorites
    .filter(f => f.userId === userId)
    .map((f, index) => {
      const event = mockEvents.find(e => e.id === f.eventId) || {
        id: f.eventId,
        name: `Clubhouse ${index + 1}`,
        date: new Date().toISOString().split('T')[0],
        visibility: 'PRIVATE' as const,
        isLocked: false,
        createdBy: userId,
        createdAt: f.createdAt,
        updatedAt: f.createdAt,
      };

      return {
        id: `fav-${index}`,
        eventId: f.eventId,
        event,
        createdAt: f.createdAt,
      };
    });
}

function toggleMockFavorite(userId: string, eventId: string): boolean {
  const existingIndex = mockFavorites.findIndex(
    f => f.userId === userId && f.eventId === eventId
  );

  if (existingIndex >= 0) {
    mockFavorites.splice(existingIndex, 1);
    return false;
  } else {
    mockFavorites.push({
      userId,
      eventId,
      createdAt: new Date().toISOString(),
    });
    return true;
  }
}

// ============================================
// HELPERS
// ============================================

function mapEventFromDb(row: Record<string, unknown>): Event {
  return {
    id: row.id as string,
    name: row.name as string,
    date: row.date as string,
    visibility: row.visibility as Event['visibility'],
    isLocked: row.is_locked as boolean,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
