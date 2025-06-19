
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, QrCode, Users, CheckCircle, XCircle, ArrowLeft, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";

interface ReferralUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  kyc_status: string;
  created_at: string;
}

const InviteFriends = () => {
  const [referralCode, setReferralCode] = useState("");
  const [referredUsers, setReferredUsers] = useState<ReferralUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth/signin');
        return;
      }
      
      setUser(user);

      // Get user's referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }

      // Get referred users with better query
      const { data: referrals } = await supabase
        .from('referrals')
        .select(`
          referred_user_id,
          created_at,
          profiles!referred_user_id (
            id,
            first_name,
            last_name,
            kyc_status
          )
        `)
        .eq('referrer_id', user.id);

      if (referrals) {
        const referredUsersData = referrals.map(r => ({
          id: r.profiles?.id || '',
          first_name: r.profiles?.first_name || '',
          last_name: r.profiles?.last_name || '',
          email: '', // We'll mask this
          kyc_status: r.profiles?.kyc_status || 'pending',
          created_at: r.created_at
        }));

        setReferredUsers(referredUsersData);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied to clipboard!');
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied to clipboard!');
  };

  const shareReferralLink = async () => {
    const link = `${window.location.origin}/auth/signup?ref=${referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join GSU Market',
          text: 'Join me on GSU Market - the best place to buy and sell within our university community!',
          url: link,
        });
      } catch (error) {
        // User cancelled sharing, just copy to clipboard
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  const maskEmail = (email: string, index: number) => {
    return `user${index + 1}****@gsu.edu.ng`;
  };

  const getStatusIcon = (status: string) => {
    return status === 'verified' ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusText = (status: string) => {
    return status === 'verified' ? 'Verified' : 'Not Verified';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10 ml-0 lg:ml-[300px] transition-all duration-300">
          <div className="relative max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="w-10">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate(-1)}
                  className="text-primary"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
              <h1 className="text-lg font-semibold absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">Invite Friends</h1>
              <div className="w-10" />
            </div>
          </div>
        </div>
        <main className="w-full max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-300">
          <div className="pt-24 pb-32 space-y-4">
            <div className="h-4 bg-secondary rounded w-1/4" />
            <div className="h-32 bg-secondary rounded" />
          </div>
        </main>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/auth/signup?ref=${referralCode}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10 ml-0 lg:ml-[300px] transition-all duration-300">
        <div className="relative max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="w-10">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="text-primary"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <h1 className="text-lg font-semibold absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">Invite Friends</h1>
            <div className="w-10" />
          </div>
        </div>
      </div>

      <main className="w-full max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-300">
        <PageTransition>
          <div className="pt-24 pb-32 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Your Referral Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Referral Code</label>
                  <div className="flex gap-2">
                    <Input value={referralCode} readOnly className="font-mono" />
                    <Button variant="outline" size="icon" onClick={copyReferralCode}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Referral Link</label>
                  <div className="flex gap-2">
                    <Input value={referralLink} readOnly className="text-sm" />
                    <Button variant="outline" size="icon" onClick={copyReferralLink}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <QrCode className="w-4 h-4" />
                        QR Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>QR Code for Referral Link</DialogTitle>
                      </DialogHeader>
                      <div className="flex justify-center p-6">
                        <QRCodeSVG value={referralLink} size={200} />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Users can scan this QR code to sign up with your referral code
                      </p>
                    </DialogContent>
                  </Dialog>

                  <Button onClick={shareReferralLink} className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share Link
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Referrals ({referredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {referredUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No referrals yet. Share your code to start earning!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {referredUsers.map((user, index) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                            {user.first_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.first_name || 'Unknown'} {user.last_name || 'User'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {maskEmail('', index)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(user.kyc_status)}
                          <Badge variant={user.kyc_status === 'verified' ? 'default' : 'secondary'}>
                            {getStatusText(user.kyc_status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default InviteFriends;
