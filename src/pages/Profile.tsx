import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Loader2, Camera, Mail, Calendar, Shield, Edit2, AlertCircle, Phone, MapPin } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { PageTransition } from "@/components/PageTransition";
import EditProfileModal from "@/components/EditProfileModal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserItem {
  id: string;
  title: string;
  price: number;
  images: string[];
  status: string;
}

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [kycDocument, setKycDocument] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const navigate = useNavigate();

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/auth/signin');
        return;
      }

      setUser(user);

      // Get profile data and check role
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
      ]);

      if (profileResult.error) throw profileResult.error;
      setProfile(profileResult.data);

      // Set user role
      const isAdmin = rolesResult.data?.some(r => r.role === 'admin') ?? false;
      setUserRole(isAdmin ? 'admin' : 'user');

      // Get latest KYC document
      let { data: kycData, error: kycError } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!kycError) {
        setKycDocument(kycData);
      }

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
        .eq('seller_id', user.id)
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

  async function updateProfile(avatarUrl: string | null = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('No user logged in');

      const updates = {
        avatar_url: avatarUrl || profile?.avatar_url,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        phone: profile?.phone,
        address: profile?.address,
        updated_at: new Date().toISOString(),
      };

      let { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Profile updated!');
      getProfile();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await updateProfile(publicUrl);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  }

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
      <div className="container max-w-2xl mx-auto px-4 py-8 pb-32">
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
                  {/* Circles */}
                  <circle cx="4" cy="4" r="2" fill="none" stroke="rgb(59, 130, 246)" strokeWidth="0.5" opacity="0.5" />
                  <circle cx="20" cy="18" r="1.5" fill="none" stroke="rgb(59, 130, 246)" strokeWidth="0.5" opacity="0.5" />
                  
                  {/* Squares */}
                  <rect x="15" y="2" width="4" height="4" fill="none" stroke="rgb(249, 115, 22)" strokeWidth="0.5" opacity="0.5" transform="rotate(45, 17, 4)" />
                  <rect x="2" y="15" width="3" height="3" fill="none" stroke="rgb(249, 115, 22)" strokeWidth="0.5" opacity="0.5" transform="rotate(30, 3.5, 16.5)" />
                  
                  {/* Triangles */}
                  <path d="M 20 12 L 22 15 L 18 15 Z" fill="none" stroke="rgb(239, 68, 68)" strokeWidth="0.5" opacity="0.5" />
                  <path d="M 8 8 L 10 11 L 6 11 Z" fill="none" stroke="rgb(239, 68, 68)" strokeWidth="0.5" opacity="0.5" transform="rotate(180, 8, 9.5)" />
                  
                  {/* Hexagons */}
                  <path d="M 12 20 L 14 18 L 16 20 L 14 22 Z" fill="none" stroke="rgb(34, 197, 94)" strokeWidth="0.5" opacity="0.5" />
                  <path d="M 22 8 L 24 6 L 26 8 L 24 10 Z" fill="none" stroke="rgb(34, 197, 94)" strokeWidth="0.5" opacity="0.5" />
                  
                  {/* Stars */}
                  <path d="M 6 22 L 7 20 L 8 22 L 6 21 L 8 21 Z" fill="none" stroke="rgb(168, 85, 247)" strokeWidth="0.5" opacity="0.5" />
                  <path d="M 16 7 L 17 5 L 18 7 L 16 6 L 18 6 Z" fill="none" stroke="rgb(168, 85, 247)" strokeWidth="0.5" opacity="0.5" />
                  
                  {/* Plus signs */}
                  <path d="M 12 3 L 12 5 M 11 4 L 13 4" stroke="rgb(234, 179, 8)" strokeWidth="0.5" opacity="0.5" />
                  <path d="M 3 12 L 3 14 M 2 13 L 4 13" stroke="rgb(234, 179, 8)" strokeWidth="0.5" opacity="0.5" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#shapes)" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20" />
          </div>
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-background ring-2 ring-blue-500/20 transition-transform group-hover:scale-[1.02]">
                <AvatarImage src={profile?.avatar_url} alt={`${profile?.first_name} ${profile?.last_name}`} />
                <AvatarFallback className="bg-secondary">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                className="hidden"
              />
              <Button 
                onClick={() => document.getElementById('avatar')?.click()}
                size="icon" 
                className="absolute -bottom-2 -right-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-2 border-background shadow-lg transition-transform hover:scale-110"
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <span className="sr-only">Upload profile picture</span>
              </Button>
              <div className="absolute inset-0 rounded-full transition-colors group-hover:bg-black/10" />
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute top-4 right-4 bg-background/20 backdrop-blur-sm hover:bg-background/40 border border-white/10"
            onClick={() => setShowEditProfile(true)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-20 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <p className="text-muted-foreground">Member since {new Date(user?.created_at).toLocaleDateString()}</p>
            <div className="flex items-center justify-center gap-2">
              {getKycStatusBadge()}
              <Badge 
                variant="outline" 
                className={cn(
                  "capitalize",
                  userRole === 'admin' 
                    ? "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/20"
                    : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
                )}
              >
                <Shield className="w-3 h-3 mr-1" />
                {userRole}
              </Badge>
              {userRole === 'admin' && (
                <Button
                  variant="outline"
                  className="mt-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/20"
                  onClick={() => navigate('/admin')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Go to Admin Dashboard
                </Button>
              )}
            </div>
          </div>

          <Card className="border-blue-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg border border-blue-500/20">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              {profile?.phone && (
                <div className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg border border-green-500/20">
                  <Phone className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{profile.phone}</p>
                  </div>
                </div>
              )}

              {profile?.address && (
                <div className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg border border-red-500/20">
                  <MapPin className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
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

              {profile?.kyc_status !== 'verified' && (
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 hover:from-blue-500/30 hover:via-purple-500/30 hover:to-pink-500/30 text-foreground border border-white/10 backdrop-blur-sm"
                  onClick={() => setShowEditProfile(true)}
                >
                  <Shield className="w-4 h-4 mr-2 text-yellow-500" />
                  Complete Verification
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-green-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">My Listings</h3>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                    {userItems?.length || 0} items
                  </Badge>
                </div>
                <Button 
                  variant="ghost"
                  onClick={() => navigate('/my-listings')}
                  className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                >
                  View All
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {userItems?.slice(0, 4).map((item) => (
                  <div 
                    key={item.id}
                    className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-white/10 cursor-pointer"
                    onClick={() => navigate(`/item/${item.id}`)}
                  >
                    <img 
                      src={item.images[0]} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
                      <p className="text-sm font-medium text-white line-clamp-2">{item.title}</p>
                      <p className="text-sm text-green-300">₦{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <EditProfileModal 
          open={showEditProfile} 
          onClose={() => setShowEditProfile(false)}
          profile={profile}
          kycDocument={kycDocument}
          onSave={async (updatedProfile) => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({
                  ...updatedProfile,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)
                .select()
                .single();

              if (error) throw error;
              
              toast.success('Profile updated successfully!');
              getProfile();
              setShowEditProfile(false);
            } catch (error: any) {
              toast.error(error.message);
            }
          }}
        />
      </div>
    </PageTransition>
  );
};

export default Profile;
