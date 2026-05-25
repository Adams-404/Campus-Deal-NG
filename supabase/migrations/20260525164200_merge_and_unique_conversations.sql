-- MERGE & UNIQUE SYMMETRIC CONVERSATIONS MIGRATION
-- Enforces one Marketplace chat and one Gigs chat per user pair,
-- while migrating all messages from duplicates into the survivor threads.

DO $$
DECLARE
    r RECORD;
    survivor_id UUID;
BEGIN
    -- 1. Merge Marketplace conversations symmetrically (gig_id IS NULL)
    FOR r IN 
        SELECT LEAST(buyer_id, seller_id) as user1, GREATEST(buyer_id, seller_id) as user2, 
               array_agg(id ORDER BY created_at ASC) as conv_ids
        FROM conversations
        WHERE gig_id IS NULL
        GROUP BY LEAST(buyer_id, seller_id), GREATEST(buyer_id, seller_id)
        HAVING count(*) > 1
    LOOP
        survivor_id := r.conv_ids[1];
        
        -- Update messages of duplicate conversations to the survivor
        UPDATE messages 
        SET conversation_id = survivor_id 
        WHERE conversation_id = ANY(r.conv_ids[2:cardinality(r.conv_ids)]);
        
        -- Update conversation_items if any exist
        UPDATE conversation_items 
        SET conversation_id = survivor_id 
        WHERE conversation_id = ANY(r.conv_ids[2:cardinality(r.conv_ids)]);
        
        -- Delete duplicate conversations
        DELETE FROM conversations 
        WHERE id = ANY(r.conv_ids[2:cardinality(r.conv_ids)]);
    END LOOP;

    -- 2. Merge Gigs conversations symmetrically (gig_id IS NOT NULL)
    FOR r IN 
        SELECT LEAST(buyer_id, seller_id) as user1, GREATEST(buyer_id, seller_id) as user2, 
               array_agg(id ORDER BY created_at ASC) as conv_ids
        FROM conversations
        WHERE gig_id IS NOT NULL
        GROUP BY LEAST(buyer_id, seller_id), GREATEST(buyer_id, seller_id)
        HAVING count(*) > 1
    LOOP
        survivor_id := r.conv_ids[1];
        
        -- Update messages of duplicate conversations to the survivor
        UPDATE messages 
        SET conversation_id = survivor_id 
        WHERE conversation_id = ANY(r.conv_ids[2:cardinality(r.conv_ids)]);
        
        -- Delete duplicate conversations
        DELETE FROM conversations 
        WHERE id = ANY(r.conv_ids[2:cardinality(r.conv_ids)]);
    END LOOP;
END $$;

-- Enforce exactly one Marketplace conversation between any two users symmetrically
CREATE UNIQUE INDEX IF NOT EXISTS unique_marketplace_conversation_symmetric
ON conversations (LEAST(buyer_id, seller_id), GREATEST(buyer_id, seller_id))
WHERE (gig_id IS NULL);

-- Enforce exactly one Gigs conversation between any two users symmetrically
CREATE UNIQUE INDEX IF NOT EXISTS unique_gigs_conversation_symmetric
ON conversations (LEAST(buyer_id, seller_id), GREATEST(buyer_id, seller_id))
WHERE (gig_id IS NOT NULL);
