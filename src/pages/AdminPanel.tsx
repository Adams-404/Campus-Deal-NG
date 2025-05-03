
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { BottomNav } from '@/components/BottomNav';
import { DesktopSideNav } from '@/components/DesktopSideNav';
import { useMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

// Import admin components with proper naming
import { UsersTab } from "@/components/admin/UsersTab";
import { PostsTab } from "@/components/admin/PostsTab";
import { KYCTab } from "@/components/admin/KYCTab";
import { KYCDocumentsTab } from "@/components/admin/KYCDocumentsTab";
import { AdminsTab } from "@/components/admin/AdminsTab";
import { AdminGuide } from "@/components/admin/AdminGuide";

// Basic dashboard component since AdminDashboard is unavailable
const AdminDashboard = () => (
  <div className="p-6 bg-card rounded-lg shadow border border-border">
    <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>
    <p>Welcome to the admin dashboard. Select a tab to manage your application.</p>
    <div className="grid md:grid-cols-3 gap-4 mt-4">
      <div className="p-4 bg-background rounded-lg border border-border">
        <h3 className="font-medium">Users</h3>
        <p className="text-sm text-muted-foreground">Manage user accounts</p>
      </div>
      <div className="p-4 bg-background rounded-lg border border-border">
        <h3 className="font-medium">Content</h3>
        <p className="text-sm text-muted-foreground">Manage listings and posts</p>
      </div>
      <div className="p-4 bg-background rounded-lg border border-border">
        <h3 className="font-medium">KYC</h3>
        <p className="text-sm text-muted-foreground">Verify user identities</p>
      </div>
    </div>
  </div>
);

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [documents, setDocuments] = useState([]);
  const { toast } = useToast();
  const isMobile = useMobile();
  
  useEffect(() => {
    checkAdminStatus();
  }, []);
  
  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/auth/sign-in';
        return;
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      // Check if is_admin field exists, if not you may need to add it
      if (profile && profile.is_admin === true) {
        setIsAdmin(true);
        // Load admin data
        fetchUsers();
        fetchItems();
        fetchDocuments();
      } else {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to access the admin panel",
          variant: "destructive"
        });
        window.location.href = '/home';
      }
    } catch (error: any) {
      toast({
        title: "Error checking admin status",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*, profiles:seller_id(*)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*, profiles:user_id(*)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleViewUserProfile = (userId: string) => {
    window.open(`/user/${userId}`, '_blank');
  };

  const handleDeleteItem = async (itemId: string) => {
    // Implement delete functionality
    console.log("Delete item:", itemId);
  };
  
  const handleAdminAction = async (userId: string, action: string) => {
    // Implement admin actions
    console.log("Admin action:", action, "for user:", userId);
  };
  
  const handleStatusChange = async (documentId: string, status: string) => {
    // Implement status change
    console.log("Status change for document:", documentId, "to:", status);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-muted-foreground mb-6">You don't have permission to access the admin panel.</p>
        <Button asChild>
          <a href="/home">Back to Home</a>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <DesktopSideNav />
        <div className="flex-1">
          <div className="container max-w-7xl mx-auto px-4 pb-24 pt-6">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <Button variant="outline" onClick={() => window.location.href = '/home'}>
                Back to App
              </Button>
            </div>
            
            <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-3 md:grid-cols-7 w-full h-auto">
                <TabsTrigger value="dashboard" className="text-xs md:text-sm">Dashboard</TabsTrigger>
                <TabsTrigger value="users" className="text-xs md:text-sm">Users</TabsTrigger>
                <TabsTrigger value="posts" className="text-xs md:text-sm">Posts</TabsTrigger>
                <TabsTrigger value="kyc" className="text-xs md:text-sm">KYC</TabsTrigger>
                <TabsTrigger value="documents" className="text-xs md:text-sm hidden md:block">Documents</TabsTrigger>
                <TabsTrigger value="admins" className="text-xs md:text-sm hidden md:block">Admins</TabsTrigger>
                <TabsTrigger value="guide" className="text-xs md:text-sm hidden md:block">Guide</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard">
                <AdminDashboard />
              </TabsContent>
              
              <TabsContent value="users">
                <UsersTab 
                  users={users} 
                  onViewUserProfile={handleViewUserProfile}
                  onAdminAction={handleAdminAction}
                />
              </TabsContent>
              
              <TabsContent value="posts">
                <PostsTab 
                  items={items}
                  onViewUserProfile={handleViewUserProfile}
                  onDeleteItem={handleDeleteItem}
                  onRefresh={fetchItems}
                />
              </TabsContent>
              
              <TabsContent value="kyc">
                <KYCTab />
              </TabsContent>
              
              <TabsContent value="documents">
                <KYCDocumentsTab 
                  documents={documents}
                  onViewDocument={() => {}}
                  onStatusChange={handleStatusChange}
                />
              </TabsContent>
              
              <TabsContent value="admins">
                <AdminsTab 
                  users={users}
                  onViewUserProfile={handleViewUserProfile}
                  onAdminAction={handleAdminAction}
                />
              </TabsContent>
              
              <TabsContent value="guide">
                <AdminGuide />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      {isMobile && <BottomNav />}
    </div>
  );
};

export default AdminPanel;
