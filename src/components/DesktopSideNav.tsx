
import { Home, MessageSquare, Plus, Heart, Settings, User, LogOut, ShoppingBag, Truck, Wallet, Briefcase, Search, UserCheck, FileText, Calendar, Newspaper, BookOpen, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDeviceType } from "../hooks/use-mobile";
import { useSettings } from "../contexts/SettingsContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useAppMode } from "@/contexts/AppModeContext";
import { supabase } from "@/integrations/supabase/client";
import { SellModal } from "./SellModal";
import { CreateGigModal } from "./CreateGigModal";
import SafetyTipsDialog from "./SafetyTipsDialog";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { toast } from "sonner";
import { useTheme } from "../contexts/ThemeContext";
import { ModeToggle } from "./ModeToggle";
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
  const [isCreateGigModalOpen, setIsCreateGigModalOpen] = useState(false);
  const [showSellSafetyTips, setShowSellSafetyTips] = useState(false);
  const [showGigSafetyTips, setShowGigSafetyTips] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { hideSellTips, isSidebarCollapsed, toggleSidebar } = useSettings();
  const { unreadMessagesByUser } = useNotifications();
  const { currentMode, isMarketplace, isGigs } = useAppMode();
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

  const handleCreateGigClick = () => {
    if (!hideSellTips) {
      setShowGigSafetyTips(true);
    } else {
      setIsCreateGigModalOpen(true);
    }
  };

  // Calculate if there are any new messages
  const hasNewMessages = Object.keys(unreadMessagesByUser).length > 0;
  const totalUnreadMessages = Object.values(unreadMessagesByUser).reduce((a, b) => a + b, 0);

  // Navigation items based on current mode
  const marketplaceNavItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: MessageSquare, label: "Messages", href: "/messages", hasNotification: hasNewMessages, notificationCount: totalUnreadMessages },
    { icon: Heart, label: "Saved", href: "/saved" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Truck, label: "Delivery", href: "/delivery", desktopOnly: true },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const gigsNavItems = [
    { icon: Search, label: "Browse Gigs", href: "/gigs" },
    { icon: Briefcase, label: "My Gigs", href: "/gigs/my-gigs" },
    { icon: UserCheck, label: "Applications", href: "/gigs/applications" },
    { icon: MessageSquare, label: "Messages", href: "/messages", hasNotification: hasNewMessages, notificationCount: totalUnreadMessages },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const eventsNavItems = [
    { icon: Calendar, label: "Browse Events", href: "/events" },
    { icon: MessageSquare, label: "Messages", href: "/messages", hasNotification: hasNewMessages, notificationCount: totalUnreadMessages },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const newsNavItems = [
    { icon: Newspaper, label: "Latest News", href: "/news" },
    { icon: MessageSquare, label: "Messages", href: "/messages", hasNotification: hasNewMessages, notificationCount: totalUnreadMessages },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const studyNavItems = [
    { icon: BookOpen, label: "Study Groups", href: "/study" },
    { icon: MessageSquare, label: "Messages", href: "/messages", hasNotification: hasNewMessages, notificationCount: totalUnreadMessages },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const lostNavItems = [
    { icon: Search, label: "Lost & Found", href: "/lost-and-found" },
    { icon: MessageSquare, label: "Messages", href: "/messages", hasNotification: hasNewMessages, notificationCount: totalUnreadMessages },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const roomNavItems = [
    { icon: Home, label: "Roommates", href: "/roommates" },
    { icon: MessageSquare, label: "Messages", href: "/messages", hasNotification: hasNewMessages, notificationCount: totalUnreadMessages },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  let navItems = marketplaceNavItems;
  if (isGigs) navItems = gigsNavItems;
  else if (currentMode === 'events') navItems = eventsNavItems;
  else if (currentMode === 'news') navItems = newsNavItems;
  else if (currentMode === 'study') navItems = studyNavItems;
  else if (currentMode === 'lost') navItems = lostNavItems;
  else if (currentMode === 'room') navItems = roomNavItems;

  // Action items based on mode
  const sellItem = { icon: Plus, label: "Sell", href: "#", onClick: handleSellClick };
  const createGigItem = { icon: Plus, label: "Create", href: "#", onClick: handleCreateGigClick };

  let actionItem = sellItem;
  if (isGigs) actionItem = createGigItem;
  // For other modes, we can default to sellItem or null, or a specific action
  // For now, let's hide the action button for other modes if not applicable, or default to something generic
  if (!isMarketplace && !isGigs) {
    // Maybe a generic "Post" button?
    // For now, we'll just use sellItem as a placeholder or hide it
    // Let's keep it as sellItem for now to avoid errors
    actionItem = sellItem;
  }

  // Don't show on mobile
  if (deviceType === 'mobile') {
    return null;
  }

  let homeLink = "/home";
  if (currentMode === 'gigs') homeLink = "/gigs";
  else if (currentMode === 'events') homeLink = "/events";
  else if (currentMode === 'news') homeLink = "/news";
  else if (currentMode === 'study') homeLink = "/study";
  else if (currentMode === 'lost') homeLink = "/lost-and-found";
  else if (currentMode === 'room') homeLink = "/roommates";

  return (
    <>
      <motion.aside
        className={cn(
          "fixed left-0 top-0 bottom-0 right-auto z-40 flex flex-col min-h-0 p-0 m-0 transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "w-[80px]" : "w-[240px]",
          theme === 'light'
            ? "border-r border-gray-200 bg-white/95 shadow-sm"
            : "border-r border-white/10 bg-black"
        )}
        style={{ height: '100vh' }}
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Header section with logo */}
        <div className={cn(
          "flex-shrink-0 flex flex-col items-center px-4 py-3 space-y-3 relative overflow-visible"
        )}>
          <Link to={homeLink} className="w-full flex justify-center group relative transition-all duration-300 hover:scale-105">
            <motion.div
              className="h-10 overflow-hidden"
              initial={{ y: 0 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.3 }}
            >
              <img src="/logo.png" alt="Book'n'Campus Logo" className="h-full object-contain" />
            </motion.div>
            {!isSidebarCollapsed && (
              <motion.span
                className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-[#16a34a] to-emerald-500 transition-all duration-300 group-hover:w-full"
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.3 }}
              />
            )}
          </Link>

          <ModeToggle isCollapsed={isSidebarCollapsed} />
        </div>

        {/* Scrollable navigation section */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <nav className="py-1 px-1">
            <div className="space-y-1">
              {navItems.slice(0, Math.ceil(navItems.length / 2)).map((item) => (
                <SideNavItem key={item.label} item={item} theme={theme} isCollapsed={isSidebarCollapsed} />
              ))}
            </div>

            <div className="my-2 flex justify-center">
              <SellButton item={actionItem} theme={theme} isCollapsed={isSidebarCollapsed} />
            </div>

            <div className="space-y-1">
              {navItems.slice(Math.ceil(navItems.length / 2)).map((item) => (
                <SideNavItem key={item.label} item={item} theme={theme} isCollapsed={isSidebarCollapsed} />
              ))}
            </div>
          </nav>
        </div>

        {/* Footer section with profile and logout */}
        <div className={cn(
          "flex-shrink-0 border-t px-2 py-2",
          theme === 'light' ? "border-gray-200" : "border-white/10"
        )}>
          <UserProfileSection
            userProfile={userProfile}
            user={user}
            theme={theme}
            isLoading={profileLoading}
            isCollapsed={isSidebarCollapsed}
          />
          <div className="mt-1">
            <LogoutButton onClick={() => setShowLogoutDialog(true)} theme={theme} isCollapsed={isSidebarCollapsed} />
          </div>
        </div>
      </motion.aside>

      {/* Toggle Button - positioned independently, not inside sidebar */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-3.5 h-8 w-8 rounded-full border-2 shadow-xl z-[60] transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "left-16" : "left-[224px]",
          theme === 'light'
            ? "bg-white border-gray-300 text-gray-600 hover:text-primary hover:border-primary hover:shadow-2xl"
            : "bg-black border-white/20 text-gray-300 hover:text-primary hover:border-primary hover:shadow-2xl"
        )}
        onClick={toggleSidebar}
      >
        {isSidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </Button>

      {/* Modals */}
      <SafetyTipsDialog
        open={showSellSafetyTips}
        onClose={() => {
          setShowSellSafetyTips(false);
          setIsSellModalOpen(true);
        }}
        trigger="sell"
      />
      <SafetyTipsDialog
        open={showGigSafetyTips}
        onClose={() => {
          setShowGigSafetyTips(false);
          setIsCreateGigModalOpen(true);
        }}
        trigger="gig"
      />
      <SellModal isOpen={isSellModalOpen} onClose={() => setIsSellModalOpen(false)} />
      <CreateGigModal isOpen={isCreateGigModalOpen} onClose={() => setIsCreateGigModalOpen(false)} />

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
