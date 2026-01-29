-- Activity events table for event-driven timeline
-- Tracks significant events like birdies, presses, settlements, etc.

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Validate activity_type values
ALTER TABLE activity_events ADD CONSTRAINT activity_events_type_check
  CHECK (activity_type IN (
    'birdie', 'eagle', 'albatross', 'ace',
    'press', 'settlement', 'tee_time', 'round_start',
    'round_end', 'game_start', 'game_complete', 'player_joined'
  ));

-- Index for efficient timeline queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_activity_events_event_created
  ON activity_events(event_id, created_at DESC);

-- Index for user-specific activity queries
CREATE INDEX IF NOT EXISTS idx_activity_events_user
  ON activity_events(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- RLS policies: Members can view activity for events they belong to
CREATE POLICY "Members can view event activity" ON activity_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_memberships em
      WHERE em.event_id = activity_events.event_id
        AND em.user_id = auth.uid()
        AND em.status = 'ACTIVE'
    )
  );

-- Players and above can create activity
CREATE POLICY "Players can create activity" ON activity_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_memberships em
      WHERE em.event_id = activity_events.event_id
        AND em.user_id = auth.uid()
        AND em.status = 'ACTIVE'
        AND em.role IN ('OWNER', 'ADMIN', 'PLAYER')
    )
  );

COMMENT ON TABLE activity_events IS 'Event-driven activity timeline for clubhouse feed';
COMMENT ON COLUMN activity_events.activity_type IS 'Type of activity (birdie, press, etc.)';
COMMENT ON COLUMN activity_events.reference_type IS 'Type of referenced entity (game, round, etc.)';
COMMENT ON COLUMN activity_events.reference_id IS 'ID of referenced entity';
COMMENT ON COLUMN activity_events.metadata IS 'Additional activity-specific data (hole number, amount, etc.)';
