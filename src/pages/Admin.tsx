
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AdminActionModal } from "@/components/AdminActionModal";

// Import admin components
import { AdminStats } from "@/components/admin/AdminDashboard";
import { AdminCharts } from "@/components/admin/AdminDashboard";
import { PostsTab } from "@/components/admin/PostsTab";
import { AdminsTab } from "@/components/admin/AdminsTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { KYCTab } from "@/components/admin/KYCTab";
import { UserDetailsModal } from "@/components/admin/UserDetailsModal";

// Import types
import { 
  KYCDocument, 
  UserProfile, 
  ItemType 
} from "@/components/admin/types";

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [items, setItems] = useState<ItemType[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingKYC: 0,
    processingKYC: 0,
    verifiedUsers: 0,
    userGrowthData: [] as { date: string; users: number }[],
    kycStatusData: [] as { name: string; value: number }[]
  });
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [adminAction, setAdminAction] = useState<'add' | 'remove'>('add');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [userItems, setUserItems] = useState<ItemType[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth/signin');
        return;
      }

      // Check if user is admin using direct query to user_roles
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
    } finally {
      setLoading(false);
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

      // Fetch all items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          id,
          title,
          price,
          status,
          created_at,
          description,
          seller_id,
          item_images (
            image_url
          ),
          profiles:seller_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });
        
      if (itemsError) throw itemsError;

      // Format items data
      const formattedItems = (itemsData || []).map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        status: item.status,
        created_at: item.created_at,
        description: item.description,
        seller: {
          id: item.profiles?.id || '',
          first_name: item.profiles?.first_name || '',
          last_name: item.profiles?.last_name || '',
          avatar_url: item.profiles?.avatar_url || ''
        },
        images: item.item_images?.map((img: any) => img.image_url) || []
      }));

      // Then fetch roles for each profile
      const usersWithRoles: UserProfile[] = [];
      
      for (const profile of profiles || []) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id);
        
        usersWithRoles.push({
          ...profile,
          roles: roleData || null
        });
      }

      const processedKycData = (kycData || []).map(doc => ({
        ...doc,
        profile: {
          ...doc.profile,
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
        { name: 'Processing', value: usersWithRoles.filter(user => user.kyc_status === 'processing').length },
        { name: 'Pending', value: usersWithRoles.filter(user => user.kyc_status === 'pending').length },
        { name: 'Rejected', value: usersWithRoles.filter(user => user.kyc_status === 'rejected').length }
      ];

      setKycDocuments(processedKycData);
      setUsers(usersWithRoles);
      setItems(formattedItems);
      setStats({
        totalUsers: usersWithRoles.length,
        pendingKYC: processedKycData.filter(doc => doc.status === 'pending').length,
        processingKYC: processedKycData.filter(doc => doc.status === 'processing').length,
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

  const handleMakeAdmin = async (userEmail: string) => {
    try {
      // Get user by email from auth
      const { data, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw new Error('Failed to get users list. Make sure you have admin privileges.');
      }
      
      if (!data || !data.users) {
        throw new Error('No users found');
      }
      
      const matchingUser = data.users.find(u => u.email === userEmail);
      
      if (!matchingUser) {
        toast.error("User not found with this email");
        return;
      }

      // Check if already admin
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', matchingUser.id)
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
          user_id: matchingUser.id,
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

  const handleViewUserProfile = async (userId: string) => {
    try {
      // Find user in existing users array
      const user = users.find(u => u.id === userId);
      if (!user) {
        toast.error("User not found");
        return;
      }
      
      // Fetch user's items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          id,
          title,
          price,
          status,
          created_at,
          description,
          item_images (
            image_url
          )
        `)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });
        
      if (itemsError) throw itemsError;

      // Format items data
      const formattedItems = (itemsData || []).map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        status: item.status,
        created_at: item.created_at,
        description: item.description,
        seller: {
          id: userId,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          avatar_url: user.avatar_url || ''
        },
        images: item.item_images?.map((img: any) => img.image_url) || []
      }));

      setViewingUser(user);
      setUserItems(formattedItems);
      setShowUserDetailsModal(true);
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      toast.error(error.message || 'Failed to fetch user details');
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

        {/* Dashboard Stats */}
        <AdminStats 
          totalUsers={stats.totalUsers}
          pendingKYC={stats.pendingKYC}
          processingKYC={stats.processingKYC}
          verifiedUsers={stats.verifiedUsers}
        />

        {/* Dashboard Charts */}
        <AdminCharts 
          userGrowthData={stats.userGrowthData}
          kycStatusData={stats.kycStatusData}
        />

        <Tabs defaultValue="posts" className="space-y-4">
          <TabsList className="bg-secondary/50 border border-blue-500/20">
            <TabsTrigger value="posts" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-500">
              Posts
            </TabsTrigger>
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

          <TabsContent value="posts" className="space-y-4">
            <PostsTab 
              items={items} 
              onRefresh={fetchData}
              onViewUserProfile={handleViewUserProfile}
            />
          </TabsContent>

          <TabsContent value="admins" className="space-y-4">
            <AdminsTab 
              users={users}
              onViewUserProfile={handleViewUserProfile}
              onAdminAction={handleAdminAction}
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UsersTab 
              users={users}
              onViewUserProfile={handleViewUserProfile}
            />
          </TabsContent>

          <TabsContent value="kyc" className="space-y-4">
            <KYCTab 
              kycDocuments={kycDocuments}
              onRefresh={fetchData}
            />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <AdminActionModal
          open={showAdminModal}
          onClose={() => {
            setShowAdminModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handleAdminConfirm}
          action={adminAction}
        />

        <UserDetailsModal
          open={showUserDetailsModal}
          onOpenChange={setShowUserDetailsModal}
          user={viewingUser}
          userItems={userItems}
        />
      </div>
    </PageTransition>
  );
}
