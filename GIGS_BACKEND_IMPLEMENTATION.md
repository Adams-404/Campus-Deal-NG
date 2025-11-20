# Gigs Feature - Backend Implementation Guide

## Summary

I've analyzed the entire codebase including the marketplace implementation, messages system, and user profiles. I've created a comprehensive SQL schema that follows the same patterns used in your existing `items` table.

## SQL File Created

**Location**: `/home/adams-sudo/Projects/Campus-Deal-NG/supabase/migrations/20250000000000_create_gigs_tables.sql`

This file creates:

### 1. **Tables Created**

#### `gigs` table
- Similar structure to `items` table
- Fields: id, title, description, category, price, location, duration, rating, reviews_count, tags, user_id, is_active, status, created_at, updated_at
- Status can be: 'active', 'paused', 'completed', 'deleted'

#### `gig_images` table  
- Similar to `item_images` table
- Stores up to 3 images per gig
- Fields: id, gig_id, image_url, is_primary, created_at

#### `gig_applications` table
- Similar concept to `saved_items` for marketplace
- Stores applications from users
- Fields: id, gig_id, applicant_id, message, status, created_at, updated_at
- Status can be: 'pending', 'accepted', 'rejected', 'withdrawn'

#### `gig_reviews` table
- Stores reviews and ratings
- Fields: id, gig_id, reviewer_id, rating (1-5), comment, created_at
- One review per user per gig

### 2. **Row Level Security (RLS) Policies**

Following the same pattern as marketplace `items`:

**Gigs Table**:
- ✅ Anyone can view active gigs
- ✅ Users can view their own gigs (including inactive)
- ✅ Authenticated users can create gigs
- ✅ Users can update their own gigs
- ✅ **Users and ADMINS can delete gigs** (like marketplace items)

**Gig Images**:
- ✅ Anyone can view images if gig is visible
- ✅ Gig owners can insert/delete images

**Applications**:
- ✅ Gig owners can view all applications for their gigs
- ✅ Users can view their own applications
- ✅ Users can apply to gigs
- ✅ Users can update/withdraw their applications
- ✅ Gig owners can accept/reject applications

**Reviews**:
- ✅ Anyone can view reviews
- ✅ Users can create/edit/delete their own reviews

### 3. **Triggers & Functions**

- **Auto-update rating**: When reviews are added/updated/deleted, the gig's average rating and review count are automatically updated
- **Auto-update timestamps**: `updated_at` is automatically set on updates

### 4. **Indices for Performance**
- Indexed on: user_id, category, status, created_at, is_active
- Similar optimization to marketplace items

## Next Steps for Full Backend Implementation

### Step 1: Run the SQL
```bash
# Copy the SQL file content and paste it into Supabase SQL Editor
# Or run the migration file
```

### Step 2: Update TypeScript Types
After running the SQL, regenerate Supabase types:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

### Step 3: Features to Implement

#### A. **Contact Seller (Messages Integration)**
The messages system is already built. To integrate:

1. Update `handleContact` in `GigCard.tsx` and `GigDetails.tsx`
2. Create/find conversation when user clicks "Contact Seller"
3. Navigate to `/messages/:conversationId`
4. Similar to how marketplace items work with messages

**Code Pattern** (from marketplace):
```typescript
// Create conversation with gig_id reference
const { data: conversation } = await supabase
  .from('conversations')
  .insert({ buyer_id: currentUserId, seller_id: gig.user_id })
  .select()
  .single();

// Navigate to messages
navigate(`/messages/${conversation.id}`);
```

#### B. **User Profile Navigation**
Already implemented in codebase. Just add onClick:

```typescript
// In GigCard and GigDetails
onClick={() => navigate(`/user-profile/${gig.user_id}`)}
```

#### C. **Delete Gig Permission**
Already handled in SQL! Only:
- Gig owner
- Admin users
Can delete gigs (same as marketplace items)

#### D. **Remove Mock Data**
Once backend is ready:
1. Delete `/src/data/mockGigs.ts`
2. Replace all mock data imports with actual Supabase queries
3. Follow the pattern from `useItems.ts` hook in marketplace

## Key Patterns from Marketplace to Follow

### Fetching Gigs (similar to items)
```typescript
const { data, error } = await supabase
  .from('gigs')
  .select(`
    *,
    gig_images (image_url),
    profiles:user_id (
      id, first_name, last_name, avatar_url
    )
  `)
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

### Creating a Gig
```typescript
// 1. Insert gig
const { data: newGig } = await supabase
  .from('gigs')
  .insert({ title, description, category, price, user_id, ... })
  .select()
  .single();

// 2. Upload images to storage
const imageUrls = await uploadImagesToStorage(images);

// 3. Insert image records
await supabase
  .from('gig_images')
  .insert(imageUrls.map(url => ({ gig_id: newGig.id, image_url: url })));
```

### Admin Check (for delete permission)
```typescript
const { data: userRole } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', currentUserId)
  .single();

const isAdmin = userRole?.role === 'admin';
const canDelete = isAdmin || gig.user_id === currentUserId;
```

## Database Schema Comparison

| Feature | Marketplace (items) | Gigs |
|---------|-------------------|------|
| Main Table | `items` | `gigs` |
| Images Table | `item_images` | `gig_images` |
| Save/Apply | `saved_items` | `gig_applications` |
| Delete Permission | Owner or Admin | Owner or Admin |
| RLS Policies | ✅ | ✅ |
| Image Storage | Supabase Storage | Supabase Storage |
| Ratings | ❌ | ✅ (gig_reviews) |

## Important Notes

1. **Image Storage**: You'll need to upload images to Supabase Storage (like marketplace items) and store URLs in `gig_images` table

2. **Messages Integration**: The conversations table can be linked to gigs (similar to how it links to items with `item_id`)

3. **Admin Access**: Admins are identified via `user_roles` table with role='admin'

4. **Status Management**: 
   - 'active' = visible to all
   - 'paused' = owner can see, not public
   - 'completed' = gig finished
   - 'deleted' = soft delete

5. **Applications**: Unlike marketplace "saves", gig applications include a message and status workflow

## Testing Checklist

After implementing backend:
- [ ] Create a gig with images
- [ ] View gig details
- [ ] Edit own gig
- [ ] Delete own gig (as owner)
- [ ] Delete any gig (as admin)
- [ ] Contact seller (opens messages)
- [ ] Click user profile (navigates to profile)
- [ ] Apply to a gig
- [ ] Leave a review
- [ ] See rating update automatically

## Migration Steps

1. Run SQL in Supabase SQL Editor
2. Verify tables created in Supabase dashboard
3. Test RLS policies
4. Generate TypeScript types
5. Update frontend code to use real data
6. Remove all mock data
7. Test all features thoroughly
