
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon, Eye } from "lucide-react";

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

interface UsersTabProps {
  users: UserProfile[];
  onViewUserProfile: (userId: string) => void;
}

export function UsersTab({ users, onViewUserProfile }: UsersTabProps) {
  return (
    <>
      {users.map((user) => (
        <Card key={user.id} className="overflow-hidden border-blue-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || ''} />
                  <AvatarFallback>
                    <UserIcon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    {user.first_name} {user.last_name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2"
                  onClick={() => onViewUserProfile(user.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
