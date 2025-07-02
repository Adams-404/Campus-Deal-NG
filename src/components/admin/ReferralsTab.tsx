
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Users, Search, Download, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ReferralData {
  referrer: {
    id: string;
    name: string;
    email: string;
    referral_count: number;
  };
  referred_users: {
    id: string;
    name: string;
    email: string;
    kyc_status: string;
    created_at: string;
  }[];
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  kyc_status: string;
  created_at: string;
  name: string;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  kyc_status: string;
  created_at: string;
}

interface AuthUser {
  id: string;
  email?: string;
}

const ReferralsTab = () => {
  const [allReferrals, setAllReferrals] = useState<ReferralData[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReferrals();
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.rpc('is_admin', { user_id: user.id });
          setIsAdmin(!!data);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current user's admin status
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setError('User not authenticated');
        return;
      }
      
      const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: currentUser.id });
      setIsAdmin(!!isAdmin);
      
      console.log('Is admin?', isAdmin);
      
      // First, let's check if we can query the referrals table directly
      console.log('Fetching raw referrals data...');
      const { data: rawReferrals, error: rawError } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Limit to 100 for testing
      
      console.log('Raw referrals data:', rawReferrals);
      
      if (rawError) {
        console.error('Error fetching raw referrals:', rawError);
      }
      
      // Get all referrers with their counts
      console.log('Fetching referrers with counts...');
      const { data: referrers, error: refError } = await supabase
        .rpc('get_referrers_with_counts');
      
      if (refError) {
        console.error('Error in get_referrers_with_counts:', refError);
        throw refError;
      }
      
      console.log('Referrers from get_referrers_with_counts:', referrers);
      
      if (!referrers?.length) {
        console.log('No referrers found');
        setAllReferrals([]);
        setFilteredReferrals([]);
        setLoading(false);
        return;
      }

      // Get all referred users with their details
      console.log('Fetching referred users with details...');
      let query = supabase
        .from('referrals')
        .select(`
          id,
          referrer_id,
          created_at,
          referred_user_id,
          profiles:referred_user_id (
            id,
            first_name,
            last_name,
            email,
            kyc_status,
            created_at
          )
        `)
        .order('created_at', { ascending: false });
      
      // If not admin, only fetch current user's referrals
      if (!isAdmin) {
        query = query.eq('referrer_id', currentUser.id);
      }
      
      const { data: referredUsers, error: refsError } = await query;
        
      console.log('Referred users data:', referredUsers);
      
      if (refsError) {
        console.error('Error fetching referred users:', refsError);
        throw refsError;
      }

      // Create a map of referrer IDs to their data
      const referrerMap = new Map<string, ReferralData>();
      
      // Initialize all referrers from the referrers list
      for (const ref of referrers) {
        const referrerId = ref.referrer_id;
        const referrerName = ref.name || 'Unknown User';
        // Always show full email for admin, masked for non-admin
        const email = isAdmin ? (ref.email || '') : '*****';
        
        referrerMap.set(referrerId, {
          referrer: {
            id: referrerId,
            name: referrerName,
            email: email,
            referral_count: ref.referral_count || 0
          },
          referred_users: []
        });
      }
      
      console.log('Initialized referrer map with', referrerMap.size, 'referrers');
      
      // Populate the referred users - updated to handle the new structure
      if (referredUsers) {
        console.log(`Processing ${referredUsers.length} referred users`);
        
        for (const ref of referredUsers) {
          const referrerId = ref.referrer_id;
          const referredUser = ref.profiles;
          
          if (!referredUser || (Array.isArray(referredUser) && referredUser.length === 0)) {
            console.log('Skipping empty referred user for referrer:', referrerId);
            continue;
          }
          
          const userData = Array.isArray(referredUser) ? referredUser[0] : referredUser;
          
          const referrerData = referrerMap.get(referrerId);
          if (!referrerData) {
            console.log('No referrer data found for ID:', referrerId);
            // Try to create a new entry if referrer not found
            const { data: missingReferrer } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, email')
              .eq('id', referrerId)
              .single();
              
            if (missingReferrer) {
              const name = [missingReferrer.first_name, missingReferrer.last_name].filter(Boolean).join(' ') || 'Unknown User';
              referrerMap.set(referrerId, {
                referrer: {
                  id: referrerId,
                  name: name,
                  email: isAdmin ? (missingReferrer.email || '') : '*****',
                  referral_count: 1
                },
                referred_users: []
              });
            } else {
              console.log('Could not find referrer profile for ID:', referrerId);
              continue;
            }
          }
          
          const referredUserName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Unknown User';
          
          // Check if this user is already in the referred users list
          const existingUser = referrerMap.get(referrerId)?.referred_users.find(u => u.id === userData.id);
          if (!existingUser) {
            referrerMap.get(referrerId)?.referred_users.push({
              id: userData.id,
              name: referredUserName,
              email: isAdmin ? (userData.email || `${userData.first_name?.toLowerCase() || 'user'}@gsu.edu.ng`) : '*****',
              kyc_status: userData.kyc_status || 'pending',
              created_at: ref.created_at || userData.created_at || new Date().toISOString()
            });
          }
        }
      }
      
      // Convert to array and sort by referral count
      const groupedData = Array.from(referrerMap.values())
        .sort((a, b) => b.referrer.referral_count - a.referrer.referral_count);

      // Log detailed information for debugging
      console.log('Grouped data:', groupedData);
      console.log(`Found ${groupedData.length} referrers with data`);
      
      // Log each referrer and their referred users
      groupedData.forEach((ref, index) => {
        console.log(`Referrer ${index + 1}:`, ref.referrer.name, `(${ref.referrer.email})`);
        console.log(`  Referral count: ${ref.referrer.referral_count}`);
        console.log(`  Actual referred users: ${ref.referred_users.length}`);
        ref.referred_users.forEach((user, i) => {
          console.log(`  - ${i + 1}. ${user.name} (${user.email}) - ${user.kyc_status}`);
        });
      });
      
      // Double check if we have any data
      if (groupedData.length === 0) {
        console.log('No referral data available after processing');
      }

      setAllReferrals(groupedData);
      setFilteredReferrals(groupedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      setError('Failed to fetch referral data. Please try again.');
      toast.error('Failed to fetch referral data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'verified' ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'verified' ? (
      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
        Verified
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50">
        Pending
      </Badge>
    );
  };
  
  // Get unique referrers for the dropdown
  const referrerOptions = [
    { id: 'all', name: 'All Referrers' },
    ...allReferrals.map(ref => ({
      id: ref.referrer.id,
      name: `${ref.referrer.name} (${ref.referrer.referral_count} ${ref.referrer.referral_count === 1 ? 'referral' : 'referrals'})`
    }))
  ];
  
  // Filter referrals based on search term and selected referrer
  useEffect(() => {
    let result = [...allReferrals];
    
    // Filter by selected referrer first
    if (selectedReferrer && selectedReferrer !== 'all') {
      result = result.filter(ref => ref.referrer.id === selectedReferrer);
    }
    
    // Then apply search filter if there's a search term
    if (searchTerm) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(referral => {
        // Check if referrer matches
        const referrerMatch = referral.referrer.name?.toLowerCase().includes(term) || 
                            (isAdmin && referral.referrer.email?.toLowerCase().includes(term));
        
        // Check if any referred user matches
        const referredUserMatch = referral.referred_users.some(user => 
          user.name?.toLowerCase().includes(term) || 
          (isAdmin && user.email?.toLowerCase().includes(term))
        );
        
        return referrerMatch || referredUserMatch;
      });
    }
    
    // If no filters are applied, show all
    if (selectedReferrer === 'all' && !searchTerm) {
      setFilteredReferrals([...allReferrals]);
    } else {
      setFilteredReferrals(result);
    }
  }, [allReferrals, searchTerm, selectedReferrer, isAdmin]);

  const exportData = () => {
    const csvContent = [
      ['Referrer Name', 'Referrer Email', 'Total Referrals', 'Referred User', 'Referred Email', 'Verification Status', 'Signup Date'],
      ...referrals.flatMap(referral =>
        referral.referred_users.map(user => [
          referral.referrer.name,
          referral.referrer.email,
          referral.referrer.referral_count.toString(),
          user.name,
          user.email,
          user.kyc_status,
          new Date(user.created_at).toLocaleDateString()
        ])
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'referrals-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getUserEmail = async (userId: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: currentUser?.id || '' });

      if (!isAdmin) {
        return ''; // Only admins can see real emails
      }

      // Try to get email from auth.users first
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (user && !userError) {
        return user.email || '';
      }

      // Fallback to profiles table if auth.users lookup fails
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (!profileError && profile?.email) {
        return profile.email;
      }

      return 'email@hidden.com';
    } catch (error) {
      console.error('Error fetching user email:', error);
      return 'error@fetching.email';
    }
  };

  if (loading) {
    return (
      <Card className="bg-background/90 dark:bg-black/90 border border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/30">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-[#1078a7]" />
            Referrals Management
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Loading referral data...
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-6 w-48 bg-muted rounded animate-pulse"></div>
                  <div className="h-8 w-20 bg-muted rounded-full animate-pulse"></div>
                </div>
                <div className="h-12 bg-muted/50 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background/90 dark:bg-black/90 border border-border/50 shadow-sm">
      <CardHeader className="border-b border-border/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5 text-[#1078a7]" />
              Referrals Management
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage and monitor user referrals and their verification status
            </CardDescription>
          </div>
          <Button 
            onClick={exportData} 
            variant="outline" 
            size="sm"
            className="bg-white/90 hover:bg-white border-2 border-[#1078a7] text-[#1078a7] hover:text-[#0d5f8a] hover:border-[#0d5f8a] transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full bg-white/90 border-2 border-[#1078a7]/30 focus:border-[#1078a7] focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
              />
            </div>
            <select
              value={selectedReferrer}
              onChange={(e) => setSelectedReferrer(e.target.value)}
              className="flex h-10 w-full sm:w-72 rounded-md border-2 border-[#1078a7]/30 bg-white/90 px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:border-[#1078a7] focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
            >
              {referrerOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div className="text-center py-8">
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No referrals found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'No referrals match your search.' : 'No referral data available.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReferrals.map((referralGroup) => (
                <div 
                  key={referralGroup.referrer.id} 
                  className="border rounded-lg p-5 bg-white/90 dark:bg-black/50 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-border/30">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {referralGroup.referrer.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {referralGroup.referrer.email}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="px-3 py-1.5 text-sm font-medium bg-[#1078a7]/10 text-[#1078a7] border-[#1078a7]/30"
                    >
                      {referralGroup.referrer.referral_count} referral{referralGroup.referrer.referral_count !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {referralGroup.referred_users.length > 0 ? (
                    <div className="rounded-lg overflow-hidden border border-border/30">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/20">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="font-medium text-foreground">Referred User</TableHead>
                              <TableHead className="font-medium text-foreground">Email</TableHead>
                              <TableHead className="font-medium text-foreground">Signup Date</TableHead>
                              <TableHead className="font-medium text-foreground">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {referralGroup.referred_users.map((user) => (
                              <TableRow key={user.id} className="hover:bg-muted/10">
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {new Date(user.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(user.kyc_status)}
                                    {getStatusBadge(user.kyc_status)}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No referred users found
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralsTab;
