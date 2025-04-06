-- Add hide_safety_tips column to profiles table
ALTER TABLE public.profiles
ADD COLUMN hide_safety_tips BOOLEAN DEFAULT FALSE;

-- Optional: Add a comment to the column for clarity
COMMENT ON COLUMN public.profiles.hide_safety_tips IS 'Indicates if the user wants to hide the safety tips dialog on app startup.';
