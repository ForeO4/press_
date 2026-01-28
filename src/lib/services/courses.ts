import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import { mockCourse, mockTeeSets } from '@/lib/mock/course';
import type {
  Course,
  TeeSet,
  TeeSetWithHoles,
  TeeSnapshot,
  HoleSnapshot,
  CreateCourseInput,
  CreateTeeSetInput,
  CourseSource,
} from '@/types';

/**
 * Get all courses
 */
export async function getCourses(): Promise<Course[]> {
  if (isMockMode) {
    return [{
      id: mockCourse.id,
      name: mockCourse.name,
      city: 'Pine Valley',
      state: 'NJ',
      source: 'manual' as CourseSource,
      verified: false,
    }];
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
      ? {
          id: mockCourse.id,
          name: mockCourse.name,
          city: 'Pine Valley',
          state: 'NJ',
          source: 'manual' as CourseSource,
          verified: false,
        }
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

  // Build snapshot data object
  const snapshotData = {
    course_name: course.name,
    tee_set_name: teeSet.name,
    rating: teeSet.rating,
    slope: teeSet.slope,
    holes: holesSnapshot,
  };

  // Insert the snapshot (using snapshot_data JSONB column)
  const { data, error } = await supabase
    .from('event_tee_snapshots')
    .insert({
      event_id: eventId,
      tee_set_id: teeSetId,
      snapshot_data: snapshotData,
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
  // Helper to create mock snapshot (only for demo/mock events)
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

  // Only use mock data for demo events or mock mode
  if (isMockMode || eventId.startsWith('demo-')) {
    return createMockSnapshot();
  }

  const supabase = createClient();
  if (!supabase) {
    console.warn('[courses] Supabase client not available');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('event_tee_snapshots')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error) {
      // No snapshot in DB - return null for real events
      if (error.code === 'PGRST116') {
        // Not found is expected - no snapshot yet
        return null;
      }
      console.warn('[courses] DB query error:', error.code, error.message);
      return null;
    }

    return mapTeeSnapshotFromDb(data);
  } catch (err) {
    console.warn('[courses] Unexpected error:', err);
    return null;
  }
}

/**
 * Map database row to Course type
 */
function mapCourseFromDb(row: Record<string, unknown>): Course {
  return {
    id: row.id as string,
    name: row.name as string,
    city: (row.city as string) || '',
    state: (row.state as string) || '',
    country: row.country as string | undefined,
    source: (row.source as CourseSource) || 'manual',
    verified: (row.verified as boolean) || false,
    createdBy: row.created_by as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
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
    color: row.color as string | undefined,
    rating: row.rating as number,
    slope: row.slope as number,
    par: row.par as number | undefined,
    yardage: row.yardage as number | undefined,
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
    color: row.color as string | undefined,
    rating: row.rating as number,
    slope: row.slope as number,
    par: row.par as number | undefined,
    yardage: row.yardage as number | undefined,
    holes: holes.map((h) => ({
      id: h.id as string,
      teeSetId: h.tee_set_id as string,
      number: h.hole_number as number,
      par: h.par as number,
      handicap: h.handicap as number,
      yardage: h.yards as number,
    })),
  };
}

/**
 * Map database row to TeeSnapshot type
 */
function mapTeeSnapshotFromDb(row: Record<string, unknown>): TeeSnapshot {
  // Data is stored in snapshot_data JSONB column
  const snapshotData = row.snapshot_data as Record<string, unknown> | undefined;

  return {
    id: row.id as string,
    eventId: row.event_id as string,
    teeSetId: row.tee_set_id as string | null,
    courseName: (snapshotData?.course_name as string) || '',
    teeSetName: (snapshotData?.tee_set_name as string) || '',
    rating: (snapshotData?.rating as number) || 0,
    slope: (snapshotData?.slope as number) || 0,
    holes: (snapshotData?.holes as HoleSnapshot[]) || [],
    createdAt: row.created_at as string,
  };
}

// ============================================
// COURSE CREATION & SEARCH
// ============================================

/**
 * Search courses by name or location
 * Returns courses matching the query, ordered by relevance
 */
export async function searchCourses(query: string): Promise<Course[]> {
  if (isMockMode || !query.trim()) {
    // In mock mode, filter mock course by query
    const mockCourseData: Course = {
      id: mockCourse.id,
      name: mockCourse.name,
      city: 'Pine Valley',
      state: 'NJ',
      source: 'manual' as CourseSource,
      verified: false,
    };

    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      if (
        mockCourseData.name.toLowerCase().includes(lowerQuery) ||
        mockCourseData.city.toLowerCase().includes(lowerQuery) ||
        mockCourseData.state.toLowerCase().includes(lowerQuery)
      ) {
        return [mockCourseData];
      }
      return [];
    }
    return [mockCourseData];
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  // Search by name, city, or state using ILIKE for case-insensitive matching
  const searchTerm = `%${query.trim()}%`;
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .or(`name.ilike.${searchTerm},city.ilike.${searchTerm},state.ilike.${searchTerm}`)
    .order('name')
    .limit(20);

  if (error) throw error;

  return (data || []).map(mapCourseFromDb);
}

/**
 * Create a new course
 * Returns the created course with its generated ID
 */
export async function createCourse(input: CreateCourseInput): Promise<Course> {
  if (isMockMode) {
    // In mock mode, return a fake created course
    const newCourse: Course = {
      id: crypto.randomUUID(),
      name: input.name,
      city: input.city || '',
      state: input.state || '',
      country: input.country || 'US',
      source: 'manual',
      verified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newCourse;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('courses')
    .insert({
      name: input.name,
      city: input.city || null,
      state: input.state || null,
      country: input.country || 'US',
      source: 'manual',
      verified: false,
    })
    .select()
    .single();

  if (error) throw error;

  return mapCourseFromDb(data);
}

/**
 * Create a new tee set for a course
 * Returns the created tee set with its generated ID
 */
export async function createTeeSet(input: CreateTeeSetInput): Promise<TeeSet> {
  if (isMockMode) {
    // In mock mode, return a fake created tee set
    const newTeeSet: TeeSet = {
      id: crypto.randomUUID(),
      courseId: input.courseId,
      name: input.name,
      color: input.color,
      rating: input.rating,
      slope: input.slope,
      par: input.par,
      yardage: input.yardage,
    };
    return newTeeSet;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('tee_sets')
    .insert({
      course_id: input.courseId,
      name: input.name,
      color: input.color || null,
      rating: input.rating,
      slope: input.slope,
      par: input.par || 72,
      yardage: input.yardage || null,
    })
    .select()
    .single();

  if (error) throw error;

  return mapTeeSetFromDb(data);
}

/**
 * Create a course with tee sets in a single transaction
 * Useful for the course entry form
 */
export async function createCourseWithTeeSets(
  courseInput: CreateCourseInput,
  teeSets: Omit<CreateTeeSetInput, 'courseId'>[]
): Promise<{ course: Course; teeSets: TeeSet[] }> {
  // Create the course first
  const course = await createCourse(courseInput);

  // Create all tee sets for this course
  const createdTeeSets: TeeSet[] = [];
  for (const teeSetInput of teeSets) {
    const teeSet = await createTeeSet({
      ...teeSetInput,
      courseId: course.id,
    });
    createdTeeSets.push(teeSet);
  }

  return { course, teeSets: createdTeeSets };
}

/**
 * Get course with its tee sets
 */
export async function getCourseWithTeeSets(
  courseId: string
): Promise<{ course: Course; teeSets: TeeSet[] } | null> {
  const course = await getCourse(courseId);
  if (!course) return null;

  const teeSets = await getCourseTeeSets(courseId);
  return { course, teeSets };
}
