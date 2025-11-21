-- Add gig_id to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS gig_id UUID REFERENCES public.gigs(id) ON DELETE SET NULL;

-- Add gig_id to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS gig_id UUID REFERENCES public.gigs(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_conversations_gig_id ON public.conversations(gig_id);
CREATE INDEX IF NOT EXISTS idx_messages_gig_id ON public.messages(gig_id);
