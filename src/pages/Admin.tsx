
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
  BarChart
} from "lucide-react";

interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  admin_notes: string | null;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  updated_at: string;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  kyc_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  roles: Array<{
    role: 'admin' | 'user';
  }>;
  updated_at: string;
  address: string | null;
  avatar_url: string | null;
  phone: string | null;
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
  });

  useEffect(() => {
    checkAdminAccess();
    fetchData();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth/signin');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (!roles?.length) {
      navigate('/');
      toast.error("Access denied. Admin privileges required.");
      return;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch KYC documents with profiles
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_documents')
        .select(`
          *,
          profile:profiles!kyc_documents_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (kycError) throw kycError;

      // Fetch users with their roles
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select(`
          *,
          roles:user_roles(role)
        `)
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      // Safely type cast the data
      const typedKycData = (kycData || []) as KYCDocument[];
      const typedUserData = (userData || []).map(user => ({
        ...user,
        email: '', // Add missing required field
      })) as UserProfile[];

      setKycDocuments(typedKycData);
      setUsers(typedUserData);

      setStats({
        totalUsers: typedUserData.length,
        pendingKYC: typedKycData.filter(doc => doc.status === 'pending').length,
        verifiedUsers: typedUserData.filter(user => user.kyc_status === 'verified').length,
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

  const handleMakeAdmin = async (userId: string) => {
    try {
      // Check if user is already admin
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRole) {
        toast.info("User is already an admin");
        return;
      }

      // Add admin role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (insertError) throw insertError;

      toast.success("User promoted to admin successfully");
      fetchData();
    } catch (error: any) {
      console.error('Error making user admin:', error);
      toast.error(error.message || "Failed to make user admin");
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
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingKYC}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verifiedUsers}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="kyc" className="space-y-4">
          <TabsList>
            <TabsTrigger value="kyc">KYC Verification</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="kyc" className="space-y-4">
            {kycDocuments.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
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
                    }>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <a 
                      href={doc.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      View Document
                    </a>
                  </div>

                  {doc.status === 'pending' && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleKYCAction(doc.id, doc.user_id, 'verify')}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleKYCAction(doc.id, doc.user_id, 'reject')}
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

          <TabsContent value="users" className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.roles?.some(r => r.role === 'admin') ? (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                          Admin
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMakeAdmin(user.id)}
                        >
                          Make Admin
                        </Button>
                      )}
                      <Badge variant={
                        user.kyc_status === 'verified'
                          ? 'outline'
                          : user.kyc_status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }>
                        {user.kyc_status?.charAt(0).toUpperCase() + user.kyc_status?.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
