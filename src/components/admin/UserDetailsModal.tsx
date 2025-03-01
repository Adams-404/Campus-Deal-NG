
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { UserIcon, Phone, MapPin, Calendar, Clock, UserCheck, Crown, Image, Eye, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Type definitions
type KycStatus = 'pending' | 'processing' | 'verified' | 'rejected';

interface UserRole {
  role: 'admin' | 'user';
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  address: string | null;
  phone: string | null;
  kyc_status: KycStatus;
  created_at: string;
  updated_at: string | null;
  roles: UserRole[] | null;
}

interface ItemType {
  id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
  description: string;
  seller: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  images: string[];
}

interface UserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  userItems: ItemType[];
}

export function UserDetailsModal({ open, onOpenChange, user, userItems }: UserDetailsModalProps) {
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            View details and listings for this user
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar_url || ''} />
              <AvatarFallback>
                <UserIcon className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{user.first_name} {user.last_name}</h3>
              <div className="flex gap-2">
                <Badge variant={
                  user.kyc_status === 'verified'
                    ? 'outline'
                    : user.kyc_status === 'rejected'
                    ? 'destructive'
                    : user.kyc_status === 'processing'
                    ? 'secondary'
                    : 'secondary'
                }
                className={
                  user.kyc_status === 'verified'
                    ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20'
                    : user.kyc_status === 'rejected'
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
                    : user.kyc_status === 'processing'
                    ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20'
                    : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20'
                }>
                  {user.kyc_status?.charAt(0).toUpperCase() + user.kyc_status?.slice(1)}
                </Badge>
                {user.roles?.some(r => r.role === 'admin') && (
                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    <Crown className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Contact Information</h4>
              <div className="space-y-2">
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Account Details</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span>User ID: {user.id}</span>
                </div>
                {user.updated_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Last updated: {new Date(user.updated_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="text-sm font-medium mb-4">User Listings ({userItems.length})</h4>
            
            {userItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {userItems.map(item => (
                  <div key={item.id} className="border rounded-md overflow-hidden bg-background/50">
                    <div className="aspect-video relative">
                      {item.images.length > 0 ? (
                        <img 
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <Image className="h-8 w-8 text-gray-600" />
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
                    <div className="p-3">
                      <h5 className="font-medium line-clamp-1">{item.title}</h5>
                      <p className="text-sm text-primary mt-1">₦{item.price}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => navigate(`/item/${item.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No listings found for this user</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button 
            onClick={() => navigate(`/user/${user.id}`)}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Public Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
