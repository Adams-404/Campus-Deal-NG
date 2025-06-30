
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Image, Trash2, Eye, UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { ItemType } from "./types";

export interface PostsTabProps {
  items: ItemType[];
  onViewUserProfile: (userId: string) => void;
  onDeleteItem: (itemId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function PostsTab({ items, onViewUserProfile, onDeleteItem, onRefresh }: PostsTabProps) {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

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
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(error.message || 'Failed to delete item');
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden border-blue-500/30 bg-secondary/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <div className="aspect-square relative">
              {item.images.length > 0 ? (
                <ImageCarousel images={item.images} />
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
                    <UserIcon className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span 
                  className="text-sm text-gray-400 hover:text-gray-300 cursor-pointer"
                  onClick={() => onViewUserProfile(item.seller.id)}
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
    </>
  );
}
