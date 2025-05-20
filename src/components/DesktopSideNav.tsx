
import { Home, MessageSquare, Plus, Heart, Settings, User, LogOut, ShoppingBag, Truck } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Import new components
import { SideNavItem } from "./navigation/SideNavItem";
import { SellButton } from "./navigation/SellButton";
import { UserProfileSection } from "./navigation/UserProfileSection";
import { LogoutButton } from "./navigation/LogoutButton";

export const DesktopSideNav = () => {
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [showSellSafetyTips, setShowSellSafetyTips] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
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

  // Reordered navItems to put Saved right before Sell
  const navItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: MessageSquare, label: "Messages", href: "/messages", hasNotification: hasNewMessages, notificationCount: totalUnreadMessages },
    { icon: Heart, label: "Saved", href: "/saved" }, // Moved up above Sell
    { icon: Plus, label: "Sell", href: "#", onClick: handleSellClick },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Truck, label: "Delivery", href: "/delivery", desktopOnly: true },
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
          "fixed left-0 top-0 bottom-0 right-auto z-40 flex flex-col w-[300px] h-screen min-h-0 p-0 m-0 backdrop-blur-sm",
          theme === 'light' 
            ? "border-r border-gray-200 bg-white/95 shadow-md" 
            : "border-r border-white/10 bg-black"
        )}
        style={{height: '100vh', top: 0, bottom: 0}}
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className={cn(
          "flex items-center px-6 h-20",
          theme === 'light' ? "border-b border-gray-200" : "border-b border-white/10"
        )}>
          <Link to="/home" className="group relative overflow-hidden text-2xl font-bold transition-all duration-300 hover:scale-105">
            <motion.span 
              className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent"
              initial={{ y: 0 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.3 }}
            >
              GSU Market
            </motion.span>
            <motion.span 
              className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-primary to-blue-500 transition-all duration-300 group-hover:w-full"
              initial={{ width: 0 }}
              whileHover={{ width: '100%' }}
              transition={{ duration: 0.3 }}
            />
          </Link>
        </div>
        <div className="flex-1 flex flex-col justify-between min-h-0">
          <nav className="flex-1 flex flex-col">
            {/* First part of the navigation - top items */}
            <div className="flex-1 flex flex-col gap-2 py-6">
              {navItems.slice(0, 2).map((item) => (
                <SideNavItem key={item.label} item={item} theme={theme} />
              ))}
            </div>

            {/* Center sell and saved buttons */}
            <div className="flex flex-col items-center gap-4 py-6">
              {/* Saved button */}
              <SideNavItem item={navItems[2]} theme={theme} />
              
              {/* Sell button - styled differently */}
              <SellButton item={navItems[3]} theme={theme} />
            </div>
            
            {/* Bottom part of navigation */}
            <div className="flex-1 flex flex-col gap-2 py-6">
              {navItems.slice(4).map((item) => {
                // Skip desktop-only items on mobile
                if (item.desktopOnly && deviceType === "mobile") return null;
                return <SideNavItem key={item.label} item={item} theme={theme} />;
              })}
            </div>
          </nav>
          
          <div className={cn(
            "w-full max-w-[260px] mx-auto mt-8 pt-6 flex flex-col items-center gap-4",
            theme === 'light' ? "border-t border-gray-200" : "border-t border-white/10"
          )}>
            <UserProfileSection userProfile={userProfile} user={user} theme={theme} />
            <LogoutButton onClick={() => setShowLogoutDialog(true)} theme={theme} />
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
      
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
