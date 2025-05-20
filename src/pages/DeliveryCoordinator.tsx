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

  // Create a Coming Soon animation for the delivery feature
  const ComingSoonAnimation = () => {
    return (
      <motion.div 
        className="w-full h-[400px] relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <svg 
          width="100%" 
          height="100%"
          viewBox="0 0 800 400"
          className={cn(theme === 'light' ? "text-primary" : "text-primary")}
        >
          {/* Campus Map Background */}
          <motion.rect
            x="50"
            y="50"
            width="700"
            height="300"
            rx="10"
            fill={theme === 'light' ? "#f0f4f8" : "#1a2030"}
            stroke={theme === 'light' ? "#1078a7" : "#4a90e2"}
            strokeWidth="2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Campus Buildings */}
          {/* Building 1 - ICT Center */}
          <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <rect 
              x="100" 
              y="100" 
              width="120" 
              height="100" 
              rx="5"
              fill={theme === 'light' ? "#d1e8ff" : "#193048"}
              stroke={theme === 'light' ? "#1078a7" : "#4a90e2"}
              strokeWidth="2"
            />
            <text x="160" y="160" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="bold">ICT Center</text>
          </motion.g>
          
          {/* Building 2 - Faculty of Law */}
          <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <rect 
              x="550" 
              y="150" 
              width="120" 
              height="100" 
              rx="5"
              fill={theme === 'light' ? "#ffe8d1" : "#483019"}
              stroke={theme === 'light' ? "#1078a7" : "#4a90e2"}
              strokeWidth="2"
            />
            <text x="610" y="200" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="bold">Faculty of Law</text>
          </motion.g>
          
          {/* Delivery Person Animation */}
          <motion.g
            initial={{ x: 150, y: 150 }}
            animate={{
              x: [150, 250, 350, 450, 550],
              y: [150, 170, 180, 175, 190]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut" 
            }}
          >
            {/* Delivery Person */}
            <circle 
              cx="0" 
              cy="0" 
              r="15" 
              fill={theme === 'light' ? "#1078a7" : "#4a90e2"} 
            />
            <rect 
              x="-10" 
              y="-25" 
              width="20" 
              height="10" 
              fill={theme === 'light' ? "#1078a7" : "#4a90e2"} 
              rx="2" 
            />
            <rect 
              x="-7" 
              y="15" 
              width="14" 
              height="10" 
              fill={theme === 'light' ? "#34495e" : "#2c3e50"} 
            />
            
            {/* Package/Food being delivered */}
            <rect 
              x="-10" 
              y="-10" 
              width="20" 
              height="20" 
              fill={theme === 'light' ? "#BA8E4A" : "#8e6a33"} 
              rx="2" 
            />
            
            {/* Speed lines */}
            <motion.path 
              d="M -30 -5 L -45 -10" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeDasharray="5,5"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
            />
            <motion.path 
              d="M -30 5 L -45 10" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeDasharray="5,5"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5, delay: 0.2 }}
            />
          </motion.g>
          
          {/* Money/Commission Indicator */}
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0],
              y: [0, -20, -30, -40]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 2,
              times: [0, 0.2, 0.8, 1],
              delay: 2
            }}
            style={{ x: 300, y: 175 }}
          >
            <circle 
              cx="0" 
              cy="0" 
              r="20" 
              fill={theme === 'light' ? "#ffd700" : "#d4af37"} 
            />
            <text x="0" y="4" fontSize="16" fontWeight="bold" fill="#000" textAnchor="middle">$</text>
          </motion.g>
          
          {/* Coming Soon Text */}
          <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <rect 
              x="300" 
              y="50" 
              width="200" 
              height="40" 
              rx="20"
              fill={theme === 'light' ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.7)"}
              stroke={theme === 'light' ? "#1078a7" : "#4a90e2"}
              strokeWidth="2"
              className="shadow-sm"
            />
            <text x="400" y="75" textAnchor="middle" fill="currentColor" fontSize="18" fontWeight="bold">
              Coming Soon!
            </text>
          </motion.g>
        </svg>
      </motion.div>
    );
  };

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
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => setSelectedView("info")}
            className="flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Info
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "p-8 rounded-xl mb-8",
            theme === 'light' 
              ? "bg-white/90 border-2 border-[#1078a7] shadow-sm" 
              : "bg-black border border-white/10"
          )}
        >
          <h2 className="text-2xl font-bold mb-4 text-center">
            Campus Delivery Service - Coming Soon
          </h2>
          
          <ComingSoonAnimation />
          
          <div className="mt-8 space-y-6">
            <div className="flex flex-col space-y-2">
              <h3 className="text-xl font-semibold">
                <span className="emoji-container mr-2">🚚</span> How It Will Work
              </h3>
              <p className="text-md">
                Our campus delivery system will connect sellers and buyers through student delivery partners. 
                When a seller books a delivery, nearby students can accept the job and earn a commission for 
                delivering items across campus.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className={cn(
                "p-4 rounded-lg flex flex-col items-center text-center",
                theme === 'light' 
                  ? "bg-white/90 border-2 border-[#1078a7] shadow-sm" 
                  : "bg-black/40 border border-white/10"
              )}>
                <div className="mb-3 p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 emoji-container">
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
                <h4 className="font-semibold mb-2">For Sellers</h4>
                <p className="text-sm">Request a delivery service when you sell an item and need it transported to the buyer</p>
              </div>
              
              <div className={cn(
                "p-4 rounded-lg flex flex-col items-center text-center",
                theme === 'light' 
                  ? "bg-white/90 border-2 border-[#1078a7] shadow-sm" 
                  : "bg-black/40 border border-white/10"
              )}>
                <div className="mb-3 p-3 rounded-full bg-green-100 dark:bg-green-900/30 emoji-container">
                  <Truck className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="font-semibold mb-2">For Deliverers</h4>
                <p className="text-sm">Accept delivery requests in your area and earn money while helping fellow students</p>
              </div>
              
              <div className={cn(
                "p-4 rounded-lg flex flex-col items-center text-center",
                theme === 'light' 
                  ? "bg-white/90 border-2 border-[#1078a7] shadow-sm" 
                  : "bg-black/40 border border-white/10"
              )}>
                <div className="mb-3 p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 emoji-container">
                  <Coins className="w-8 h-8 text-yellow-500" />
                </div>
                <h4 className="font-semibold mb-2">Commission System</h4>
                <p className="text-sm">Earn a percentage from each delivery completed based on distance and item value</p>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">
                <span className="emoji-container mr-2">📆</span> Launch Timeline
              </h3>
              <div className={cn(
                "p-4 rounded-lg",
                theme === 'light' 
                  ? "bg-white/90 border-2 border-[#1078a7] shadow-sm" 
                  : "bg-black/40 border border-white/10"
              )}>
                <p className="text-center text-md">
                  We're working hard to bring this feature to you soon! Check back for updates on the launch date.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center mt-8">
              <Button 
                variant="outline"
                onClick={() => setSelectedView("info")}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Go Back
              </Button>
            </div>
          </div>
        </motion.div>
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
