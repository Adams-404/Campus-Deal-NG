import { useParams, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { EditItemModal } from "@/components/EditItemModal";
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Share2, 
  User, 
  ZoomIn, 
  ZoomOut,
  Pencil,
  Trash2
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  title: string;
  price: number;
  condition: string;
  description: string;
  category: string;
  created_at: string;
  seller_id: string;
  status: string;
  seller?: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    phone?: string;
  };
  images: string[];
}

export default function ViewItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleItemUpdated = async () => {
    if (!id) return;
    try {
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select(`
          *,
          item_images (
            image_url
          ),
          profiles:seller_id (
            first_name,
            last_name,
            avatar_url,
            phone
          )
        `)
        .eq('id', id)
        .single();

      if (itemError) throw itemError;
      if (!itemData) throw new Error('Item not found');

      const sellerData = itemData.profiles;
      
      setItem({
        ...itemData,
        images: itemData.item_images?.map((img: any) => img.image_url) || [],
        seller: sellerData ? {
          full_name: sellerData.first_name && sellerData.last_name 
            ? `${sellerData.first_name} ${sellerData.last_name}`
            : sellerData.first_name || sellerData.last_name || 'Anonymous',
          first_name: sellerData.first_name || '',
          last_name: sellerData.last_name || '',
          avatar_url: sellerData.avatar_url || '',
          phone: sellerData.phone || ''
        } : {
          full_name: 'Anonymous',
          first_name: '',
          last_name: '',
          avatar_url: '',
          phone: ''
        }
      });
    } catch (error: any) {
      console.error('Error refreshing item:', error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data: itemData, error: itemError } = await supabase
          .from('items')
          .select(`
            *,
            item_images (
              image_url
            ),
            profiles:seller_id (
              first_name,
              last_name,
              avatar_url,
              phone
            )
          `)
          .eq('id', id)
          .single();

        if (itemError) throw itemError;
        if (!itemData) throw new Error('Item not found');

        setIsOwner(!!user && user.id === itemData.seller_id);

        const sellerData = itemData.profiles;
        
        setItem({
          ...itemData,
          images: itemData.item_images?.map((img: any) => img.image_url) || [],
          seller: sellerData ? {
            full_name: sellerData.first_name && sellerData.last_name 
              ? `${sellerData.first_name} ${sellerData.last_name}`
              : sellerData.first_name || sellerData.last_name || 'Anonymous',
            first_name: sellerData.first_name || '',
            last_name: sellerData.last_name || '',
            avatar_url: sellerData.avatar_url || '',
            phone: sellerData.phone || ''
          } : {
            full_name: 'Anonymous',
            first_name: '',
            last_name: '',
            avatar_url: '',
            phone: ''
          }
        });
      } catch (error: any) {
        console.error('Error fetching item:', error);
        toast.error(error.message);
        navigate('/home');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to delete an item');

      const { error } = await supabase
        .from('items')
        .update({ 
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('seller_id', user.id);

      if (error) {
        console.error('Error deleting item:', error);
        throw error;
      }

      toast.success('Item deleted successfully');
      navigate('/home');
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(error.message || 'Failed to delete item');
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 1));
  };

  const handleMessageSeller = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please sign in to message the seller');
        return;
      }

      if (user.id === item?.seller_id) {
        toast.error("You can't message yourself");
        return;
      }

      // First check if there's any existing conversation between these users
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select(`
          id,
          conversation_items!inner (
            item_id
          )
        `)
        .eq('buyer_id', user.id)
        .eq('seller_id', item?.seller_id)
        .single();

      let conversationId;

      if (existingConversation) {
        conversationId = existingConversation.id;
        
        // Check if this item is already being discussed in this conversation
        const itemExists = existingConversation.conversation_items.some(
          ci => ci.item_id === item?.id
        );

        if (itemExists) {
          // Item already being discussed, just navigate to the conversation
          navigate(`/messages/${conversationId}`);
          return;
        }

        // Add new item to existing conversation
        const { error: itemError } = await supabase
          .from('conversation_items')
          .insert({
            conversation_id: conversationId,
            item_id: item?.id
          });

        if (itemError) throw itemError;

        // Send a message about the new item
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            content: `Hi, I'm also interested in ${item?.title}`,
            sender_id: user.id,
            created_at: new Date().toISOString(),
            item_id: item?.id
          });

        if (messageError) throw messageError;

        // Update conversation's last message
        const { error: updateError } = await supabase
          .from('conversations')
          .update({
            last_message: `Also interested in ${item?.title}`,
            last_message_at: new Date().toISOString()
          })
          .eq('id', conversationId);

        if (updateError) throw updateError;

      } else {
        // Create new conversation if none exists
        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            buyer_id: user.id,
            seller_id: item?.seller_id,
            last_message: `Interested in ${item?.title}`,
            last_message_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (conversationError) throw conversationError;
        
        conversationId = newConversation.id;

        // Create conversation_items entry
        const { error: itemError } = await supabase
          .from('conversation_items')
          .insert({
            conversation_id: conversationId,
            item_id: item?.id
          });

        if (itemError) throw itemError;

        // Send initial message
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            content: `Hi, I'm interested in ${item?.title}`,
            sender_id: user.id,
            created_at: new Date().toISOString(),
            item_id: item?.id
          });

        if (messageError) throw messageError;
      }

      // Navigate to messages with the conversation
      navigate(`/messages/${conversationId}`);
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Item not found</h2>
          <Button onClick={() => navigate("/home")}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              {isOwner && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEditModal(true)}
                    className="h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                    className="h-9 w-9 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6">
        <PageTransition>
          <div className="pt-24 pb-32">
            <div className="rounded-lg overflow-hidden border border-white/10 relative h-[400px]">
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.2s' }} className="h-full">
                <ImageCarousel 
                  images={item.images} 
                  showZoom={true}
                  aspectRatio="full"
                  className="h-full"
                />
              </div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom(prev => Math.max(prev - 0.25, 1))}
                  disabled={zoom <= 1}
                  className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                  disabled={zoom >= 3}
                  className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{item.title}</h1>
                  <p className="text-3xl font-bold text-primary mt-2">₦{item.price}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={item.seller?.avatar_url} />
                    <AvatarFallback>
                      <User className="w-5 h-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {item.seller?.full_name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {item.seller?.phone || 'No phone number provided'}
                    </p>
                  </div>
                </div>
                {!isOwner && (
                  <Button 
                    onClick={handleMessageSeller}
                    className="ml-auto"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message Seller
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Condition</h2>
                  <p className="text-gray-400">{item.condition}</p>
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-2">Category</h2>
                  <p className="text-gray-400">{item.category}</p>
                </div>
                {item.description && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Description</h2>
                    <p className="text-gray-400 whitespace-pre-wrap">{item.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PageTransition>
      </main>

      <EditItemModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        onItemUpdated={handleItemUpdated}
        itemId={item.id}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your item listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
