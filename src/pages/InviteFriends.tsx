import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, QrCode, Users, CheckCircle, XCircle, ArrowLeft, Share2, Trophy, Clock, Sparkles, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

type KYCStatus = 'pending' | 'processing' | 'verified' | 'rejected';

interface ReferralUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  kyc_status: KYCStatus;
  created_at: string;
}

interface LeaderboardUser {
  id: string;
  name: string;
  count: number;
  unverified_count: number;
  total_count: number;
  isCurrentUser: boolean;
  avatar_url?: string;
  status_counts: {
    verified: number;
    processing: number;
    pending: number;
    rejected: number;
  };
}

interface ReferralData {
  referred_user_id: string;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    kyc_status: KYCStatus;
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
  const { isSidebarCollapsed } = useSettings();

  const fetchLeaderboard = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Get the leaderboard data with both verified and total counts
      const { data: leaderboardData, error } = await supabase
        .rpc('get_leaderboard');
      
      if (error) throw error;
      
      if (leaderboardData?.length) {
        // Get profile pictures and referral details for the users
        const userIds = leaderboardData.map((item: any) => item.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        
        // Get all referrals with their KYC status
        const { data: allReferrals, error: referralsError } = await supabase
          .from('referrals')
          .select(`
            referrer_id,
            referred_user:profiles!referrals_referred_user_id_fkey(
              id,
              kyc_status
            )
          `)
          .in('referrer_id', userIds);
          
        if (referralsError) throw referralsError;
        
        // Group referrals by referrer and count by status
        const referralsByUser = allReferrals?.reduce((acc, referral) => {
          if (!acc[referral.referrer_id]) {
            acc[referral.referrer_id] = [];
          }
          if (referral.referred_user) {
            acc[referral.referrer_id].push(referral.referred_user);
          }
          return acc;
        }, {} as Record<string, { id: string; kyc_status: KYCStatus }[]>);
        
        // Format the leaderboard data
        const formattedLeaderboard = leaderboardData.map((item: any) => {
          const userReferrals = referralsByUser?.[item.user_id] || [];
          const verifiedCount = userReferrals.filter(r => r.kyc_status === 'verified').length;
          const processingCount = userReferrals.filter(r => r.kyc_status === 'processing').length;
          const pendingCount = userReferrals.filter(r => r.kyc_status === 'pending').length;
          const rejectedCount = userReferrals.filter(r => r.kyc_status === 'rejected').length;
          
          return {
            id: item.user_id,
            name: item.name,
            count: verifiedCount,  // Verified count for ranking
            unverified_count: pendingCount + processingCount + rejectedCount,
            total_count: userReferrals.length,  // Total referrals
            isCurrentUser: item.is_current_user,
            avatar_url: profileMap.get(item.user_id)?.avatar_url,
            status_counts: {
              verified: verifiedCount,
              processing: processingCount,
              pending: pendingCount,
              rejected: rejectedCount
            }
          };
        });
        
        // Sort leaderboard by total referrals (descending), then by verified count (descending)
        const sortedLeaderboard = [...formattedLeaderboard].sort((a, b) => {
          // First sort by total_count in descending order
          if (b.total_count !== a.total_count) {
            return b.total_count - a.total_count;
          }
          // If total_count is the same, sort by verified count (count) in descending order
          return b.count - a.count;
        });
        setLeaderboard(sortedLeaderboard);
      } else {
        setLeaderboard([]);
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

      // Get referred users with their profiles - fix the query to be more specific
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          referred_user_id,
          created_at,
          referred_profile:profiles!referrals_referred_user_id_fkey (
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
          .filter(r => r.referred_profile) // Filter out any null profiles
          .map((r, index) => {
            const profile = r.referred_profile as { id: string; first_name: string; last_name: string; kyc_status: KYCStatus; created_at: string };
            return {
              id: profile?.id || `user-${index}`,
              first_name: profile?.first_name || '',
              last_name: profile?.last_name || '',
              kyc_status: profile?.kyc_status || 'pending',
              created_at: r.created_at || profile?.created_at || new Date().toISOString()
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
          title: 'Join Campus Deal',
          text: 'Join me on Campus Deal - the best place to buy and sell within our campus community!',
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

  const getStatusBadge = (status: KYCStatus) => {
    const statusConfig = {
      pending: {
        icon: <Clock className="h-3 w-3 mr-1" />,
        label: 'Pending',
        className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      },
      processing: {
        icon: <RefreshCw className="h-3 w-3 mr-1 animate-spin" />,
        label: 'Processing',
        className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      },
      verified: {
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        label: 'Verified',
        className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
      },
      rejected: {
        icon: <XCircle className="h-3 w-3 mr-1" />,
        label: 'Rejected',
        className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10 transition-all duration-300",
        isSidebarCollapsed ? "ml-0 lg:ml-[80px]" : "ml-0 lg:ml-[240px]"
      )}>
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
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/40 transition-all duration-300 shadow-sm",
        isSidebarCollapsed ? "ml-0 lg:ml-[80px]" : "ml-0 lg:ml-[240px]"
      )}>
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
                  Share your code with friends and earn rewards when they verify their email and join
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
                  Every referral brings us closer to building a stronger community. Keep sharing and climb the ranks! 🚀
                </p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                {leaderboard.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {leaderboard.slice(0, 10).map((item, index) => (
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
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                            <AvatarImage src={item.avatar_url || ''} />
                            <AvatarFallback>
                              {item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <span className={`font-medium truncate block ${
                              index === 0 ? 'text-amber-900 dark:text-amber-100' : 'text-foreground'
                            }`}>
                              {item.name || 'Anonymous'}
                            </span>
                            <div className="flex items-center gap-1 text-[10px]">
                              {item.isCurrentUser && <span>You • </span>}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted/80 hover:bg-muted transition-colors cursor-help border border-border/50">
                                      <span className="font-medium text-green-600 dark:text-green-400">{item.count} verified</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[200px] p-2 text-xs">
                                    <div className="space-y-1.5">
                                      <p className="font-medium text-xs text-center mb-1">Referral Status</p>
                                      <div className="grid grid-cols-2 gap-1.5">
                                        <div className="flex items-center justify-between px-2 py-1 bg-green-50 dark:bg-green-900/30 rounded">
                                          <span className="text-green-600 dark:text-green-400">Verified</span>
                                          <span className="font-medium">{item.status_counts.verified}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded">
                                          <span className="text-blue-600 dark:text-blue-400">Processing</span>
                                          <span className="font-medium">{item.status_counts.processing}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                          <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                                          <span className="font-medium">{item.status_counts.pending}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded">
                                          <span className="text-red-600 dark:text-red-400">Rejected</span>
                                          <span className="font-medium">{item.status_counts.rejected}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                        <div className="w-16 sm:w-24 text-center">
                          <Badge 
                            variant="outline" 
                            className={`w-full justify-center font-medium text-xs sm:text-sm whitespace-nowrap ${
                              index === 0 ? 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-900 border-amber-200 dark:from-amber-900/40 dark:to-amber-900/20 dark:border-amber-800/50' :
                              index === 1 ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-900 border-blue-200 dark:from-blue-900/30 dark:to-blue-900/10 dark:border-blue-800/50' :
                              index === 2 ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-900 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-900/10 dark:border-emerald-800/50' :
                              'bg-gradient-to-r from-neutral-100 to-neutral-50 text-neutral-700 border-neutral-200 dark:from-neutral-800/30 dark:to-neutral-800/10 dark:border-neutral-700/50 dark:text-neutral-200'
                            } transition-colors`}
                          >
                            <span className={`sm:hidden ${index < 3 ? 'text-white dark:text-white' : ''}`}>
                              {item.total_count} ref
                            </span>
                            <span className={`hidden sm:inline ${index < 3 ? 'text-white dark:text-white' : ''}`}>
                              {item.total_count} {item.total_count === 1 ? 'referral' : 'referrals'}
                            </span>
                          </Badge>
                        </div>
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
                  See the impact you're making! Each verified referral helps grow our community. Keep sharing! 🌟
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
                        {getStatusBadge(user.kyc_status as KYCStatus)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 sm:py-8 text-center">
                    <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2 sm:mb-3" />
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Your referral journey starts now! 🚀
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
                      Share your unique link below and be the first to grow our community!
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
