import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Phone, MapPin, Calendar } from "lucide-react";
import { UserProfile } from "./types";

export interface AdminsTabProps {
  users: UserProfile[];
  onViewUserProfile: (userId: string) => void;
  onAdminAction: (user: UserProfile | null, action: 'add' | 'remove') => void;
}

export function AdminsTab({ users, onViewUserProfile, onAdminAction }: AdminsTabProps) {
  const handleViewUserProfile = (adminId: string) => {
    console.log('Admin ID to view profile:', adminId);
    onViewUserProfile(adminId);
  };

  return (
    <>
      <div className="flex justify-end">
        <Button
          onClick={() => onAdminAction(null, 'add')}
          className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
        >
          <Crown className="w-4 h-4" />
          Add New Admin
        </Button>
      </div>

      {users.map((admin) => (
        <Card key={admin.id} className="overflow-hidden border-blue-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <CardContent className="p-6">
            <div className="grid gap-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {admin.first_name} {admin.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">Administrator</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => handleViewUserProfile(admin.id)}
                >
                  View Profile
                </Button>
              </div>

              <div className="grid gap-2">
                {admin.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <span>{admin.phone}</span>
                  </div>
                )}
                {admin.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span>{admin.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>Joined {new Date(admin.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                  <Crown className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
                <Badge variant={
                  admin.kyc_status === 'verified'
                    ? 'outline'
                    : admin.kyc_status === 'rejected'
                    ? 'destructive'
                    : admin.kyc_status === 'processing'
                    ? 'secondary'
                    : 'secondary'
                }
                className={
                  admin.kyc_status === 'verified'
                    ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20'
                    : admin.kyc_status === 'rejected'
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
                    : admin.kyc_status === 'processing'
                    ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20'
                    : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20'
                }>
                  {admin.kyc_status?.charAt(0).toUpperCase() + admin.kyc_status?.slice(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
