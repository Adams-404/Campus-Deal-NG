-- First drop the existing function
DROP FUNCTION IF EXISTS public.get_leaderboard();

-- Then create the new function with updated return type
CREATE FUNCTION public.get_leaderboard()
RETURNS TABLE(
  user_id uuid, 
  name text, 
  referral_count bigint, 
  total_count bigint,
  is_current_user boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
  WITH referral_counts AS (
    SELECT 
      r.referrer_id,
      COUNT(CASE WHEN u.email_confirmed_at IS NOT NULL THEN 1 END) as verified_count,
      COUNT(*) as total_count
    FROM 
      referrals r
      LEFT JOIN auth.users u ON r.referred_user_id = u.id
    GROUP BY 
      r.referrer_id
  )
  SELECT 
    p.id as user_id,
    COALESCE(p.first_name || ' ' || p.last_name, p.first_name, p.email, 'Anonymous') as name,
    COALESCE(rc.verified_count, 0) as referral_count,
    COALESCE(rc.total_count, 0) as total_count,
    p.id = auth.uid() as is_current_user
  FROM 
    profiles p
    LEFT JOIN referral_counts rc ON p.id = rc.referrer_id
  WHERE 
    rc.referrer_id IS NOT NULL
  ORDER BY 
    COALESCE(rc.verified_count, 0) DESC
  LIMIT 25;
$$;
