-- Press! Database Schema
-- Migration: 0001_init.sql
-- Core tables for events, games, scoring, and Alligator Teeth

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE: Events & Memberships
-- ============================================

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE', 'UNLISTED', 'PUBLIC')),
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event memberships
CREATE TABLE event_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'PLAYER', 'VIEWER')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'REMOVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

-- Event settings
CREATE TABLE event_settings (
  event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  press_rules JSONB NOT NULL DEFAULT '{}',
  default_teeth INTEGER NOT NULL DEFAULT 100,
  allow_self_press BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- COURSES: Course & Hole Data
-- ============================================

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tee sets
CREATE TABLE tee_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rating DECIMAL(4,1),
  slope INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Holes
CREATE TABLE holes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tee_set_id UUID NOT NULL REFERENCES tee_sets(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
  par INTEGER NOT NULL CHECK (par >= 3 AND par <= 6),
  handicap INTEGER CHECK (handicap >= 1 AND handicap <= 18),
  yards INTEGER,
  UNIQUE (tee_set_id, hole_number)
);

-- Event tee snapshot (frozen copy for event)
CREATE TABLE event_tee_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tee_set_id UUID REFERENCES tee_sets(id) ON DELETE SET NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- HANDICAPS: User Handicap Data
-- ============================================

-- Handicap profiles
CREATE TABLE handicap_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handicap_index DECIMAL(3,1),
  ghin_number TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Handicap snapshots (frozen for event)
CREATE TABLE handicap_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handicap_index DECIMAL(3,1) NOT NULL,
  course_handicap INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

-- ============================================
-- SCORING: Rounds & Hole Scores
-- ============================================

-- Rounds
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tee_set_id UUID REFERENCES tee_sets(id) ON DELETE SET NULL,
  round_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

-- Hole scores
CREATE TABLE hole_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
  strokes INTEGER NOT NULL CHECK (strokes >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (round_id, hole_number)
);

-- ============================================
-- GAMES: Games & Presses
-- ============================================

-- Games (includes presses via parent_game_id)
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match_play', 'nassau', 'skins')),
  stake_teeth_int INTEGER NOT NULL CHECK (stake_teeth_int >= 0),
  parent_game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  start_hole INTEGER NOT NULL DEFAULT 1 CHECK (start_hole >= 1 AND start_hole <= 18),
  end_hole INTEGER NOT NULL DEFAULT 18 CHECK (end_hole >= 1 AND end_hole <= 18),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'complete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_hole <= end_hole)
);

-- Game participants
CREATE TABLE game_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, user_id)
);

-- ============================================
-- SETTLEMENTS
-- ============================================

-- Settlements
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_int INTEGER NOT NULL CHECK (amount_int >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settlement snapshots
CREATE TABLE settlement_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data JSONB NOT NULL
);

-- ============================================
-- ALLIGATOR TEETH: Fun Currency Ledger
-- ============================================

-- Current balances (denormalized for performance)
CREATE TABLE teeth_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_int INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

-- Immutable transaction ledger (double-entry)
CREATE TABLE teeth_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta_int INTEGER NOT NULL,
  balance_int INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CALCUTTA: Auction Pools
-- ============================================

-- Calcutta pools
CREATE TABLE calcutta_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('individual', 'team')),
  payout_schema JSONB NOT NULL DEFAULT '{}',
  house_cut INTEGER NOT NULL DEFAULT 0 CHECK (house_cut >= 0 AND house_cut <= 100),
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'bidding', 'active', 'complete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Calcutta items (players/teams being auctioned)
CREATE TABLE calcutta_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES calcutta_pools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  position INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Calcutta bids
CREATE TABLE calcutta_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES calcutta_items(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_int INTEGER NOT NULL CHECK (amount_int >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Calcutta ownership splits
CREATE TABLE calcutta_ownership_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bid_id UUID NOT NULL REFERENCES calcutta_bids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Calcutta payouts
CREATE TABLE calcutta_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES calcutta_pools(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES calcutta_items(id) ON DELETE CASCADE,
  amount_int INTEGER NOT NULL CHECK (amount_int >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SOCIAL: Feed & Chat
-- ============================================

-- Event posts
CREATE TABLE event_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  media_ids UUID[] DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event comments
CREATE TABLE event_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES event_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event reactions
CREATE TABLE event_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES event_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id, type)
);

-- Event chat threads
CREATE TABLE event_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event messages
CREATE TABLE event_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES event_threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media objects
CREATE TABLE media_objects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('avatars', 'posts', 'chat', 'exports')),
  content_type TEXT NOT NULL,
  size_bytes INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SHARE & AUDIT
-- ============================================

-- Share links
CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Membership lookups
CREATE INDEX idx_memberships_event ON event_memberships(event_id);
CREATE INDEX idx_memberships_user ON event_memberships(user_id);

-- Game queries
CREATE INDEX idx_games_event ON games(event_id);
CREATE INDEX idx_games_parent ON games(parent_game_id);

-- Score lookups
CREATE INDEX idx_scores_round ON hole_scores(round_id);

-- Teeth queries
CREATE INDEX idx_teeth_ledger_event_user ON teeth_ledger(event_id, user_id);
CREATE INDEX idx_teeth_balances_event_user ON teeth_balances(event_id, user_id);

-- Feed queries
CREATE INDEX idx_posts_event ON event_posts(event_id);
CREATE INDEX idx_messages_thread ON event_messages(thread_id);

-- Audit queries
CREATE INDEX idx_audit_event ON audit_log(event_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);

-- ============================================
-- TRIGGERS: Updated timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER event_settings_updated_at BEFORE UPDATE ON event_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER hole_scores_updated_at BEFORE UPDATE ON hole_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER teeth_balances_updated_at BEFORE UPDATE ON teeth_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER handicap_profiles_updated_at BEFORE UPDATE ON handicap_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
