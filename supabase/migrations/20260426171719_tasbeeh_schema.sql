/*
  # Tasbeeh App Schema

  ## Tables
  - `profiles` - User profile data linked to auth.users
  - `daily_stats` - Per-user per-day dhikr counts
  - `dhikr_sessions` - Individual counting sessions
  - `app_analytics` - Anonymous usage events for app analytics

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Anonymous analytics allowed for basic tracking
*/

-- Profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text DEFAULT '',
  total_all_time integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  best_day_count integer DEFAULT 0,
  best_day_label text DEFAULT '',
  first_use_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Daily stats: one row per user per day
CREATE TABLE IF NOT EXISTS daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_count integer DEFAULT 0,
  completed_cycles integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily stats"
  ON daily_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily stats"
  ON daily_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily stats"
  ON daily_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- For ranking: allow users to see aggregate counts (not individual rows)
CREATE OR REPLACE VIEW public.leaderboard_stats AS
SELECT
  COUNT(DISTINCT user_id) as total_users,
  SUM(total_count) as total_dhikr_all_users,
  AVG(total_count) as avg_dhikr_per_day
FROM daily_stats
WHERE date = CURRENT_DATE;

-- App analytics: anonymous event tracking
CREATE TABLE IF NOT EXISTS app_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  properties jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert analytics"
  ON app_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anon can insert analytics"
  ON app_analytics FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Users can view own analytics"
  ON app_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_app_analytics_user ON app_analytics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_analytics_event ON app_analytics(event_type, created_at DESC);

-- Function to upsert daily stats
CREATE OR REPLACE FUNCTION increment_daily_count(
  p_user_id uuid,
  p_date date,
  p_increment integer DEFAULT 1
) RETURNS daily_stats AS $$
DECLARE
  result daily_stats;
BEGIN
  INSERT INTO daily_stats (user_id, date, total_count, updated_at)
  VALUES (p_user_id, p_date, p_increment, now())
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_count = daily_stats.total_count + p_increment,
    updated_at = now()
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's rank among all users today
CREATE OR REPLACE FUNCTION get_user_rank_today(p_user_id uuid)
RETURNS TABLE(user_rank bigint, total_users bigint, user_count integer, percentile numeric) AS $$
BEGIN
  RETURN QUERY
  WITH today_stats AS (
    SELECT user_id, total_count
    FROM daily_stats
    WHERE date = CURRENT_DATE
  ),
  ranked AS (
    SELECT user_id, total_count,
      RANK() OVER (ORDER BY total_count DESC) as rnk,
      COUNT(*) OVER () as total_cnt
    FROM today_stats
  )
  SELECT
    COALESCE((SELECT rnk FROM ranked WHERE user_id = p_user_id), (SELECT total_cnt + 1 FROM ranked LIMIT 1))::bigint,
    COALESCE((SELECT total_cnt FROM ranked LIMIT 1), 0)::bigint,
    COALESCE((SELECT total_count FROM ranked WHERE user_id = p_user_id), 0)::integer,
    CASE
      WHEN (SELECT total_cnt FROM ranked LIMIT 1) > 0
      THEN ROUND(100.0 * (SELECT rnk FROM ranked WHERE user_id = p_user_id) / (SELECT total_cnt FROM ranked LIMIT 1), 1)
      ELSE 100
    END::numeric;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
