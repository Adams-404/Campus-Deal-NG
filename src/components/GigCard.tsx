import { Clock, MapPin, Star, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gig } from "@/data/mockGigs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GigCardProps {
  gig: Gig;
  showActions?: boolean;
}

export const GigCard = ({ gig, showActions = false }: GigCardProps) => {
  const navigate = useNavigate();

  const handleContact = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please sign in to contact the seller');
        navigate('/auth/signin');
        return;
      }

      if (user.id === gig.user_id) {
        toast.error('You cannot contact yourself');
        return;
      }

      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(buyer_id.eq.${user.id},seller_id.eq.${gig.user_id}),and(buyer_id.eq.${gig.user_id},seller_id.eq.${user.id})`)
        .limit(1)
        .single();

      if (existingConv) {
        navigate(`/messages/${existingConv.id}`);
        return;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          buyer_id: user.id,
          seller_id: gig.user_id,
          last_message: `Interested in: ${gig.title}`,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/messages/${newConv.id}`);
      toast.success('Conversation started!');
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/user-profile/${gig.user_id}`);
  };

  const getUserName = () => {
    if (!gig.profiles) return 'Anonymous';
    const { first_name, last_name } = gig.profiles;
    if (first_name && last_name) return `${first_name} ${last_name}`;
    if (first_name) return first_name;
    return 'Anonymous';
  };

  const getInitials = () => {
    const name = getUserName();
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFirstImage = () => {
    if (gig.gig_images && gig.gig_images.length > 0) {
      return gig.gig_images[0].image_url;
    }
    return null;
  };

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-border flex flex-col h-full"
      onClick={() => navigate(`/gigs/${gig.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary" className="text-xs">
            {gig.category}
          </Badge>
          <div className="text-right">
            <div className="text-xl font-bold text-primary">₦{gig.price.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">per service</div>
          </div>
        </div>
        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {gig.title}
        </CardTitle>
      </CardHeader>

      {getFirstImage() && (
        <div className="px-6 pb-3">
          <img
            src={getFirstImage()!}
            alt={gig.title}
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
          {gig.description}
        </p>

        {gig.tags && gig.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {gig.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {gig.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{gig.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="space-y-2 mt-auto">
          {gig.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{gig.location}</span>
            </div>
          )}
          {gig.duration && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{gig.duration}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{gig.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({gig.reviews_count} reviews)</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80"
            onClick={handleUserClick}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={gig.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{getUserName()}</div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleContact}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};