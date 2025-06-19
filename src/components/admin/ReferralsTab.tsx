
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Users, Search, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReferralData {
  referrer: {
    id: string;
    name: string;
    email: string;
    referral_count: number;
  };
  referred_users: {
    id: string;
    name: string;
    email: string;
    kyc_status: string;
    created_at: string;
  }[];
}

const ReferralsTab = () => {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      // Get all referrals with user details
      const { data: referralData, error } = await supabase
        .from('referrals')
        .select(`
          referrer_id,
          referred_user_id,
          created_at,
          referrer:profiles!referrer_id (
            id,
            first_name,
            last_name,
            referral_code
          ),
          referred:profiles!referred_user_id (
            id,
            first_name,
            last_name,
            kyc_status,
            created_at
          )
        `);

      if (error) throw error;

      // Group by referrer
      const groupedData: { [key: string]: ReferralData } = {};

      referralData?.forEach((ref) => {
        const referrerId = ref.referrer_id;
        const referrer = ref.referrer;
        const referred = ref.referred;

        if (!referrer || !referred) return;

        if (!groupedData[referrerId]) {
          groupedData[referrerId] = {
            referrer: {
              id: referrerId,
              name: `${referrer.first_name || ''} ${referrer.last_name || ''}`.trim(),
              email: `${referrer.first_name?.toLowerCase() || 'user'}@gsu.edu.ng`, // Mock email
              referral_count: 0
            },
            referred_users: []
          };
        }

        groupedData[referrerId].referrer.referral_count++;
        groupedData[referrerId].referred_users.push({
          id: referred.id,
          name: `${referred.first_name || ''} ${referred.last_name || ''}`.trim(),
          email: `${referred.first_name?.toLowerCase() || 'user'}@gsu.edu.ng`, // Mock email
          kyc_status: referred.kyc_status || 'pending',
          created_at: ref.created_at
        });
      });

      setReferrals(Object.values(groupedData));
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Failed to fetch referral data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'verified' ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'verified' ? (
      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
        Verified
      </Badge>
    ) : (
      <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
        Not Verified
      </Badge>
    );
  };

  const exportData = () => {
    const csvContent = [
      ['Referrer Name', 'Referrer Email', 'Total Referrals', 'Referred User', 'Referred Email', 'Verification Status', 'Signup Date'],
      ...referrals.flatMap(referral => 
        referral.referred_users.map(user => [
          referral.referrer.name,
          referral.referrer.email,
          referral.referrer.referral_count.toString(),
          user.name,
          user.email,
          user.kyc_status,
          new Date(user.created_at).toLocaleDateString()
        ])
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'referrals-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredReferrals = referrals.filter(referral =>
    referral.referrer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referrer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referred_users.some(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referrals Management</CardTitle>
          <CardDescription>Loading referral data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-secondary rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Referrals Management
            </CardTitle>
            <CardDescription>
              Manage and monitor user referrals and their verification status
            </CardDescription>
          </div>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredReferrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No referrals found matching your search.' : 'No referrals found.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReferrals.map((referralGroup) => (
                <div key={referralGroup.referrer.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{referralGroup.referrer.name}</h3>
                      <p className="text-sm text-muted-foreground">{referralGroup.referrer.email}</p>
                    </div>
                    <Badge variant="outline">
                      {referralGroup.referrer.referral_count} referral{referralGroup.referrer.referral_count !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Referred User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Signup Date</TableHead>
                          <TableHead>Verification Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referralGroup.referred_users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(user.kyc_status)}
                                {getStatusBadge(user.kyc_status)}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralsTab;
