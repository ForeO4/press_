-- =============================================================================
-- Migration: 0004_profiles
-- Description: User profiles table extending auth.users
-- =============================================================================

-- User profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read any profile (needed for displaying names in events)
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can only update their own profile
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE
  USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger (reuse existing function if it exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    CREATE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for lookups
CREATE INDEX idx_profiles_display_name ON profiles(display_name);
