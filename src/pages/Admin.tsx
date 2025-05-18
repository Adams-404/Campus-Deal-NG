import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Copy, Trash2, UserCog, ShieldAlert, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { KYCTab } from "@/components/admin/KYCTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { ItemsTab } from "@/components/admin/ItemsTab";

interface User {
  id: string;
  email: string;
  created_at: string;
  role: string;
  user_metadata: {
    full_name: string;
    avatar_url: string;
  };
}

interface Item {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  status: string;
  seller_id: string;
  created_at: string;
  description?: string;
}

interface KycDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_front: string;
  document_back?: string;
  status: string;
  rejection_reason?: string;
  created_at: string;
}

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedItemStatus, setSelectedItemStatus] = useState<string | null>(null);
  const [selectedKycStatus, setSelectedKycStatus] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedKycDocument, setSelectedKycDocument] = useState<KycDocument | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isKycDialogOpen, setIsKycDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [itemStatus, setItemStatus] = useState<string>('');
  const [kycStatus, setKycStatus] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [isReasonDialogOpenItem, setIsReasonDialogOpenItem] = useState(false);
  const [isReasonDialogOpenKyc, setIsReasonDialogOpenKyc] = useState(false);
  const [itemDeletionReason, setItemDeletionReason] = useState<string>('');
  const [kycRejectionReason, setKycRejectionReason] = useState<string>('');
  const [isItemDeletionDialogOpen, setIsItemDeletionDialogOpen] = useState(false);
  const [isKycRejectionDialogOpen, setIsKycRejectionDialogOpen] = useState(false);
  const [isItemDeletionLoading, setIsItemDeletionLoading] = useState(false);
  const [isKycRejectionLoading, setIsKycRejectionLoading] = useState(false);
  const [isUserUpdateLoading, setIsUserUpdateLoading] = useState(false);
  const [isItemUpdateLoading, setIsItemUpdateLoading] = useState(false);
  const [isKycUpdateLoading, setIsKycUpdateLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*');

      if (usersError) throw usersError;

      setUsers(usersData || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Error fetching users",
        description: error.message
      });
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*');

      if (itemsError) throw itemsError;

      setItems(itemsData || []);
    } catch (error: any) {
      console.error('Error fetching items:', error);
      toast({
        variant: "destructive",
        title: "Error fetching items",
        description: error.message
      });
    }
  }, []);

  const fetchKycDocuments = useCallback(async () => {
    try {
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_documents')
        .select('*');

      if (kycError) throw kycError;

      setKycDocuments(kycData || []);
    } catch (error: any) {
      console.error('Error fetching KYC documents:', error);
      toast({
        variant: "destructive",
        title: "Error fetching KYC documents",
        description: error.message
      });
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchItems(), fetchKycDocuments()]);
      setLoading(false);
    };

    fetchData();
  }, [fetchUsers, fetchItems, fetchKycDocuments]);

  const handleUserOpenDialog = (user: User) => {
    setSelectedUser(user);
    setUserRole(user.role);
    setIsUserDialogOpen(true);
  };

  const handleItemOpenDialog = (item: Item) => {
    setSelectedItem(item);
    setItemStatus(item.status);
    setIsItemDialogOpen(true);
  };

  const handleKycOpenDialog = (kycDocument: KycDocument) => {
    setSelectedKycDocument(kycDocument);
    setKycStatus(kycDocument.status);
    setKycRejectionReason(kycDocument.rejection_reason || '');
    setIsKycDialogOpen(true);
  };

  const updateUserRole = async () => {
    if (!selectedUser) return;

    setIsUserUpdateLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: userRole })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully."
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role."
      });
    } finally {
      setIsUserUpdateLoading(false);
      setIsUserDialogOpen(false);
    }
  };

  const updateItemStatus = async () => {
    if (!selectedItem) return;

    setIsItemUpdateLoading(true);
    try {
      const { error } = await supabase
        .from('items')
        .update({ status: itemStatus })
        .eq('id', selectedItem.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item status updated successfully."
      });
      fetchItems();
    } catch (error: any) {
      console.error('Error updating item status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update item status."
      });
    } finally {
      setIsItemUpdateLoading(false);
      setIsItemDialogOpen(false);
    }
  };

  const updateKycStatus = async () => {
    if (!selectedKycDocument) return;

    setIsKycUpdateLoading(true);
    try {
      const { error } = await supabase
        .from('kyc_documents')
        .update({ status: kycStatus, rejection_reason: kycRejectionReason })
        .eq('id', selectedKycDocument.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "KYC document status updated successfully."
      });
      fetchKycDocuments();
    } catch (error: any) {
      console.error('Error updating KYC document status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update KYC document status."
      });
    } finally {
      setIsKycUpdateLoading(false);
      setIsKycDialogOpen(false);
    }
  };

  const deleteItem = async () => {
    if (!selectedItem) return;

    setIsItemDeletionLoading(true);
    try {
      const deletionReason = itemDeletionReason ? `[ADMIN DELETED] Reason: ${itemDeletionReason}` : '[ADMIN DELETED] No reason provided';
      const { error } = await supabase
        .from('items')
        .update({ status: 'deleted', description: deletionReason })
        .eq('id', selectedItem.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item deleted successfully."
      });
      fetchItems();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        variant: "destructive",
        title: "Error deleting item",
        description: error.message
      });
    } finally {
      setIsItemDeletionLoading(false);
      setIsItemDeletionDialogOpen(false);
      setIsItemDialogOpen(false);
    }
  };

  const rejectKycDocument = async () => {
    if (!selectedKycDocument) return;

    setIsKycRejectionLoading(true);
    try {
      const { error } = await supabase
        .from('kyc_documents')
        .update({ status: 'rejected', rejection_reason: kycRejectionReason })
        .eq('id', selectedKycDocument.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "KYC document rejected successfully."
      });
      fetchKycDocuments();
    } catch (error: any) {
      console.error('Error rejecting KYC document:', error);
      toast({
        variant: "destructive",
        title: "Error rejecting document",
        description: error.message
      });
    } finally {
      setIsKycRejectionLoading(false);
      setIsKycRejectionDialogOpen(false);
      setIsKycDialogOpen(false);
    }
  };

  const filteredUsers = selectedStatus
    ? users.filter(user => user.role === selectedStatus)
    : users;

  const filteredItems = selectedItemStatus
    ? items.filter(item => item.status === selectedItemStatus)
    : items;

  const filteredKycDocuments = selectedKycStatus
    ? kycDocuments.filter(doc => doc.status === selectedKycStatus)
    : kycDocuments;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        <PageTransition>
          <div className="pt-24 pb-32">
            <Tabs defaultValue="users" className="w-full">
              <TabsList>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="kyc">KYC Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="users" className="mt-4">
                <UsersTab />
              </TabsContent>
              <TabsContent value="items" className="mt-4">
                <ItemsTab />
              </TabsContent>
              <TabsContent value="kyc" className="mt-4">
                <KYCTab />
              </TabsContent>
            </Tabs>
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default Admin;
