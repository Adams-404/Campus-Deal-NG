import { User, Edit, Heart, Clock, Star, Shield, Upload, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditProfileModal from "@/components/EditProfileModal";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageTransition } from "@/components/PageTransition";

const Profile = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isVerified = false; // This would come from your auth state
  const kycProgress = 30; // This would come from your auth state

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="bg-secondary">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center relative group">
                <User className="w-12 h-12 text-primary group-hover:opacity-50 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsEditModalOpen(true)}>
                    <Edit className="w-8 h-8 text-primary" />
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">John Doe</h1>
                {isVerified ? (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-green-500/20 text-green-500">
                    <Shield className="w-3 h-3" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Unverified
                  </Badge>
                )}
              </div>
              <p className="text-gray-400">Joined December 2023</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsEditModalOpen(true)}>
                <Edit className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PageTransition>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-secondary rounded-lg p-4 hover:bg-secondary/80 transition-colors cursor-pointer">
              <Heart className="w-5 h-5 text-red-500 mb-2" />
              <h3 className="font-medium">Saved Items</h3>
              <p className="text-sm text-gray-400">12 items</p>
            </div>
            <div className="bg-secondary rounded-lg p-4 hover:bg-secondary/80 transition-colors cursor-pointer">
              <Clock className="w-5 h-5 text-orange-500 mb-2" />
              <h3 className="font-medium">Active Listings</h3>
              <p className="text-sm text-gray-400">5 items</p>
            </div>
          </div>

          <div className="bg-secondary rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Shield className="w-6 h-6 text-yellow-500" />
                KYC Verification
              </h2>
              {isVerified ? (
                <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
                  <XCircle className="w-4 h-4 mr-1" /> Pending
                </Badge>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Verification Progress</span>
                  <span className="text-sm font-medium">{kycProgress}%</span>
                </div>
                <Progress value={kycProgress} className="h-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Email Verified</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>ID Upload Pending</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>Student Status Pending</span>
                </div>
              </div>
              {!isVerified && (
                <Button 
                  className="w-full mt-4 border-2 border-yellow-500 hover:border-yellow-600 bg-transparent hover:bg-transparent text-white" 
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Complete Verification
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Reviews
            </h2>
            <div className="bg-secondary rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">4.8</span>
                <span className="text-gray-400">(24 reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
      <EditProfileModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
    </div>
  );
};

export default Profile;
