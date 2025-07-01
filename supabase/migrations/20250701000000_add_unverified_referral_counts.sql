
-- Update the get_leaderboard function to include both verified and unverified counts
CREATE OR REPLACE FUNCTION public.get_leaderboard()
 RETURNS TABLE(user_id uuid, name text, referral_count bigint, unverified_count bigint, is_current_user boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select 
    p.id as user_id,
    case 
      when p.first_name is not null and p.last_name is not null then p.first_name || ' ' || p.last_name
      when p.first_name is not null then p.first_name
      else 'Anonymous'
    end as name,
    count(case when au.email_confirmed_at IS NOT NULL then r.id end) as referral_count,
    count(case when au.email_confirmed_at IS NULL then r.id end) as unverified_count,
    p.id = auth.uid() as is_current_user
  from 
    profiles p
    join referrals r on p.id = r.referrer_id
    join auth.users au on r.referred_user_id = au.id
  group by 
    p.id, p.first_name, p.last_name
  having 
    count(r.id) > 0
  order by 
    count(case when au.email_confirmed_at IS NOT NULL then r.id end) desc
  limit 5;
$function$;
