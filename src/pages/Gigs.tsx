import { useEffect, useState } from "react";
import { Search, Plus, MapPin, Clock, Star, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDeviceType } from "@/hooks/use-mobile";
import { CreateGigModal } from "@/components/CreateGigModal";
import { GigCard } from "@/components/GigCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { PageTransition } from "@/components/PageTransition";
import { useLocation } from "react-router-dom";

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
  user_avatar: string;
  created_at: string;
  is_active: boolean;
}

const Gigs = () => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const deviceType = useDeviceType();
  const { toast } = useToast();
  const location = useLocation();
  const user = null; // Replace with actual user logic if needed

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        setLoading(true);
        // For now, we'll use mock data since we haven't created the gigs table yet
        const mockGigs: Gig[] = [
        {
          id: "1",
          title: "Math Tutoring - Calculus & Algebra",
          description: "Experienced math tutor offering personalized sessions for students struggling with calculus and algebra. 4+ years experience.",
          category: "Tutoring",
          price: 5000, // ~$3.50 USD equivalent
          location: "On Campus",
          duration: "1-2 hours",
          rating: 4.8,
          reviews_count: 24,
          tags: ["Math", "Calculus", "Algebra", "Homework Help"],
          user_id: "user1",
          user_name: "Adesuwa Adebayo",
          user_avatar: "",
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: "2",
          title: "Logo Design & Branding",
          description: "Professional logo design and brand identity packages for startups and small businesses. Quick turnaround guaranteed.",
          category: "Design & Creative",
          price: 15000, // ~$10 USD equivalent
          location: "Remote",
          duration: "2-3 days",
          rating: 4.9,
          reviews_count: 31,
          tags: ["Logo", "Branding", "Graphic Design", "Adobe"],
          user_id: "user2",
          user_name: "Chinedu Okafor",
          user_avatar: "",
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: "3",
          title: "Website Development",
          description: "Full-stack web development services. React, Node.js, databases. Portfolio available upon request.",
          category: "Tech & Programming",
          price: 50000, // ~$35 USD equivalent
          location: "Remote/On Campus",
          duration: "1-2 weeks",
          rating: 4.7,
          reviews_count: 18,
          tags: ["React", "Node.js", "Full Stack", "Web Development"],
          user_id: "user3",
          user_name: "Ibrahim Mohammed",
          user_avatar: "",
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: "4",
          title: "Campus Food Delivery",
          description: "Quick and reliable food delivery from any restaurant to your dorm or study location. Available evenings and weekends.",
          category: "Delivery & Moving",
          price: 2000, // ~$1.50 USD equivalent
          location: "Campus Wide",
          duration: "30-45 mins",
          rating: 4.6,
          reviews_count: 67,
          tags: ["Food Delivery", "Quick", "Campus", "Flexible"],
          user_id: "user4",
          user_name: "Amina Bello",
          user_avatar: "",
          created_at: new Date().toISOString(),
          is_active: true
        }
      ];
      
  setGigs(mockGigs);
    } catch (error) {
      console.error("Error fetching gigs:", error);
      toast({
        title: "Error",
        description: "Failed to load gigs. Please try again.",
        variant: "destructive"
      });
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, []);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Available Gigs</h1>
          {user && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Gig
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : gigs.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <div className="text-muted-foreground mb-4">
              No gigs available at the moment
            </div>
            {user && (
              <Button onClick={() => setIsCreateModalOpen(true)} variant="outline">
                Be the first to post a gig
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        )}

        {isCreateModalOpen && (
          <CreateGigModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onGigCreated={() => {
              // Refresh gigs after creation
              fetchGigs();
            }}
          />
        )}
      </div>
    </PageTransition>
  );
};

export default Gigs;