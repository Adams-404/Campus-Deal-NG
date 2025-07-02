
import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  Users, 
  Search, 
  Download, 
  AlertCircle, 
  UserCheck, 
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Filter,
  UserPlus,
  BarChart2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

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
  const [sortConfig, setSortConfig] = useState<{ key: keyof ReferralData['referrer'] | 'referral_count'; direction: 'asc' | 'desc' }>({ 
    key: 'referral_count', 
    direction: 'desc' 
  });
  
  // Calculate totals for the summary cards
  const { totalReferrers, totalReferrals, verifiedReferrals } = useMemo(() => {
    return {
      totalReferrers: allReferrals.length,
      totalReferrals: allReferrals.reduce((sum, ref) => sum + ref.referrer.referral_count, 0),
      verifiedReferrals: allReferrals.reduce((sum, ref) => 
        sum + ref.referred_users.filter(u => u.kyc_status === 'verified').length, 0
      )
    };
  }, [allReferrals]);
  
  // Handle sorting
  const requestSort = (key: keyof ReferralData['referrer'] | 'referral_count') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="ml-2 h-4 w-4" /> 
      : <ChevronDown className="ml-2 h-4 w-4" />;
  };

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
  
  // Filter and sort referrals
  useEffect(() => {
    let result = [...allReferrals];
    
    // Filter by selected referrer
    if (selectedReferrer && selectedReferrer !== 'all') {
      result = result.filter(ref => ref.referrer.id === selectedReferrer);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(referral => {
        const referrerMatch = referral.referrer.name?.toLowerCase().includes(term) || 
                            (isAdmin && referral.referrer.email?.toLowerCase().includes(term));
        
        const referredUserMatch = referral.referred_users.some(user => 
          user.name?.toLowerCase().includes(term) || 
          (isAdmin && user.email?.toLowerCase().includes(term))
        );
        
        return referrerMatch || referredUserMatch;
      });
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue, bValue;
        
        if (sortConfig.key === 'referral_count') {
          aValue = a.referrer.referral_count;
          bValue = b.referrer.referral_count;
        } else {
          aValue = a.referrer[sortConfig.key as keyof typeof a.referrer];
          bValue = b.referrer[sortConfig.key as keyof typeof b.referrer];
        }
        
        if (aValue === null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (aValue === bValue) return 0;
        
        const comparison = aValue > bValue ? 1 : -1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    setFilteredReferrals(result);
  }, [allReferrals, searchTerm, selectedReferrer, isAdmin, sortConfig]);

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
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-white/90 dark:bg-black/50 border border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card className="bg-white/90 dark:bg-black/50 border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1078a7]" />
              Loading Referrals...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/90 dark:bg-black/50 border border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferrers}</div>
            <p className="text-xs text-muted-foreground">Active users with referrals</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/90 dark:bg-black/50 border border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferrals}</div>
            <p className="text-xs text-muted-foreground">Total users referred</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/90 dark:bg-black/50 border border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedReferrals}</div>
            <p className="text-xs text-muted-foreground">Verified accounts</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/90 dark:bg-black/50 border border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalReferrers > 0 ? Math.round((verifiedReferrals / totalReferrals) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Verification rate</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-white/90 dark:bg-black/50 border border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1078a7]" />
                Referral Management
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage and monitor user referrals and their verification status
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white/90 hover:bg-white border-2 border-[#1078a7] text-[#1078a7] hover:text-[#0d5f8a] hover:border-[#0d5f8a] transition-colors shadow-sm"
                      onClick={exportData}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export all referral data as CSV</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search referrals..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-64">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedReferrer}
                  onChange={(e) => setSelectedReferrer(e.target.value)}
                >
                  <option value="all">All Referrers</option>
                  {allReferrals.map((ref) => (
                    <option key={ref.referrer.id} value={ref.referrer.id}>
                      {ref.referrer.name} ({ref.referrer.referral_count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {filteredReferrals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No referrals found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || selectedReferrer !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No referral data available.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredReferrals.map((referralGroup) => (
                  <div key={referralGroup.referrer.id} className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/20 rounded-lg">
                      <div>
                        <h3 className="font-medium">{referralGroup.referrer.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {isAdmin && referralGroup.referrer.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="px-3 py-1">
                          {referralGroup.referred_users.length} {referralGroup.referred_users.length === 1 ? 'Referral' : 'Referrals'}
                        </Badge>
                      </div>
                    </div>

                    {referralGroup.referred_users.length > 0 && (
                      <div className="overflow-hidden border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Signup Date</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {referralGroup.referred_users.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  {new Date(user.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={user.kyc_status === 'verified' ? 'default' : 'outline'}
                                    className={user.kyc_status === 'verified' ? 'bg-green-500' : ''}
                                  >
                                    {user.kyc_status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralsTab;
