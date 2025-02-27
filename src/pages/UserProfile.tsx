import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, Shield, AlertCircle, Phone, MapPin, MessageCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  kyc_status: string | null;
}

interface UserItem {
  id: string;
  title: string;
  price: number;
  images: string[];
  status: string;
}

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [userItems, setUserItems] = useState<UserItem[]>([]);

  useEffect(() => {
    getProfile();
  }, [userId]);

  async function getProfile() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth/signin');
        return;
      }
      setCurrentUser(user);

      // If viewing own profile, redirect to profile page
      if (user.id === userId) {
        navigate('/profile');
        return;
      }

      // Get profile data and user role
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        throw roleError;
      }

      setProfile({
        ...profileData,
        role: roleData?.role || 'user'
      });

      // Get user's items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          id,
          title,
          price,
          status,
          item_images (
            image_url
          )
        `)
        .eq('seller_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      if (itemsData) {
        const formattedItems = itemsData.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          status: item.status,
          images: item.item_images?.map((img: any) => img.image_url) || []
        }));
        setUserItems(formattedItems);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  const startConversation = async (itemId: string) => {
    try {
      // Check if conversation already exists
      const { data: existingConv, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('item_id', itemId)
        .eq('buyer_id', currentUser.id)
        .eq('seller_id', userId)
        .single();

      if (convError && convError.code !== 'PGRST116') {
        throw convError;
      }

      if (existingConv) {
        navigate(`/messages/${existingConv.id}`);
        return;
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          item_id: itemId,
          buyer_id: currentUser.id,
          seller_id: userId
        })
        .select('id')
        .single();

      if (createError) throw createError;

      navigate(`/messages/${newConv.id}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getKycStatusBadge = () => {
    const status = profile?.kyc_status || 'pending';
    switch (status) {
      case 'verified':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
            <Shield className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending Verification
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="fixed inset-x-0 top-0 z-50 bg-background/20 backdrop-blur-sm after:absolute after:inset-x-0 after:bottom-0 after:h-[1px] after:bg-gradient-to-r after:from-border/0 after:via-border/20 after:to-border/0">
          <div className="container h-16 px-4">
            <div className="flex h-full items-center justify-center relative">
              <div className="absolute left-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="h-9 w-9 rounded-full border border-green-500/50 bg-green-500/10 hover:bg-green-500/20"
                >
                  <ArrowLeft className="h-5 w-5 text-green-500" />
                </Button>
              </div>
              <h1 className="text-xl font-semibold">User Profile</h1>
            </div>
          </div>
        </div>

        <div className="container max-w-2xl mx-auto px-4 py-6 pt-24">
          <div className="relative mb-8">
            <div className="h-32 bg-secondary/50 rounded-lg border border-blue-500/30 overflow-hidden">
              <svg
                className="absolute inset-0 h-full w-full opacity-60"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  <pattern
                    id="shapes"
                    x="0"
                    y="0"
                    width="25"
                    height="25"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="4" cy="4" r="2" fill="none" stroke="rgb(59, 130, 246)" strokeWidth="0.5" opacity="0.5" />
                    <circle cx="20" cy="18" r="1.5" fill="none" stroke="rgb(59, 130, 246)" strokeWidth="0.5" opacity="0.5" />
                    <rect x="15" y="2" width="4" height="4" fill="none" stroke="rgb(249, 115, 22)" strokeWidth="0.5" opacity="0.5" transform="rotate(45, 17, 4)" />
                    <rect x="2" y="15" width="3" height="3" fill="none" stroke="rgb(249, 115, 22)" strokeWidth="0.5" opacity="0.5" transform="rotate(30, 3.5, 16.5)" />
                    <path d="M 20 12 L 22 15 L 18 15 Z" fill="none" stroke="rgb(239, 68, 68)" strokeWidth="0.5" opacity="0.5" />
                    <path d="M 8 8 L 10 11 L 6 11 Z" fill="none" stroke="rgb(239, 68, 68)" strokeWidth="0.5" opacity="0.5" transform="rotate(180, 8, 9.5)" />
                    <path d="M 12 20 L 14 18 L 16 20 L 14 22 Z" fill="none" stroke="rgb(34, 197, 94)" strokeWidth="0.5" opacity="0.5" />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#shapes)" />
              </svg>
            </div>
            
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background ring-2 ring-blue-500/20">
                  <AvatarImage src={profile?.avatar_url} alt={`${profile?.first_name} ${profile?.last_name}`} />
                  <AvatarFallback className="bg-secondary">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          <div className="mt-20 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <p className="text-muted-foreground">Member since {new Date(profile?.created_at).toLocaleDateString()}</p>
              <div className="flex items-center justify-center gap-2">
                {getKycStatusBadge()}
                {profile?.role === 'admin' && (
                  <Badge 
                    variant="outline" 
                    className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3 h-3 mr-1"
                    >
                      <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7-7H4a2 2 0 0 0-2 2v4" />
                      <path d="M14 2v6h6" />
                      <path d="M8.5 12.5 5 16l3.5 3.5" />
                      <path d="M15.5 12.5 19 16l-3.5 3.5" />
                    </svg>
                    Admin
                  </Badge>
                )}
              </div>
            </div>

            <Card className="border-blue-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <CardContent className="p-6 space-y-4">
                {profile?.phone && (
                  <div className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg border border-green-500/20">
                    <Phone className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{profile.phone}</p>
                    </div>
                    <div className="flex-1 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
                        onClick={() => window.open(`tel:${profile.phone}`)}
                      >
                        Call
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
                        onClick={() => window.open(`https://wa.me/${profile.phone?.replace(/\+/g, '')}`)}
                      >
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                )}

                {profile?.address && (
                  <div className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg border border-red-500/20">
                    <MapPin className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{profile.address}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg border border-orange-500/20">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Joined</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(profile?.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(34,197,94,0.1)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Items for Sale</h3>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                      {userItems?.length || 0} items
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {userItems?.map((item) => (
                    <div 
                      key={item.id}
                      className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-white/10"
                    >
                      <img 
                        src={item.images[0]} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
                        <p className="text-sm font-medium text-white line-clamp-2">{item.title}</p>
                        <p className="text-sm text-green-300">₦{item.price}</p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                            onClick={() => navigate(`/item/${item.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            className="w-full bg-primary/80 hover:bg-primary backdrop-blur-sm"
                            onClick={() => startConversation(item.id)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
} 