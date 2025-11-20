-- Update RLS policies to allow admins to update and delete gigs

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update their own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can delete their own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Gig owners can insert images" ON public.gig_images;
DROP POLICY IF EXISTS "Gig owners can delete images" ON public.gig_images;

-- Create new UPDATE policy for gigs (allows owner OR admin)
CREATE POLICY "Users and admins can update gigs" 
  ON public.gigs 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create new DELETE policy for gigs (allows owner OR admin)
-- Note: This is for hard deletes, though the app uses soft deletes (updates)
CREATE POLICY "Users and admins can delete gigs" 
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

-- Update gig_images policies to allow admins to manage images
CREATE POLICY "Gig owners and admins can insert images" 
  ON public.gig_images 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gigs 
      WHERE gigs.id = gig_images.gig_id 
      AND (
        gigs.user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() 
          AND role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Gig owners and admins can delete images" 
  ON public.gig_images 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.gigs 
      WHERE gigs.id = gig_images.gig_id 
      AND (
        gigs.user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() 
          AND role = 'admin'
        )
      )
    )
  );
