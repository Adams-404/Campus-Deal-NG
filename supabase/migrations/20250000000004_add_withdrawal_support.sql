-- Add withdrawal_reason column to gig_applications table
ALTER TABLE public.gig_applications 
ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT;

-- Update the status check constraint to include 'withdrawn'
ALTER TABLE public.gig_applications
DROP CONSTRAINT IF EXISTS gig_applications_status_check;

ALTER TABLE public.gig_applications
ADD CONSTRAINT gig_applications_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn'));
