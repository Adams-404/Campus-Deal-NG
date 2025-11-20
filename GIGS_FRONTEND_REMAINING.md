# Gigs Frontend Implementation - Remaining Steps

## ✅ Already Completed:

1. **Database Schema** - SQL migration created and run
2. **Type Definitions** - Updated `/src/data/mockGigs.ts` with proper interfaces
3. **useGigs Hook** - Created `/src/hooks/useGigs.ts` with all helper functions
4. **Main Gigs Page** - Updated `/src/pages/Gigs.tsx` to use real data
5. **GigCard Component** - Updated with:
   - Contact Seller (opens messages)
   - User profile navigation (clickable avatar/name)
   - Real data structure support
6. **CreateGigModal** - Updated to use `createGig()` function

## 🔨 Files Still Need Updating:

### 1. **EditGigModal.tsx** (`/src/components/EditGigModal.tsx`)

Update imports at the top:
```tsx
// Change from:
import { mockGigs, Gig } from "@/data/mockGigs";

// To:
import { Gig } from "@/data/mockGigs";
import { updateGig, fetchGigById } from "@/hooks/useGigs";
import { supabase } from "@/integrations/supabase/client";
```

Update the `useEffect` that fetches gig data (around line 50-60):
```tsx
useEffect(() => {
  const loadGig = async () => {
    if (!gigId) return;
    
    const gigData = await fetchGigById(gigId);
    if (gigData) {
      setFormData({
        title: gigData.title,
        description: gigData.description || "",
        category: gigData.category,
        price: gigData.price.toString(),
        location: gigData.location || "",
        duration: gigData.duration || "",
        tags: gigData.tags || [],
      });
      
      // Load images from gig_images
      if (gigData.gig_images) {
        const imageUrls = gigData.gig_images.map(img => img.image_url);
        setImages(imageUrls);
      }
    }
  };
  
  if (isOpen) {
    loadGig();
  }
}, [gigId, isOpen]);
```

Update the `handleSubmit` function (around line 100):
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    if (!formData.title || !formData.description || !formData.category || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    await updateGig(gigId, {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      price: Number(formData.price),
      location: formData.location || undefined,
      duration: formData.duration || undefined,
      tags: formData.tags,
      images: images,
    });

    onGigUpdated?.();
    onClose();
    
    setFormData({
      title: "",
      description: "",
      category: "",
      price: "",
      location: "",
      duration: "",
      tags: []
    });
    setImages([]);
  } catch (error) {
    console.error('Error updating gig:', error);
  } finally {
    setIsSubmitting(false);
  }
};
```

### 2. **GigDetails.tsx** (`/src/pages/gigs/GigDetails.tsx`)

Update imports:
```tsx
import { fetchGigById, deleteGig, canDeleteGig } from "@/hooks/useGigs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
```

Replace the `useEffect` (around line 32-42):
```tsx
useEffect(() => {
  const loadGig = async () => {
    if (!id) return;
    
    setLoading(true);
    const gigData = await fetchGigById(id);
    setGig(gigData);
    setLoading(false);
  };
  
  loadGig();
}, [id]);
```

Update `handleContact` function:
```tsx
const handleContact = async () => {
  if (!gig) return;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Please sign in to contact the seller');
      navigate('/auth/signin');
      return;
    }

    if (user.id === gig.user_id) {
      toast.error('You cannot contact yourself');
      return;
    }

    // Check if conversation exists
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(buyer_id.eq.${user.id},seller_id.eq.${gig.user_id}),and(buyer_id.eq.${gig.user_id},seller_id.eq.${user.id})`)
      .limit(1)
      .single();

    if (existingConv) {
      navigate(`/messages/${existingConv.id}`);
      return;
    }

    // Create conversation
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        buyer_id: user.id,
        seller_id: gig.user_id,
        last_message: `Interested in: ${gig.title}`,
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    navigate(`/messages/${newConv.id}`);
    toast.success('Conversation started!');
  } catch (error: any) {
    console.error('Error:', error);
    toast.error('Failed to start conversation');
  }
};
```

Update `handleDelete` function to use real permissions:
```tsx
const handleDelete = async () => {
  if (!gig) return;
  
  const confirmed = window.confirm('Are you sure you want to delete this gig?');
  if (!confirmed) return;

  try {
    await deleteGig(gig.id);
    navigate('/gigs');
  } catch (error) {
    console.error('Error deleting gig:', error);
  }
};
```

Add check for delete button visibility:
```tsx
const [canDelete, setCanDelete] = useState(false);

useEffect(() => {
  const checkPermissions = async () => {
    if (gig) {
      const canDel = await canDeleteGig(gig.user_id);
      setCanDelete(canDel);
    }
  };
  checkPermissions();
}, [gig]);
```

Update Delete button conditional (find where Edit/Delete buttons are rendered):
```tsx
{canDelete && (
  <Button 
    variant="ghost" 
    size="icon"
    onClick={handleDelete}
  >
    <Trash2 className="h-5 w-5 text-destructive" />
  </Button>
)}
```

Update image carousel to use `gig_images`:
```tsx
{gig.gig_images && gig.gig_images.length > 0 && (
  <div className="space-y-3 mb-6">
    <div className="relative group">
      <img
        src={gig.gig_images[selectedImageIndex].image_url}
        alt={`${gig.title} - Image ${selectedImageIndex + 1}`}
        className="w-full h-64 md:h-80 object-cover rounded-lg"
      />
      
      {gig.gig_images.length > 1 && (
        // ... navigation arrows code stays the same
        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
          {selectedImageIndex + 1} / {gig.gig_images.length}
        </div>
      )}
    </div>
    
    {gig.gig_images.length > 1 && (
      <div className="grid grid-cols-3 gap-2">
        {gig.gig_images.map((image, index) => (
          <div
            key={index}
            className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
              selectedImageIndex === index ? 'ring-2 ring-primary' : 'hover:opacity-80'
            }`}
            onClick={() => setSelectedImageIndex(index)}
          >
            <img
              src={image.image_url}
              alt={`${gig.title} thumbnail ${index + 1}`}
              className="w-full h-24 object-cover"
            />
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

Update user info display (find seller info section):
```tsx
const getUserName = () => {
  if (!gig?.profiles) return 'Anonymous';
  const { first_name, last_name } = gig.profiles;
  if (first_name && last_name) return `${first_name} ${last_name}`;
  if (first_name) return first_name;
  return 'Anonymous';
};

// In the JSX:
<Avatar 
  className="h-16 w-16 cursor-pointer"
  onClick={() => navigate(`/user-profile/${gig.user_id}`)}
>
  <AvatarImage src={gig.profiles?.avatar_url || undefined} />
  <AvatarFallback>
    {getUserName().split(' ').map(n => n[0]).join('').toUpperCase()}
  </AvatarFallback>
</Avatar>
<div>
  <h3 
    className="font-semibold text-lg cursor-pointer hover:text-primary"
    onClick={() => navigate(`/user-profile/${gig.user_id}`)}
  >
    {getUserName()}
  </h3>
  // ... rest
</div>
```

### 3. **MyGigs.tsx** (`/src/pages/gigs/MyGigs.tsx`)

Update to use real database:
```tsx
import { useGigs } from "@/hooks/useGigs";
import { supabase } from "@/integrations/supabase/client";

const MyGigs = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const { gigs, loading, refetch } = useGigs({ userId: userId || undefined });
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        navigate('/auth/signin');
      }
    };
    getUser();
  }, []);

  // Rest of component uses `gigs` from hook
};
```

### 4. **Applications.tsx** (`/src/pages/gigs/Applications.tsx`)

Create a hook for applications first in `useGigs.ts`:
```tsx
export const useGigApplications = () => {
  const [applications, setApplications] = useState<GigApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('gig_applications')
        .select(`
          *,
          gigs (*,
            gig_images (image_url, is_primary),
            profiles:user_id (id, first_name, last_name, avatar_url)
          ),
          profiles:applicant_id (id, first_name, last_name, avatar_url)
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return { applications, loading, refetch: fetchApplications };
};
```

Then in Applications.tsx:
```tsx
import { useGigApplications } from "@/hooks/useGigs";

const Applications = () => {
  const { applications, loading, refetch } = useGigApplications();
  
  // Use applications from hook
};
```

## 🎯 Quick Implementation Checklist:

- [ ] Update `EditGigModal.tsx` imports and functions
- [ ] Update `GigDetails.tsx` with real data fetching
- [ ] Add `canDeleteGig` permission check to GigDetails
- [ ] Make user avatar/name clickable in GigDetails  
- [ ] Update Contact Seller to open messages in GigDetails
- [ ] Fix image carousel to use `gig_images` array
- [ ] Update `MyGigs.tsx` to use useGigs hook with userId filter
- [ ] Add `useGigApplications` hook to useGigs.ts
- [ ] Update `Applications.tsx` to use new hook

## 🧪 Testing After Implementation:

1. Create a new gig ✅
2. View gig details ✅
3. Edit own gig ⏳
4. Delete own gig (as owner) ⏳
5. Try to delete someone else's gig (should fail unless admin) ⏳
6. Click Contact Seller → should open messages ⏳
7. Click user avatar/name → should go to profile ⏳
8. View all images in carousel ⏳
9. View My Gigs page ⏳
10. View Applications page ⏳

## 📌 Important Notes:

- All DELETE operations are SOFT DELETES (status = 'deleted')
- Admin users can delete any gig
- Regular users can only delete their own gigs
- Images are stored in `gig_images` table, not inline
- User info comes from joined `profiles` table
- Conversations are created just like in marketplace

## 🚀 Next Features (After Basic CRUD Works):

1. Image upload to Supabase Storage (currently using base64)
2. Apply to gig functionality
3. Review system
4. Gig analytics
5. Search and filters
