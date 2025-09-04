
import { Home, MessageSquare, Plus, Heart, Settings, Briefcase, Search, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { SellModal } from "./SellModal";
import { CreateGigModal } from "./CreateGigModal";
import { Link, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "../contexts/SettingsContext";
import SafetyTipsDialog from "./SafetyTipsDialog";
import { useNotifications } from "@/contexts/NotificationContext";
import { useDeviceType } from "../hooks/use-mobile";
import { useTheme } from "../contexts/ThemeContext";
import { useAppMode } from "@/contexts/AppModeContext";

export const BottomNav = () => {
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isCreateGigModalOpen, setIsCreateGigModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showSellSafetyTips, setShowSellSafetyTips] = useState(false);
  const [showGigSafetyTips, setShowGigSafetyTips] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const { hideSellTips } = useSettings();
  const { unreadMessagesByUser } = useNotifications();
  const { isMarketplace, isGigs } = useAppMode();
  const deviceType = useDeviceType();
  const { theme } = useTheme();
  
  useEffect(() => {
    // Check for existing user session
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    checkUser();
    
    // Set up auth state listener for real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Only show on mobile devices
  if (!user || deviceType !== 'mobile') {
    return null;
  }

  // Calculate if there are any new messages
  const hasNewMessages = Object.keys(unreadMessagesByUser).length > 0;
  const totalUnreadMessages = Object.values(unreadMessagesByUser).reduce((a, b) => a + b, 0);

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

  // Navigation items based on current mode
  const marketplaceNavItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: Heart, label: "Saved", href: "/saved" },
    { icon: Plus, label: "Sell", href: "#", onClick: handleSellClick },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const gigsNavItems = [
    { icon: Search, label: "Browse", href: "/gigs" },
    { icon: Briefcase, label: "My Gigs", href: "/gigs/my-gigs" },
    { icon: Plus, label: "Create", href: "#", onClick: handleCreateGigClick },
    { icon: UserCheck, label: "Applied", href: "/gigs/applications" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const navItems = isMarketplace ? marketplaceNavItems : gigsNavItems;

  return (
    <>
      <nav data-bottom-nav className={cn(
        "fixed bottom-0 left-0 right-0 backdrop-blur-md border-t px-6 pb-6 pt-3 z-40 w-full",
        theme === 'light' 
          ? "bg-white/90 border-gray-200 shadow-sm" 
          : "bg-neutral-900/90 border-white/10"
      )}>
        <div className="flex justify-between items-center max-w-md mx-auto relative">
          {navItems.map((item, index) => (
            index === 2 ? (
              <button
                key={item.label}
                onClick={(item as any).onClick}
                className={cn(
                  "flex flex-col items-center gap-1 relative",
                  "-mt-8"
                )}
              >
                <div className="bg-primary rounded-full p-4 shadow-lg shadow-primary/20 -mt-6">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className={cn(
                  "text-xs",
                  theme === 'light' ? "text-black" : "text-gray-400"
                )}>{item.label}</span>
              </button>
            ) : (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 relative",
                  location.pathname === item.href && "text-primary"
                )}
              >
                {item.href === "/messages" && hasNewMessages && (
                  <>
                    {totalUnreadMessages > 0 && (
                      <div className="absolute -right-2 -top-2">
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] min-h-[18px]">
                          {totalUnreadMessages}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <item.icon className={cn(
                  "w-6 h-6",
                  location.pathname === item.href 
                    ? "text-primary" 
                    : theme === 'light' ? "text-black" : "text-gray-400"
                )} />
                <span className={cn(
                  "text-xs",
                  location.pathname === item.href 
                    ? "text-primary" 
                    : theme === 'light' ? "text-black" : "text-gray-400"
                )}>{item.label}</span>
              </Link>
            )
          ))}
        </div>
      </nav>
      
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
    </>
  );
};
