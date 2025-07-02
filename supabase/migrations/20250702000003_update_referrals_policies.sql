-- Enable RLS on referrals table if not already enabled
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for admin users" ON public.referrals;
DROP POLICY IF EXISTS "Enable read access for referrers" ON public.referrals;

-- Create policy to allow admins to see all referrals
CREATE POLICY "Enable read access for admin users"
ON public.referrals
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
);

-- Create policy to allow users to see their own referrals
CREATE POLICY "Enable read access for referrers"
ON public.referrals
FOR SELECT
TO authenticated
USING (
  referrer_id = auth.uid()
);

-- Update the get_referrers_with_counts function to respect admin access
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
    -- Only show users who have made referrals
    p.id IN (SELECT DISTINCT referrer_id FROM referrals)
    -- Check if admin or viewing own data
    AND (
      is_admin(auth.uid())
      OR p.id = auth.uid()
    )
  GROUP BY 
    p.id, p.first_name, p.last_name, p.email
  ORDER BY 
    referral_count DESC;
$$;
