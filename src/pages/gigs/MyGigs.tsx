import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mockGigs } from "@/data/mockGigs";
import { GigCard } from "@/components/GigCard";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import { CreateGigModal } from "@/components/CreateGigModal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export default function MyGigs() {
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    fetchMyGigs();
  }, []);

  const fetchMyGigs = async () => {
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Filter mock gigs to simulate "my gigs" (just taking the first two for demo)
    const myMockGigs = mockGigs.slice(0, 2).map(gig => ({
      ...gig,
      status: gig.status || 'active'
    }));

    setGigs(myMockGigs);
    setLoading(false);
  };

  const filteredGigs = gigs.filter(gig => {
    const matchesSearch = gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || gig.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className={cn(
              "text-2xl md:text-3xl font-bold",
              theme === 'light' ? "text-gray-900" : "text-white"
            )}>
              My Gigs
            </h1>
            <p className={cn(
              "text-sm",
              theme === 'light' ? "text-gray-600" : "text-gray-400"
            )}>
              Manage your posted gigs and track their performance
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Gig
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search your gigs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Gigs Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className={cn(
              "mt-4",
              theme === 'light' ? "text-gray-600" : "text-gray-400"
            )}>
              Loading your gigs...
            </p>
          </div>
        ) : filteredGigs.length === 0 ? (
          <div className={cn(
            "text-center py-12 rounded-lg border-2 border-dashed",
            theme === 'light'
              ? "border-gray-300 bg-gray-50"
              : "border-gray-600 bg-gray-800/50"
          )}>
            <h3 className={cn(
              "text-lg font-semibold mb-2",
              theme === 'light' ? "text-gray-900" : "text-white"
            )}>
              {searchTerm || statusFilter !== "all" ? "No gigs found" : "No gigs yet"}
            </h3>
            <p className={cn(
              "text-sm mb-4",
              theme === 'light' ? "text-gray-600" : "text-gray-400"
            )}>
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Create your first gig to start offering your services"
              }
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Gig
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
      </div>

      <CreateGigModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGigCreated={fetchMyGigs}
      />
    </div>
  );
}