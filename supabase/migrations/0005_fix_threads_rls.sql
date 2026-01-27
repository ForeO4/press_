-- Fix: Add missing INSERT policy for event_threads
-- This policy was missing from 0002_rls.sql and blocks event creation
-- because event_threads are created during event initialization.

-- Only add if table exists and policy doesn't exist (safe to run multiple times)
DO $$
BEGIN
  -- Check if table exists first
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'event_threads'
  ) THEN
    -- Check if policy already exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'event_threads'
      AND policyname = 'threads_insert'
    ) THEN
      CREATE POLICY "threads_insert" ON event_threads
        FOR INSERT
        WITH CHECK (is_event_member(event_id, 'ADMIN'));
      RAISE NOTICE 'Created threads_insert policy';
    ELSE
      RAISE NOTICE 'threads_insert policy already exists';
    END IF;
  ELSE
    RAISE NOTICE 'event_threads table does not exist yet - skipping';
  END IF;
END $$;
