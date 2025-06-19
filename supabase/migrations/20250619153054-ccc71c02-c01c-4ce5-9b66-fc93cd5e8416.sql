
-- Create referrals table to track all referral relationships
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id) -- Each user can only be referred once
);

-- Add referral_code column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN referral_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- Enable RLS on referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals table
CREATE POLICY "Users can view their own referrals" 
  ON public.referrals 
  FOR SELECT 
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert referrals" 
  ON public.referrals 
  FOR INSERT 
  WITH CHECK (auth.uid() = referred_user_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_id UUID, first_name TEXT DEFAULT NULL, last_name TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INT := 0;
BEGIN
  -- Create base code from name or fallback to 'user'
  IF first_name IS NOT NULL AND LENGTH(TRIM(first_name)) > 0 THEN
    base_code := 'gsu-' || LOWER(REGEXP_REPLACE(TRIM(first_name), '[^a-zA-Z0-9]', '', 'g'));
  ELSE
    base_code := 'gsu-user';
  END IF;
  
  -- Ensure the code is unique
  final_code := base_code;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || counter::TEXT;
  END LOOP;
  
  RETURN final_code;
END;
$$;

-- Function to handle referral code assignment for existing users
CREATE OR REPLACE FUNCTION public.assign_referral_codes()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Assign referral codes to users who don't have one
  FOR user_record IN 
    SELECT id, first_name, last_name 
    FROM public.profiles 
    WHERE referral_code IS NULL
  LOOP
    UPDATE public.profiles 
    SET referral_code = public.generate_referral_code(user_record.id, user_record.first_name, user_record.last_name)
    WHERE id = user_record.id;
  END LOOP;
END;
$$;

-- Assign referral codes to existing users
SELECT public.assign_referral_codes();

-- Create trigger to auto-assign referral code for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only assign if referral_code is null
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code(NEW.id, NEW.first_name, NEW.last_name);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user referral code assignment
DROP TRIGGER IF EXISTS on_profile_create_referral_code ON public.profiles;
CREATE TRIGGER on_profile_create_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_referral_code();

-- Function to process referral signup
CREATE OR REPLACE FUNCTION public.process_referral_signup(
  referred_user_id UUID,
  referral_code_input TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_record RECORD;
  result JSONB;
BEGIN
  -- Find the referrer by referral code
  SELECT id, first_name, last_name 
  INTO referrer_record
  FROM public.profiles 
  WHERE referral_code = referral_code_input;
  
  -- If referrer not found
  IF referrer_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;
  
  -- If user is trying to refer themselves
  IF referrer_record.id = referred_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot refer yourself');
  END IF;
  
  -- Check if user is already referred
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = referred_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already referred');
  END IF;
  
  -- Create the referral record
  INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code)
  VALUES (referrer_record.id, referred_user_id, referral_code_input);
  
  RETURN jsonb_build_object('success', true, 'referrer_name', referrer_record.first_name || ' ' || referrer_record.last_name);
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
