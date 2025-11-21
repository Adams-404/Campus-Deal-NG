-- Add response_message column to gig_applications table
ALTER TABLE public.gig_applications 
ADD COLUMN IF NOT EXISTS response_message TEXT;
