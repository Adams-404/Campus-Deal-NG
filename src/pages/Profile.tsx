
import { User, Edit, Heart, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";

const Profile = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="bg-secondary">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">John Doe</h1>
              <p className="text-gray-400">Joined December 2023</p>
              <Button variant="outline" size="sm" className="mt-2">
                <Edit className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-secondary rounded-lg p-4">
            <Heart className="w-5 h-5 text-primary mb-2" />
            <h3 className="font-medium">Saved Items</h3>
            <p className="text-sm text-gray-400">12 items</p>
          </div>
          <div className="bg-secondary rounded-lg p-4">
            <Clock className="w-5 h-5 text-primary mb-2" />
            <h3 className="font-medium">Active Listings</h3>
            <p className="text-sm text-gray-400">5 items</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Reviews</h2>
          <div className="bg-secondary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">4.8</span>
              <span className="text-gray-400">(24 reviews)</span>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
