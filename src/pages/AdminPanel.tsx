
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UsersTab } from "@/components/admin/UsersTab";
import { PostsTab } from "@/components/admin/PostsTab";
import { KYCTab } from "@/components/admin/KYCTab";
import { KYCDocumentsTab } from "@/components/admin/KYCDocumentsTab";
import { AdminsTab } from "@/components/admin/AdminsTab";
import { AdminGuide } from "@/components/admin/AdminGuide";
import { BottomNav } from '@/components/BottomNav';
import { DesktopSideNav } from '@/components/DesktopSideNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  React.useEffect(() => {
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
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      if (profile?.is_admin) {
        setIsAdmin(true);
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
                <UsersTab />
              </TabsContent>
              
              <TabsContent value="posts">
                <PostsTab />
              </TabsContent>
              
              <TabsContent value="kyc">
                <KYCTab />
              </TabsContent>
              
              <TabsContent value="documents">
                <KYCDocumentsTab />
              </TabsContent>
              
              <TabsContent value="admins">
                <AdminsTab />
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
