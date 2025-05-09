
import { Home, MessageSquare, Plus, Heart, Settings, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDeviceType } from "../hooks/use-mobile";
import { useSettings } from "../contexts/SettingsContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { supabase } from "@/integrations/supabase/client";
import { SellModal } from "./SellModal";
import SafetyTipsDialog from "./SafetyTipsDialog";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { toast } from "sonner";

export const DesktopSideNav = () => {
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [showSellSafetyTips, setShowSellSafetyTips] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { hideSellTips } = useSettings();
  const { unreadMessagesByUser } = useNotifications();
  const deviceType = useDeviceType();
  
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        setUserProfile(profile);
      }
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // If there's no user, don't render the navigation
  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Successfully signed out");
      navigate("/");
    }
  };

  const handleSellClick = () => {
    if (!hideSellTips) {
      setShowSellSafetyTips(true);
    } else {
      setIsSellModalOpen(true);
    }
  };

  // Calculate if there are any new messages
  const hasNewMessages = Object.keys(unreadMessagesByUser).length > 0;
  const totalUnreadMessages = Object.values(unreadMessagesByUser).reduce((a, b) => a + b, 0);

  const navItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: MessageSquare, label: "Messages", href: "/messages", hasNotification: hasNewMessages, notificationCount: totalUnreadMessages },
    { icon: Plus, label: "Sell", href: "#", onClick: handleSellClick },
    { icon: Heart, label: "Saved", href: "/saved" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];
  
  // Don't show on mobile, show on tablet and desktop
  if (deviceType === 'mobile') {
    return null;
  }

  return (
    <>
      <motion.aside 
        className="fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-white/10 bg-secondary/95 w-[300px]"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center p-4 h-16">
          <Link to="/home" className="text-xl font-bold text-primary">GSU Market</Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col justify-between">
          <TooltipProvider delayDuration={300}>
            <nav className="flex flex-col h-full">
              <div className="space-y-4 px-3">
                {navItems.map((item) => (
                  item.onClick ? (
                    <Tooltip key={item.label}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "flex items-center justify-start gap-4 w-full py-3 h-auto",
                            location.pathname === item.href && "bg-primary/10 text-primary"
                          )}
                          onClick={item.onClick}
                        >
                          <div className="relative">
                            <item.icon className={cn(
                              "h-5 w-5", 
                              location.pathname === item.href ? "text-primary" : "text-gray-400"
                            )} />
                          </div>
                          <span className="text-sm">{item.label}</span>
                        </Button>
                      </TooltipTrigger>
                    </Tooltip>
                  ) : (
                    <Tooltip key={item.label}>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.href}
                          className={cn(
                            "flex items-center justify-start gap-4 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 transition-colors",
                            location.pathname === item.href && "bg-primary/10 text-primary"
                          )}
                        >
                          <div className="relative">
                            <item.icon className={cn(
                              "h-5 w-5", 
                              location.pathname === item.href ? "text-primary" : "text-gray-400"
                            )} />
                            {item.hasNotification && totalUnreadMessages > 0 && (
                              <span className="absolute -top-1 -right-1 flex h-5 w-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                                {totalUnreadMessages}
                              </span>
                            )}
                          </div>
                          <span className="text-sm">{item.label}</span>
                        </Link>
                      </TooltipTrigger>
                    </Tooltip>
                  )
                ))}
              </div>
              
              {/* Logout button */}
              <div className="mt-auto px-3 mb-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center justify-start gap-4 w-full py-3 h-auto text-red-400 hover:bg-red-500/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="text-sm">Logout</span>
                    </Button>
                  </TooltipTrigger>
                </Tooltip>
              </div>
            </nav>
          </TooltipProvider>
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile?.avatar_url} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {userProfile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium text-sm">{userProfile?.first_name || 'User'}</div>
              <div className="text-xs text-gray-400 truncate max-w-[180px]">{user?.email}</div>
            </div>
          </div>
        </div>
      </motion.aside>

      <SafetyTipsDialog 
        open={showSellSafetyTips} 
        onClose={() => {
          setShowSellSafetyTips(false);
          setIsSellModalOpen(true);
        }} 
        trigger="sell"
      />
      
      <SellModal isOpen={isSellModalOpen} onClose={() => setIsSellModalOpen(false)} />
    </>
  );
};
