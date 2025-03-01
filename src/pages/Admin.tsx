
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
  Calendar,
  ExternalLink,
  Image,
  Trash2,
  Eye
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AdminActionModal } from "@/components/AdminActionModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ImageCarousel } from "@/components/ui/image-carousel";

// Define the KYC status type to match the database enum
type KycStatus = 'pending' | 'processing' | 'verified' | 'rejected';

// Define simpler types to avoid recursion issues
interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  address: string | null;
  phone: string | null;
  kyc_status: KycStatus;
  created_at: string;
  updated_at: string | null;
}

interface UserRole {
  role: 'admin' | 'user';
}

interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: KycStatus;
  created_at: string;
  admin_notes: string | null;
  updated_at: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
  };
}

interface UserProfile extends Profile {
  roles: UserRole[] | null;
}

interface ItemType {
  id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
  description: string;
  seller: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  images: string[];
}

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
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [userItems, setUserItems] = useState<ItemType[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    // Generate signed URLs for documents when kycDocuments change
    const generateSignedUrls = async () => {
      const urls: Record<string, string> = {};
      
      for (const doc of kycDocuments) {
        // Extract the file path from the document_url
        try {
          const url = new URL(doc.document_url);
          const pathParts = url.pathname.split('/');
          const bucketIndex = pathParts.findIndex(part => part === 'kyc_documents');
          
          if (bucketIndex !== -1 && bucketIndex + 2 < pathParts.length) {
            const userId = pathParts[bucketIndex + 1];
            const fileName = pathParts[bucketIndex + 2];
            const filePath = `${userId}/${fileName}`;
            
            try {
              const { data, error } = await supabase.storage
                .from('kyc_documents')
                .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
              
              if (data && !error) {
                urls[doc.id] = data.signedUrl;
              } else {
                console.error("Error getting signed URL:", error);
              }
            } catch (error) {
              console.error("Error in createSignedUrl:", error);
            }
          }
        } catch (error) {
          console.error("Invalid URL format:", doc.document_url, error);
        }
      }
      
      setDocumentUrls(urls);
    };
    
    if (kycDocuments.length > 0) {
      generateSignedUrls();
    }
  }, [kycDocuments]);

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

  const handleKYCAction = async (documentId: string, userId: string, action: 'verify' | 'reject', notes?: string) => {
    try {
      const status = action === 'verify' ? 'verified' : 'rejected';

      const { error: docError } = await supabase
        .from('kyc_documents')
        .update({ 
          status: status as KycStatus,
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (docError) throw docError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: status as KycStatus,
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
      // Get user by email from auth
      const { data, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw new Error('Failed to get users list. Make sure you have admin privileges.');
      }
      
      if (!data || !data.users) {
        throw new Error('No users found');
      }
      
      const matchingUser = data.users.find(u => u.email === email);
      
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

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      // Update the item status to 'deleted' and add admin reason
      const { error: updateError } = await supabase
        .from('items')
        .update({
          status: 'deleted',
          description: selectedItem.description + 
            "\n\n[ADMIN DELETED] Reason: " + (deleteReason || "Violated community guidelines")
        })
        .eq('id', selectedItem.id);
        
      if (updateError) throw updateError;
      
      toast.success('Item has been removed successfully');
      setShowDeleteItemDialog(false);
      setSelectedItem(null);
      setDeleteReason("");
      fetchData();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(error.message || 'Failed to delete item');
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

  const COLORS = ['#22c55e', '#f97316', '#eab308', '#ef4444']; // Green, Orange, Yellow, Red

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
          <Card className="border-orange-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing Verifications</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.processingKYC}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
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
                    <RechartsTooltip 
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
                    <RechartsTooltip
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden border-blue-500/30 bg-secondary/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative">
                    {item.images.length > 0 ? (
                      <ImageCarousel images={item.images} showZoom={false} />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-800">
                        <Image className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <Badge 
                      className={`absolute top-2 right-2 ${
                        item.status === 'active' 
                          ? 'bg-green-500/20 text-green-500 border-green-500/20' 
                          : item.status === 'deleted' 
                          ? 'bg-red-500/20 text-red-500 border-red-500/20'
                          : 'bg-gray-500/20 text-gray-500 border-gray-500/20'
                      }`}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1 mb-1">{item.title}</h3>
                    <p className="text-sm text-primary font-medium mb-2">₦{item.price}</p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={item.seller.avatar_url || ''} />
                        <AvatarFallback>
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span 
                        className="text-sm text-gray-400 hover:text-gray-300 cursor-pointer"
                        onClick={() => handleViewUserProfile(item.seller.id)}
                      >
                        {item.seller.first_name || 'Anonymous'}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 h-8"
                        onClick={() => navigate(`/item/${item.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="flex-1 h-8"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDeleteItemDialog(true);
                        }}
                        disabled={item.status === 'deleted'}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {items.length === 0 && (
              <Card className="border-blue-500/30 bg-secondary/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No posts found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto"
                          onClick={() => handleViewUserProfile(admin.id)}
                        >
                          View Profile
                        </Button>
                      </div>

                      <div className="grid gap-2">
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
                            : admin.kyc_status === 'processing'
                            ? 'secondary'
                            : 'secondary'
                        }
                        className={
                          admin.kyc_status === 'verified'
                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20'
                            : admin.kyc_status === 'rejected'
                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
                            : admin.kyc_status === 'processing'
                            ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20'
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
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h3 className="font-semibold">
                          {user.first_name} {user.last_name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        user.kyc_status === 'verified'
                          ? 'outline'
                          : user.kyc_status === 'rejected'
                          ? 'destructive'
                          : user.kyc_status === 'processing'
                          ? 'secondary'
                          : 'secondary'
                      }
                      className={
                        user.kyc_status === 'verified'
                          ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20'
                          : user.kyc_status === 'rejected'
                          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
                          : user.kyc_status === 'processing'
                          ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20'
                          : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20'
                      }>
                        {user.kyc_status?.charAt(0).toUpperCase() + user.kyc_status?.slice(1)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-2"
                        onClick={() => handleViewUserProfile(user.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="kyc" className="space-y-4">
            {kycDocuments
              .filter(doc => doc.status === 'processing') // First show all documents in 'processing' status
              .map((doc) => (
                <Card key={doc.id} className="overflow-hidden border-orange-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(249,115,22,0.1)]">
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
                      <Badge 
                        className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20"
                      >
                        Processing
                      </Badge>
                    </div>

                    <div className="mt-4">
                      {documentUrls[doc.id] ? (
                        <a 
                          href={documentUrls[doc.id]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                        >
                          View Document
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <p className="text-sm text-yellow-500">
                          Generating document link...
                        </p>
                      )}
                    </div>

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
                  </CardContent>
                </Card>
              ))}

            {kycDocuments
              .filter(doc => doc.status !== 'processing') // Then show all other documents
              .map((doc) => (
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
                      {documentUrls[doc.id] ? (
                        <a 
                          href={documentUrls[doc.id]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                        >
                          View Document
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <p className="text-sm text-yellow-500">
                          Generating document link...
                        </p>
                      )}
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
            
            {kycDocuments.length === 0 && (
              <Card className="overflow-hidden border-blue-500/30 bg-secondary/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No KYC verification documents submitted yet</p>
                </CardContent>
              </Card>
            )}
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

        {/* Item Deletion Dialog */}
        <Dialog open={showDeleteItemDialog} onOpenChange={setShowDeleteItemDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remove Listing</DialogTitle>
              <DialogDescription>
                This will mark the item as deleted and notify the seller.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for removal:</label>
                <Input
                  placeholder="Violates community guidelines..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="bg-background/50 border-blue-500/20"
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be shown to the seller.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteItemDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteItem}
                variant="destructive"
              >
                Remove Listing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Details Modal */}
        <Dialog open={showUserDetailsModal} onOpenChange={setShowUserDetailsModal}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            {viewingUser && (
              <>
                <DialogHeader>
                  <DialogTitle>User Profile</DialogTitle>
                  <DialogDescription>
                    View details and listings for this user
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={viewingUser.avatar_url || ''} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold">{viewingUser.first_name} {viewingUser.last_name}</h3>
                      <div className="flex gap-2">
                        <Badge variant={
                          viewingUser.kyc_status === 'verified'
                            ? 'outline'
                            : viewingUser.kyc_status === 'rejected'
                            ? 'destructive'
                            : viewingUser.kyc_status === 'processing'
                            ? 'secondary'
                            : 'secondary'
                        }
                        className={
                          viewingUser.kyc_status === 'verified'
                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20'
                            : viewingUser.kyc_status === 'rejected'
                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
                            : viewingUser.kyc_status === 'processing'
                            ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20'
                            : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20'
                        }>
                          {viewingUser.kyc_status?.charAt(0).toUpperCase() + viewingUser.kyc_status?.slice(1)}
                        </Badge>
                        {viewingUser.roles?.some(r => r.role === 'admin') && (
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            <Crown className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Contact Information</h4>
                      <div className="space-y-2">
                        {viewingUser.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{viewingUser.phone}</span>
                          </div>
                        )}
                        {viewingUser.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{viewingUser.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Joined {new Date(viewingUser.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Account Details</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                          <span>User ID: {viewingUser.id}</span>
                        </div>
                        {viewingUser.updated_at && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Last updated: {new Date(viewingUser.updated_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-4">User Listings ({userItems.length})</h4>
                    
                    {userItems.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {userItems.map(item => (
                          <div key={item.id} className="border rounded-md overflow-hidden bg-background/50">
                            <div className="aspect-video relative">
                              {item.images.length > 0 ? (
                                <img 
                                  src={item.images[0]}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                  <Image className="h-8 w-8 text-gray-600" />
                                </div>
                              )}
                              <Badge 
                                className={`absolute top-2 right-2 ${
                                  item.status === 'active' 
                                    ? 'bg-green-500/20 text-green-500 border-green-500/20' 
                                    : item.status === 'deleted' 
                                    ? 'bg-red-500/20 text-red-500 border-red-500/20'
                                    : 'bg-gray-500/20 text-gray-500 border-gray-500/20'
                                }`}
                              >
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="p-3">
                              <h5 className="font-medium line-clamp-1">{item.title}</h5>
                              <p className="text-sm text-primary mt-1">₦{item.price}</p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-gray-400">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={() => navigate(`/item/${item.id}`)}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No listings found for this user</p>
                    )}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUserDetailsModal(false)}>
                    Close
                  </Button>
                  <Button 
                    onClick={() => navigate(`/user/${viewingUser.id}`)}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Public Profile
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
