-- Create a function to get all referrers with their counts
CREATE OR REPLACE FUNCTION public.get_referrers_with_counts()
RETURNS TABLE (
  referrer_id uuid,
  first_name text,
  last_name text,
  email text,
  name text,
  referral_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT 
    p.id as referrer_id,
    p.first_name,
    p.last_name,
    p.email,
    COALESCE(p.first_name || ' ' || p.last_name, p.first_name, p.email, 'Unknown User') as name,
    COUNT(r.id) as referral_count
  FROM 
    profiles p
    LEFT JOIN referrals r ON p.id = r.referrer_id
  WHERE 
    p.id IN (SELECT DISTINCT referrer_id FROM referrals)
  GROUP BY 
    p.id, p.first_name, p.last_name, p.email
  ORDER BY 
    referral_count DESC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_referrers_with_counts() TO authenticated;
