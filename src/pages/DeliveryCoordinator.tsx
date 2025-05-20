
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, MapPin, Calendar, CalendarCheck, Truck, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Define delivery status types
type DeliveryStatus = "pending" | "in_transit" | "delivered" | "cancelled";

// Interface for delivery data
interface Delivery {
  id: string;
  item_id: string;
  item_title: string;
  seller_id: string;
  buyer_id: string;
  status: DeliveryStatus;
  pickup_address: string;
  delivery_address: string;
  created_at: string;
  estimated_delivery: string | null;
  completed_at: string | null;
  image_url: string | null;
}

// Interface for user profile data
interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

const DeliveryCoordinator = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };

    fetchCurrentUser();
  }, []);

  // Mock data for demonstration - in a real app, you would fetch this from your database
  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      const mockDeliveries: Delivery[] = [
        {
          id: "d1",
          item_id: "i1",
          item_title: "Vintage Camera",
          seller_id: "s1",
          buyer_id: "b1",
          status: "in_transit",
          pickup_address: "GSU Main Campus",
          delivery_address: "Student Housing Complex B",
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          estimated_delivery: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
          completed_at: null,
          image_url: "/lovable-uploads/0c7613ff-7d84-43c5-b64c-c82051ab6cfa.png"
        },
        {
          id: "d2",
          item_id: "i2",
          item_title: "Engineering Textbook",
          seller_id: "s2",
          buyer_id: "b1",
          status: "pending",
          pickup_address: "Engineering Building",
          delivery_address: "Student Housing Complex B",
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          estimated_delivery: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
          completed_at: null,
          image_url: "/lovable-uploads/3fdfaed5-4b18-4048-93dd-bea2e609ff26.png"
        },
        {
          id: "d3",
          item_id: "i3",
          item_title: "Desk Lamp",
          seller_id: "s1",
          buyer_id: "b2",
          status: "delivered",
          pickup_address: "GSU Main Campus",
          delivery_address: "Off-campus Apartment",
          created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          estimated_delivery: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          completed_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          image_url: "/lovable-uploads/297c12be-24a7-418b-a660-db5801458751.png"
        },
        {
          id: "d4",
          item_id: "i4",
          item_title: "Wireless Earbuds",
          seller_id: "s3",
          buyer_id: "b3",
          status: "cancelled",
          pickup_address: "GSU Library",
          delivery_address: "Student Housing Complex A",
          created_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
          estimated_delivery: null,
          completed_at: null,
          image_url: "/lovable-uploads/84a45155-63a7-451e-b656-5d4600fe0673.png"
        }
      ];

      const mockProfiles: Record<string, UserProfile> = {
        s1: { id: "s1", first_name: "Alex", last_name: "Johnson", avatar_url: null },
        s2: { id: "s2", first_name: "Sam", last_name: "Smith", avatar_url: null },
        s3: { id: "s3", first_name: "Taylor", last_name: "Rodriguez", avatar_url: null },
        b1: { id: "b1", first_name: "Jordan", last_name: "Lee", avatar_url: null },
        b2: { id: "b2", first_name: "Casey", last_name: "Williams", avatar_url: null },
        b3: { id: "b3", first_name: "Morgan", last_name: "Brown", avatar_url: null },
      };

      setDeliveries(mockDeliveries);
      setUserProfiles(mockProfiles);
      setIsLoading(false);
    }, 1500);
  }, []);

  const filteredDeliveries = activeTab === "all" 
    ? deliveries 
    : deliveries.filter(delivery => delivery.status === activeTab);

  // Format date to human-readable string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get progress percentage based on status
  const getProgressPercentage = (status: DeliveryStatus) => {
    switch (status) {
      case "pending": return 25;
      case "in_transit": return 75;
      case "delivered": return 100;
      case "cancelled": return 100; // Full but will be shown differently
      default: return 0;
    }
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Pending</Badge>;
      case "in_transit":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">In Transit</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Delivery Coordination</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Track and manage your item deliveries across campus
        </p>
      </motion.div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_transit">In Transit</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              // Loading skeletons
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className={cn(
                  "border",
                  theme === 'light' ? "border-gray-200 bg-white" : "border-gray-800 bg-gray-900"
                )}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-6 w-40 mt-2" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent className="pb-4">
                    <Skeleton className="h-32 w-full mb-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : filteredDeliveries.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <Package className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium mb-2">No deliveries found</h3>
                <p className="text-gray-500 text-center max-w-md">
                  There are no deliveries matching your current filter. Try changing your filter or check back later.
                </p>
              </div>
            ) : (
              filteredDeliveries.map((delivery) => (
                <motion.div
                  key={delivery.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={cn(
                    "h-full flex flex-col border",
                    delivery.status === "cancelled" && "border-red-500/30",
                    theme === 'light' ? "border-gray-200 bg-white" : "border-gray-800 bg-gray-900"
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-500">Order #{delivery.id}</span>
                        </div>
                        {getStatusBadge(delivery.status)}
                      </div>
                      <CardTitle className="mt-2">{delivery.item_title}</CardTitle>
                      <CardDescription>
                        {delivery.status !== "cancelled" ? (
                          <>
                            {delivery.status === "delivered" ? (
                              <span className="flex items-center text-green-500">
                                <CheckCircle className="h-4 w-4 mr-1" /> 
                                Delivered on {formatDate(delivery.completed_at)}
                              </span>
                            ) : delivery.estimated_delivery ? (
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" /> 
                                Estimated delivery: {formatDate(delivery.estimated_delivery)}
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" /> 
                                Processing order
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="flex items-center text-red-500">
                            <AlertCircle className="h-4 w-4 mr-1" /> 
                            Cancelled
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="py-4 flex-grow">
                      {delivery.image_url && (
                        <div className="relative h-40 mb-4 rounded-md overflow-hidden">
                          <img 
                            src={delivery.image_url} 
                            alt={delivery.item_title}
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      )}

                      <div className="space-y-3 mb-4">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Pickup</p>
                            <p className="text-sm text-gray-500">{delivery.pickup_address}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Delivery</p>
                            <p className="text-sm text-gray-500">{delivery.delivery_address}</p>
                          </div>
                        </div>
                      </div>
                      
                      {delivery.status !== "cancelled" && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Order Placed</span>
                            <span>Delivered</span>
                          </div>
                          <Progress 
                            value={getProgressPercentage(delivery.status)} 
                            className={cn(
                              "h-2",
                              delivery.status === "delivered" ? "bg-green-200" : "bg-gray-200"
                            )}
                            indicatorClassName={
                              delivery.status === "delivered" ? "bg-green-500" : "bg-primary"
                            }
                          />
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center">
                          <p className="text-sm mr-1">{delivery.status === "pending" ? "Seller:" : "From:"}</p>
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-1">
                              <AvatarImage src={userProfiles[delivery.seller_id]?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {userProfiles[delivery.seller_id]?.first_name?.[0] || "S"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {userProfiles[delivery.seller_id]?.first_name} {userProfiles[delivery.seller_id]?.last_name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      {delivery.status === "pending" && (
                        <Button className="w-full" variant="outline">
                          <Truck className="mr-2 h-4 w-4" />
                          Track Delivery
                        </Button>
                      )}
                      {delivery.status === "in_transit" && (
                        <Button className="w-full" variant="default">
                          <Truck className="mr-2 h-4 w-4" />
                          Track Delivery
                        </Button>
                      )}
                      {delivery.status === "delivered" && (
                        <Button className="w-full" variant="outline" disabled>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Delivered
                        </Button>
                      )}
                      {delivery.status === "cancelled" && (
                        <Button className="w-full" variant="outline" disabled>
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Cancelled
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveryCoordinator;
