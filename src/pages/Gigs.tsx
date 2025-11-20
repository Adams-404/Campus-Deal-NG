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

import { mockGigs, Gig } from "@/data/mockGigs";

const Gigs = () => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const deviceType = useDeviceType();
  const { toast } = useToast();
  const location = useLocation();
  const user = null; // Replace with actual user logic if needed

  const fetchGigs = async () => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
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

  useEffect(() => {
    fetchGigs();
  }, []);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24 sm:pt-6">
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