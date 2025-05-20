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
import { 
  Package, 
  MapPin, 
  Calendar, 
  CalendarCheck, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Coins,
  Map,
  Users,
  ClipboardList,
  ShoppingBag
} from "lucide-react";
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
  price?: number;
  commission?: number;
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
  const [selectedView, setSelectedView] = useState<"info" | "deliveries">("info");

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
          image_url: "/lovable-uploads/0c7613ff-7d84-43c5-b64c-c82051ab6cfa.png",
          price: 100,
          commission: 15
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
          image_url: "/lovable-uploads/3fdfaed5-4b18-4048-93dd-bea2e609ff26.png",
          price: 50,
          commission: 10
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
          image_url: "/lovable-uploads/297c12be-24a7-418b-a660-db5801458751.png",
          price: 30,
          commission: 5
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
          image_url: "/lovable-uploads/84a45155-63a7-451e-b656-5d4600fe0673.png",
          price: 80,
          commission: 12
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

  const infoContent = () => (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col gap-10 py-8">
        {/* Hero section with animated illustration */}
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-4">Campus Delivery Network</h2>
            <p className="text-lg mb-6">
              Earn money while helping your fellow students get their purchases delivered across campus.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-6 py-3 rounded-lg font-medium flex items-center gap-2",
                theme === 'light' ? "bg-primary text-white" : "bg-primary text-white"
              )}
              onClick={() => setSelectedView("deliveries")}
            >
              <Truck className="w-5 h-5" />
              View Available Deliveries
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
          <div className="flex-1">
            <motion.div 
              className="relative w-full h-[300px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Animated Delivery Illustration */}
              <DeliveryAnimation />
            </motion.div>
          </div>
        </div>
        
        {/* How it works section */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-8 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <ClipboardList className="w-10 h-10 text-blue-500" />,
                title: "Browse Deliveries",
                description: "See available delivery requests from sellers on campus who need items delivered."
              },
              {
                icon: <Map className="w-10 h-10 text-green-500" />,
                title: "Accept & Deliver",
                description: "Choose deliveries near you, pick up from sellers, and drop off to buyers."
              },
              {
                icon: <Coins className="w-10 h-10 text-yellow-500" />,
                title: "Earn Commission",
                description: "Get paid for each successful delivery you complete. Easy money between classes!"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                className={cn(
                  "flex flex-col items-center text-center p-6 rounded-xl",
                  theme === 'light' ? "bg-white shadow-md" : "bg-black/40 border border-white/10"
                )}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="mb-4 p-3 rounded-full bg-gray-100 dark:bg-gray-800">
                  {step.icon}
                </div>
                <h4 className="text-xl font-semibold mb-2">{step.title}</h4>
                <p className={cn("text-sm", theme === 'light' ? "text-gray-600" : "text-gray-300")}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Benefits section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold mb-8">Benefits of Campus Delivery</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Flexible Schedule",
                description: "Make deliveries between classes or whenever you have free time",
                icon: <Calendar className="w-6 h-6" />
              },
              {
                title: "Extra Income",
                description: "Earn money while helping fellow students",
                icon: <Coins className="w-6 h-6" />
              },
              {
                title: "Help Community",
                description: "Support the campus marketplace ecosystem",
                icon: <Users className="w-6 h-6" />
              },
              {
                title: "No Special Equipment",
                description: "Just your phone and your willingness to help",
                icon: <ShoppingBag className="w-6 h-6" />
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                className={cn(
                  "flex items-start gap-4 p-5 rounded-lg",
                  theme === 'light' ? "bg-blue-50" : "bg-blue-900/20"
                )}
                initial={{ x: index % 2 === 0 ? -20 : 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  theme === 'light' ? "bg-blue-100 text-blue-600" : "bg-blue-800/30 text-blue-400"
                )}>
                  {benefit.icon}
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-1">{benefit.title}</h4>
                  <p className={cn("text-sm", theme === 'light' ? "text-gray-700" : "text-gray-300")}>
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="mt-12">
          <motion.div
            className={cn(
              "p-8 rounded-2xl text-center",
              theme === 'light' 
                ? "bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200" 
                : "bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold mb-4">Ready to Start Delivering?</h3>
            <p className="mb-6 max-w-lg mx-auto">
              Join our campus delivery network today and start earning money while helping other students get their items delivered.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-8 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto",
                theme === 'light' ? "bg-primary text-white" : "bg-primary text-white"
              )}
              onClick={() => setSelectedView("deliveries")}
            >
              <Truck className="w-5 h-5" />
              Browse Available Deliveries
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );

  // Create a simple SVG animation for the delivery concept
  const DeliveryAnimation = () => {
    return (
      <motion.div className="w-full h-full flex items-center justify-center">
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 400 300"
          className={cn(theme === 'light' ? "text-primary" : "text-primary")}
        >
          {/* Campus Building */}
          <motion.path
            d="M50,230 L50,130 L100,100 L150,130 L150,230 Z"
            fill={theme === 'light' ? "#d1e8ff" : "#193048"}
            stroke="currentColor"
            strokeWidth="2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          
          {/* Windows */}
          {[1, 2, 3].map((i) => (
            <motion.rect
              key={`window-left-${i}`}
              x={65}
              y={130 + (i * 25)}
              width={15}
              height={15}
              fill={theme === 'light' ? "#a3d0ff" : "#0d223a"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + (i * 0.1) }}
            />
          ))}
          {[1, 2, 3].map((i) => (
            <motion.rect
              key={`window-right-${i}`}
              x={115}
              y={130 + (i * 25)}
              width={15}
              height={15}
              fill={theme === 'light' ? "#a3d0ff" : "#0d223a"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + (i * 0.1) }}
            />
          ))}
          
          {/* Door */}
          <motion.rect
            x={90}
            y={200}
            width={20}
            height={30}
            fill={theme === 'light' ? "#4a72ab" : "#0d223a"}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            style={{ transformOrigin: "90px 230px" }}
          />
          
          {/* Another Building */}
          <motion.path
            d="M250,230 L250,150 L300,120 L350,150 L350,230 Z"
            fill={theme === 'light' ? "#ffe8d1" : "#483019"}
            stroke="currentColor"
            strokeWidth="2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
          
          {/* Windows */}
          {[1, 2].map((i) => (
            <motion.rect
              key={`window2-left-${i}`}
              x={265}
              y={160 + (i * 25)}
              width={15}
              height={15}
              fill={theme === 'light' ? "#ffd1a3" : "#2a1d0d"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + (i * 0.1) }}
            />
          ))}
          {[1, 2].map((i) => (
            <motion.rect
              key={`window2-right-${i}`}
              x={315}
              y={160 + (i * 25)}
              width={15}
              height={15}
              fill={theme === 'light' ? "#ffd1a3" : "#2a1d0d"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + (i * 0.1) }}
            />
          ))}
          
          {/* Door */}
          <motion.rect
            x={290}
            y={200}
            width={20}
            height={30}
            fill={theme === 'light' ? "#ab724a" : "#2a1d0d"}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            style={{ transformOrigin: "290px 230px" }}
          />
          
          {/* Ground */}
          <motion.rect
            x={0}
            y={230}
            width={400}
            height={10}
            fill={theme === 'light' ? "#c0c0c0" : "#2a2a2a"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Package */}
          <motion.rect
            x={125}
            y={200}
            width={20}
            height={20}
            fill={theme === 'light' ? "#BA8E4A" : "#8e6a33"}
            stroke="#000"
            strokeWidth="1"
            initial={{ opacity: 0, x: 145 }}
            animate={{ 
              opacity: [0, 1, 1, 1, 0],
              x: [145, 145, 170, 195, 225]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              repeatDelay: 1
            }}
          />
          
          {/* Delivery Person */}
          <motion.g
            initial={{ x: 145 }}
            animate={{ 
              x: [145, 170, 195, 225, 250]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              repeatDelay: 1
            }}
          >
            {/* Body */}
            <circle 
              cx={0} 
              cy={195} 
              r={10} 
              fill={theme === 'light' ? "#4a72ab" : "#3a5a8a"}
            />
            
            {/* Head */}
            <circle 
              cx={0} 
              cy={180} 
              r={7} 
              fill={theme === 'light' ? "#ffd1a3" : "#d1a37a"}
            />
            
            {/* Arms - animated to show walking */}
            <motion.line
              x1={0}
              y1={195}
              x2={-8}
              y2={205}
              stroke={theme === 'light' ? "#4a72ab" : "#3a5a8a"}
              strokeWidth={3}
              animate={{ 
                x2: [-8, -10, -8],
                y2: [205, 200, 205]
              }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            <motion.line
              x1={0}
              y1={195}
              x2={8}
              y2={205}
              stroke={theme === 'light' ? "#4a72ab" : "#3a5a8a"}
              strokeWidth={3}
              animate={{ 
                x2: [8, 10, 8],
                y2: [205, 200, 205]
              }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 0.25
              }}
            />
            
            {/* Legs - animated to show walking */}
            <motion.line
              x1={0}
              y1={205}
              x2={-5}
              y2={220}
              stroke={theme === 'light' ? "#2a4060" : "#1a304a"}
              strokeWidth={3}
              animate={{ 
                x2: [-5, -8, -5],
                y2: [220, 215, 220]
              }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            <motion.line
              x1={0}
              y1={205}
              x2={5}
              y2={220}
              stroke={theme === 'light' ? "#2a4060" : "#1a304a"}
              strokeWidth={3}
              animate={{ 
                x2: [5, 8, 5],
                y2: [220, 215, 220]
              }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 0.25
              }}
            />
          </motion.g>
          
          {/* Path between buildings */}
          <motion.path
            d="M150,230 C200,230 250,230 250,230"
            stroke={theme === 'light' ? "#e0e0e0" : "#3a3a3a"}
            strokeWidth="15"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          />

          {/* Path dots */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.circle
              key={`dot-${i}`}
              cx={175 + (i * 15)}
              cy={230}
              r={1.5}
              fill={theme === 'light' ? "#a0a0a0" : "#5a5a5a"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 + (i * 0.1) }}
            />
          ))}
        </svg>
      </motion.div>
    );
  };

  // Render the main content based on selected view
  const renderContent = () => {
    if (selectedView === "info") {
      return infoContent();
    }
    
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setSelectedView("info")}
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Info
          </Button>
        </div>
        
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
                            
                            {/* Commission badge */}
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center">
                              <Coins className="w-3 h-3 mr-1" />
                              ${delivery.commission} commission
                            </div>
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
                          <Button className="w-full" variant="default">
                            <Truck className="mr-2 h-4 w-4" />
                            Accept Delivery
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

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Delivery Coordination</h1>
        <p className={cn(
          "text-gray-500 dark:text-gray-400",
          theme === 'light' ? "text-gray-600" : "text-gray-300"
        )}>
          Earn money by helping deliver items across campus
        </p>
      </motion.div>

      {renderContent()}
    </div>
  );
};

export default DeliveryCoordinator;
