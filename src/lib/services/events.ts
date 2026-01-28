import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import { mockEvent } from '@/lib/mock/data';
import { createEventTeeSnapshot } from '@/lib/services/courses';
import type { Event, CreateEventInput, UpdateEventInput } from '@/types';

/**
 * Create a new event using RPC (recommended)
 * This creates the event, owner membership, settings, and initializes teeth balance in one transaction
 */
export async function createEventWithRPC(
  input: CreateEventInput
): Promise<Event> {
  if (isMockMode) {
    // In mock mode, create a fake event
    const now = new Date().toISOString();
    const eventId = crypto.randomUUID();

    // Create tee snapshot if teeSetId provided
    if (input.teeSetId) {
      await createEventTeeSnapshot(eventId, input.teeSetId);
    }

    return {
      id: eventId,
      name: input.name,
      date: input.date,
      visibility: input.visibility,
      isLocked: false,
      createdBy: 'mock-user',
      createdAt: now,
      updatedAt: now,
    };
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase.rpc('rpc_create_event', {
    p_name: input.name,
    p_date: input.date,
    p_visibility: input.visibility,
  });

  if (error) {
    console.error('[events] RPC error:', error);
    throw new Error(error.message || 'Database error creating event');
  }

  if (!data?.success || !data?.event) {
    console.error('[events] RPC returned invalid data:', data);
    throw new Error(data?.message || 'Failed to create event - no data returned');
  }

  const event = mapEventFromDb(data.event);

  // Create tee snapshot if teeSetId provided
  if (input.teeSetId) {
    try {
      await createEventTeeSnapshot(event.id, input.teeSetId);
    } catch (snapshotError) {
      // Log but don't fail event creation
      console.error('[events] Failed to create tee snapshot:', snapshotError);
    }
  }

  return event;
}

/**
 * Create a new event
 */
export async function createEvent(
  input: CreateEventInput,
  userId: string
): Promise<Event> {
  if (isMockMode) {
    // In mock mode, create a fake event
    const now = new Date().toISOString();
    const eventId = crypto.randomUUID();

    // Create tee snapshot if teeSetId provided
    if (input.teeSetId) {
      await createEventTeeSnapshot(eventId, input.teeSetId);
    }

    return {
      id: eventId,
      name: input.name,
      date: input.date,
      visibility: input.visibility,
      isLocked: false,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('events')
    .insert({
      name: input.name,
      date: input.date,
      visibility: input.visibility,
      is_locked: false,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  const event = mapEventFromDb(data);

  // Create tee snapshot if teeSetId provided
  if (input.teeSetId) {
    try {
      await createEventTeeSnapshot(event.id, input.teeSetId);
    } catch (snapshotError) {
      // Log but don't fail event creation
      console.error('[events] Failed to create tee snapshot:', snapshotError);
    }
  }

  return event;
}

/**
 * Get a single event by ID
 */
export async function getEvent(eventId: string): Promise<Event | null> {
  if (isMockMode || eventId.startsWith('demo-')) {
    return eventId.startsWith('demo-') ? { ...mockEvent, id: eventId } : null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return mapEventFromDb(data);
}

/**
 * Get all events for the current user
 */
export async function getUserEvents(userId: string): Promise<Event[]> {
  if (isMockMode) {
    // In mock mode, return the demo event
    return [mockEvent];
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Get events where user is a member
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      *,
      event_memberships!inner(user_id)
    `
    )
    .eq('event_memberships.user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapEventFromDb);
}

/**
 * Update an existing event
 */
export async function updateEvent(
  eventId: string,
  input: UpdateEventInput
): Promise<Event> {
  if (isMockMode || eventId.startsWith('demo-')) {
    // In mock mode or demo events, create tee snapshot if provided
    if (input.teeSetId) {
      try {
        await createEventTeeSnapshot(eventId, input.teeSetId);
      } catch (snapshotError) {
        console.error('[events] Failed to create tee snapshot in mock mode:', snapshotError);
      }
    }
    // Return updated mock event
    return {
      ...mockEvent,
      id: eventId,
      ...input,
      updatedAt: new Date().toISOString(),
    };
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.date !== undefined) updates.date = input.date;
  if (input.visibility !== undefined) updates.visibility = input.visibility;

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;

  // Update tee snapshot if teeSetId provided
  if (input.teeSetId) {
    try {
      // Delete existing snapshot first
      await supabase
        .from('event_tee_snapshots')
        .delete()
        .eq('event_id', eventId);

      // Create new snapshot
      await createEventTeeSnapshot(eventId, input.teeSetId);
    } catch (snapshotError) {
      console.error('[events] Failed to update tee snapshot:', snapshotError);
    }
  }

  return mapEventFromDb(data);
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  if (isMockMode || eventId.startsWith('demo-')) {
    // In mock mode or demo events, just pretend it worked
    return;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { error } = await supabase.from('events').delete().eq('id', eventId);

  if (error) throw error;
}

/**
 * Map database row to Event type
 */
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
