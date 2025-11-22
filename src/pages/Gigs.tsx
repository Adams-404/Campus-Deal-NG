import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDeviceType } from "@/hooks/use-mobile";
import { CreateGigModal } from "@/components/CreateGigModal";
import { GigCard } from "@/components/GigCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { PageTransition } from "@/components/PageTransition";
import { useLocation } from "react-router-dom";
import { useGigs } from "@/hooks/useGigs";
import { useEffect } from "react";
import { GigCardSkeleton } from "@/components/GigCardSkeleton";

const Gigs = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { gigs, loading, refetch } = useGigs();
  const deviceType = useDeviceType();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24 sm:pt-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Available Gigs</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <GigCardSkeleton key={i} />
            ))}
          </div>
        ) : gigs.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <div className="text-muted-foreground mb-4">
              No gigs available at the moment
            </div>
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
              refetch();
            }}
          />
        )}
      </div>
    </PageTransition>
  );
};

export default Gigs;