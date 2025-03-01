
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "./types";
import { Calendar, MapPin, Phone, ShieldCheck, Shield, Mail, User as UserIcon, Eye, AlertTriangle, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsersTabProps {
  users: UserProfile[];
  onViewUserProfile: (userId: string) => void;
}

export function UsersTab({ users, onViewUserProfile }: UsersTabProps) {
  const getKycStatusColors = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          bg: 'bg-green-500/10',
          text: 'text-green-500',
          hover: 'hover:bg-green-500/20',
          border: 'border-green-500/20',
          icon: <ShieldCheck className="h-3.5 w-3.5 mr-1" />
        };
      case 'rejected':
        return {
          bg: 'bg-red-500/10',
          text: 'text-red-500',
          hover: 'hover:bg-red-500/20',
          border: 'border-red-500/20',
          icon: <AlertTriangle className="h-3.5 w-3.5 mr-1" />
        };
      case 'processing':
        return {
          bg: 'bg-orange-500/10',
          text: 'text-orange-500',
          hover: 'hover:bg-orange-500/20',
          border: 'border-orange-500/20',
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
        };
      default:
        return {
          bg: 'bg-yellow-500/10',
          text: 'text-yellow-500',
          hover: 'hover:bg-yellow-500/20',
          border: 'border-yellow-500/20',
          icon: <Shield className="h-3.5 w-3.5 mr-1" />
        };
    }
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card 
          key={user.id} 
          className="overflow-hidden border border-indigo-500/30 bg-gradient-to-br from-background to-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all duration-300"
        >
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-indigo-500/20 border-2 border-background">
                  <AvatarImage src={user.avatar_url || ''} />
                  <AvatarFallback className="bg-indigo-500/10 text-indigo-500">
                    <UserIcon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">
                    {user.first_name} {user.last_name}
                  </h3>
                  <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Joined {formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {user.kyc_status && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      getKycStatusColors(user.kyc_status).bg,
                      getKycStatusColors(user.kyc_status).text,
                      getKycStatusColors(user.kyc_status).hover,
                      getKycStatusColors(user.kyc_status).border
                    )}
                  >
                    {getKycStatusColors(user.kyc_status).icon}
                    {user.kyc_status.charAt(0).toUpperCase() + user.kyc_status.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {user.phone && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-purple-500/10 text-purple-600">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{user.phone}</span>
                </div>
              )}
              
              {user.address && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-500/10 text-blue-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm line-clamp-1">{user.address}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-500/10 text-amber-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{user.updated_at ? `Updated ${formatDate(user.updated_at)}` : 'Never updated'}</span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="px-6 py-4 bg-background/60 flex justify-end border-t border-indigo-500/10">
            <Button
              onClick={() => onViewUserProfile(user.id)}
              variant="outline"
              className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 border-indigo-500/20"
            >
              <Eye className="h-4 w-4 mr-1" />
              View Profile
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
