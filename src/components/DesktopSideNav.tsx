
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
import { useTheme } from "../contexts/ThemeContext";

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
  const { theme } = useTheme();
  
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
        className={cn(
          "fixed left-0 top-0 bottom-0 right-auto z-40 flex flex-col w-[300px] h-screen min-h-0 p-0 m-0",
          theme === 'light' 
            ? "border-r border-gray-200 bg-white shadow-sm" 
            : "border-r border-white/10 bg-secondary/95"
        )}
        style={{height: '100vh', top: 0, bottom: 0}}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className={cn(
          "flex items-center p-4 h-16",
          theme === 'light' ? "border-b border-gray-100" : undefined
        )}>
          <Link to="/home" className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">GSU Market</span>
          </Link>
        </div>
        <div className="flex-1 flex flex-col justify-between min-h-0">
          <nav className="flex-1 flex flex-col justify-between">
            <div className="flex-1 flex flex-col gap-2 py-6">
              {navItems.map((item) => (
  <Tooltip key={item.label}>
    <TooltipTrigger asChild>
      {item.onClick ? (
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-4 w-full py-3 px-4 rounded-lg text-lg transition-all",
            location.pathname === item.href
              ? "bg-primary/15 text-primary shadow-md border-l-4 border-primary"
              : theme === 'light' 
                ? "text-black hover:bg-black/5 hover:text-primary" 
                : "text-gray-300 hover:bg-white/10 hover:text-primary/90"
          )}
          onClick={item.onClick}
        >
          <item.icon className={theme === 'light' ? "h-7 w-7 text-black" : "h-7 w-7"} />
          <span className="text-lg font-medium">{item.label}</span>
        </Button>
      ) : (
        <Link
          to={item.href}
          className={cn(
            "flex items-center gap-4 w-full py-3 px-4 rounded-lg text-lg transition-all",
            location.pathname === item.href
              ? "bg-primary/15 text-primary shadow-md border-l-4 border-primary"
              : theme === 'light' 
                ? "text-black hover:bg-black/5 hover:text-primary" 
                : "text-gray-300 hover:bg-white/10 hover:text-primary/90"
          )}
        >
          <item.icon className={theme === 'light' ? "h-7 w-7 text-black" : "h-7 w-7"} />
          <span className="text-lg font-medium">{item.label}</span>
        </Link>
      )}
    </TooltipTrigger>
    <TooltipContent>{item.label}</TooltipContent>
  </Tooltip>
))}
            </div>
          </nav>
          <div className={cn(
            "w-full max-w-[240px] mx-auto mt-6 pt-4 flex flex-col items-center gap-3",
            theme === 'light' ? "border-t border-gray-200" : "border-t border-white/10"
          )}>
            {userProfile && (
              <div className="flex items-center gap-3 w-full px-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userProfile?.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {userProfile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className={cn("font-medium text-sm truncate", theme === 'light' ? "text-black" : undefined)}>{userProfile?.first_name || 'User'}</div>
                  <div className={cn("text-xs truncate", theme === 'light' ? "text-gray-600" : "text-gray-400")}>{user?.email}</div>
                </div>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-4 w-full py-3 px-4 h-auto rounded-lg",
                    theme === 'light' ? "text-red-600 hover:bg-red-50" : "text-red-400 hover:bg-red-500/10"
                  )}
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm">Logout</span>
                </Button>
              </TooltipTrigger>
            </Tooltip>
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
