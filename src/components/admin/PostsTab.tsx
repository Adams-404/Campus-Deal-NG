
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Trash2, Search, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ImageCarousel } from "@/components/ui/image-carousel";

interface Item {
  id: string;
  title: string;
  description?: string;
  price: number;
  category: string;
  condition: string;
  status: string;
  location?: string;
  created_at: string;
  seller_id: string;
  seller: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  item_images: Array<{
    image_url: string;
    is_primary: boolean;
  }>;
}

const PostsTab = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          profiles!seller_id (
            first_name,
            last_name,
            email
          ),
          item_images (
            image_url,
            is_primary
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        ...item,
        seller: {
          first_name: item.profiles?.first_name,
          last_name: item.profiles?.last_name,
          email: item.profiles?.email
        }
      })) || [];

      setItems(formattedData);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (item: Item) => {
    if (!deleteReason.trim()) {
      toast.error('Please provide a reason for deletion');
      return;
    }

    setDeleting(true);
    try {
      // Delete the item
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      // Send notification to seller
      await supabase.rpc('notify_seller_about_deletion', {
        seller_id: item.seller_id,
        item_title: item.title,
        reason: deleteReason
      });

      toast.success('Item deleted successfully');
      await fetchItems();
      setDeleteReason("");
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(error.message || 'Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'sold':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Sold</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Title', 'Seller', 'Email', 'Price', 'Category', 'Status', 'Created Date'],
      ...items.map(item => [
        item.title,
        `${item.seller.first_name || ''} ${item.seller.last_name || ''}`.trim() || 'N/A',
        item.seller.email || 'N/A',
        `₦${item.price.toLocaleString()}`,
        item.category,
        item.status,
        new Date(item.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'items-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${item.seller.first_name || ''} ${item.seller.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.seller.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posts Management</CardTitle>
          <CardDescription>Loading posts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-secondary rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Posts Management</CardTitle>
            <CardDescription>
              Manage and moderate user posts
            </CardDescription>
          </div>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, seller, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No items found matching your search.' : 'No items found.'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.item_images.length > 0 && (
                            <img
                              src={item.item_images.find(img => img.is_primary)?.image_url || item.item_images[0].image_url}
                              alt={item.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.location}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {`${item.seller.first_name || ''} ${item.seller.last_name || ''}`.trim() || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">{item.seller.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>₦{item.price.toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{item.category}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedItem(item)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Item Details</DialogTitle>
                              </DialogHeader>
                              {selectedItem && (
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="font-semibold text-lg">{selectedItem.title}</h3>
                                    <p className="text-2xl font-bold text-primary">₦{selectedItem.price.toLocaleString()}</p>
                                  </div>

                                  {selectedItem.item_images.length > 0 && (
                                    <div>
                                      <ImageCarousel 
                                        images={selectedItem.item_images.map(img => img.image_url)}
                                      />
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Category:</label>
                                      <p className="capitalize">{selectedItem.category}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Condition:</label>
                                      <p className="capitalize">{selectedItem.condition}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Location:</label>
                                      <p>{selectedItem.location}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Status:</label>
                                      <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                                    </div>
                                  </div>

                                  {selectedItem.description && (
                                    <div>
                                      <label className="text-sm font-medium">Description:</label>
                                      <p className="mt-1 text-sm">{selectedItem.description}</p>
                                    </div>
                                  )}

                                  <div>
                                    <label className="text-sm font-medium">Seller:</label>
                                    <div className="mt-1">
                                      <p>{`${selectedItem.seller.first_name || ''} ${selectedItem.seller.last_name || ''}`.trim()}</p>
                                      <p className="text-sm text-muted-foreground">{selectedItem.seller.email}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{item.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="my-4">
                                <label className="text-sm font-medium">Reason for deletion:</label>
                                <Textarea
                                  value={deleteReason}
                                  onChange={(e) => setDeleteReason(e.target.value)}
                                  placeholder="Provide a reason for deleting this item..."
                                  className="mt-1"
                                />
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteItem(item)}
                                  disabled={deleting || !deleteReason.trim()}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deleting ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostsTab;
