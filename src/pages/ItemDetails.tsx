import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageSquare, Share, ChevronLeft } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { DesktopSideNav } from '@/components/DesktopSideNav';
import { useMobile } from '@/hooks/use-mobile';

const ItemDetails = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savingState, setSavingState] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { toast } = useToast();
  const isMobile = useMobile();

  useEffect(() => {
    fetchItemDetails();
    checkCurrentUser();
  }, [itemId]);

  const fetchItemDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          profiles:seller_id (*),
          item_images (*)
        `)
        .eq('id', itemId)
        .single();

      if (error) throw error;
      setItem(data);
      
      // Check if the item is saved by the current user
      if (currentUser) {
        checkIfItemIsSaved(data.id);
      }
    } catch (error: any) {
      toast({
        title: "Error loading item",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    
    if (user && itemId) {
      checkIfItemIsSaved(itemId);
    }
  };

  const checkIfItemIsSaved = async (itemId: string) => {
    if (!currentUser) return;
    
    const { data, error } = await supabase
      .from('saved_items')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('item_id', itemId)
      .single();
    
    if (!error && data) {
      setIsSaved(true);
    } else {
      setIsSaved(false);
    }
  };

  const handleToggleSave = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save items",
        variant: "default"
      });
      return;
    }

    setSavingState(true);
    try {
      if (isSaved) {
        // Remove from saved items
        const { error } = await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('item_id', itemId);
          
        if (error) throw error;
        
        setIsSaved(false);
        toast({
          title: "Item removed from saved",
          description: "The item has been removed from your saved items",
          variant: "default"
        });
      } else {
        // Add to saved items
        const { error } = await supabase
          .from('saved_items')
          .insert({
            user_id: currentUser.id,
            item_id: itemId
          });
          
        if (error) throw error;
        
        setIsSaved(true);
        toast({
          title: "Item saved",
          description: "The item has been added to your saved items",
          variant: "default"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSavingState(false);
    }
  };

  const startConversation = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to message the seller",
        variant: "default"
      });
      return;
    }
    
    if (currentUser.id === item.seller_id) {
      toast({
        title: "Cannot message yourself",
        description: "This is your own listing",
        variant: "default"
      });
      return;
    }
    
    try {
      // First check if a conversation already exists
      const { data: existingConvo, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('item_id', item.id)
        .or(`seller_id.eq.${item.seller_id},buyer_id.eq.${item.seller_id}`)
        .or(`seller_id.eq.${currentUser.id},buyer_id.eq.${currentUser.id}`)
        .maybeSingle();
      
      if (searchError) throw searchError;
      
      let conversationId;
      
      if (existingConvo) {
        // Conversation exists, get its ID
        conversationId = existingConvo.id;
      } else {
        // Create new conversation
        const { data: newConvo, error: insertError } = await supabase
          .from('conversations')
          .insert({
            buyer_id: currentUser.id,
            seller_id: item.seller_id,
            item_id: item.id,
            last_message: `Inquiry about: ${item.title}`
          })
          .select('id')
          .single();
        
        if (insertError) throw insertError;
        conversationId = newConvo.id;
      }
      
      // Navigate to the conversation
      window.location.href = `/messages?conversation=${conversationId}`;
    } catch (error: any) {
      toast({
        title: "Error starting conversation",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Item Not Found</h2>
        <p className="text-muted-foreground mb-6">This item may have been removed or is no longer available.</p>
        <Button asChild>
          <Link to="/home">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const conditionMap: Record<string, string> = {
    new: "New",
    like_new: "Like New",
    good: "Good",
    fair: "Fair",
    poor: "Poor"
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <DesktopSideNav />
        <div className="flex-1">
          <div className="container max-w-4xl mx-auto px-4 pb-24 pt-6">
            <Link to="/home" className="inline-flex items-center text-sm mb-4 hover:underline">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to listings
            </Link>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Image Gallery */}
              <div className="relative rounded-lg overflow-hidden bg-neutral-100">
                {item.item_images && item.item_images.length > 0 ? (
                  <div>
                    <img 
                      src={item.item_images[activeImageIndex]?.url || '/placeholder.svg'}
                      alt={item.title}
                      className="w-full h-[300px] md:h-[400px] object-cover"
                    />
                    
                    {item.item_images.length > 1 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto p-2">
                        {item.item_images.map((image: any, index: number) => (
                          <button
                            key={image.id}
                            onClick={() => setActiveImageIndex(index)}
                            className={`w-16 h-16 flex-shrink-0 rounded overflow-hidden border-2 ${
                              activeImageIndex === index ? 'border-primary' : 'border-transparent'
                            }`}
                          >
                            <img 
                              src={image.url} 
                              alt={`${item.title} - image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] md:h-[400px] bg-neutral-100">
                    <p className="text-muted-foreground">No images available</p>
                  </div>
                )}
              </div>
              
              {/* Item Details */}
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {conditionMap[item.condition] || item.condition}
                    </Badge>
                    <h1 className="text-2xl font-bold mb-1">{item.title}</h1>
                    <p className="text-xl font-semibold text-primary">${item.price.toFixed(2)}</p>
                  </div>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={savingState}
                    onClick={handleToggleSave}
                    className={isSaved ? "text-primary" : ""}
                  >
                    <Heart className={`w-6 h-6 ${isSaved ? "fill-primary text-primary" : ""}`} />
                  </Button>
                </div>
                
                <Separator className="my-4" />
                
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {item.description}
                  </p>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Location</h3>
                  <p className="text-muted-foreground">{item.location}</p>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center mb-6">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={item.profiles?.avatar_url} />
                    <AvatarFallback>
                      {item.profiles?.first_name?.[0] || ''}
                      {item.profiles?.last_name?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{item.profiles?.first_name} {item.profiles?.last_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Member since {new Date(item.profiles?.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button 
                    className="w-full" 
                    onClick={startConversation}
                    disabled={currentUser?.id === item.seller_id}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message Seller
                  </Button>
                  
                  <Button variant="outline" className="w-full" onClick={() => {
                    navigator.share({
                      title: item.title,
                      text: `Check out this item: ${item.title}`,
                      url: window.location.href
                    }).catch(() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({
                        title: "Link copied",
                        description: "Item link copied to clipboard",
                      });
                    });
                  }}>
                    <Share className="mr-2 h-4 w-4" />
                    Share Listing
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isMobile && <BottomNav />}
    </div>
  );
};

export default ItemDetails;
