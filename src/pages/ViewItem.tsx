import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Heart, Share, MapPin, Calendar, Eye, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { SafetyTipsDialog } from "@/components/SafetyTipsDialog";
import { PageTransition } from "@/components/PageTransition";

interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  created_at: string;
  seller: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
  images: string[];
}

const ViewItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showSafetyTips, setShowSafetyTips] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select(`
          *,
          seller:profiles!items_seller_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          item_images (
            image_url
          )
        `)
        .eq('id', id)
        .single();

      if (itemError) throw itemError;

      const itemWithImages = {
        ...itemData,
        seller: itemData.seller,
        images: itemData.item_images?.map((img: any) => img.image_url) || []
      };

      setItem(itemWithImages);

      // Check if item is saved by current user
      if (user) {
        const { data: savedData } = await supabase
          .from('saved_items')
          .select('id')
          .eq('item_id', id)
          .eq('user_id', user.id)
          .single();
        
        setIsSaved(!!savedData);
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      toast.error('Failed to load item');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveItem = async () => {
    if (!user) {
      toast.error('Please sign in to save items');
      return;
    }

    try {
      if (isSaved) {
        await supabase
          .from('saved_items')
          .delete()
          .eq('item_id', id)
          .eq('user_id', user.id);
        
        setIsSaved(false);
        toast.success('Item removed from saved items');
      } else {
        await supabase
          .from('saved_items')
          .insert([{ item_id: id, user_id: user.id }]);
        
        setIsSaved(true);
        toast.success('Item saved successfully');
      }
    } catch (error) {
      console.error('Error toggling save item:', error);
      toast.error('Failed to save item');
    }
  };

  const createConversation = async () => {
    if (!user) {
      toast.error('Please sign in to message the seller');
      return;
    }

    if (!item) return;

    if (user.id === item.seller.id) {
      toast.error("You can't message yourself");
      return;
    }

    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(buyer_id.eq.${user.id},seller_id.eq.${item.seller.id}),and(buyer_id.eq.${item.seller.id},seller_id.eq.${user.id})`)
        .single();

      let conversationId;

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Create new conversation
        const { data: newConversation, error } = await supabase
          .from('conversations')
          .insert([{
            buyer_id: user.id,
            seller_id: item.seller.id,
            last_message: `Hi! I'm interested in your item: ${item.title}`,
            last_message_at: new Date().toISOString()
          }])
          .select('id')
          .single();

        if (error) throw error;
        conversationId = newConversation.id;

        // Send initial message
        await supabase
          .from('messages')
          .insert([{
            conversation_id: conversationId,
            sender_id: user.id,
            receiver_id: item.seller.id,
            content: `Hi! I'm interested in your item: ${item.title}`,
            item_id: item.id
          }]);
      }

      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: item?.title,
          text: `Check out this item: ${item?.title}`,
          url: url,
        });
      } catch (error) {
        // User cancelled sharing, just copy to clipboard
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10 ml-0 lg:ml-[300px] transition-all duration-300">
          <div className="relative max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Loading...</h1>
              <div className="w-10" />
            </div>
          </div>
        </div>
        <main className="w-full max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-300">
          <div className="pt-24 pb-32 space-y-4">
            <div className="h-64 bg-secondary rounded" />
            <div className="h-8 bg-secondary rounded w-3/4" />
            <div className="h-6 bg-secondary rounded w-1/2" />
          </div>
        </main>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Item not found</h1>
          <p className="text-muted-foreground mb-4">The item you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/40 ml-0 lg:ml-[300px] transition-all duration-300 shadow-sm">
        <div className="relative max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-lg font-semibold truncate max-w-xs sm:max-w-sm">{item.title}</h1>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="icon" onClick={handleShare} className="h-9 w-9 sm:h-10 sm:w-10">
                <Share className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSaveItem}
                className={`h-9 w-9 sm:h-10 sm:w-10 ${isSaved ? 'text-red-500' : ''}`}
              >
                <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isSaved ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PageTransition>
        <main className="w-full max-w-2xl lg:max-w-4xl mx-auto px-3 sm:px-4 md:px-6 transition-all duration-300">
          <div className="pt-20 sm:pt-24 pb-28 sm:pb-32">
            {/* Image Carousel */}
            <div className="mb-6 sm:mb-8 -mx-3 sm:mx-0">
              {item.images.length > 0 ? (
                <ImageCarousel 
                  images={item.images} 
                  aspectRatio="square"
                  className="sm:rounded-xl overflow-hidden"
                />
              ) : (
                <div className="aspect-square bg-secondary/50 flex items-center justify-center sm:rounded-xl">
                  <Eye className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Item Details */}
            <div className="space-y-6 sm:space-y-8">
              {/* Title and Price */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">{item.title}</h1>
                <p className="text-3xl sm:text-4xl font-bold text-primary">₦{item.price.toLocaleString()}</p>
              </div>

              {/* Item Info */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Category</h3>
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {item.category}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Condition</h3>
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    {item.condition}
                  </Badge>
                </div>
              </div>

              {/* Location and Date */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{formatDistanceToNow(new Date(item.created_at))} ago</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3">Description</h3>
                <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Seller Info */}
              <div className="p-4 sm:p-6 bg-muted/30 rounded-xl border border-border/50">
                <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Seller Information</h3>
                <div className="flex items-center gap-3 sm:gap-4">
                  <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                    <AvatarImage src={item.seller.avatar_url} />
                    <AvatarFallback className="text-lg sm:text-xl">
                      {item.seller.first_name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-base sm:text-lg">
                      {item.seller.first_name} {item.seller.last_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">Seller</p>
                  </div>
                </div>
              </div>

              {/* Safety Notice */}
              <div className="p-4 sm:p-6 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                      Stay Safe
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                      Always meet in public places and never send money in advance.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowSafetyTips(true)}
                      className="text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/20"
                    >
                      View Safety Tips
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Fixed Bottom Action Bar */}
        {user?.id !== item.seller.id && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border/40 ml-0 lg:ml-[300px] transition-all duration-300">
            <div className="max-w-2xl lg:max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              <Button 
                onClick={createConversation}
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
                size="lg"
              >
                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                Message Seller
              </Button>
            </div>
          </div>
        )}
      </PageTransition>

      <SafetyTipsDialog 
        open={showSafetyTips} 
        onOpenChange={setShowSafetyTips} 
      />
    </div>
  );
};

export default ViewItem;
