
import { Home, MessageSquare, Plus, Heart, Settings, User, LogOut, ShoppingBag, Truck, Wallet } from "lucide-react";
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
  const [profileLoading, setProfileLoading] = useState(true);
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
        setProfileLoading(true);
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (error) {
            console.error('Error fetching profile:', error);
            setUserProfile({ id: user.id, first_name: 'User' });
          } else {
            setUserProfile(profile);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setUserProfile({ id: user.id, first_name: 'User' });
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfileLoading(false);
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

  // Always render the sidebar, even if user is not loaded yet, to avoid delayed appearance

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
    { icon: Heart, label: "Saved", href: "/saved" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Truck, label: "Delivery", href: "/delivery", desktopOnly: true },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];
  
  // The sell item with onClick handler
  const sellItem = { icon: Plus, label: "Sell", href: "#", onClick: handleSellClick };
  
  // Don't show on mobile
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
          "flex justify-center items-center px-6 h-20"
        )}>
          <Link to="/home" className="group relative flex items-center transition-all duration-300 hover:scale-105">
            <motion.div 
              className="h-14 overflow-hidden"
              initial={{ y: 0 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.3 }}
            >
              <img src="/logo.png" alt="GSU Market Logo" className="h-full object-contain" />
            </motion.div>
            <motion.span 
              className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-[#16a34a] to-emerald-500 transition-all duration-300 group-hover:w-full"
              initial={{ width: 0 }}
              whileHover={{ width: '100%' }}
              transition={{ duration: 0.3 }}
            />
          </Link>
        </div>
        <div className="flex-1 flex flex-col justify-between min-h-0">
          <nav className="flex-1 flex flex-col pt-5 px-2">
            {/* All navigation items with consistent spacing */}
            <div className="space-y-1.5">
              {/* Home & Messages */}
              {navItems.slice(0, 2).map((item) => (
                <SideNavItem key={item.label} item={item} theme={theme} />
              ))}
              
              {/* Saved item */}
              <SideNavItem item={navItems[2]} theme={theme} />
              
              {/* Sell button - styled differently */}
              <SellButton item={sellItem} theme={theme} />
              
              {/* Bottom navigation items - Profile, Delivery, Settings */}
              {navItems.slice(3).map((item) => {
                // Only render desktopOnly items on desktop (deviceType is never 'mobile' here)
                if (item.desktopOnly && deviceType !== 'desktop') return null;
                return <SideNavItem key={item.label} item={item} theme={theme} />;
              })}
            </div>
          </nav>
          
          {/* User profile and logout section */}
          <div className={cn(
            "mt-auto pt-2 px-4 pb-2",
            theme === 'light' ? "border-t border-gray-200" : "border-t border-white/10"
          )}>
            <UserProfileSection 
              userProfile={userProfile} 
              user={user} 
              theme={theme} 
              isLoading={profileLoading}
            />
            <div className="mt-4 relative z-10 w-full">
              <LogoutButton onClick={() => setShowLogoutDialog(true)} theme={theme} />
            </div>
          </div>
        </div>
      </motion.aside>
      
      {/* Modals */}
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
