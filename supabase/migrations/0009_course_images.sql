-- Press! Database Schema Enhancement
-- Migration: 0009_course_images.sql
-- Add image URL columns to courses table for logos and scorecards

-- ============================================
-- COURSES: Add image URL columns
-- ============================================

-- Add logo URL column
ALTER TABLE courses ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add scorecard URL column
ALTER TABLE courses ADD COLUMN IF NOT EXISTS scorecard_url TEXT;

-- Add optional aerial map URL column
ALTER TABLE courses ADD COLUMN IF NOT EXISTS aerial_map_url TEXT;

-- ============================================
-- HOLES: Relax constraints for specialty courses
-- ============================================

-- Allow par 2 for putting courses (Punchbowl) and up to 19 holes (Shorty's)
-- Drop and recreate the check constraints
ALTER TABLE holes DROP CONSTRAINT IF EXISTS holes_par_check;
ALTER TABLE holes ADD CONSTRAINT holes_par_check CHECK (par >= 2 AND par <= 6);

ALTER TABLE holes DROP CONSTRAINT IF EXISTS holes_hole_number_check;
ALTER TABLE holes ADD CONSTRAINT holes_hole_number_check CHECK (hole_number >= 1 AND hole_number <= 19);

-- Update unique constraint to allow 19 holes
-- (The existing unique constraint on tee_set_id, hole_number doesn't need to change)

-- ============================================
-- TEE_SETS: Allow lower par totals for specialty courses
-- ============================================

-- Par 3 courses can have lower totals (e.g., Bandon Preserve par 39, Shorty's par 57)
-- Putting courses can have even lower (e.g., Punchbowl par 36)
ALTER TABLE tee_sets DROP CONSTRAINT IF EXISTS tee_sets_par_check;
ALTER TABLE tee_sets ADD CONSTRAINT tee_sets_par_check CHECK (par >= 30 AND par <= 80);

-- Allow shorter yardage for par 3 and putting courses
ALTER TABLE tee_sets DROP CONSTRAINT IF EXISTS tee_sets_yardage_check;
ALTER TABLE tee_sets ADD CONSTRAINT tee_sets_yardage_check CHECK (yardage IS NULL OR (yardage >= 500 AND yardage <= 9000));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN courses.logo_url IS 'URL to course logo image (PNG preferred)';
COMMENT ON COLUMN courses.scorecard_url IS 'URL to course scorecard image';
COMMENT ON COLUMN courses.aerial_map_url IS 'URL to aerial/satellite map of course layout';
