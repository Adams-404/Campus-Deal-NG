
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats, ChartData, TimeSeriesData, ItemType, KYCDocument } from "./types";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { users as UsersIcon, image as ImageIcon, shieldCheck as ShieldCheckIcon, userCheck as UserCheckIcon, trendingUp as TrendingUpIcon } from "lucide-react";

interface DashboardOverviewProps {
  stats: DashboardStats;
  recentItems: ItemType[];
  kycDocuments: KYCDocument[];
}

export const DashboardOverview = ({ stats, recentItems, kycDocuments }: DashboardOverviewProps) => {
  // Data for pie chart
  const pieData: ChartData[] = [
    { name: 'Verified', value: kycDocuments.filter(doc => doc.status === 'verified').length },
    { name: 'Pending', value: kycDocuments.filter(doc => doc.status === 'pending').length },
    { name: 'Processing', value: kycDocuments.filter(doc => doc.status === 'processing').length },
    { name: 'Rejected', value: kycDocuments.filter(doc => doc.status === 'rejected').length },
  ];

  // Colors for pie chart
  const COLORS = ['#22C55E', '#F97316', '#3B82F6', '#EF4444'];

  // Sample time series data
  const timeSeriesData: TimeSeriesData[] = [
    { date: 'Jan', users: 10, items: 5 },
    { date: 'Feb', users: 15, items: 10 },
    { date: 'Mar', users: 25, items: 15 },
    { date: 'Apr', users: 30, items: 20 },
    { date: 'May', users: 40, items: 25 },
    { date: 'Jun', users: 50, items: 40 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <UsersIcon className="h-8 w-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-blue-500">{stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <ImageIcon className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-500">{stats.totalItems}</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <ShieldCheckIcon className="h-8 w-8 text-orange-500 mb-2" />
            <p className="text-2xl font-bold text-orange-500">{stats.pendingKyc}</p>
            <p className="text-xs text-muted-foreground">Pending KYC</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <UserCheckIcon className="h-8 w-8 text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-purple-500">{stats.activeSellers}</p>
            <p className="text-xs text-muted-foreground">Active Sellers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Growth Overview</CardTitle>
            <CardDescription>Users and items over time</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={30} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="items" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">KYC Status Distribution</CardTitle>
            <CardDescription>Status of verification documents</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUpIcon className="h-4 w-4" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentItems.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex-shrink-0 h-10 w-10 rounded overflow-hidden">
                  {item.images[0] ? (
                    <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-secondary flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    by {item.seller.first_name} {item.seller.last_name} • {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={
                    item.status === 'active' 
                      ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20' 
                      : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border-gray-500/20'
                  }
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
