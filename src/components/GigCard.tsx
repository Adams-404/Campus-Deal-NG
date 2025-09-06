import { Clock, MapPin, Star, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  duration: string;
  rating: number;
  reviews_count: number;
  tags: string[];
  user_id: string;
  user_name: string;
  user_avatar?: string;
  created_at: string;
  is_active: boolean;
}

interface GigCardProps {
  gig: Gig;
  showActions?: boolean;
}

export const GigCard = ({ gig, showActions = false }: GigCardProps) => {
  const handleContact = () => {
    // TODO: Implement contact functionality
    console.log("Contacting user for gig:", gig.id);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border border-border">
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
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {gig.description}
        </p>
        
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

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{gig.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{gig.duration}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{gig.rating}</span>
            <span className="text-muted-foreground">({gig.reviews_count} reviews)</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={gig.user_avatar} />
              <AvatarFallback className="text-xs">
                {gig.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{gig.user_name}</div>
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