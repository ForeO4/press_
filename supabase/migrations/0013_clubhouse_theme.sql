-- Add theme column to events table for clubhouse customization
-- Theme options: dark (default), light, masters, links, ryder

ALTER TABLE events ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';

-- Add constraint to validate theme values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_theme_check'
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_theme_check
      CHECK (theme IN ('dark', 'light', 'masters', 'links', 'ryder'));
  END IF;
END $$;

-- Create index for theme queries (optional, for analytics)
CREATE INDEX IF NOT EXISTS idx_events_theme ON events(theme);

COMMENT ON COLUMN events.theme IS 'Visual theme for the clubhouse UI';
