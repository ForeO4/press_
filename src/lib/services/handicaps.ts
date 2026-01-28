import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import type { HandicapProfile, HandicapSnapshot } from '@/types';

// Mock handicap data for demo mode
const mockHandicapProfiles: Record<string, HandicapProfile> = {
  'user-1': {
    id: 'hp-1',
    userId: 'user-1',
    handicapIndex: 12.4,
    ghinNumber: '1234567',
    source: 'manual',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'user-2': {
    id: 'hp-2',
    userId: 'user-2',
    handicapIndex: 8.2,
    ghinNumber: '2345678',
    source: 'manual',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'user-3': {
    id: 'hp-3',
    userId: 'user-3',
    handicapIndex: 15.8,
    ghinNumber: null,
    source: 'manual',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  'user-4': {
    id: 'hp-4',
    userId: 'user-4',
    handicapIndex: 5.1,
    ghinNumber: '3456789',
    source: 'manual',
    updatedAt: '2024-01-01T00:00:00Z',
  },
};

// Mock handicap snapshots (stored per event+user)
const mockHandicapSnapshots: Map<string, HandicapSnapshot> = new Map();

/**
 * Check if we should use mock data
 */
function shouldUseMockData(eventId?: string): boolean {
  return isMockMode || (eventId?.startsWith('demo-') ?? false);
}

/**
 * Calculate course handicap using the World Handicap System formula
 * WHS Formula: Course Handicap = Handicap Index × (Slope / 113) + (Course Rating - Par)
 *
 * @param handicapIndex - Player's handicap index
 * @param slope - Course slope rating (55-155, standard 113)
 * @param courseRating - Course rating (optional, for full WHS calculation)
 * @param par - Course par (optional, typically 72)
 * @returns Calculated course handicap rounded to nearest integer
 */
export function calculateCourseHandicap(
  handicapIndex: number,
  slope: number,
  courseRating?: number,
  par?: number
): number {
  // Base calculation: Index × (Slope / 113)
  const baseHandicap = handicapIndex * (slope / 113);

  // Full WHS formula includes course rating adjustment
  if (courseRating !== undefined && par !== undefined) {
    return Math.round(baseHandicap + (courseRating - par));
  }

  // Simplified formula when course rating/par not available
  return Math.round(baseHandicap);
}

/**
 * Get a user's handicap profile
 */
export async function getHandicapProfile(userId: string): Promise<HandicapProfile | null> {
  if (isMockMode) {
    return mockHandicapProfiles[userId] ?? null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('handicap_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No row found
      return null;
    }
    throw error;
  }

  return mapHandicapProfileFromDb(data);
}

/**
 * Get handicap snapshot for a user in an event
 * Returns the frozen handicap value at the time the event started
 */
export async function getHandicapSnapshot(
  eventId: string,
  userId: string
): Promise<HandicapSnapshot | null> {
  if (shouldUseMockData(eventId)) {
    const key = `${eventId}-${userId}`;
    const snapshot = mockHandicapSnapshots.get(key);
    if (snapshot) return snapshot;

    // Auto-create snapshot from profile for demo events
    const profile = mockHandicapProfiles[userId];
    if (profile && profile.handicapIndex !== null) {
      // Use default slope of 113 for demo
      const snapshot: HandicapSnapshot = {
        id: `hs-${eventId}-${userId}`,
        eventId,
        userId,
        handicapIndex: profile.handicapIndex,
        courseHandicap: calculateCourseHandicap(profile.handicapIndex, 131), // Augusta slope
        createdAt: new Date().toISOString(),
      };
      mockHandicapSnapshots.set(key, snapshot);
      return snapshot;
    }

    return null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('handicap_snapshots')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No row found
      return null;
    }
    throw error;
  }

  return mapHandicapSnapshotFromDb(data);
}

/**
 * Create handicap snapshot for a user in an event
 * This freezes the handicap at the current value for the duration of the event
 */
export async function createHandicapSnapshot(
  eventId: string,
  userId: string,
  handicapIndex: number,
  courseHandicap: number | null
): Promise<HandicapSnapshot> {
  if (shouldUseMockData(eventId)) {
    const key = `${eventId}-${userId}`;
    const snapshot: HandicapSnapshot = {
      id: `hs-${eventId}-${userId}`,
      eventId,
      userId,
      handicapIndex,
      courseHandicap,
      createdAt: new Date().toISOString(),
    };
    mockHandicapSnapshots.set(key, snapshot);
    return snapshot;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('handicap_snapshots')
    .upsert({
      event_id: eventId,
      user_id: userId,
      handicap_index: handicapIndex,
      course_handicap: courseHandicap,
    })
    .select()
    .single();

  if (error) throw error;

  return mapHandicapSnapshotFromDb(data);
}

/**
 * Get all handicap snapshots for an event
 */
export async function getEventHandicapSnapshots(
  eventId: string
): Promise<HandicapSnapshot[]> {
  if (shouldUseMockData(eventId)) {
    const snapshots: HandicapSnapshot[] = [];
    mockHandicapSnapshots.forEach((snapshot) => {
      if (snapshot.eventId === eventId) {
        snapshots.push(snapshot);
      }
    });
    return snapshots;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('handicap_snapshots')
    .select('*')
    .eq('event_id', eventId);

  if (error) throw error;

  return (data || []).map(mapHandicapSnapshotFromDb);
}

/**
 * Map database row to HandicapProfile type
 */
function mapHandicapProfileFromDb(row: Record<string, unknown>): HandicapProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    handicapIndex: row.handicap_index as number | null,
    ghinNumber: row.ghin_number as string | null,
    source: (row.source as 'manual' | 'ghin_verified') || 'manual',
    homeCourseId: row.home_course_id as string | undefined,
    lastVerifiedAt: row.last_verified_at as string | undefined,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Map database row to HandicapSnapshot type
 */
function mapHandicapSnapshotFromDb(row: Record<string, unknown>): HandicapSnapshot {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    userId: row.user_id as string,
    handicapIndex: row.handicap_index as number,
    courseHandicap: row.course_handicap as number | null,
    createdAt: row.created_at as string,
  };
}
