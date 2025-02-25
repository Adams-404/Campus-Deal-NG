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

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [kycDocument, setKycDocument] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
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

      // Get profile data
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container max-w-2xl mx-auto px-4 py-8 pb-32">
        <div className="relative mb-8">
          <div className="h-32 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-lg border border-white/10" />
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-background ring-2 ring-blue-500/20">
                <AvatarImage src={profile?.avatar_url} alt={`${profile?.first_name} ${profile?.last_name}`} />
                <AvatarFallback className="bg-secondary">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <Label htmlFor="avatar" className="absolute bottom-0 right-0 cursor-pointer">
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                  className="hidden"
                />
                <Button size="icon" className="rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20">
                  <Camera className="h-4 w-4" />
                </Button>
              </Label>
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
            </div>
          </div>

          <Card className="border-white/10 bg-secondary/50 backdrop-blur-sm">
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
