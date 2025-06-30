
-- Update the get_leaderboard function to only count referrals from verified users
CREATE OR REPLACE FUNCTION public.get_leaderboard()
 RETURNS TABLE(user_id uuid, name text, referral_count bigint, is_current_user boolean)
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
    count(r.id) as referral_count,
    p.id = auth.uid() as is_current_user
  from 
    profiles p
    join referrals r on p.id = r.referrer_id
    join profiles referred_p on r.referred_user_id = referred_p.id
    join auth.users u on referred_p.id = u.id
  where 
    u.email_confirmed_at IS NOT NULL  -- Only count users who have verified their email
  group by 
    p.id, p.first_name, p.last_name
  having 
    count(r.id) > 0
  order by 
    count(r.id) desc
  limit 5;
$function$;

-- Update the handle_new_user function to only process referrals for email-confirmed users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_first_name TEXT;
    v_last_name TEXT;
    v_full_name TEXT;
    v_referral_code TEXT;
    v_used_referral_code TEXT;
    v_referrer_id UUID;
    v_referrer_email TEXT;
    v_email_name TEXT;
BEGIN
    -- Initialize variables
    v_first_name := NULL;
    v_last_name := NULL;
    v_full_name := NULL;
    v_used_referral_code := NULL;
    
    -- Safely extract values with NULL checks
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        v_full_name := NEW.raw_user_meta_data->>'full_name';
        v_first_name := NEW.raw_user_meta_data->>'first_name';
        v_last_name := NEW.raw_user_meta_data->>'last_name';
        v_used_referral_code := NEW.raw_user_meta_data->>'referral_code';
    END IF;
    
    -- Debug: Log the extracted values
    RAISE NOTICE 'Processing new user: %', NEW.email;
    RAISE NOTICE 'Full name: %, First: %, Last: %, Referral Code: %', 
        v_full_name, v_first_name, v_last_name, v_used_referral_code;
    
    -- If we have full_name but not first_name/last_name, try to split it
    IF v_full_name IS NOT NULL THEN
        IF v_first_name IS NULL OR v_first_name = '' THEN
            v_first_name := TRIM(SPLIT_PART(v_full_name, ' ', 1));
            IF v_full_name ~ ' ' THEN
                v_last_name := TRIM(SUBSTRING(v_full_name FROM ' (.*)$'));
            END IF;
        END IF;
    END IF;
    
    -- If still no first name, try to get from email
    IF (v_first_name IS NULL OR v_first_name = '') AND POSITION('@' IN NEW.email) > 1 THEN
        v_email_name := SPLIT_PART(NEW.email, '@', 1);
        v_first_name := INITCAP(SPLIT_PART(v_email_name, '.', 1));
        v_first_name := TRIM(REGEXP_REPLACE(v_first_name, '[^a-zA-Z]', ' ', 'g'));
    END IF;

    -- Ensure we have at least a first name
    IF v_first_name IS NULL OR v_first_name = '' THEN
        v_first_name := 'User';
    END IF;

    -- Generate the user's own referral code - simplified to prevent errors
    BEGIN
        v_referral_code := 'gsu-' || LOWER(SUBSTRING(REPLACE(v_first_name, ' ', ''), 1, 10)) || 
                          CASE WHEN v_last_name IS NOT NULL AND v_last_name != '' 
                               THEN '-' || LOWER(SUBSTRING(REPLACE(v_last_name, ' ', ''), 1, 5))
                               ELSE '' 
                          END;
        
        -- Make it unique
        IF EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_referral_code) THEN
            v_referral_code := v_referral_code || '-' || SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 4);
        END IF;
        
        RAISE NOTICE 'Generated referral code: %', v_referral_code;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error generating referral code: %', SQLERRM;
        v_referral_code := 'gsu-user-' || SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8);
    END;

    -- Insert or update the profile - simplified to prevent errors
    BEGIN
        INSERT INTO public.profiles (
            id, 
            email, 
            first_name, 
            last_name, 
            referral_code,
            updated_at
        ) VALUES (
            NEW.id, 
            NEW.email, 
            NULLIF(v_first_name, ''),
            NULLIF(v_last_name, ''),
            v_referral_code,
            NOW()
        )
        ON CONFLICT (id) 
        DO UPDATE SET
            email = EXCLUDED.email,
            first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), profiles.first_name),
            last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), profiles.last_name),
            updated_at = NOW();
            
        RAISE NOTICE 'Successfully created/updated profile for %', NEW.email;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error creating/updating profile: %', SQLERRM;
        -- Continue execution even if profile update fails
    END;

    -- Only process referral if email is confirmed
    IF NEW.email_confirmed_at IS NOT NULL AND v_used_referral_code IS NOT NULL AND v_used_referral_code != '' THEN
        BEGIN
            -- Find the referrer's ID
            SELECT p.id, u.email INTO v_referrer_id, v_referrer_email
            FROM public.profiles p
            JOIN auth.users u ON p.id = u.id
            WHERE p.referral_code = v_used_referral_code
            LIMIT 1;

            -- If referrer found and it's not a self-referral
            IF v_referrer_id IS NOT NULL AND v_referrer_id != NEW.id THEN
                -- Insert the referral record
                INSERT INTO public.referrals (
                    id,
                    referrer_id,
                    referred_user_id,
                    referral_code,
                    created_at
                ) VALUES (
                    gen_random_uuid(),
                    v_referrer_id,
                    NEW.id,
                    v_used_referral_code,
                    NOW()
                )
                ON CONFLICT (referred_user_id) 
                DO NOTHING;

                RAISE NOTICE 'Successfully processed referral from % to %', v_referrer_email, NEW.email;
            ELSIF v_referrer_id = NEW.id THEN
                RAISE NOTICE 'Self-referral attempt by %', NEW.email;
            ELSE
                RAISE NOTICE 'Invalid referral code % used by %', v_used_referral_code, NEW.email;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error processing referral: %', SQLERRM;
            -- Continue execution even if referral processing fails
        END;
    ELSIF v_used_referral_code IS NOT NULL AND v_used_referral_code != '' THEN
        RAISE NOTICE 'Referral code % provided by % but email not confirmed yet', v_used_referral_code, NEW.email;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create a function to process referrals when email gets confirmed
CREATE OR REPLACE FUNCTION public.process_referral_on_email_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_used_referral_code TEXT;
    v_referrer_id UUID;
    v_referrer_email TEXT;
BEGIN
    -- Only process if email was just confirmed (changed from NULL to a timestamp)
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        -- Get referral code from user metadata
        IF NEW.raw_user_meta_data IS NOT NULL THEN
            v_used_referral_code := NEW.raw_user_meta_data->>'referral_code';
            
            IF v_used_referral_code IS NOT NULL AND v_used_referral_code != '' THEN
                -- Find the referrer
                SELECT p.id, u.email INTO v_referrer_id, v_referrer_email
                FROM public.profiles p
                JOIN auth.users u ON p.id = u.id
                WHERE p.referral_code = v_used_referral_code
                LIMIT 1;

                -- If referrer found and it's not a self-referral
                IF v_referrer_id IS NOT NULL AND v_referrer_id != NEW.id THEN
                    -- Check if referral doesn't already exist
                    IF NOT EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = NEW.id) THEN
                        -- Insert the referral record
                        INSERT INTO public.referrals (
                            id,
                            referrer_id,
                            referred_user_id,
                            referral_code,
                            created_at
                        ) VALUES (
                            gen_random_uuid(),
                            v_referrer_id,
                            NEW.id,
                            v_used_referral_code,
                            NOW()
                        );

                        RAISE NOTICE 'Processed referral after email confirmation: % referred %', v_referrer_email, NEW.email;
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for email confirmation
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.process_referral_on_email_confirmation();
