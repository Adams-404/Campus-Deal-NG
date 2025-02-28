
// A simplified version to fix the build error
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SimpleUserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  kyc_status: 'pending' | 'processing' | 'verified' | 'rejected';
}

interface SimpleItem {
  id: string;
  title: string;
  price: number;
  images: string[];
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SimpleUserProfile | null>(null);
  const [items, setItems] = useState<SimpleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchUserProfile();
    }
  }, [id]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, kyc_status')
        .eq('id', id)
        .single();
      
      if (profileError) {
        throw profileError;
      }
      
      setProfile(profileData);
      
      // Get user items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          id,
          title,
          price,
          item_images (
            image_url
          )
        `)
        .eq('seller_id', id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (itemsError) {
        throw itemsError;
      }
      
      // Process items to extract images
      const processedItems: SimpleItem[] = (itemsData || []).map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        images: item.item_images?.map((img: any) => img.image_url) || []
      }));
      
      setItems(processedItems);
      
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">User not found</h1>
        <Button onClick={() => navigate('/home')}>Go Home</Button>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col items-center sm:items-start sm:flex-row gap-6">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-xl">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.first_name || 'User'} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {profile.first_name?.[0] || '?'}{profile.last_name?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col items-center sm:items-start">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {profile.first_name} {profile.last_name}
              </h1>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant={
                    profile.kyc_status === 'verified' 
                      ? 'outline' 
                      : profile.kyc_status === 'rejected' 
                      ? 'destructive' 
                      : profile.kyc_status === 'processing'
                      ? 'secondary'
                      : 'secondary'
                  }
                  className={
                    profile.kyc_status === 'verified' 
                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : profile.kyc_status === 'rejected'
                      ? 'bg-red-500/10 text-red-500 border-red-500/20'
                      : profile.kyc_status === 'processing'
                      ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                      : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }
                >
                  {profile.kyc_status === 'verified' ? 'Verified Seller' : 
                   profile.kyc_status === 'rejected' ? 'Unverified' : 
                   profile.kyc_status === 'processing' ? (
                     <span className="flex items-center">
                       <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                       Verification in Progress
                     </span>
                   ) : 'Verification Pending'}
                </Badge>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button 
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="border-primary/20 hover:bg-primary/10"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => {
                    // Start a conversation
                    navigate(`/messages?seller=${id}`);
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  Message Seller
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Listings by {profile.first_name}</h2>
            
            {items.length === 0 ? (
              <div className="text-center py-12 bg-secondary/20 rounded-lg border border-border">
                <p className="text-muted-foreground">This user doesn't have any active listings</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {items.map((item) => (
                  <div 
                    key={item.id}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-primary/20 transition-colors"
                    onClick={() => navigate(`/item/${item.id}`)}
                  >
                    {item.images.length > 0 ? (
                      <img 
                        src={item.images[0]} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">No image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
                      <p className="text-sm font-medium text-white line-clamp-2">{item.title}</p>
                      <p className="text-sm text-primary">₦{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
