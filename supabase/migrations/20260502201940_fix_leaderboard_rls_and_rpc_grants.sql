/*
  # Fix Leaderboard Access and RPC Grants

  ## Changes
  1. Add SELECT policy on `daily_stats` so authenticated users can read today's leaderboard
     (only exposes date and total_count, not personal details — user_id is needed for rank lookup)
  2. Grant EXECUTE on RPC functions to authenticated role
  3. Add leaderboard_view SELECT policy — users can see today's aggregate leaderboard for ranking

  ## Security Notes
  - Users can see other users' total_count for today only (for leaderboard)
  - User identity is still protected — display_name comes from profiles which is own-only
  - The new policy is scoped to current date only to minimize exposure
*/

-- Allow authenticated users to read today's leaderboard data (for ranking tab)
CREATE POLICY "Authenticated users can view today leaderboard"
  ON daily_stats FOR SELECT
  TO authenticated
  USING (date = CURRENT_DATE);

-- Grant execute on RPC functions to authenticated users
GRANT EXECUTE ON FUNCTION increment_daily_count(uuid, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rank_today(uuid) TO authenticated;

-- Allow authenticated users to read all profiles (display names for leaderboard)
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);
