-- Press! Database Schema Enhancement
-- Migration: 0007_course_enhancements.sql
-- Add source tracking, verification, and enhanced course data

-- ============================================
-- COURSES: Add source tracking and metadata
-- ============================================

-- Add source tracking to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'
  CHECK (source IN ('manual', 'imported', 'ghin_api', 'verified'));
ALTER TABLE courses ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add par and yardage to tee_sets (total for the set)
ALTER TABLE tee_sets ADD COLUMN IF NOT EXISTS par INTEGER DEFAULT 72 CHECK (par >= 60 AND par <= 80);
ALTER TABLE tee_sets ADD COLUMN IF NOT EXISTS yardage INTEGER CHECK (yardage >= 3000 AND yardage <= 9000);
ALTER TABLE tee_sets ADD COLUMN IF NOT EXISTS color TEXT; -- "Blue", "White", "Red" etc.

-- ============================================
-- HANDICAP PROFILES: Enhanced tracking
-- ============================================

-- Add source tracking and home course to handicap profiles
ALTER TABLE handicap_profiles ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'
  CHECK (source IN ('manual', 'ghin_verified'));
ALTER TABLE handicap_profiles ADD COLUMN IF NOT EXISTS home_course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE handicap_profiles ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- ============================================
-- INDEXES: Course search optimization
-- ============================================

-- Index for course search by name
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses USING gin(to_tsvector('english', name));

-- Index for course search by location
CREATE INDEX IF NOT EXISTS idx_courses_state ON courses(state);
CREATE INDEX IF NOT EXISTS idx_courses_city ON courses(city);

-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_courses_source ON courses(source);
CREATE INDEX IF NOT EXISTS idx_courses_verified ON courses(verified);

-- ============================================
-- TRIGGERS: Updated timestamps
-- ============================================

CREATE TRIGGER courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS POLICIES: Course access
-- ============================================

-- Allow all authenticated users to view courses
DROP POLICY IF EXISTS "Courses are viewable by authenticated users" ON courses;
CREATE POLICY "Courses are viewable by authenticated users"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create courses
DROP POLICY IF EXISTS "Authenticated users can create courses" ON courses;
CREATE POLICY "Authenticated users can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow course creators to update their own courses (unless verified)
DROP POLICY IF EXISTS "Course creators can update unverified courses" ON courses;
CREATE POLICY "Course creators can update unverified courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() AND verified = false)
  WITH CHECK (created_by = auth.uid() AND verified = false);

-- Enable RLS on courses if not already enabled
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: Tee sets access
-- ============================================

-- Allow all authenticated users to view tee sets
DROP POLICY IF EXISTS "Tee sets are viewable by authenticated users" ON tee_sets;
CREATE POLICY "Tee sets are viewable by authenticated users"
  ON tee_sets FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create tee sets for courses they created
DROP POLICY IF EXISTS "Authenticated users can create tee sets" ON tee_sets;
CREATE POLICY "Authenticated users can create tee sets"
  ON tee_sets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND (courses.created_by = auth.uid() OR courses.verified = false)
    )
  );

-- Enable RLS on tee_sets if not already enabled
ALTER TABLE tee_sets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: Holes access
-- ============================================

-- Allow all authenticated users to view holes
DROP POLICY IF EXISTS "Holes are viewable by authenticated users" ON holes;
CREATE POLICY "Holes are viewable by authenticated users"
  ON holes FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create holes for tee sets they can modify
DROP POLICY IF EXISTS "Authenticated users can create holes" ON holes;
CREATE POLICY "Authenticated users can create holes"
  ON holes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tee_sets
      JOIN courses ON courses.id = tee_sets.course_id
      WHERE tee_sets.id = tee_set_id
      AND (courses.created_by = auth.uid() OR courses.verified = false)
    )
  );

-- Enable RLS on holes if not already enabled
ALTER TABLE holes ENABLE ROW LEVEL SECURITY;
