import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { UserProfile, KYCDocument, ItemType, DashboardStats, ChartData, TimeSeriesData } from '@/components/admin/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/PageTransition';
import { supabase } from '@/integrations/supabase/client';
import { UserDetailsModal } from '@/components/admin/UserDetailsModal';
import { AdminActionModal } from '@/components/AdminActionModal';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
  const [items, setItems] = useState<ItemType[]>([]);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalItems: 0,
    pendingKyc: 0,
    activeSellers: 0
  });
  const [userStats, setUserStats] = useState<ChartData[]>([]);
  const [itemStats, setItemStats] = useState<ChartData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'add' | 'remove'>('add');
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate('/sign-in');
        return;
      }

      const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin', {
        user_id: userData.user.id
      });

      if (isAdminError) {
        console.error('Error checking admin status:', isAdminError);
        toast.error('Error checking admin permission');
        navigate('/');
        return;
      }

      if (!isAdminData) {
        toast.error('You do not have admin permissions');
        navigate('/');
        return;
      }

      setIsAdmin(true);

      const { data: profilesData, error: profilesError } = await supabase
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
          updated_at,
          roles:user_roles(role)
        `)
        .order('created_at', { ascending: false });
        
      if (profilesError) throw profilesError;
      setUsers(profilesData || []);

      const { data: kycDocumentsData, error: kycDocumentsError } = await supabase
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
          profile:profiles(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });
        
      if (kycDocumentsError) throw kycDocumentsError;
      setKycDocuments(kycDocumentsData || []);

      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          id,
          title,
          price,
          status,
          created_at,
          description,
          seller:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          images:item_images(image_url)
        `)
        .order('created_at', { ascending: false });
        
      if (itemsError) throw itemsError;
      
      const formattedItems = itemsData.map(item => ({
        ...item,
        seller: item.seller,
        images: item.images.map((img: { image_url: string }) => img.image_url)
      }));
      
      setItems(formattedItems || []);

      setStats({
        totalUsers: profilesData?.length || 0,
        totalItems: formattedItems?.length || 0,
        pendingKyc: kycDocumentsData?.filter(doc => doc.status === 'pending' || doc.status === 'processing').length || 0,
        activeSellers: new Set(formattedItems?.map(item => item.seller.id)).size || 0
      });

      const kycStatusCounts: Record<string, number> = {};
      profilesData?.forEach(user => {
        const status = user.kyc_status || 'pending';
        kycStatusCounts[status] = (kycStatusCounts[status] || 0) + 1;
      });
      
      setUserStats(Object.entries(kycStatusCounts).map(([name, value]) => ({ name, value })));

      const itemStatusCounts: Record<string, number> = {};
      formattedItems?.forEach(item => {
        const status = item.status || 'active';
        itemStatusCounts[status] = (itemStatusCounts[status] || 0) + 1;
      });
      
      setItemStats(Object.entries(itemStatusCounts).map(([name, value]) => ({ name, value })));

      const timeSeriesPoints: TimeSeriesData[] = [];
      const now = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const usersCountBeforeDate = profilesData?.filter(user => 
          new Date(user.created_at) <= date
        ).length || 0;
        
        const itemsCountBeforeDate = formattedItems?.filter(item => 
          new Date(item.created_at) <= date
        ).length || 0;
        
        timeSeriesPoints.push({
          date: dateString,
          users: usersCountBeforeDate,
          items: itemsCountBeforeDate
        });
      }
      
      setTimeSeriesData(timeSeriesPoints);
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const profilesChannel = supabase
      .channel('admin-profiles-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        fetchData();
      })
      .subscribe();
      
    const kycDocumentsChannel = supabase
      .channel('admin-kyc-documents-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'kyc_documents'
      }, () => {
        fetchData();
      })
      .subscribe();
      
    const itemsChannel = supabase
      .channel('admin-items-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'items'
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(kycDocumentsChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [navigate]);

  const handleViewUserProfile = (userId: string) => {
    setSelectedUserId(userId);
    setIsUserDetailsOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      toast.success('Item deleted successfully');
      
      setItems(prev => prev.filter(item => item.id !== itemId));
      
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleViewKYCDocument = (document: KYCDocument) => {
    navigate('/admin?tab=kyc');
  };

  const handleAdminAction = (user: UserProfile | null, action: 'add' | 'remove') => {
    setTargetUser(user);
    setModalAction(action);
    setIsModalOpen(true);
  };

  const handleCompleteAdminAction = async (success: boolean) => {
    setIsModalOpen(false);
    if (success) {
      fetchData();
    }
  };

  if (loading && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-32">
        <h1 className="text-3xl font-bold my-8">Admin Dashboard</h1>
        
        {isAdmin ? (
          <>
            <AdminDashboard 
              users={users}
              kycDocuments={kycDocuments}
              items={items}
              stats={stats}
              userStats={userStats}
              itemStats={itemStats}
              timeSeriesData={timeSeriesData}
              onViewUserProfile={handleViewUserProfile}
              onViewKYCDocument={handleViewKYCDocument}
              onDeleteItem={handleDeleteItem}
              onAdminAction={handleAdminAction}
            />
            
            <UserDetailsModal
              isOpen={isUserDetailsOpen}
              onClose={() => setIsUserDetailsOpen(false)}
              userId={selectedUserId}
            />
            
            <AdminActionModal
              open={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              action={modalAction}
              user={targetUser}
              onComplete={handleCompleteAdminAction}
            />
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
              <p className="mb-6">
                You do not have permission to access the admin dashboard.
              </p>
              <Button onClick={() => navigate('/')}>
                Return to Homepage
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
};

export default Admin;
