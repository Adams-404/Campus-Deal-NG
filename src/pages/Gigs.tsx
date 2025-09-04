import { useEffect, useState } from "react";
import { Search, Plus, MapPin, Clock, Star, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeviceType } from "@/hooks/use-mobile";
import { CreateGigModal } from "@/components/CreateGigModal";
import { GigCard } from "@/components/GigCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

import { PageTransition } from "@/components/PageTransition";
import { Navbar } from "@/components/Navbar";

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

const CATEGORIES = [
  "All Categories",
  "Tutoring",
  "Design & Creative",
  "Tech & Programming",
  "Writing & Translation",
  "Delivery & Moving",
  "Event Services",
  "Cleaning & Maintenance",
  "Photography",
  "Music & Audio",
  "Other"
];

const Gigs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("recent");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const deviceType = useDeviceType();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  useEffect(() => {
    fetchGigs();
  }, [selectedCategory, sortBy]);

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
          price: 25,
          location: "On Campus",
          duration: "1-2 hours",
          rating: 4.8,
          reviews_count: 24,
          tags: ["Math", "Calculus", "Algebra", "Homework Help"],
          user_id: "user1",
          user_name: "Sarah Johnson",
          user_avatar: "",
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: "2",
          title: "Logo Design & Branding",
          description: "Professional logo design and brand identity packages for startups and small businesses. Quick turnaround guaranteed.",
          category: "Design & Creative",
          price: 50,
          location: "Remote",
          duration: "2-3 days",
          rating: 4.9,
          reviews_count: 31,
          tags: ["Logo", "Branding", "Graphic Design", "Adobe"],
          user_id: "user2",
          user_name: "Alex Chen",
          user_avatar: "",
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: "3",
          title: "Website Development",
          description: "Full-stack web development services. React, Node.js, databases. Portfolio available upon request.",
          category: "Tech & Programming",
          price: 75,
          location: "Remote/On Campus",
          duration: "1-2 weeks",
          rating: 4.7,
          reviews_count: 18,
          tags: ["React", "Node.js", "Full Stack", "Web Development"],
          user_id: "user3",
          user_name: "Michael Rodriguez",
          user_avatar: "",
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: "4",
          title: "Campus Food Delivery",
          description: "Quick and reliable food delivery from any restaurant to your dorm or study location. Available evenings and weekends.",
          category: "Delivery & Moving",
          price: 8,
          location: "Campus Wide",
          duration: "30-45 mins",
          rating: 4.6,
          reviews_count: 67,
          tags: ["Food Delivery", "Quick", "Campus", "Flexible"],
          user_id: "user4",
          user_name: "Emma Wilson",
          user_avatar: "",
          created_at: new Date().toISOString(),
          is_active: true
        }
      ];
      
      let filteredGigs = mockGigs;
      
      if (selectedCategory !== "All Categories") {
        filteredGigs = filteredGigs.filter(gig => gig.category === selectedCategory);
      }
      
      // Sort gigs
      switch (sortBy) {
        case "price-low":
          filteredGigs.sort((a, b) => a.price - b.price);
          break;
        case "price-high":
          filteredGigs.sort((a, b) => b.price - a.price);
          break;
        case "rating":
          filteredGigs.sort((a, b) => b.rating - a.rating);
          break;
        case "recent":
        default:
          filteredGigs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
      }
      
      setGigs(filteredGigs);
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

  const filteredGigs = gigs.filter(gig =>
    gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gig.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gig.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <Navbar />
      <PageTransition>
        <div
          className={`min-h-screen ${deviceType === 'mobile' ? 'pb-20 pt-14' : 'ml-[300px] pt-14'} px-4 py-6`}
        >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Campus Gigs</h1>
              <p className="text-muted-foreground">Find services or offer your skills to fellow students</p>
            </div>
            {user && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Post a Gig
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search gigs, skills, or services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="browse" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="browse">Browse Gigs</TabsTrigger>
              <TabsTrigger value="my-gigs">My Gigs</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="mt-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredGigs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    {searchQuery || selectedCategory !== "All Categories" 
                      ? "No gigs found matching your criteria"
                      : "No gigs available at the moment"
                    }
                  </div>
                  {user && (
                    <Button onClick={() => setIsCreateModalOpen(true)} variant="outline">
                      Be the first to post a gig
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGigs.map((gig) => (
                    <GigCard key={gig.id} gig={gig} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-gigs" className="mt-6">
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  {user ? "You haven't posted any gigs yet" : "Sign in to view your gigs"}
                </div>
                {user && (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    Post Your First Gig
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {isCreateModalOpen && (
          <CreateGigModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onGigCreated={fetchGigs}
          />
        )}
        </div>
      </PageTransition>
    </>
  );
};

export default Gigs;