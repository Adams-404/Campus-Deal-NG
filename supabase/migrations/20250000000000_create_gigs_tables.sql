-- Campus Deal NG - Gigs Feature Database Schema
-- This migration creates all necessary tables and policies for the gigs feature

-- Create gigs table (similar structure to items table)
CREATE TABLE IF NOT EXISTS public.gigs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  location TEXT,
  duration TEXT,
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INTEGER DEFAULT 0 CHECK (reviews_count >= 0),
  tags TEXT[] DEFAULT '{}',
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create gig_images table (similar to item_images)
CREATE TABLE IF NOT EXISTS public.gig_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create gig_applications table (similar to saved_items for marketplace)
CREATE TABLE IF NOT EXISTS public.gig_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(gig_id, applicant_id) -- One application per user per gig
);

-- Create gig_reviews table
CREATE TABLE IF NOT EXISTS public.gig_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(gig_id, reviewer_id) -- One review per user per gig
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_gigs_user_id ON public.gigs(user_id);
CREATE INDEX IF NOT EXISTS idx_gigs_category ON public.gigs(category);
CREATE INDEX IF NOT EXISTS idx_gigs_status ON public.gigs(status);
CREATE INDEX IF NOT EXISTS idx_gigs_created_at ON public.gigs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gigs_is_active ON public.gigs(is_active);
CREATE INDEX IF NOT EXISTS idx_gig_images_gig_id ON public.gig_images(gig_id);
CREATE INDEX IF NOT EXISTS idx_gig_applications_gig_id ON public.gig_applications(gig_id);
CREATE INDEX IF NOT EXISTS idx_gig_applications_applicant_id ON public.gig_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_gig_reviews_gig_id ON public.gig_reviews(gig_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gigs table
-- Everyone can view active gigs
CREATE POLICY "Anyone can view active gigs" 
  ON public.gigs 
  FOR SELECT 
  USING (is_active = TRUE AND status != 'deleted');

-- Users can view their own gigs (including inactive/deleted)
CREATE POLICY "Users can view their own gigs" 
  ON public.gigs 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Authenticated users can create gigs
CREATE POLICY "Authenticated users can create gigs" 
  ON public.gigs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own gigs
CREATE POLICY "Users can update their own gigs" 
  ON public.gigs 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users and admins can delete their own gigs
CREATE POLICY "Users can delete their own gigs" 
  ON public.gigs 
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for gig_images table
-- Anyone can view gig images if the gig is visible
CREATE POLICY "Anyone can view gig images" 
  ON public.gig_images 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.gigs 
      WHERE gigs.id = gig_images.gig_id 
      AND (gigs.is_active = TRUE OR gigs.user_id = auth.uid())
    )
  );

-- Gig owners can insert images for their gigs
CREATE POLICY "Gig owners can insert images" 
  ON public.gig_images 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gigs 
      WHERE gigs.id = gig_images.gig_id 
      AND gigs.user_id = auth.uid()
    )
  );

-- Gig owners can delete images from their gigs
CREATE POLICY "Gig owners can delete images" 
  ON public.gig_images 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.gigs 
      WHERE gigs.id = gig_images.gig_id 
      AND gigs.user_id = auth.uid()
    )
  );

-- RLS Policies for gig_applications table
-- Users can view applications for their own gigs
CREATE POLICY "Gig owners can view applications" 
  ON public.gig_applications 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.gigs 
      WHERE gigs.id = gig_applications.gig_id 
      AND gigs.user_id = auth.uid()
    )
  );

-- Users can view their own applications
CREATE POLICY "Users can view their own applications" 
  ON public.gig_applications 
  FOR SELECT 
  USING (auth.uid() = applicant_id);

-- Authenticated users can create applications
CREATE POLICY "Authenticated users can apply to gigs" 
  ON public.gig_applications 
  FOR INSERT 
  WITH CHECK (auth.uid() = applicant_id);

-- Users can update their own applications (withdraw, etc.)
CREATE POLICY "Users can update their own applications" 
  ON public.gig_applications 
  FOR UPDATE 
  USING (auth.uid() = applicant_id)
  WITH CHECK (auth.uid() = applicant_id);

-- Gig owners can update application status
CREATE POLICY "Gig owners can update application status" 
  ON public.gig_applications 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.gigs 
      WHERE gigs.id = gig_applications.gig_id 
      AND gigs.user_id = auth.uid()
    )
  );

-- Users can delete their own applications
CREATE POLICY "Users can delete their own applications" 
  ON public.gig_applications 
  FOR DELETE 
  USING (auth.uid() = applicant_id);

-- RLS Policies for gig_reviews table
-- Anyone can view reviews
CREATE POLICY "Anyone can view gig reviews" 
  ON public.gig_reviews 
  FOR SELECT 
  USING (TRUE);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews" 
  ON public.gig_reviews 
  FOR INSERT 
  WITH CHECK (auth.uid() = reviewer_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" 
  ON public.gig_reviews 
  FOR UPDATE 
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" 
  ON public.gig_reviews 
  FOR DELETE 
  USING (auth.uid() = reviewer_id);

-- Function to update gig rating when a review is added/updated/deleted
CREATE OR REPLACE FUNCTION public.update_gig_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_rating NUMERIC;
  review_count INTEGER;
BEGIN
  -- Calculate new average rating and count for the gig
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO avg_rating, review_count
  FROM public.gig_reviews
  WHERE gig_id = COALESCE(NEW.gig_id, OLD.gig_id);
  
  -- Update the gig with new rating and count
  UPDATE public.gigs
  SET 
    rating = ROUND(avg_rating, 1),
    reviews_count = review_count,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.gig_id, OLD.gig_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers to update gig ratings
DROP TRIGGER IF EXISTS update_gig_rating_on_insert ON public.gig_reviews;
CREATE TRIGGER update_gig_rating_on_insert
  AFTER INSERT ON public.gig_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_gig_rating();

DROP TRIGGER IF EXISTS update_gig_rating_on_update ON public.gig_reviews;
CREATE TRIGGER update_gig_rating_on_update
  AFTER UPDATE ON public.gig_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_gig_rating();

DROP TRIGGER IF EXISTS update_gig_rating_on_delete ON public.gig_reviews;
CREATE TRIGGER update_gig_rating_on_delete
  AFTER DELETE ON public.gig_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_gig_rating();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_gigs ON public.gigs;
CREATE TRIGGER set_updated_at_gigs
  BEFORE UPDATE ON public.gigs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_gig_applications ON public.gig_applications;
CREATE TRIGGER set_updated_at_gig_applications
  BEFORE UPDATE ON public.gig_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_gig_reviews ON public.gig_reviews;
CREATE TRIGGER set_updated_at_gig_reviews
  BEFORE UPDATE ON public.gig_reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant necessary permissions
GRANT SELECT ON public.gigs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gigs TO authenticated;

GRANT SELECT ON public.gig_images TO anon, authenticated;
GRANT INSERT, DELETE ON public.gig_images TO authenticated;

GRANT SELECT ON public.gig_applications TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gig_applications TO authenticated;

GRANT SELECT ON public.gig_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gig_reviews TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.gigs IS 'Stores gig postings created by users offering services';
COMMENT ON TABLE public.gig_images IS 'Stores images associated with gigs (max 3 per gig)';
COMMENT ON TABLE public.gig_applications IS 'Stores applications from users interested in gigs';
COMMENT ON TABLE public.gig_reviews IS 'Stores reviews and ratings for completed gigs';
