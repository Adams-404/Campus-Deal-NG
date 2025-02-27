import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield,
  Users,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  BarChart,
  TrendingUp,
  Clock,
  Crown,
  Mail,
  Phone,
  MapPin,
  Calendar
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { Database } from '@/integrations/supabase/types';
import { AdminActionModal } from "@/components/AdminActionModal";

type Profile = Database['public']['Tables']['profiles']['Row'];
type KYCStatus = Database['public']['Enums']['kyc_status'];
type UserRole = Database['public']['Enums']['user_role'];

interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: KYCStatus;
  created_at: string;
  admin_notes: string | null;
  updated_at: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email?: string;
  };
}

interface UserProfile extends Omit<Profile, 'kyc_status'> {
  kyc_status: KYCStatus;
  email?: string;
  roles: Array<{
    role: UserRole;
  }> | null;
}

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingKYC: 0,
    verifiedUsers: 0,
    userGrowthData: [] as { date: string; users: number }[],
    kycStatusData: [] as { name: string; value: number }[]
  });
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [adminAction, setAdminAction] = useState<'add' | 'remove'>('add');
  const [showAdminModal, setShowAdminModal] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/sign-in');
        return;
      }

      // Check user_roles table directly
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error checking admin status:', error);
        toast.error('Error checking admin status');
        navigate('/');
        return;
      }

      const isAdmin = roles?.some(r => r.role === 'admin') ?? false;
      if (!isAdmin) {
        toast.error('Access denied, admin privileges required');
        navigate('/');
        return;
      }

      // Only fetch data if user is admin
      fetchData();
    } catch (error) {
      console.error('Error in admin check:', error);
      toast.error('An error occurred while checking admin access');
      navigate('/');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch KYC documents with profiles
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_documents')
        .select(`
          id,
          user_id,
          document_type,
          document_url,
          status,
          created_at,
          admin_notes,
          updated_at,
          profile:profiles (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (kycError) throw kycError;

      // First fetch profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          avatar_url,
          address,
          phone,
          kyc_status,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Then fetch roles for each profile
      const usersWithRoles = await Promise.all((profiles || []).map(async (profile) => {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id);
        
        return {
          ...profile,
          email: '', // Add empty email since we don't fetch it
          roles: roleData || null
        };
      }));

      const processedKycData = (kycData || []).map(doc => ({
        ...doc,
        profile: {
          ...doc.profile,
          email: '', // Add empty email since we don't fetch it
        }
      }));

      // Calculate user growth data (last 7 days)
      const userGrowthData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const usersOnDate = usersWithRoles.filter(user => {
          const userDate = new Date(user.created_at);
          return userDate.toDateString() === date.toDateString();
        }).length;
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          users: usersOnDate
        };
      });

      // Calculate KYC status distribution
      const kycStatusData = [
        { name: 'Verified', value: usersWithRoles.filter(user => user.kyc_status === 'verified').length },
        { name: 'Pending', value: usersWithRoles.filter(user => user.kyc_status === 'pending').length },
        { name: 'Rejected', value: usersWithRoles.filter(user => user.kyc_status === 'rejected').length }
      ];

      setKycDocuments(processedKycData);
      setUsers(usersWithRoles);
      setStats({
        totalUsers: usersWithRoles.length,
        pendingKYC: processedKycData.filter(doc => doc.status === 'pending').length,
        verifiedUsers: usersWithRoles.filter(user => user.kyc_status === 'verified').length,
        userGrowthData,
        kycStatusData
      });

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKYCAction = async (documentId: string, userId: string, action: 'verify' | 'reject', notes?: string) => {
    try {
      const status = action === 'verify' ? 'verified' : 'rejected';

      const { error: docError } = await supabase
        .from('kyc_documents')
        .update({ 
          status,
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (docError) throw docError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      toast.success(`KYC ${action === 'verify' ? 'verified' : 'rejected'} successfully`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleMakeAdmin = async (email: string) => {
    try {
      // First get the user by email from auth.users
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;
      
      const user = users.find(u => u.email === email);
      if (!user) {
        toast.error("User not found with this email");
        return;
      }

      // Check if already admin
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (existingRole) {
        toast.info("User is already an admin");
        return;
      }

      // Add admin role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'admin'
        });

      if (insertError) throw insertError;

      toast.success("User promoted to admin successfully");
      await fetchData();
    } catch (error: any) {
      console.error('Error making user admin:', error);
      toast.error(error.message || "Failed to make user admin");
      throw error; // Re-throw to be caught by the modal
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (deleteError) throw deleteError;

      toast.success("Admin privileges removed successfully");
      await fetchData();
    } catch (error: any) {
      console.error('Error removing admin:', error);
      toast.error(error.message || "Failed to remove admin privileges");
      throw error; // Re-throw to be caught by the modal
    }
  };

  const handleAdminAction = (user: UserProfile | null, action: 'add' | 'remove') => {
    setSelectedUser(user);
    setAdminAction(action);
    setShowAdminModal(true);
  };

  const handleAdminConfirm = async (email: string) => {
    try {
      if (adminAction === 'add') {
        await handleMakeAdmin(email);
      } else if (selectedUser) {
        await handleRemoveAdmin(selectedUser.id);
      }
      setShowAdminModal(false);
      setSelectedUser(null);
    } catch (error) {
      // Error is already handled in the individual functions
      console.error('Error in handleAdminConfirm:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#F59E0B', '#EF4444'];

  return (
    <PageTransition>
      <div className="container py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage users and monitor platform activity
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="border-blue-500/20 hover:bg-blue-500/10"
          >
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Platform members</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.pendingKYC}</div>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.verifiedUsers}</div>
              <p className="text-xs text-muted-foreground">Verified members</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-blue-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                User Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.userGrowthData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart className="h-4 w-4 text-blue-500" />
                KYC Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.kycStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.kycStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {stats.kycStatusData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-sm">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="admins" className="space-y-4">
          <TabsList className="bg-secondary/50 border border-blue-500/20">
            <TabsTrigger value="admins" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-500">
              Admins
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-500">
              Users
            </TabsTrigger>
            <TabsTrigger value="kyc" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-500">
              KYC Verification
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admins" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setSelectedUser(null);
                  setAdminAction('add');
                  setShowAdminModal(true);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Add New Admin
              </Button>
            </div>

            {users
              .filter(user => user.roles?.some(r => r.role === 'admin'))
              .map((admin) => (
                <Card key={admin.id} className="overflow-hidden border-blue-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                  <CardContent className="p-6">
                    <div className="grid gap-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Crown className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">
                            {admin.first_name} {admin.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">Administrator</p>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <span>{admin.email}</span>
                        </div>
                        {admin.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-blue-500" />
                            <span>{admin.phone}</span>
                          </div>
                        )}
                        {admin.address && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <span>{admin.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span>Joined {new Date(admin.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          <Crown className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                        <Badge variant={
                          admin.kyc_status === 'verified'
                            ? 'outline'
                            : admin.kyc_status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className={
                          admin.kyc_status === 'verified'
                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20'
                            : admin.kyc_status === 'rejected'
                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
                            : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20'
                        }>
                          {admin.kyc_status?.charAt(0).toUpperCase() + admin.kyc_status?.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="overflow-hidden border-blue-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={
                      user.kyc_status === 'verified'
                        ? 'outline'
                        : user.kyc_status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className={
                      user.kyc_status === 'verified'
                        ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20'
                        : user.kyc_status === 'rejected'
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
                        : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20'
                    }>
                      {user.kyc_status?.charAt(0).toUpperCase() + user.kyc_status?.slice(1)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="kyc" className="space-y-4">
            {kycDocuments.map((doc) => (
              <Card key={doc.id} className="overflow-hidden border-blue-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">
                        {doc.profile.first_name} {doc.profile.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted on {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      doc.status === 'verified' 
                        ? 'outline' 
                        : doc.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className={
                      doc.status === 'verified'
                        ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20'
                        : doc.status === 'rejected'
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
                        : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20'
                    }>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <a 
                      href={doc.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                    >
                      View Document
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>

                  {doc.status === 'pending' && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleKYCAction(doc.id, doc.user_id, 'verify')}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleKYCAction(doc.id, doc.user_id, 'reject')}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <AdminActionModal
          open={showAdminModal}
          onClose={() => {
            setShowAdminModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handleAdminConfirm}
          action={adminAction}
        />
      </div>
    </PageTransition>
  );
}
