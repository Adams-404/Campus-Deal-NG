import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KYCData {
  id: string;
  user_id: string;
  full_name: string;
  dob: string;
  address: string;
  document_type: string;
  document_front_url: string;
  document_back_url: string;
  status: 'pending' | 'approved' | 'rejected';
  reason_for_rejection: string | null;
  created_at: string;
  profiles?: {
    email: string;
  };
}

export default function KYCTab() {
  const [kycData, setKycData] = useState<KYCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<KYCData | null>(null);

  useEffect(() => {
    fetchKYCData();
  }, []);

  const fetchKYCData = async () => {
    try {
      const { data, error } = await supabase
        .from('kyc_data')
        .select(`
          *,
          profiles (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching KYC data:', error);
        toast({
          variant: "destructive",
          title: "Error fetching KYC data",
          description: "Please try again later."
        });
        return;
      }

      setKycData(data);
    } catch (error) {
      console.error('Unexpected error fetching KYC data:', error);
      toast({
        variant: "destructive",
        title: "Unexpected error",
        description: "Please try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  const updateKYCStatus = async (id: string, status: 'approved' | 'rejected', reason: string | null = null) => {
    try {
      const { error } = await supabase
        .from('kyc_data')
        .update({ status, reason_for_rejection: reason })
        .eq('id', id);

      if (error) {
        console.error('Error updating KYC status:', error);
        toast({
          variant: "destructive",
          title: "Error updating status",
          description: "Please try again later."
        });
        return;
      }

      // Optimistically update the KYC data
      setKycData(prevData =>
        prevData.map(item =>
          item.id === id ? { ...item, status, reason_for_rejection: reason } : item
        )
      );

      toast({
        title: "KYC status updated",
        description: `KYC status updated to ${status}`,
      });
    } catch (error) {
      console.error('Unexpected error updating KYC status:', error);
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: "Please try again later."
      });
    }
  };

  const handleApprove = (id: string) => {
    updateKYCStatus(id, 'approved');
  };

  const handleReject = (id: string) => {
    // Open a prompt to ask for the reason for rejection
    const reason = prompt("Please enter the reason for rejection:");
    if (reason === null) {
      // If the user cancels the prompt, do nothing
      return;
    }
    if (reason === "") {
      alert("Reason cannot be empty");
      return;
    }
    updateKYCStatus(id, 'rejected', reason);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-center">Loading KYC Data...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">KYC Verification</h2>
      <p className="text-muted-foreground mb-4">Review and verify user identity documents.</p>

      <div className="overflow-x-auto">
        <Table>
          <TableCaption>A list of users KYC applications.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kycData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.full_name}</TableCell>
                <TableCell>{item.profiles?.email}</TableCell>
                <TableCell>{formatDate(item.created_at)}</TableCell>
                <TableCell>
                  {item.status === 'pending' && (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                  {item.status === 'approved' && (
                    <Badge variant="outline">Approved</Badge>
                  )}
                  {item.status === 'rejected' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="destructive" className="cursor-help">Rejected</Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Reason: {item.reason_for_rejection}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedDocument(item)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[625px]">
                        <DialogHeader>
                          <DialogTitle>KYC Document</DialogTitle>
                          <DialogDescription>
                            Review the user's submitted documents.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium leading-none">Front Document</h3>
                              <img src={selectedDocument?.document_front_url} alt="Front Document" className="w-full aspect-video rounded-md border" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium leading-none">Back Document</h3>
                              <img src={selectedDocument?.document_back_url} alt="Back Document" className="w-full aspect-video rounded-md border" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium leading-none">Full Name</h3>
                            <p className="text-sm text-muted-foreground">{selectedDocument?.full_name}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium leading-none">Date of Birth</h3>
                              <p className="text-sm text-muted-foreground">{selectedDocument?.dob}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium leading-none">Address</h3>
                              <p className="text-sm text-muted-foreground">{selectedDocument?.address}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="secondary" onClick={() => handleReject(selectedDocument!.id)}>
                            Reject <XCircle className="ml-2 h-4 w-4" />
                          </Button>
                          <Button type="button" onClick={() => handleApprove(selectedDocument!.id)}>
                            Approve <CheckCircle className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {item.status === 'pending' && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleApprove(item.id)}>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleReject(item.id)}>
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
