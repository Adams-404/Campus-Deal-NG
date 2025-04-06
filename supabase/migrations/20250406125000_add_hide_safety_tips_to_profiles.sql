
-- Add hide_safety_tips columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN hide_safety_tips BOOLEAN DEFAULT FALSE,
ADD COLUMN hide_sell_tips BOOLEAN DEFAULT FALSE,
ADD COLUMN hide_message_tips BOOLEAN DEFAULT FALSE;

-- Optional: Add comments to the columns for clarity
COMMENT ON COLUMN public.profiles.hide_safety_tips IS 'Indicates if the user wants to hide the safety tips dialog on app startup.';
COMMENT ON COLUMN public.profiles.hide_sell_tips IS 'Indicates if the user wants to hide the safety tips dialog when using sell feature.';
COMMENT ON COLUMN public.profiles.hide_message_tips IS 'Indicates if the user wants to hide the safety tips dialog when messaging sellers.';
