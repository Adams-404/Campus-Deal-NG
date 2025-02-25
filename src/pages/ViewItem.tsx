import { useParams, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { ImageCarousel } from "@/components/ui/image-carousel";
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

interface Item {
  id: string;
  title: string;
  price: number;
  condition: string;
  description: string;
  category: string;
  created_at: string;
  seller_id: string;
  seller?: {
    full_name: string;
    avatar_url?: string;
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

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Fetch item with its images
        const { data: itemData, error: itemError } = await supabase
          .from('items')
          .select(`
            *,
            item_images (
              image_url
            )
          `)
          .eq('id', id)
          .eq('status', 'active')
          .single();

        if (itemError) throw itemError;
        if (!itemData) throw new Error('Item not found');

        // Check if current user is the owner
        setIsOwner(!!user && user.id === itemData.seller_id);

        // Fetch seller information
        const { data: sellerData, error: sellerError } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url, created_at')
          .eq('id', itemData.seller_id)
          .single();

        if (sellerError) throw sellerError;

        setItem({
          ...itemData,
          images: itemData.item_images.map((img: any) => img.image_url),
          seller: sellerData ? {
            full_name: sellerData.first_name && sellerData.last_name 
              ? `${sellerData.first_name} ${sellerData.last_name}`
              : sellerData.first_name || sellerData.last_name || 'Anonymous',
            avatar_url: sellerData.avatar_url
          } : undefined
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

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (id) {
        const { data: itemData } = await supabase
          .from('items')
          .select('seller_id')
          .eq('id', id)
          .single();
        
        if (itemData) {
          setIsOwner(!!session?.user && session.user.id === itemData.seller_id);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to delete an item');

      // Update the item status to deleted
      const { error } = await supabase
        .from('items')
        .update({ 
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('seller_id', user.id); // This ensures RLS policy is satisfied

      if (error) {
        console.error('Error deleting item:', error);
        throw new Error(error.message || 'Failed to delete item. Please try again.');
      }

      toast.success('Item deleted successfully');
      navigate('/home');
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(error.message);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 1));
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
      {/* Fixed Header */}
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
              {isOwner ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/edit-item/${id}`)}
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
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/share")}
                    className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
                  >
                    <Share2 className="h-5 w-5" />
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
            {/* Image Carousel */}
            <div className="rounded-lg overflow-hidden border border-white/10 relative">
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.2s' }}>
                <ImageCarousel 
                  images={item.images} 
                  className="aspect-[4/3] sm:aspect-[16/9]"
                  showZoom={true}
                />
              </div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                  className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Item Details */}
            <div className="mt-8 space-y-6">
              <div>
                <h1 className="text-2xl font-semibold mb-2">{item.title}</h1>
                <p className="text-3xl font-bold text-primary">₦{item.price}</p>
              </div>

              <div className="flex items-center justify-between py-4 border-y border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                    {item.seller?.avatar_url ? (
                      <img 
                        src={item.seller.avatar_url} 
                        alt={item.seller.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{item.seller?.full_name}</h3>
                    <p className="text-sm text-gray-400">
                      Listed {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {!isOwner && (
                  <Button className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Condition</p>
                      <p className="capitalize">{item.condition.replace('_', ' ')}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Category</p>
                      <p className="capitalize">{item.category}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Listed</p>
                      <p>{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2">Description</h2>
                  <p className="text-gray-300 whitespace-pre-line">{item.description}</p>
                </div>
              </div>
            </div>
          </div>
        </PageTransition>
      </main>

      {/* Fixed Bottom Action */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-white/10 p-4">
          <div className="max-w-2xl mx-auto flex gap-4">
            <Button variant="outline" className="flex-1">
              Make Offer
            </Button>
            <Button className="flex-1">
              Buy Now
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
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
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 