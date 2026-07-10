/*
# Binder - Complete Initial Schema

## Overview
Creates the full database schema for Binder, a professional service marketplace for Cameroon.

## New Tables

### users
Extended user profile table linked to auth.users. Stores language preference, role flags,
avatar color, and soft-delete status.

### client_profiles
Client-specific profile: location, budget range, preferences, and profile completion score.

### provider_profiles
Provider-specific profile: skills, pricing, availability, experience, rating, contact info.

### service_requests
Client service requests with status lifecycle: open → in_progress → completed → archived.

### swipes
Records all swipe actions (left/right) by both clients and providers with fit score snapshots.

### matches
Represents interest/connections between clients and providers, with asymmetric status tracking.

### conversations
Chat threads linked to matches.

### messages
Individual chat messages with soft-delete support for both sender and all parties.

### reviews
Ratings (1-5) with comments, linked to matches.

### notifications
In-app notification system for matches, messages, reviews, and request responses.

### weights
User-specific FitScore algorithm weights per role, updated by feedback loop.

### user_priorities
Raw priority answers from onboarding questionnaire.

### sync_queue
Offline sync queue for queued create/update/delete actions when offline.

## Security
- RLS enabled on all tables
- Authenticated users can read/write their own data
- Special cross-user read policies for matching/messaging features
- Soft-delete pattern: is_deleted flag, no hard deletes
*/

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'en',
  has_client_profile boolean NOT NULL DEFAULT false,
  has_provider_profile boolean NOT NULL DEFAULT false,
  active_role text NOT NULL DEFAULT 'client' CHECK (active_role IN ('client', 'provider')),
  avatar_color text NOT NULL DEFAULT 'blue',
  is_dummy boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_delete_own" ON users;
CREATE POLICY "users_delete_own" ON users FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ============================================================
-- CLIENT PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS client_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location text NOT NULL DEFAULT '',
  quartier text NOT NULL DEFAULT '',
  budget_range text NOT NULL DEFAULT 'under_10k' CHECK (budget_range IN ('under_10k', '10k_30k', '30k_100k', 'above_100k')),
  budget_value integer NOT NULL DEFAULT 5000,
  description text NOT NULL DEFAULT '',
  preferences text[] NOT NULL DEFAULT '{}',
  profile_completion integer NOT NULL DEFAULT 0 CHECK (profile_completion >= 0 AND profile_completion <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_profiles_select" ON client_profiles;
CREATE POLICY "client_profiles_select" ON client_profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "client_profiles_insert" ON client_profiles;
CREATE POLICY "client_profiles_insert" ON client_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "client_profiles_update" ON client_profiles;
CREATE POLICY "client_profiles_update" ON client_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "client_profiles_delete" ON client_profiles;
CREATE POLICY "client_profiles_delete" ON client_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- PROVIDER PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location text NOT NULL DEFAULT '',
  quartier text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  price integer NOT NULL DEFAULT 0,
  availability text NOT NULL DEFAULT 'flexible' CHECK (availability IN ('immediate', 'this_week', 'flexible', 'busy')),
  experience integer NOT NULL DEFAULT 0,
  bio text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  profile_completion integer NOT NULL DEFAULT 0 CHECK (profile_completion >= 0 AND profile_completion <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_profiles_select" ON provider_profiles;
CREATE POLICY "provider_profiles_select" ON provider_profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "provider_profiles_insert" ON provider_profiles;
CREATE POLICY "provider_profiles_insert" ON provider_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "provider_profiles_update" ON provider_profiles;
CREATE POLICY "provider_profiles_update" ON provider_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "provider_profiles_delete" ON provider_profiles;
CREATE POLICY "provider_profiles_delete" ON provider_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- SERVICE REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  budget integer NOT NULL DEFAULT 0,
  urgency text NOT NULL DEFAULT 'flexible' CHECK (urgency IN ('urgent', 'this_week', 'flexible')),
  required_skills text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'archived')),
  accepted_provider_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_service_requests_client_id ON service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_requests_select" ON service_requests;
CREATE POLICY "service_requests_select" ON service_requests FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "service_requests_insert" ON service_requests;
CREATE POLICY "service_requests_insert" ON service_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "service_requests_update" ON service_requests;
CREATE POLICY "service_requests_update" ON service_requests FOR UPDATE
  TO authenticated USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "service_requests_delete" ON service_requests;
CREATE POLICY "service_requests_delete" ON service_requests FOR DELETE
  TO authenticated USING (auth.uid() = client_id);

-- ============================================================
-- SWIPES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL,
  target_type text NOT NULL DEFAULT 'user' CHECK (target_type IN ('user', 'request')),
  swiper_role text NOT NULL CHECK (swiper_role IN ('client', 'provider')),
  direction text NOT NULL CHECK (direction IN ('left', 'right')),
  fit_score integer NOT NULL DEFAULT 0,
  is_synced boolean NOT NULL DEFAULT false,
  is_undone boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_swipes_swiper_id ON swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_swipes_target_id ON swipes(target_id);

ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "swipes_select" ON swipes;
CREATE POLICY "swipes_select" ON swipes FOR SELECT
  TO authenticated USING (auth.uid() = swiper_id);

DROP POLICY IF EXISTS "swipes_insert" ON swipes;
CREATE POLICY "swipes_insert" ON swipes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = swiper_id);

DROP POLICY IF EXISTS "swipes_update" ON swipes;
CREATE POLICY "swipes_update" ON swipes FOR UPDATE
  TO authenticated USING (auth.uid() = swiper_id) WITH CHECK (auth.uid() = swiper_id);

DROP POLICY IF EXISTS "swipes_delete" ON swipes;
CREATE POLICY "swipes_delete" ON swipes FOR DELETE
  TO authenticated USING (auth.uid() = swiper_id);

-- ============================================================
-- MATCHES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id uuid REFERENCES service_requests(id) ON DELETE SET NULL,
  initiated_by text NOT NULL DEFAULT 'provider' CHECK (initiated_by IN ('client', 'provider', 'mutual')),
  client_fit_score integer NOT NULL DEFAULT 0,
  provider_fit_score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'provider_interested' CHECK (status IN ('provider_interested', 'client_interested', 'mutual', 'contacted', 'completed', 'archived')),
  contact_revealed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matches_client_id ON matches(client_id);
CREATE INDEX IF NOT EXISTS idx_matches_provider_id ON matches(provider_id);
CREATE INDEX IF NOT EXISTS idx_matches_request_id ON matches(request_id);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "matches_select" ON matches;
CREATE POLICY "matches_select" ON matches FOR SELECT
  TO authenticated USING (auth.uid() = client_id OR auth.uid() = provider_id);

DROP POLICY IF EXISTS "matches_insert" ON matches;
CREATE POLICY "matches_insert" ON matches FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = client_id OR auth.uid() = provider_id);

DROP POLICY IF EXISTS "matches_update" ON matches;
CREATE POLICY "matches_update" ON matches FOR UPDATE
  TO authenticated USING (auth.uid() = client_id OR auth.uid() = provider_id)
  WITH CHECK (auth.uid() = client_id OR auth.uid() = provider_id);

DROP POLICY IF EXISTS "matches_delete" ON matches;
CREATE POLICY "matches_delete" ON matches FOR DELETE
  TO authenticated USING (auth.uid() = client_id OR auth.uid() = provider_id);

-- ============================================================
-- CONVERSATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_match_id ON conversations(match_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select" ON conversations;
CREATE POLICY "conversations_select" ON conversations FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = conversations.match_id
      AND (m.client_id = auth.uid() OR m.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "conversations_insert" ON conversations;
CREATE POLICY "conversations_insert" ON conversations FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
      AND (m.client_id = auth.uid() OR m.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "conversations_update" ON conversations;
CREATE POLICY "conversations_update" ON conversations FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = conversations.match_id
      AND (m.client_id = auth.uid() OR m.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "conversations_delete" ON conversations;
CREATE POLICY "conversations_delete" ON conversations FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = conversations.match_id
      AND (m.client_id = auth.uid() OR m.provider_id = auth.uid())
    )
  );

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  is_synced boolean NOT NULL DEFAULT false,
  is_deleted_for_sender boolean NOT NULL DEFAULT false,
  is_deleted_for_everyone boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN matches m ON m.id = c.match_id
      WHERE c.id = messages.conversation_id
      AND (m.client_id = auth.uid() OR m.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN matches m ON m.id = c.match_id
      WHERE c.id = conversation_id
      AND (m.client_id = auth.uid() OR m.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_update" ON messages FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN matches m ON m.id = c.match_id
      WHERE c.id = messages.conversation_id
      AND (m.client_id = auth.uid() OR m.provider_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_delete" ON messages;
CREATE POLICY "messages_delete" ON messages FOR DELETE
  TO authenticated USING (auth.uid() = sender_id);

-- ============================================================
-- REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_match_id ON reviews(match_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select" ON reviews;
CREATE POLICY "reviews_select" ON reviews FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_insert" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "reviews_update" ON reviews;
CREATE POLICY "reviews_update" ON reviews FOR UPDATE
  TO authenticated USING (auth.uid() = reviewer_id) WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "reviews_delete" ON reviews;
CREATE POLICY "reviews_delete" ON reviews FOR DELETE
  TO authenticated USING (auth.uid() = reviewer_id);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('new_match', 'new_message', 'review_received', 'request_response')),
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- WEIGHTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('client', 'provider')),
  preferences numeric(5,4) NOT NULL DEFAULT 0.2,
  location numeric(5,4) NOT NULL DEFAULT 0.15,
  price numeric(5,4) NOT NULL DEFAULT 0.15,
  rating numeric(5,4) NOT NULL DEFAULT 0.15,
  availability numeric(5,4) NOT NULL DEFAULT 0.15,
  profile_completeness numeric(5,4) NOT NULL DEFAULT 0.1,
  experience numeric(5,4) NOT NULL DEFAULT 0.1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "weights_select" ON weights;
CREATE POLICY "weights_select" ON weights FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "weights_insert" ON weights;
CREATE POLICY "weights_insert" ON weights FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "weights_update" ON weights;
CREATE POLICY "weights_update" ON weights FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "weights_delete" ON weights;
CREATE POLICY "weights_delete" ON weights FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- USER PRIORITIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('client', 'provider')),
  location_priority text NOT NULL DEFAULT 'medium' CHECK (location_priority IN ('high', 'medium', 'low')),
  price_priority text NOT NULL DEFAULT 'medium' CHECK (price_priority IN ('high', 'medium', 'low')),
  rating_priority text NOT NULL DEFAULT 'medium' CHECK (rating_priority IN ('high', 'medium', 'low')),
  availability_priority text NOT NULL DEFAULT 'medium' CHECK (availability_priority IN ('high', 'medium', 'low')),
  experience_priority text NOT NULL DEFAULT 'medium' CHECK (experience_priority IN ('high', 'medium', 'low')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_priorities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_priorities_select" ON user_priorities;
CREATE POLICY "user_priorities_select" ON user_priorities FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_priorities_insert" ON user_priorities;
CREATE POLICY "user_priorities_insert" ON user_priorities FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_priorities_update" ON user_priorities;
CREATE POLICY "user_priorities_update" ON user_priorities FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_priorities_delete" ON user_priorities;
CREATE POLICY "user_priorities_delete" ON user_priorities FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- SYNC QUEUE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed')),
  retry_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  synced_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);

ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sync_queue_select" ON sync_queue;
CREATE POLICY "sync_queue_select" ON sync_queue FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sync_queue_insert" ON sync_queue;
CREATE POLICY "sync_queue_insert" ON sync_queue FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sync_queue_update" ON sync_queue;
CREATE POLICY "sync_queue_update" ON sync_queue FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sync_queue_delete" ON sync_queue;
CREATE POLICY "sync_queue_delete" ON sync_queue FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
