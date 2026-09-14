-- ============================================
-- Niko Rolović Gymnasium - Student Portal
-- Database Schema
-- ============================================
-- Snapshot of the live database as of 2026-09-10, including the security
-- changes in supabase/migrations/202609100001*–4*.
--
-- This file is the "create from scratch" reference. Incremental changes to an
-- existing database belong in supabase/migrations/ — add a file there and
-- mirror the result here.
--
-- Roles used by the portal: 'student', 'moderator', 'admin', 'creator'.
-- (The live role column only carries a NOT NULL check, not an allowlist —
-- see the note next to the profiles table.)

-- ============================================
-- Tables
-- ============================================

-- Verified students (roster pre-loaded by admins; registration is matched
-- against it). Holds PII — service_role only, see the RLS section.
CREATE TABLE verified_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  class_number INT NOT NULL CHECK (class_number BETWEEN 1 AND 4),
  section_number INT NOT NULL CHECK (section_number BETWEEN 1 AND 6),
  email TEXT,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles.
-- NOTE: the live database only enforces `role IS NOT NULL` (a legacy row uses
-- a role outside the four documented ones). Tighten it to an allowlist once
-- that data is cleaned up.
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  class_number INT NOT NULL,
  section_number INT NOT NULL,
  role TEXT DEFAULT 'student' NOT NULL CHECK (role IS NOT NULL),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- News
CREATE TABLE news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- News likes
CREATE TABLE news_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID REFERENCES news(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(news_id, user_id)
);

-- Events / school calendar
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  event_type TEXT DEFAULT 'dogadjaj',
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lectures
CREATE TABLE lectures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  class_number INT NOT NULL CHECK (class_number BETWEEN 1 AND 4),
  video_url TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos (gallery with moderation)
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  anonymous BOOLEAN DEFAULT FALSE,
  moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photo likes
CREATE TABLE photo_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, user_id)
);

-- Photo hearts (multi-tap reaction counter)
CREATE TABLE photo_hearts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, user_id)
);

-- Teachers and their daily presence status
CREATE TABLE teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE teacher_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present',
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, date)
);

-- Mini-game leaderboard
CREATE TABLE game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Biology quiz results (standalone leaderboard, not wired into the portal UI)
CREATE TABLE bio_rezultati (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ime TEXT NOT NULL,
  test_id TEXT NOT NULL,
  test_naziv TEXT NOT NULL,
  bodovi INT NOT NULL,
  max_bodovi INT NOT NULL,
  procenat INT NOT NULL,
  ocjena INT NOT NULL,
  uid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Moderation: user blocks and content reports
CREATE TABLE blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) NOT NULL,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('photo', 'news', 'profile', 'lecture', 'comment')),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trail (currently: role changes, written by the trigger below)
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shared rate limit counters (see supabase/migrations/20260910000400_rate_limits.sql)
CREATE TABLE rate_limits (
  bucket TEXT PRIMARY KEY,
  hits INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX rate_limits_expires_at_idx ON rate_limits (expires_at);

-- ============================================
-- Functions & triggers
-- ============================================

-- Records every role change in audit_log. SECURITY DEFINER because audit_log
-- has no INSERT policy; search_path is pinned and EXECUTE is revoked from the
-- API roles so it cannot be called as an RPC (triggers don't need EXECUTE).
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, details)
    VALUES (
      auth.uid(),
      'role_change',
      'profiles',
      NEW.id::text,
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.log_role_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_role_audit
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_role_change();

-- Fixed-window rate limiter shared by every serverless instance.
-- SECURITY INVOKER: only service_role may execute it, and service_role
-- bypasses RLS anyway.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key             TEXT,
  p_max             INT,
  p_window_seconds  INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_reset_at     TIMESTAMPTZ;
  v_bucket       TEXT;
  v_hits         INT;
BEGIN
  IF p_max < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'consume_rate_limit: p_max and p_window_seconds must be >= 1';
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch FROM clock_timestamp()) / p_window_seconds) * p_window_seconds
  );
  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);
  v_bucket   := p_key || '@' || extract(epoch FROM v_window_start)::BIGINT;

  INSERT INTO rate_limits AS rl (bucket, hits, expires_at)
  VALUES (v_bucket, 1, v_reset_at)
  ON CONFLICT (bucket) DO UPDATE SET hits = rl.hits + 1
  RETURNING rl.hits INTO v_hits;

  IF random() < 0.02 THEN
    DELETE FROM rate_limits WHERE expires_at < clock_timestamp() - INTERVAL '1 hour';
  END IF;

  RETURN jsonb_build_object(
    'allowed',  v_hits <= p_max,
    'hits',     v_hits,
    'limit',    p_max,
    'reset_at', v_reset_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, INT, INT) TO service_role;

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE verified_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_hearts ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE bio_rezultati ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Verified students: service_role only. Deliberately no policies, and the
-- API roles have no grants either — the roster is read and written solely by
-- server routes (/api/register, /api/complete-profile, /api/admin/students,
-- /api/kick-student, /api/telegram/webhook).
REVOKE ALL ON TABLE verified_students FROM anon, authenticated;

-- Rate limit counters: service_role only, same reasoning.
REVOKE ALL ON TABLE rate_limits FROM anon, authenticated;

-- Profiles: signed-in users read everyone, users edit their own row but may
-- not change their own role (profiles_update_safe pins it); admins/creators
-- may change any profile.
CREATE POLICY profiles_read ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY profiles_insert ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_safe ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid()));
CREATE POLICY admin_update_profiles ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'creator')));

-- News: signed-in users read, admins/moderators write
CREATE POLICY news_read ON news FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY news_insert ON news FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));
CREATE POLICY news_update ON news FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));
CREATE POLICY news_delete ON news FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator', 'creator')));

-- News likes
CREATE POLICY likes_read ON news_likes FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY likes_insert ON news_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY likes_delete ON news_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Events
CREATE POLICY events_read ON events FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY events_insert ON events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'creator')));
CREATE POLICY events_update ON events FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'creator')));
CREATE POLICY events_delete ON events FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'creator')));

-- Lectures
CREATE POLICY lectures_read ON lectures FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY lectures_insert ON lectures FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'creator')));
CREATE POLICY lectures_update ON lectures FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'creator')));
CREATE POLICY lectures_delete ON lectures FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'creator')));

-- Photos: approved ones (plus your own, plus everything for staff)
CREATE POLICY photos_read ON photos FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      status = 'approved'
      OR user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
    )
  );
CREATE POLICY photos_insert ON photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY photos_update ON photos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));
CREATE POLICY photos_delete ON photos FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator', 'creator')));

-- Photo reactions
CREATE POLICY "Anyone can read photo likes" ON photo_likes FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert likes" ON photo_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON photo_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read hearts" ON photo_hearts FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own hearts" ON photo_hearts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own hearts" ON photo_hearts FOR UPDATE
  USING (auth.uid() = user_id);

-- Teachers / presence board
CREATE POLICY "Anyone can read teachers" ON teachers FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage teachers" ON teachers FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'creator', 'moderator')));

CREATE POLICY "Anyone can read statuses" ON teacher_statuses FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Mods can manage statuses" ON teacher_statuses FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'creator', 'moderator')));
CREATE POLICY "Mods can update statuses" ON teacher_statuses FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'creator', 'moderator')));

-- Game leaderboard
CREATE POLICY "Anyone can read scores" ON game_scores FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own score" ON game_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own score" ON game_scores FOR UPDATE
  USING (auth.uid() = user_id);

-- Biology quiz leaderboard. NOTE: this one is intentionally open to anon
-- (it is used by a standalone quiz page outside this portal). It only stores
-- a first name and a score; revisit if that changes.
CREATE POLICY bio_select_all ON bio_rezultati FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY bio_insert_valid ON bio_rezultati FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(ime) BETWEEN 1 AND 24
    AND char_length(test_id) BETWEEN 1 AND 60
    AND char_length(test_naziv) BETWEEN 1 AND 80
    AND bodovi >= 0 AND max_bodovi > 0 AND bodovi <= max_bodovi
    AND procenat BETWEEN 0 AND 100
    AND ocjena BETWEEN 1 AND 5
  );

-- Blocks & reports
CREATE POLICY "Users manage own blocks" ON blocked_users FOR ALL
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can create reports" ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can read own reports" ON reports FOR SELECT
  USING (auth.uid() = reporter_id);
CREATE POLICY "Admins read all reports" ON reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'creator')));
CREATE POLICY "Admins update reports" ON reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'creator')));

-- Audit log: admins read; rows are written only by log_role_change()
CREATE POLICY "Only admins read audit log" ON audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'creator')));

-- ============================================
-- Storage
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Authenticated users upload photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
