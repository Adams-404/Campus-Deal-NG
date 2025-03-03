
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User as UserIcon,
  Mail,
  Calendar,
  Shield,
  Edit2,
  AlertCircle,
  Phone,
  MapPin,
  BadgeCheck,
  Crown,
  Image,
  Eye,
  Trash2,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  LayoutDashboard,
  Menu,
  HelpCircle,
  X,
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminGuide } from "@/components/admin/AdminGuide";
import { UsersTab } from "@/components/admin/UsersTab";
import { AdminsTab } from "@/components/admin/AdminsTab";
import { UserDetailsModal } from "@/components/admin/UserDetailsModal";
import { KYCDocumentsTab } from "@/components/admin/KYCDocumentsTab";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { 
  Profile, 
  UserProfile, 
  KYCDocument, 
  ItemType, 
  KycStatus, 
  DashboardStats 
} from "@/components/admin/types";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface SimpleItemSeller {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface SimpleItemImage {
  image_url: string;
}

interface SimpleItem {
  id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
  description: string;
  seller: SimpleItemSeller;
  item_images?: SimpleItemImage[];
  images: string[];
}

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [items, setItems] = useState<ItemType[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedKYCDocument, setSelectedKYCDocument] = useState<KYCDocument | null>(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showKYCDetailsModal, setShowKYCDetailsModal] = useState(false);
  const [userItems, setUserItems] = useState<ItemType[]>([]);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemType | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'admins' | 'kyc' | 'posts'>('dashboard');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdatingKYC, setIsUpdatingKYC] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showGuideSheet, setShowGuideSheet] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalItems: 0,
    pendingKyc: 0,
    activeSellers: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/sign-in');
        return;
      }

      setUser(user);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast.error('Error fetching profile');
        return;
      }

      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      setProfile({ ...profileData, roles: roles || [] });

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        toast.error('Error fetching users');
        return;
      }

      const usersWithRoles = await Promise.all(
        usersData.map(async (userData) => {
          const { data: userRoles, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userData.id);

          if (roleError) {
            console.error('Error fetching role:', roleError);
            return { ...userData, roles: [] };
          }

          return { ...userData, roles: userRoles || [] };
        })
      );

      setUsers(usersWithRoles);

      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          id,
          title,
          price,
          status,
          created_at,
          description,
          seller:profiles (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          item_images (
            image_url
          )
        `)
        .order('created_at', { ascending: false });

      if (itemsError) {
        console.error('Error fetching items:', itemsError);
        toast.error('Error fetching items');
        return;
      }

      const formattedItems = itemsData.map((item: SimpleItem) => {
        return {
          id: item.id,
          title: item.title,
          price: item.price,
          status: item.status,
          created_at: item.created_at,
          description: item.description,
          seller: item.seller ? {
            id: item.seller.id,
            first_name: item.seller.first_name || '',
            last_name: item.seller.last_name || '',
            avatar_url: item.seller.avatar_url || ''
          } : null,
          images: item.item_images ? item.item_images.map((img: SimpleItemImage) => img.image_url) : []
        };
      });

      setItems(formattedItems);

      const { data: kycData, error: kycError } = await supabase
        .from('kyc_documents')
        .select(`
          *,
          profile:profiles (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (kycError) {
        console.error('Error fetching KYC documents:', kycError);
        toast.error('Error fetching KYC documents');
        return;
      }

      setKycDocuments(kycData);

      setDashboardStats({
        totalUsers: usersData.length,
        totalItems: formattedItems.length,
        pendingKyc: kycData.filter(doc => doc.status === 'pending').length,
        activeSellers: [...new Set(formattedItems.filter(item => item.status === 'active').map(item => item.seller.id))].length
      });
    } catch (error) {
      console.error('Error in getProfile:', error);
      toast.error('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUserProfile = async (userId: string) => {
    const selected = users.find(user => user.id === userId);
    setSelectedUser(selected || null);

    if (selected) {
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          id,
          title,
          price,
          status,
          created_at,
          description,
          seller:profiles (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          item_images (
            image_url
          )
        `)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (itemsError) {
        console.error('Error fetching user items:', itemsError);
        toast.error('Error fetching user items');
        setUserItems([]);
      } else {
        const formattedItems = itemsData.map((item: SimpleItem) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          status: item.status,
          created_at: item.created_at,
          description: item.description,
          seller: item.seller ? {
            id: item.seller.id,
            first_name: item.seller.first_name || '',
            last_name: item.seller.last_name || '',
            avatar_url: item.seller.avatar_url || ''
          } : null,
          images: item.item_images ? item.item_images.map((img: SimpleItemImage) => img.image_url) : []
        }));
        
        setUserItems(formattedItems);
      }
    }

    setShowUserDetailsModal(true);
  };

  const handleViewKYCDocument = (document: KYCDocument) => {
    setSelectedKYCDocument(document);
    setAdminNotes(document.admin_notes || '');
    setShowKYCDetailsModal(true);
  };

  const handleKYCStatusUpdate = async (documentId: string, newStatus: KycStatus) => {
    setIsUpdatingKYC(true);
    try {
      const { error } = await supabase
        .from('kyc_documents')
        .update({ 
          status: newStatus, 
          admin_notes: adminNotes, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', documentId);

      if (error) {
        console.error('Error updating KYC status:', error);
        toast.error('Failed to update KYC status');
      } else {
        toast.success('KYC status updated successfully!');
        getProfile();
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsUpdatingKYC(false);
      setShowKYCDetailsModal(false);
    }
  };

  const handleAdminAction = (user: UserProfile | null, action: 'add' | 'remove') => {
    if (action === 'add') {
      setShowAddAdminModal(true);
    } else if (action === 'remove' && user) {
      setSelectedUser(user);
      setShowDeleteConfirmation(true);
    }
  };

  const handleMakeAdmin = async (userEmail: string) => {
    setIsAddingAdmin(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail);

      if (usersError || !usersData || usersData.length === 0) {
        console.error('Error finding user:', usersError);
        toast.error('User not found with that email');
        return;
      }

      const targetUser = usersData[0];

      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUser.id);

      if (roleError) {
        console.error('Error checking role:', roleError);
        toast.error('Error checking user role');
        return;
      }

      const isAdmin = roles?.some(r => r.role === 'admin') ?? false;
      if (isAdmin) {
        toast.error('User is already an admin');
        return;
      }

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([{ user_id: targetUser.id, role: 'admin' }]);

      if (insertError) {
        console.error('Error adding admin role:', insertError);
        toast.error('Failed to add admin role');
        return;
      }

      toast.success('Admin role added successfully!');
      getProfile();
    } catch (error) {
      console.error('Error in handleMakeAdmin:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsAddingAdmin(false);
      setShowAddAdminModal(false);
    }
  };

  const handleRemoveAdmin = async () => {
    setIsAddingAdmin(true);
    if (!selectedUser) return;

    try {
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id)
        .eq('role', 'admin');

      if (deleteError) {
        console.error('Error removing admin role:', deleteError);
        toast.error('Failed to remove admin role');
        return;
      }

      toast.success('Admin role removed successfully!');
      getProfile();
    } catch (error) {
      console.error('Error in handleRemoveAdmin:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsAddingAdmin(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleDeleteItem = async (item: ItemType) => {
    setItemToDelete(item);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      // Optimistically update the UI first
      setItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));
      setItemToDelete(null);
      setShowDeleteConfirmation(false);

      const { data: { user } } = await supabase.auth.getUser();
      const isAdmin = user ? await checkIfUserIsAdmin(user.id) : false;

      if (isAdmin) {
        if (itemToDelete.seller && itemToDelete.seller.id !== user?.id) {
          // Admin deleting another user's item (soft delete)
          const { error: updateError } = await supabase
            .from('items')
            .update({
              status: 'deleted',
              description: itemToDelete.description + "\n\n[ADMIN DELETED] Reason: Violated community guidelines"
            })
            .eq('id', itemToDelete.id);
            
          if (updateError) throw updateError;
          
          // Notify the seller
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: itemToDelete.seller.id,
              type: 'admin_action',
              title: 'Your listing has been removed',
              content: `Your listing "${itemToDelete.title}" has been removed by an admin.\nReason: Violated community guidelines`,
              metadata: {
                item_id: itemToDelete.id,
                item_title: itemToDelete.title,
                admin_reason: "Violated community guidelines"
              }
            });
            
          if (notificationError) {
            console.error('Error creating notification:', notificationError);
          }
          
          toast.success('Item has been removed by admin');
        } else {
          // Admin deleting their own item
          const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', itemToDelete.id);

          if (error) throw error;
          toast.success('Item deleted successfully!');
        }
      } else {
        // Regular user deleting their own item
        const { error } = await supabase
          .from('items')
          .delete()
          .eq('id', itemToDelete.id);

        if (error) throw error;
        toast.success('Item deleted successfully!');
      }
    } catch (error: any) {
      console.error('Error in confirmDeleteItem:', error);
      toast.error('An unexpected error occurred');
      getProfile(); // Refresh the data in case of error
    }
  };
  
  const checkIfUserIsAdmin = async (userId: string): Promise<boolean> => {
    try {
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (roleError) {
        console.error('Error checking admin status:', roleError);
        return false;
      }

      return roles?.some(r => r.role === 'admin') ?? false;
    } catch (error) {
      console.error('Error in checkIfUserIsAdmin:', error);
      return false;
    }
  };

  const columns: ColumnDef<ItemType>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => `₦${row.getValue("price")}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            row.getValue("status") === 'active'
              ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20'
              : row.getValue("status") === 'deleted'
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
                : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border-gray-500/20'
          )}
        >
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: 'seller',
      header: 'Seller',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={row.original.seller?.avatar_url || ''} />
            <AvatarFallback>
              <UserIcon className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          <span>{row.original.seller?.first_name} {row.original.seller?.last_name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate(`/item/${row.original.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              View Item
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDeleteItem(row.original)}>
              <Trash2 className="h-4 w-4 mr-2 text-red-500" />
              Delete Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (profile?.roles?.every(r => r.role !== 'admin')) {
    return (
      <PageTransition>
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertTitle>Unauthorized</AlertTitle>
            <AlertDescription>
              You do not have permission to access this page.
            </AlertDescription>
          </Alert>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container max-w-7xl mx-auto px-4 py-4 pb-32">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-2 md:gap-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback>
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline">{profile?.first_name} {profile?.last_name}</span>
            
            <Sheet open={showGuideSheet} onOpenChange={setShowGuideSheet}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative md:hidden">
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[90vw] sm:w-[385px] overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle>Admin Guide</SheetTitle>
                  <SheetDescription>
                    Learn how to use the admin dashboard effectively
                  </SheetDescription>
                </SheetHeader>
                <AdminGuide />
                <SheetFooter className="mt-4">
                  <SheetClose asChild>
                    <Button variant="outline" className="w-full">Close</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle>Admin Guide</SheetTitle>
                  <SheetDescription>
                    Learn how to use the admin dashboard effectively
                  </SheetDescription>
                </SheetHeader>
                <AdminGuide />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block md:col-span-1 sticky top-20`}>
            <Card className="border-blue-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start",
                      activeTab === 'dashboard' ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20" : "text-muted-foreground hover:bg-secondary/50"
                    )}
                    onClick={() => {
                      setActiveTab('dashboard');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start",
                      activeTab === 'users' ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20" : "text-muted-foreground hover:bg-secondary/50"
                    )}
                    onClick={() => {
                      setActiveTab('users');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <UserIcon className="w-4 h-4 mr-2" />
                    Users
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start",
                      activeTab === 'admins' ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20" : "text-muted-foreground hover:bg-secondary/50"
                    )}
                    onClick={() => {
                      setActiveTab('admins');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Admins
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start",
                      activeTab === 'kyc' ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20" : "text-muted-foreground hover:bg-secondary/50"
                    )}
                    onClick={() => {
                      setActiveTab('kyc');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    KYC Documents
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start",
                      activeTab === 'posts' ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20" : "text-muted-foreground hover:bg-secondary/50"
                    )}
                    onClick={() => {
                      setActiveTab('posts');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Posts
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="hidden md:block mt-4">
              <AdminGuide />
            </div>
          </div>

          <div className="md:col-span-3">
            {activeTab === 'dashboard' && (
              <DashboardOverview stats={dashboardStats} recentItems={items} kycDocuments={kycDocuments} />
            )}
            {activeTab === 'users' && (
              <UsersTab users={users} onViewUserProfile={handleViewUserProfile} />
            )}
            {activeTab === 'admins' && (
              <AdminsTab
                users={users}
                onViewUserProfile={handleViewUserProfile}
                onAdminAction={handleAdminAction}
              />
            )}
            {activeTab === 'kyc' && (
              <KYCDocumentsTab
                kycDocuments={kycDocuments}
                onViewKYCDocument={handleViewKYCDocument}
              />
            )}
            {activeTab === 'posts' && (
              <Card className="overflow-hidden border-blue-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <CardContent className="p-4 md:p-6">
                  <h2 className="text-xl md:text-2xl font-semibold mb-4">All Posts</h2>
                  <div className="overflow-auto">
                    <DataTable columns={columns} data={items} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <UserDetailsModal
          open={showUserDetailsModal}
          onOpenChange={setShowUserDetailsModal}
          user={selectedUser}
          userItems={userItems}
        />

        <Dialog open={showKYCDetailsModal} onOpenChange={setShowKYCDetailsModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>KYC Document Details</DialogTitle>
              <DialogDescription>
                Review and update the status of the KYC document.
              </DialogDescription>
            </DialogHeader>
            {selectedKYCDocument && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {selectedKYCDocument.profile?.first_name?.[0]}{selectedKYCDocument.profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedKYCDocument.profile?.first_name} {selectedKYCDocument.profile?.last_name}</h3>
                    <p className="text-sm text-muted-foreground">User ID: {selectedKYCDocument.user_id}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Document Type</p>
                  <p className="text-sm text-muted-foreground">{selectedKYCDocument.document_type}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Document URL</p>
                  <a href={selectedKYCDocument.document_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                    View Document
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Admin Notes</p>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about the document"
                    className="resize-none"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowKYCDetailsModal(false)} disabled={isUpdatingKYC}>
                Cancel
              </Button>
              <Button onClick={() => handleKYCStatusUpdate(selectedKYCDocument!.id, 'rejected')} variant="destructive" disabled={isUpdatingKYC}>
                Reject
              </Button>
              <Button onClick={() => handleKYCStatusUpdate(selectedKYCDocument!.id, 'verified')} disabled={isUpdatingKYC}>
                {isUpdatingKYC ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating
                  </>
                ) : 'Verify'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddAdminModal} onOpenChange={setShowAddAdminModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
              <DialogDescription>
                Enter the email address of the user you want to make an admin.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="col-span-3"
                  type="email"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddAdminModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleMakeAdmin(newAdminEmail)} disabled={isAddingAdmin}>
                {isAddingAdmin ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Make Admin'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmation</DialogTitle>
              <DialogDescription>
                {itemToDelete ? 
                  `Are you sure you want to delete this item: ${itemToDelete.title}?` : 
                  `Are you sure you want to remove admin role from ${selectedUser?.first_name} ${selectedUser?.last_name}?`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowDeleteConfirmation(false)}>
                Cancel
              </Button>
              {itemToDelete ? (
                <Button variant="destructive" onClick={confirmDeleteItem}>
                  Delete Item
                </Button>
              ) : (
                <Button variant="destructive" onClick={handleRemoveAdmin} disabled={isAddingAdmin}>
                  {isAddingAdmin ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Remove Admin'
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default Admin;
