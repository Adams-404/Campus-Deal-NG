import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, QrCode, Users, CheckCircle, XCircle, ArrowLeft, Share2, Trophy, Clock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";

interface ReferralUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  kyc_status: string;
  created_at: string;
}

interface LeaderboardUser {
  name: string;
  count: number;
}

interface ReferralData {
  referred_user_id: string;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    kyc_status: string;
  } | null;
}

const InviteFriends = () => {
  const [referralCode, setReferralCode] = useState("");
  const [referredUsers, setReferredUsers] = useState<ReferralUser[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  const fetchLeaderboard = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .rpc('get_leaderboard');
      
      if (error) throw error;
      
      if (data) {
        const formattedLeaderboard = data.map((item: any) => ({
          id: item.user_id,
          name: item.name,
          count: Number(item.referral_count) || 0,
          isCurrentUser: item.is_current_user
        }));
        setLeaderboard(formattedLeaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to refresh leaderboard');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReferralData();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('referrals_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'referrals'
      }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    // Initial fetch
    fetchLeaderboard();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  const fetchReferralData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/auth/signin');
        return;
      }
      
      setUser(currentUser);

      // Get user's profile and referral code
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code, first_name, last_name')
        .eq('id', currentUser.id)
        .single();

      if (profileError) throw profileError;
      
      // Set referral code if available
      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }
      
      // Fetch leaderboard using the refetch function
      await fetchLeaderboard();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }

      // Get referred users with their profiles
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          referred_user_id,
          created_at,
          profiles:referred_user_id (
            id,
            first_name,
            last_name,
            kyc_status,
            created_at
          )
        `)
        .eq('referrer_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      if (referrals && referrals.length > 0) {
        const referredUsersData = referrals
          .filter(r => r.profiles) // Filter out any null profiles
          .map((r, index) => {
            // Create a placeholder email based on available profile info
            let email: string;
            if (r.profiles?.first_name && r.profiles?.last_name) {
              email = `${r.profiles.first_name.toLowerCase()}.${r.profiles.last_name.charAt(0).toLowerCase()}@example.com`;
            } else if (r.profiles?.first_name) {
              email = `${r.profiles.first_name.toLowerCase()}@example.com`;
            } else if (r.profiles?.id) {
              email = `user_${r.profiles.id.substring(0, 6)}@example.com`;
            } else {
              email = `user${index + 1}@example.com`;
            }

            return {
              id: r.profiles?.id || `user-${index}`,
              first_name: r.profiles?.first_name || '',
              last_name: r.profiles?.last_name || '',
              email: email,
              kyc_status: r.profiles?.kyc_status || 'pending',
              created_at: r.created_at || r.profiles?.created_at || new Date().toISOString()
            };
          });


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
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/40 ml-0 lg:ml-[300px] transition-all duration-300 shadow-sm">
        <div className="relative max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="h-9 w-9 sm:h-10 sm:w-10 text-foreground/80 hover:bg-accent/50 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Go back</span>
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Invite Friends</h1>
            <div className="w-9 sm:w-10" />
          </div>
        </div>
      </div>

      <PageTransition>
        <main className="w-full max-w-2xl lg:max-w-4xl mx-auto px-3 sm:px-4 md:px-6 transition-all duration-300">
          <div className="pt-20 sm:pt-24 pb-28 sm:pb-32 space-y-6 sm:space-y-8">
            {/* Referral Code Card */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-foreground/90">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Your Referral Code
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Share your code with friends and earn rewards when they sign up
                </p>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-foreground/80">Referral Link</label>
                  <div className="relative w-full">
                    <Input 
                      value={referralLink} 
                      readOnly 
                      className="text-xs sm:text-sm font-mono bg-muted/50 border-border/50 hover:border-primary/50 transition-colors pr-10"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={copyReferralLink}
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent hover:text-foreground"
                    >
                      <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="sr-only">Copy link</span>
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-10 items-center gap-1.5 sm:gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors text-xs sm:text-sm"
                      >
                        <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">QR Code</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[90%] sm:max-w-md">
                      <DialogHeader className="space-y-1">
                        <DialogTitle className="text-lg sm:text-xl">Your Referral QR Code</DialogTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Share this code for quick sign-ups
                        </p>
                      </DialogHeader>
                      <div className="flex flex-col items-center py-2 sm:py-4">
                        <div className="p-3 sm:p-4 bg-white rounded-lg border border-border/50 mb-3 sm:mb-4">
                          <QRCodeSVG 
                            value={referralLink} 
                            size={typeof window !== 'undefined' && window.innerWidth > 640 ? 180 : 140}
                            level="H"
                            includeMargin={false}
                            className="rounded"
                          />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-xs">
                          Scan this QR code to sign up with your referral code
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    onClick={shareReferralLink} 
                    size="sm"
                    className="h-10 items-center gap-1.5 sm:gap-2 bg-primary/90 hover:bg-primary transition-colors text-xs sm:text-sm"
                  >
                    <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Share Link</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard Card */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      Top Referrers
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={fetchLeaderboard}
                      disabled={isRefreshing}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`${isRefreshing ? 'animate-spin' : ''}`}
                      >
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                      </svg>
                      <span className="sr-only">Refresh leaderboard</span>
                    </Button>
                  </div>
                  {leaderboard.length > 0 && (
                    <span className="text-[10px] sm:text-xs bg-primary/10 text-primary px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                      Updated now
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  See who's leading the referral program this month
                </p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                {leaderboard.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {leaderboard.map((item, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg transition-all ${
                          index === 0 ? 'bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-950/30 dark:to-amber-950/10 border border-amber-200/50 dark:border-amber-800/50' : 
                          'bg-muted/30 hover:bg-muted/50 border border-border/30 hover:border-border/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className={`relative w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 flex items-center justify-center ${
                            index === 0 ? 'text-amber-400' :
                            index === 1 ? 'text-gray-300' :
                            index === 2 ? 'text-amber-600' : 'text-muted-foreground/60'
                          }`}>
                            {index === 0 ? (
                              <>
                                <svg className="w-full h-full" viewBox="0 0 36 36" fill="currentColor">
                                  <path d="M18 3l4.5 9.3 10.1 1.5-7.3 7.1 1.7 10-9.1-4.8L8.9 31l1.7-10L3.4 13.8l10.1-1.5z" />
                                </svg>
                                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse" />
                              </>
                            ) : index === 1 ? (
                              <svg className="w-full h-full" viewBox="0 0 36 36" fill="currentColor">
                                <path d="M18 3l3.2 6.6 7.1 1-5.2 5.1 1.2 7.1-6.3-3.3-6.3 3.3 1.2-7.1-5.2-5.1 7.1-1z" />
                              </svg>
                            ) : index === 2 ? (
                              <svg className="w-full h-full" viewBox="0 0 36 36" fill="currentColor">
                                <path d="M18 5l2.4 4.9 5.4.8-3.9 3.8.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.9-3.8 5.4-.8z" />
                              </svg>
                            ) : (
                              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                'bg-gradient-to-br from-muted/70 to-muted/40 text-foreground/80'
                              }`}>
                                {index + 1}
                              </div>
                            )}
                            {index < 3 && (
                              <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                index === 0 ? 'bg-amber-500 text-white' :
                                index === 1 ? 'bg-gray-400 text-white' :
                                'bg-amber-700 text-white'
                              }`}>
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className={`font-medium truncate block ${
                              index === 0 ? 'text-amber-900 dark:text-amber-100' : 'text-foreground'
                            }`}>
                              {item.name || 'Anonymous'}
                            </span>
                            {item.isCurrentUser && (
                              <span className="text-[10px] text-muted-foreground">You</span>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`font-medium text-xs sm:text-sm whitespace-nowrap ${
                            index === 0 ? 'bg-amber-100/50 text-amber-900 border-amber-200/50 dark:bg-amber-900/30 dark:border-amber-800/50' :
                            'bg-background border-border/50'
                          }`}
                        >
                          {item.count} {item.count === 1 ? 'ref' : 'refs'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 sm:py-8 text-center">
                    <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2 sm:mb-3" />
                    <p className="text-muted-foreground text-sm sm:text-base">
                      No leaderboard data available yet
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
                      Be the first to refer a friend!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Your Referrals Card */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-foreground/90">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Your Referrals ({referredUsers.length})
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  People who have joined using your referral code
                </p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                {referredUsers.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {referredUsers.map((user, index) => (
                      <div 
                        key={user.id} 
                        className="flex items-center justify-between p-2.5 sm:p-3 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border/30 hover:border-border/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/5 rounded-full flex-shrink-0 flex items-center justify-center text-xs sm:text-sm font-medium text-primary">
                            {user.first_name?.charAt(0) || 'U'}
                            {user.last_name?.charAt(0) || ''}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate text-sm sm:text-base">
                              {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'User'}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={user.kyc_status === 'verified' ? 'default' : 'secondary'}
                          className="gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs whitespace-nowrap"
                        >
                          {user.kyc_status === 'verified' ? (
                            <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          ) : (
                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          )}
                          <span>{getStatusText(user.kyc_status)}</span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 sm:py-8 text-center">
                    <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2 sm:mb-3" />
                    <p className="text-muted-foreground text-sm sm:text-base">
                      No referrals yet
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
                      Share your referral link to invite friends!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </PageTransition>
    </div>
  );
};

export default InviteFriends;
