
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats, ChartData, TimeSeriesData, ItemType, KYCDocument } from "./types";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Users, Image, ShieldCheck, UserCheck, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardOverviewProps {
  stats: DashboardStats;
  recentItems: ItemType[];
  kycDocuments: KYCDocument[];
}

export const DashboardOverview = ({ stats, recentItems, kycDocuments }: DashboardOverviewProps) => {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch real-time data for growth overview
  useEffect(() => {
    const fetchGrowthData = async () => {
      setIsLoading(true);
      try {
        // Get the current date and subtract 6 months
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 5);
        
        // Format date to first day of month
        sixMonthsAgo.setDate(1);
        
        // Get users by month
        const { data: usersByMonth, error: usersError } = await supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', sixMonthsAgo.toISOString());
          
        if (usersError) throw usersError;
        
        // Get items by month
        const { data: itemsByMonth, error: itemsError } = await supabase
          .from('items')
          .select('created_at')
          .gte('created_at', sixMonthsAgo.toISOString());
          
        if (itemsError) throw itemsError;
        
        // Process the data by month
        const months = [];
        const currentMonth = new Date(sixMonthsAgo);
        
        // Generate last 6 months
        for (let i = 0; i < 6; i++) {
          months.push({
            date: currentMonth.toLocaleString('default', { month: 'short' }),
            timestamp: new Date(currentMonth).getTime(),
            users: 0,
            items: 0
          });
          currentMonth.setMonth(currentMonth.getMonth() + 1);
        }
        
        // Count users by month
        usersByMonth.forEach(user => {
          const userDate = new Date(user.created_at);
          const monthIndex = months.findIndex(m => {
            const nextMonthIndex = months.indexOf(m) + 1;
            const nextMonth = nextMonthIndex < months.length 
              ? new Date(months[nextMonthIndex].timestamp)
              : new Date(); // Use current date if it's the last month
              
            return userDate.getTime() >= m.timestamp && userDate.getTime() < nextMonth.getTime();
          });
          
          if (monthIndex !== -1) {
            months[monthIndex].users += 1;
          }
        });
        
        // Count items by month
        itemsByMonth.forEach(item => {
          const itemDate = new Date(item.created_at);
          const monthIndex = months.findIndex(m => {
            const nextMonthIndex = months.indexOf(m) + 1;
            const nextMonth = nextMonthIndex < months.length 
              ? new Date(months[nextMonthIndex].timestamp)
              : new Date(); // Use current date if it's the last month
              
            return itemDate.getTime() >= m.timestamp && itemDate.getTime() < nextMonth.getTime();
          });
          
          if (monthIndex !== -1) {
            months[monthIndex].items += 1;
          }
        });
        
        // Calculate cumulative totals
        let userTotal = 0;
        let itemTotal = 0;
        
        const cumulativeData = months.map(month => {
          userTotal += month.users;
          itemTotal += month.items;
          
          return {
            date: month.date,
            users: userTotal,
            items: itemTotal
          };
        });
        
        setTimeSeriesData(cumulativeData);
      } catch (error) {
        console.error("Error fetching growth data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGrowthData();
  }, []);

  // Data for pie chart
  const pieData: ChartData[] = [
    { name: 'Verified', value: kycDocuments.filter(doc => doc.status === 'verified').length },
    { name: 'Pending', value: kycDocuments.filter(doc => doc.status === 'pending').length },
    { name: 'Processing', value: kycDocuments.filter(doc => doc.status === 'processing').length },
    { name: 'Rejected', value: kycDocuments.filter(doc => doc.status === 'rejected').length },
  ].filter(item => item.value > 0); // Only show statuses with values

  // Colors for pie chart
  const COLORS = ['#22C55E', '#F97316', '#3B82F6', '#EF4444'];
  
  // Custom pie chart label
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill={COLORS[index % COLORS.length]}
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Users className="h-8 w-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-blue-500">{stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Image className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-500">{stats.totalItems}</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-orange-500 mb-2" />
            <p className="text-2xl font-bold text-orange-500">{stats.pendingKyc}</p>
            <p className="text-xs text-muted-foreground">Pending KYC</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <UserCheck className="h-8 w-8 text-purple-500 mb-2" />
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
              {isLoading ? (
                <div className="flex items-center justify-center h-full w-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} width={30} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111', 
                        border: 'none', 
                        borderRadius: '8px', 
                        fontSize: '12px',
                        padding: '8px' 
                      }} 
                      formatter={(value) => [`${value}`, '']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#3B82F6" 
                      strokeWidth={2} 
                      dot={{ r: 4, strokeWidth: 2 }} 
                      activeDot={{ r: 6 }} 
                      name="Users"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="items" 
                      stroke="#22C55E" 
                      strokeWidth={2} 
                      dot={{ r: 4, strokeWidth: 2 }} 
                      activeDot={{ r: 6 }}
                      name="Items" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
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
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No KYC documents available</p>
                </div>
              ) : (
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
                      label={renderCustomizedLabel}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111', 
                        border: 'none', 
                        borderRadius: '8px', 
                        fontSize: '12px',
                        padding: '8px'
                      }}
                      formatter={(value, name) => [`${value} documents`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No recent activity</p>
            ) : (
              recentItems.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex-shrink-0 h-10 w-10 rounded overflow-hidden">
                    {item.images && item.images[0] ? (
                      <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-secondary flex items-center justify-center">
                        <Image className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by {item.seller?.first_name} {item.seller?.last_name} • {new Date(item.created_at).toLocaleDateString()}
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
