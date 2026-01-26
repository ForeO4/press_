import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import { mockCourse, mockTeeSets } from '@/lib/mock/course';
import type { Course, TeeSet, TeeSetWithHoles, TeeSnapshot, HoleSnapshot } from '@/types';

/**
 * Get all courses
 */
export async function getCourses(): Promise<Course[]> {
  if (isMockMode) {
    return [{ id: mockCourse.id, name: mockCourse.name, city: 'Pine Valley', state: 'NJ' }];
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('name');

  if (error) throw error;

  return (data || []).map(mapCourseFromDb);
}

/**
 * Get a course by ID
 */
export async function getCourse(courseId: string): Promise<Course | null> {
  if (isMockMode) {
    return courseId === mockCourse.id
      ? { id: mockCourse.id, name: mockCourse.name, city: 'Pine Valley', state: 'NJ' }
      : null;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapCourseFromDb(data);
}

/**
 * Get a tee set with all its holes
 */
export async function getTeeSetWithHoles(teeSetId: string): Promise<TeeSetWithHoles | null> {
  if (isMockMode) {
    const mockTee = mockTeeSets.find((t) => t.id === teeSetId);
    if (!mockTee) return null;

    return {
      id: mockTee.id,
      courseId: mockCourse.id,
      name: mockTee.name,
      rating: mockTee.rating,
      slope: mockTee.slope,
      holes: mockCourse.holes.map((hole, idx) => ({
        id: `hole-${teeSetId}-${hole.number}`,
        teeSetId: mockTee.id,
        number: hole.number,
        par: hole.par,
        handicap: mockTee.handicaps[idx],
        yardage: mockTee.yardages[idx],
      })),
    };
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('tee_sets')
    .select('*, holes(*)')
    .eq('id', teeSetId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapTeeSetWithHolesFromDb(data);
}

/**
 * Get all tee sets for a course
 */
export async function getCourseTeeSets(courseId: string): Promise<TeeSet[]> {
  if (isMockMode) {
    if (courseId !== mockCourse.id) return [];
    return mockTeeSets.map((t) => ({
      id: t.id,
      courseId: mockCourse.id,
      name: t.name,
      rating: t.rating,
      slope: t.slope,
    }));
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('tee_sets')
    .select('*')
    .eq('course_id', courseId)
    .order('rating', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapTeeSetFromDb);
}

/**
 * Create a tee snapshot for an event
 * This freezes the course/tee data at the time of event creation
 */
export async function createEventTeeSnapshot(
  eventId: string,
  teeSetId: string
): Promise<TeeSnapshot> {
  if (isMockMode) {
    // In mock mode, create a fake snapshot
    const mockTee = mockTeeSets.find((t) => t.id === teeSetId);
    if (!mockTee) {
      throw new Error(`Tee set not found: ${teeSetId}`);
    }

    return {
      id: crypto.randomUUID(),
      eventId,
      teeSetId,
      courseName: mockCourse.name,
      teeSetName: mockTee.name,
      rating: mockTee.rating,
      slope: mockTee.slope,
      holes: mockCourse.holes.map((hole, idx) => ({
        number: hole.number,
        par: hole.par,
        handicap: mockTee.handicaps[idx],
        yardage: mockTee.yardages[idx],
      })),
      createdAt: new Date().toISOString(),
    };
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Fetch the tee set with holes
  const teeSet = await getTeeSetWithHoles(teeSetId);
  if (!teeSet) {
    throw new Error(`Tee set not found: ${teeSetId}`);
  }

  // Fetch the course info
  const course = await getCourse(teeSet.courseId);
  if (!course) {
    throw new Error(`Course not found: ${teeSet.courseId}`);
  }

  // Build the holes snapshot
  const holesSnapshot: HoleSnapshot[] = teeSet.holes
    .sort((a, b) => a.number - b.number)
    .map((hole) => ({
      number: hole.number,
      par: hole.par,
      handicap: hole.handicap,
      yardage: hole.yardage,
    }));

  // Insert the snapshot
  const { data, error } = await supabase
    .from('event_tee_snapshots')
    .insert({
      event_id: eventId,
      tee_set_id: teeSetId,
      course_name: course.name,
      tee_set_name: teeSet.name,
      rating: teeSet.rating,
      slope: teeSet.slope,
      holes: holesSnapshot,
    })
    .select()
    .single();

  if (error) throw error;

  return mapTeeSnapshotFromDb(data);
}

/**
 * Get tee snapshot for an event (from event_tee_snapshots table)
 * Falls back to mock data if no snapshot exists in database
 */
export async function getEventTeeSnapshot(eventId: string): Promise<TeeSnapshot | null> {
  // Helper to create mock snapshot
  const createMockSnapshot = (): TeeSnapshot | null => {
    const mockTee = mockTeeSets.find((t) => t.id === 'tee-set-blue');
    if (!mockTee) return null;

    return {
      id: `snapshot-${eventId}`,
      eventId,
      teeSetId: mockTee.id,
      courseName: mockCourse.name,
      teeSetName: mockTee.name,
      rating: mockTee.rating,
      slope: mockTee.slope,
      holes: mockCourse.holes.map((hole, idx) => ({
        number: hole.number,
        par: hole.par,
        handicap: mockTee.handicaps[idx],
        yardage: mockTee.yardages[idx],
      })),
      createdAt: new Date().toISOString(),
    };
  };

  if (isMockMode) {
    return createMockSnapshot();
  }

  const supabase = createClient();
  if (!supabase) {
    console.warn('[courses] Supabase client not available, using mock data');
    return createMockSnapshot();
  }

  try {
    const { data, error } = await supabase
      .from('event_tee_snapshots')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error) {
      // No snapshot in DB or table doesn't exist - fall back to mock data
      console.warn('[courses] DB query error, using mock data:', error.code, error.message);
      return createMockSnapshot();
    }

    return mapTeeSnapshotFromDb(data);
  } catch (err) {
    console.warn('[courses] Unexpected error, using mock data:', err);
    return createMockSnapshot();
  }
}

/**
 * Map database row to Course type
 */
function mapCourseFromDb(row: Record<string, unknown>): Course {
  return {
    id: row.id as string,
    name: row.name as string,
    city: row.city as string,
    state: row.state as string,
  };
}

/**
 * Map database row to TeeSet type
 */
function mapTeeSetFromDb(row: Record<string, unknown>): TeeSet {
  return {
    id: row.id as string,
    courseId: row.course_id as string,
    name: row.name as string,
    rating: row.rating as number,
    slope: row.slope as number,
  };
}

/**
 * Map database row to TeeSetWithHoles type
 */
function mapTeeSetWithHolesFromDb(row: Record<string, unknown>): TeeSetWithHoles {
  const holes = (row.holes as Record<string, unknown>[]) || [];
  return {
    id: row.id as string,
    courseId: row.course_id as string,
    name: row.name as string,
    rating: row.rating as number,
    slope: row.slope as number,
    holes: holes.map((h) => ({
      id: h.id as string,
      teeSetId: h.tee_set_id as string,
      number: h.number as number,
      par: h.par as number,
      handicap: h.handicap as number,
      yardage: h.yardage as number,
    })),
  };
}

/**
 * Map database row to TeeSnapshot type
 */
function mapTeeSnapshotFromDb(row: Record<string, unknown>): TeeSnapshot {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    teeSetId: row.tee_set_id as string | null,
    courseName: row.course_name as string,
    teeSetName: row.tee_set_name as string,
    rating: row.rating as number,
    slope: row.slope as number,
    holes: row.holes as HoleSnapshot[],
    createdAt: row.created_at as string,
  };
}
