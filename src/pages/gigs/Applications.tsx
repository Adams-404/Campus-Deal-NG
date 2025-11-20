import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mockApplications } from "@/data/mockGigs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Clock, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function Applications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { theme } = useTheme();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    setApplications(mockApplications);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.gigs?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.proposal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={cn(
            "text-2xl md:text-3xl font-bold mb-2",
            theme === 'light' ? "text-gray-900" : "text-white"
          )}>
            My Applications
          </h1>
          <p className={cn(
            "text-sm",
            theme === 'light' ? "text-gray-600" : "text-gray-400"
          )}>
            Track the status of your gig applications
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className={cn(
              "mt-4",
              theme === 'light' ? "text-gray-600" : "text-gray-400"
            )}>
              Loading your applications...
            </p>
          </div>
        ) : filteredApplications.length === 0 ? (
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
              {searchTerm || statusFilter !== "all" ? "No applications found" : "No applications yet"}
            </h3>
            <p className={cn(
              "text-sm",
              theme === 'light' ? "text-gray-600" : "text-gray-400"
            )}>
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Start applying to gigs to see them here"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <Card key={application.id} className={cn(
                "hover:shadow-md transition-shadow",
                theme === 'light' ? "bg-white" : "bg-gray-800"
              )}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className={cn(
                        "text-lg mb-2",
                        theme === 'light' ? "text-gray-900" : "text-white"
                      )}>
                        {application.gigs?.title}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className={cn(
                            theme === 'light' ? "text-gray-600" : "text-gray-400"
                          )}>
                            Applied {formatDistanceToNow(new Date(application.created_at))} ago
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            "font-medium",
                            theme === 'light' ? "text-gray-900" : "text-white"
                          )}>
                            ${application.gigs?.budget_min} - ${application.gigs?.budget_max}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge className={cn("flex items-center gap-1", getStatusColor(application.status))}>
                      {getStatusIcon(application.status)}
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className={cn(
                        "font-medium mb-1",
                        theme === 'light' ? "text-gray-900" : "text-white"
                      )}>
                        Your Proposal:
                      </h4>
                      <p className={cn(
                        "text-sm",
                        theme === 'light' ? "text-gray-600" : "text-gray-400"
                      )}>
                        {application.proposal}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-medium",
                          theme === 'light' ? "text-gray-900" : "text-white"
                        )}>
                          Your Rate: ${application.rate}
                        </span>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}