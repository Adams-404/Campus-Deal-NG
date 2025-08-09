import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Wallet as WalletIcon, CreditCard, DollarSign, TrendingUp, Lock, ArrowRight, Sparkles, Zap, Shield, Gift, Star, Users, GraduationCap, CheckCircle, ArrowLeft, Headset } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/PageTransition";

interface WalletFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'available' | 'coming-soon' | 'locked';
  progress?: number;
  color: string;
}

export default function Wallet() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setBalance(0); // 0 Naira - no real balance
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const features: WalletFeature[] = [
    {
      id: 'balance',
      title: 'Available Balance',
      description: 'Your current wallet balance',
      icon: WalletIcon,
      status: 'available',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'send-money',
      title: 'Send Money',
      description: 'Transfer funds to other students',
      icon: ArrowRight,
      status: 'coming-soon',
      progress: 75,
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'receive-money',
      title: 'Receive Payments',
      description: 'Get paid for your sold items',
      icon: Gift,
      status: 'coming-soon',
      progress: 60,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'transactions',
      title: 'Transaction History',
      description: 'View all your past transactions',
      icon: TrendingUp,
      status: 'locked',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'student-verification',
      title: 'Student Verification',
      description: 'Verify your student status for secure trading',
      icon: GraduationCap,
      status: 'locked',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'escrow-service',
      title: 'Escrow Service',
      description: 'Secure payment protection for high-value items',
      icon: Shield,
      status: 'locked',
      color: 'from-pink-500 to-pink-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full mx-auto"
          />
          <p className="text-muted-foreground font-medium">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  const isMobile = window.innerWidth < 1024; // Simple mobile detection

  return (
    <div className="bg-background min-h-screen">
      {/* Header - match app aesthetics (like Settings) */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10 ml-0 lg:ml-[300px] transition-all duration-300">
        <div className="relative max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="w-10">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack}
                className="text-primary lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <h1 className="text-lg font-semibold absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">Wallet</h1>
            <div className="w-10 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/support')}
                className="text-[#1078a7] hover:text-[#1078a7]/80 bg-white/90 dark:bg-transparent shadow-sm"
              >
                <Headset className="h-6 w-6" />
              </Button>
            </div>
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>
      </div>

      <main className="w-full max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-300">
        <PageTransition>
        <div className="pt-24 pb-16 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Coming Soon
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Secure, instant payments for the campus community
          </p>
        </motion.div>

        {/* Main Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden lg:bg-background/5 lg:rounded-xl lg:border lg:border-white/10 lg:shadow-sm">
            <CardHeader className="relative pb-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium text-gray-600">Available Balance</CardTitle>
                  <div className="text-4xl font-bold text-foreground">
                    ₦{balance.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl border border-white/10">
                  <WalletIcon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Shield className="w-3 h-3 mr-1" />
                  Secure
                </Badge>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                  <Zap className="w-3 h-3 mr-1" />
                  Instant
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Features</h2>
            <p className="text-muted-foreground">Explore what's available and what's coming</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                onClick={() => setSelectedFeature(feature.id)}
                className="cursor-pointer group"
              >
                <Card className={cn(
                  "relative overflow-hidden transition-all duration-300 lg:bg-background/5 lg:border lg:border-white/10 hover:shadow-sm",
                  feature.status === 'available' 
                    ? "" 
                    : "bg-card/50"
                )}>
                  {feature.status !== 'available' && (
                    <motion.div
                      className="absolute inset-0 bg-black/5 backdrop-blur-[1px] z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                  
                  <CardHeader className="relative pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn(
                        "p-3 rounded-xl transition-all duration-300",
                        feature.status === 'available' 
                          ? `bg-gradient-to-r ${feature.color} shadow-lg` 
                          : "bg-muted/50"
                      )}>
                        <feature.icon className={cn(
                          "w-5 h-5",
                          feature.status === 'available' 
                            ? "text-white" 
                            : "text-muted-foreground"
                        )} />
                      </div>
                      {feature.status === 'available' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="relative pt-0">
                    {feature.status === 'coming-soon' && feature.progress && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-primary">{feature.progress}%</span>
                        </div>
                        <Progress value={feature.progress} className="h-2 bg-muted" />
                        <p className="text-xs text-muted-foreground">
                          Our team is working hard to bring this feature to you
                        </p>
                      </div>
                    )}
                    
                    {feature.status === 'locked' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-muted-foreground">Premium Feature</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          This feature will be available soon. Stay tuned for updates!
                        </p>
                      </div>
                    )}
                    
                    {feature.status === 'available' && (
                      <Button 
                        className="w-full mt-4"
                        variant="outline"
                        disabled
                        size="sm"
                      >
                        Access Feature
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Coming Soon Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="relative overflow-hidden rounded-2xl lg:bg-background/5 border lg:border-white/10 p-6 sm:p-8 mt-4"
        >
          <div className="absolute inset-0 pointer-events-none" />
          <div className="relative text-center space-y-6">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium"
            >
              <Sparkles className="w-4 h-4" />
              <span>Coming Soon</span>
            </motion.div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">More Features on the Way!</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Our development team is working tirelessly to bring you advanced wallet features including 
                instant transfers between students, secure escrow services for high-value items, and enhanced 
                student verification for safer trading within the campus community.
              </p>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span>Secure Transactions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>Student Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
        </PageTransition>
      </main>
    </div>
  );
} 