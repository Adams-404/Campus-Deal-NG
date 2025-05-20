
import { Home, MessageSquare, Plus, Heart, Settings, User, LogOut, ShoppingBag } from "lucide-react";
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
          <nav className="flex-1 flex flex-col justify-between">
            <div className="flex-1 flex flex-col gap-2 py-6">
              {navItems.map((item) => (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    {item.label === "Sell" ? (
                      <Button
                        variant="ghost"
                        className={cn(
                          "group relative flex items-center justify-between w-full transition-all duration-300",
                          theme === 'light'
                            ? "bg-gradient-to-r from-white/90 via-blue-50 to-white/90 border-2 border-[#1078a7] shadow-sm"
                            : "bg-gradient-to-r from-black/80 via-primary/20 to-black/80 border border-primary/30 shadow-md"
                        )}
                        style={{
                          borderRadius: '2rem',
                          padding: '0.75rem 1.5rem',
                        }}
                        onClick={item.onClick}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <motion.div
                              className={cn(
                                "absolute inset-0 rounded-full",
                                theme === 'light' ? "bg-[#1078a7]/10" : "bg-primary/20"
                              )}
                              initial={{ scale: 0.9 }}
                              animate={{ 
                                scale: [1, 1.05, 1],
                                opacity: [0.7, 1, 0.7]
                              }}
                              transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "mirror"
                              }}
                            />
                            <div className={cn(
                              "flex items-center justify-center w-10 h-10 rounded-full",
                              theme === 'light' ? "bg-white shadow-md" : "bg-black shadow-inner border border-primary/30"
                            )}>
                              <item.icon className={cn(
                                "h-5 w-5",
                                theme === 'light' ? "text-[#1078a7]" : "text-primary"
                              )} />
                            </div>
                          </div>
                          <span className={cn(
                            "text-lg font-medium",
                            theme === 'light' ? "text-[#1078a7]" : "text-primary"
                          )}>{item.label}</span>
                        </div>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          theme === 'light' ? "bg-[#1078a7]/10 text-[#1078a7]" : "bg-primary/20 text-primary"
                        )}>
                          <ShoppingBag className="h-4 w-4" />
                        </div>
                      </Button>
                    ) : item.onClick ? (
                      <Button
                        variant="ghost"
                        className={cn(
                          "group relative flex items-center gap-4 w-full py-4 px-6 rounded-xl text-lg transition-all duration-300",
                          location.pathname === item.href
                            ? theme === 'light'
                              ? "bg-white text-primary shadow-md border-l-4 border-[#1078a7]"
                              : "bg-primary/15 text-primary shadow-md border-l-4 border-primary"
                            : theme === 'light' 
                              ? "text-black hover:bg-white hover:shadow-md hover:text-[#1078a7] hover:border-l-4 hover:border-[#1078a7]/50" 
                              : "text-gray-300 hover:bg-white/10 hover:text-primary/90 hover:border-l-4 hover:border-primary/50"
                        )}
                        onClick={item.onClick}
                      >
                        <div className="relative flex items-center justify-center">
                          <motion.div
                            className="absolute -inset-1 rounded-full bg-primary/0 group-hover:bg-primary/10 transition-all duration-300"
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileHover={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                          <item.icon className={cn(
                            "h-6 w-6 transition-all duration-300", 
                            location.pathname === item.href
                              ? "text-primary"
                              : theme === 'light' ? "text-black group-hover:text-[#1078a7]" : "text-gray-300 group-hover:text-primary"
                          )} />
                        </div>
                        <span className={cn(
                          "text-lg font-medium transition-all duration-300", 
                          location.pathname === item.href
                            ? "translate-x-1"
                            : "group-hover:translate-x-1"
                        )}>{item.label}</span>
                        {item.hasNotification && (
                          <div className="ml-auto flex items-center justify-center">
                            <div className="bg-red-500 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                              {item.notificationCount > 99 ? "99+" : item.notificationCount}
                            </div>
                          </div>
                        )}
                      </Button>
                    ) : (
                      <Link
                        to={item.href}
                        className={cn(
                          "group relative flex items-center gap-4 w-full py-4 px-6 rounded-xl text-lg transition-all duration-300",
                          location.pathname === item.href
                            ? theme === 'light'
                              ? "bg-white text-primary shadow-md border-l-4 border-[#1078a7]"
                              : "bg-primary/15 text-primary shadow-md border-l-4 border-primary"
                            : theme === 'light' 
                              ? "text-black hover:bg-white hover:shadow-md hover:text-[#1078a7] hover:border-l-4 hover:border-[#1078a7]/50" 
                              : "text-gray-300 hover:bg-white/10 hover:text-primary/90 hover:border-l-4 hover:border-primary/50"
                        )}
                      >
                        <div className="relative flex items-center justify-center">
                          <motion.div
                            className="absolute -inset-1 rounded-full bg-primary/0 group-hover:bg-primary/10 transition-all duration-300"
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileHover={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                          <item.icon className={cn(
                            "h-6 w-6 transition-all duration-300", 
                            location.pathname === item.href
                              ? "text-primary"
                              : theme === 'light' ? "text-black group-hover:text-[#1078a7]" : "text-gray-300 group-hover:text-primary"
                          )} />
                        </div>
                        <span className={cn(
                          "text-lg font-medium transition-all duration-300", 
                          location.pathname === item.href
                            ? "translate-x-1"
                            : "group-hover:translate-x-1"
                        )}>{item.label}</span>
                        {item.hasNotification && (
                          <div className="ml-auto flex items-center justify-center">
                            <div className="bg-red-500 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                              {item.notificationCount > 99 ? "99+" : item.notificationCount}
                            </div>
                          </div>
                        )}
                      </Link>
                    )}
                  </TooltipTrigger>
                  <TooltipContent className="bg-black/90 text-white border-white/10 px-3 py-1">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </nav>
          <div className={cn(
            "w-full max-w-[260px] mx-auto mt-8 pt-6 flex flex-col items-center gap-4",
            theme === 'light' ? "border-t border-gray-200" : "border-t border-white/10"
          )}>
            {userProfile && (
              <div className="group relative flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-all duration-300 hover:bg-primary/5">
                <div className="relative">
                  <motion.div
                    className="absolute -inset-1 rounded-full bg-primary/0 group-hover:bg-primary/10 transition-all duration-300"
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                  <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm">
                    <AvatarImage src={userProfile?.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary font-medium">
                      {userProfile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn("font-medium text-sm truncate group-hover:text-primary transition-all duration-300", theme === 'light' ? "text-black" : undefined)}>
                    {userProfile?.first_name || 'User'}
                  </div>
                  <div className={cn("text-xs truncate", theme === 'light' ? "text-gray-600" : "text-gray-400")}>{user?.email}</div>
                </div>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "group relative flex items-center gap-3 w-full py-3 px-4 h-auto rounded-lg transition-all duration-300",
                    theme === 'light' ? "text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200" : "text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
                  )}
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      className="absolute -inset-1 rounded-full bg-red-400/0 group-hover:bg-red-400/10 transition-all duration-300"
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileHover={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                  </div>
                  <span className="text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">Logout</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 text-white border-white/10 px-3 py-1">
                Sign out from your account
              </TooltipContent>
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
