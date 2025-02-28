
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Loader2, 
  Camera, 
  Mail, 
  Calendar, 
  Shield, 
  Edit2, 
  AlertCircle, 
  Phone, 
  MapPin,
  BadgeCheck,
  Crown
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { PageTransition } from "@/components/PageTransition";
import EditProfileModal from "@/components/EditProfileModal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ImageCropModal from "@/components/ImageCropModal";

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
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const forceRefreshRole = async () => {
    try {
      // Force refresh the session
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError) throw sessionError;

      if (!session?.user) {
        navigate('/sign-in');
        return;
      }

      // Re-fetch roles after session refresh
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      console.log('Refreshed roles:', roles); // Debug log

      if (roleError) {
        console.error('Error checking role:', roleError);
        setUserRole('user');
      } else {
        const isAdmin = roles?.some(r => r.role === 'admin') ?? false;
        console.log('Is admin after refresh?', isAdmin); // Debug log
        setUserRole(isAdmin ? 'admin' : 'user');
      }
    } catch (error) {
      console.error('Error refreshing role:', error);
      toast.error('Error refreshing role status');
    }
  };

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Profile - Current user:', user); // Debug log

      if (!user) {
        navigate('/sign-in');
        return;
      }

      setUser(user);

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Profile data:', profileData); // Debug log
      console.log('Profile error:', profileError); // Debug log

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast.error('Error fetching profile');
        return;
      }

      // Check user role
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      console.log('User roles:', roles); // Debug log
      console.log('Role error:', roleError); // Debug log

      if (roleError) {
        console.error('Error checking role:', roleError);
        // Don't show error toast here, just set default role
        setUserRole('user');
      } else {
        const isAdmin = roles?.some(r => r.role === 'admin') ?? false;
        console.log('Is admin?', isAdmin); // Debug log
        setUserRole(isAdmin ? 'admin' : 'user');
      }

      setProfile(profileData);

      // Get latest KYC document
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!kycError && kycData) {
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

      if (!itemsError && itemsData) {
        const formattedItems = itemsData.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          status: item.status,
          images: item.item_images?.map((img: any) => img.image_url) || []
        }));
        setUserItems(formattedItems);
      }
    } catch (error) {
      console.error('Error in getProfile:', error);
      toast.error('An error occurred while fetching profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

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

  async function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    setSelectedImage(event.target.files[0]);
    setShowCropModal(true);
  }

  async function handleCroppedImage(croppedBlob: Blob) {
    try {
      setUploading(true);

      const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
      const fileExt = 'jpg';
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
            <BadgeCheck className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing
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
            <Shield className="w-3 h-3 mr-1" />
            Pending Verification
          </Badge>
        );
    }
  };

  const getVerificationButtonText = () => {
    switch (profile?.kyc_status) {
      case 'verified':
        return null; // No button for verified users
      case 'processing':
        return (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verification Processing
          </>
        );
      case 'rejected':
        return (
          <>
            <Shield className="w-4 h-4 mr-2" />
            Resubmit Verification
          </>
        );
      default:
        return (
          <>
            <Shield className="w-4 h-4 mr-2" />
            Complete Verification
          </>
        );
    }
  };

  const shouldShowVerificationButton = () => {
    return profile?.kyc_status !== 'verified';
  };

  const getVerificationButtonClasses = () => {
    switch (profile?.kyc_status) {
      case 'processing':
        return "bg-orange-500/10 hover:bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-orange-500/5";
      case 'rejected':
        return "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 shadow-red-500/5";
      default:
        return "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 shadow-yellow-500/5";
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
                onChange={handleImageSelect}
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
            <p className="text-muted-foreground">
              Member since {formatDate(user?.created_at)}
            </p>
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                {getKycStatusBadge()}
                <Badge 
                  variant="outline" 
                  className={cn(
                    "capitalize transition-all duration-200",
                    userRole === 'admin' 
                      ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
                      : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
                  )}
                  onClick={forceRefreshRole}
                  style={{ cursor: 'pointer' }}
                >
                  <Crown className="w-3 h-3 mr-1" />
                  {userRole}
                </Badge>
              </div>
              {userRole === 'admin' && (
                <Button
                  variant="outline"
                  className="bg-gradient-to-r from-blue-500/20 via-green-500/20 to-blue-500/20 hover:from-blue-500/30 hover:via-green-500/30 hover:to-blue-500/30 text-blue-500 border-blue-500/20 transition-all duration-300 shadow-lg shadow-blue-500/5"
                  onClick={() => navigate('/admin')}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Go to Admin Dashboard
                </Button>
              )}
              {shouldShowVerificationButton() && (
                <Button 
                  className={cn(
                    "transition-all duration-300 shadow-lg",
                    getVerificationButtonClasses()
                  )}
                  onClick={() => setShowEditProfile(true)}
                  disabled={profile?.kyc_status === 'processing'}
                >
                  {getVerificationButtonText()}
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
                    {formatDate(profile?.created_at)}
                  </p>
                </div>
              </div>
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

        <ImageCropModal
          open={showCropModal}
          onClose={() => setShowCropModal(false)}
          imageFile={selectedImage}
          onCropComplete={handleCroppedImage}
        />
      </div>
    </PageTransition>
  );
};

export default Profile;
