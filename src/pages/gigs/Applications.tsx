import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useGigApplications, useReceivedApplications, acceptApplication, rejectApplication } from "@/hooks/useGigs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Clock, CheckCircle, XCircle, Calendar, MessageSquare, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function Applications() {
  const { applications: sentApplications, loading: sentLoading, refetch: refetchSent } = useGigApplications();
  const { applications: receivedApplications, loading: receivedLoading, refetch: refetchReceived } = useReceivedApplications();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Response dialog state
  const [responseDialog, setResponseDialog] = useState<{
    open: boolean;
    type: 'accept' | 'reject' | null;
    applicationId: string | null;
  }>({ open: false, type: null, applicationId: null });
  const [responseMessage, setResponseMessage] = useState("");
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth/signin');
      }
    };
    checkUser();
  }, []);

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

  const openResponseDialog = (type: 'accept' | 'reject', applicationId: string) => {
    setResponseDialog({ open: true, type, applicationId });
    setResponseMessage("");
  };

  const closeResponseDialog = () => {
    setResponseDialog({ open: false, type: null, applicationId: null });
    setResponseMessage("");
  };

  const handleResponse = async () => {
    if (!responseDialog.applicationId || !responseDialog.type) return;

    try {
      setResponding(true);

      if (responseDialog.type === 'accept') {
        await acceptApplication(responseDialog.applicationId, responseMessage || undefined);
      } else {
        await rejectApplication(responseDialog.applicationId, responseMessage || undefined);
      }

      refetchReceived();
      closeResponseDialog();
    } catch (error) {
      console.error('Error responding to application:', error);
    } finally {
      setResponding(false);
    }
  };

  const filteredSentApplications = sentApplications.filter(app => {
    const matchesSearch = app.gigs?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.message || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredReceivedApplications = receivedApplications.filter(app => {
    const matchesSearch = app.gigs?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderApplicationCard = (application: any, isReceived: boolean) => (
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

            {isReceived && (
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={application.profiles?.avatar_url} />
                  <AvatarFallback>
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  "text-sm font-medium",
                  theme === 'light' ? "text-gray-700" : "text-gray-300"
                )}>
                  {application.profiles?.first_name} {application.profiles?.last_name}
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className={cn(
                  theme === 'light' ? "text-gray-600" : "text-gray-400"
                )}>
                  {formatDistanceToNow(new Date(application.created_at))} ago
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
              "font-medium mb-1 text-sm",
              theme === 'light' ? "text-gray-900" : "text-white"
            )}>
              {isReceived ? "Applicant's Message:" : "Your Message:"}
            </h4>
            <p className={cn(
              "text-sm",
              theme === 'light' ? "text-gray-600" : "text-gray-400"
            )}>
              {application.message || 'No message provided'}
            </p>
          </div>

          {application.response_message && (
            <div className={cn(
              "p-3 rounded-lg",
              theme === 'light' ? "bg-blue-50" : "bg-blue-900/20"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <h4 className={cn(
                  "font-medium text-sm text-blue-600",
                  theme === 'dark' && "text-blue-400"
                )}>
                  {isReceived ? "Your Response:" : "Response from Gig Owner:"}
                </h4>
              </div>
              <p className={cn(
                "text-sm",
                theme === 'light' ? "text-gray-700" : "text-gray-300"
              )}>
                {application.response_message}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {isReceived && application.profiles?.email && (
                <span className={cn(
                  "text-xs",
                  theme === 'light' ? "text-gray-500" : "text-gray-400"
                )}>
                  {application.profiles.email}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {isReceived && application.status === 'pending' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:bg-green-50"
                    onClick={() => openResponseDialog('accept', application.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => openResponseDialog('reject', application.id)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/gigs/${application.gig_id}`)}
                >
                  View Gig
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={cn(
            "text-2xl md:text-3xl font-bold mb-2",
            theme === 'light' ? "text-gray-900" : "text-white"
          )}>
            Applications
          </h1>
          <p className={cn(
            "text-sm",
            theme === 'light' ? "text-gray-600" : "text-gray-400"
          )}>
            Manage your gig applications
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

        {/* Tabs for Sent and Received */}
        <Tabs defaultValue="sent" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="sent">
              My Applications ({sentApplications.length})
            </TabsTrigger>
            <TabsTrigger value="received">
              Received ({receivedApplications.length})
            </TabsTrigger>
          </TabsList>

          {/* Sent Applications Tab */}
          <TabsContent value="sent">
            {sentLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className={cn(
                  "mt-4",
                  theme === 'light' ? "text-gray-600" : "text-gray-400"
                )}>
                  Loading your applications...
                </p>
              </div>
            ) : filteredSentApplications.length === 0 ? (
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
                {filteredSentApplications.map((application) => renderApplicationCard(application, false))}
              </div>
            )}
          </TabsContent>

          {/* Received Applications Tab */}
          <TabsContent value="received">
            {receivedLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className={cn(
                  "mt-4",
                  theme === 'light' ? "text-gray-600" : "text-gray-400"
                )}>
                  Loading received applications...
                </p>
              </div>
            ) : filteredReceivedApplications.length === 0 ? (
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
                  {searchTerm || statusFilter !== "all" ? "No applications found" : "No applications received yet"}
                </h3>
                <p className={cn(
                  "text-sm",
                  theme === 'light' ? "text-gray-600" : "text-gray-400"
                )}>
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Applications for your gigs will appear here"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReceivedApplications.map((application) => renderApplicationCard(application, true))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Response Dialog */}
      <Dialog open={responseDialog.open} onOpenChange={closeResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseDialog.type === 'accept' ? 'Accept Application' : 'Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {responseDialog.type === 'accept'
                ? 'You can optionally add a message to the applicant.'
                : 'You can optionally explain why you\'re rejecting this application.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Add an optional message (you can leave this blank)"
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeResponseDialog} disabled={responding}>
              Cancel
            </Button>
            <Button
              onClick={handleResponse}
              disabled={responding}
              className={responseDialog.type === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {responding ? 'Processing...' : (responseDialog.type === 'accept' ? 'Accept' : 'Reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}