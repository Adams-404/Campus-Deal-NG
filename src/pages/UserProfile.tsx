
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageTransition } from '@/components/PageTransition';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, ShieldCheck, Loader2, Calendar, Shield, MapPin, Phone, User } from 'lucide-react';
import { getKycStatusBadgeProps, KycStatus } from '@/utils/kycUtils';

interface UserProfile {
  id: string;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  address: string | null;
  phone: string | null;
  kyc_status: KycStatus | null;
  created_at: string;
  updated_at: string | null;
}

interface Item {
  id: string;
  title: string;
  price: number;
  category: string;
  description: string | null;
  condition: string;
  status: string;
  images: string[];
  seller?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

interface ProductGridProps {
  items: Item[];
  title?: string;
}

const ProductGridWrapper: React.FC<ProductGridProps> = ({ items, title }) => {
  // This component just correctly passes the props to ProductGrid
  return (
    <div>
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <a 
            key={item.id} 
            href={`/item/${item.id}`}
            className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="aspect-square relative bg-muted">
              {item.images && item.images.length > 0 ? (
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium truncate">{item.title}</h3>
              <p className="text-primary font-semibold mt-1">₦{item.price}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!id) {
          setError("No user ID provided");
          navigate('/');
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        setIsCurrentUser(user?.id === id);
        
        // Fetch user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          if (profileError.code === 'PGRST116') {
            setError("User not found");
          } else {
            setError("Failed to load user profile");
          }
          return;
        }
        
        if (!profileData) {
          setError("User not found");
          return;
        }
        
        setProfile(profileData);
        
        // Fetch user's listings
        const { data: itemsData, error: itemsError } = await supabase
          .from('items')
          .select(`
            *,
            images:item_images(image_url)
          `)
          .eq('seller_id', id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
          
        if (itemsError) {
          console.error("Error fetching items:", itemsError);
          toast.error("Failed to load user's listings");
          return;
        }
        
        const formattedItems = itemsData.map((item: any) => ({
          ...item,
          images: item.images.map((img: any) => img.image_url)
        }));
        
        setUserItems(formattedItems);
      } catch (error: any) {
        console.error("Error fetching user data:", error);
        setError(error.message || "An error occurred while loading user data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;
    
    // Subscribe to real-time profile updates
    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${id}`
      }, (payload) => {
        setProfile(payload.new as UserProfile);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">User not found</h2>
          <p className="text-muted-foreground mb-4">{error || "The user profile you're looking for doesn't exist."}</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  const statusBadgeProps = getKycStatusBadgeProps(profile.kyc_status);

  return (
    <PageTransition>
      <div className="container max-w-4xl mx-auto px-4 py-8 pb-32">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-3xl">
                  {profile.first_name?.[0] || ''}{profile.last_name?.[0] || ''}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <CardTitle className="text-2xl">
                    {profile.first_name} {profile.last_name}
                  </CardTitle>
                  
                  <Badge 
                    variant={statusBadgeProps.variant} 
                    className={statusBadgeProps.className}
                  >
                    {statusBadgeProps.icon}
                    {statusBadgeProps.label}
                  </Badge>
                </div>
                
                <CardDescription>
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                </CardDescription>
                
                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                  {profile.address && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{profile.address}</span>
                    </div>
                  )}
                  
                  {profile.phone && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {isCurrentUser && (
                <div className="flex-shrink-0">
                  <Button variant="outline" onClick={() => navigate('/profile')}>
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>
        
        <Tabs defaultValue="listings">
          <TabsList className="mb-6">
            <TabsTrigger value="listings">Listings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="listings">
            {userItems.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <User className="h-12 w-12 mx-auto opacity-20 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Listings Yet</h3>
                  <p className="text-muted-foreground">
                    {isCurrentUser 
                      ? "You haven't listed any items for sale yet."
                      : "This user hasn't listed any items for sale yet."}
                  </p>
                  
                  {isCurrentUser && (
                    <Button 
                      variant="default"
                      className="mt-4"
                      onClick={() => document.getElementById('sell-button')?.click()}
                    >
                      Create Your First Listing
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <ProductGridWrapper items={userItems} title={`${profile.first_name}'s Listings`} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default UserProfile;
