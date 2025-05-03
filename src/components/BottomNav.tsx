
import { Home, MessageSquare, Plus, Heart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { SellModal } from "./SellModal";
import { Link, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "../contexts/SettingsContext";
import SafetyTipsDialog from "./SafetyTipsDialog";
import { useNotifications } from "@/contexts/NotificationContext";
import { useIsMobile } from "../hooks/use-mobile";

export const BottomNav = () => {
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showSellSafetyTips, setShowSellSafetyTips] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const { hideSellTips } = useSettings();
  const { unreadMessagesByUser } = useNotifications();
  const isMobile = useIsMobile();
  
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

  // If there's no user or not on mobile, don't render the navigation
  if (!user || !isMobile) {
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

  const navItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: MessageSquare, label: "Messages", href: "/messages", hasNotification: hasNewMessages },
    { icon: Plus, label: "Sell", href: "#" },
    { icon: Heart, label: "Saved", href: "/saved" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <>
      <nav data-bottom-nav className="fixed bottom-0 left-0 right-0 bg-secondary border-t border-white/10 px-6 pb-6 pt-3">
        <div className="flex justify-between items-center max-w-md mx-auto relative">
          {navItems.map((item, index) => (
            index === 2 ? (
              <button
                key={item.label}
                onClick={handleSellClick}
                className={cn(
                  "flex flex-col items-center gap-1 relative",
                  "-mt-8"
                )}
              >
                <div className="bg-primary rounded-full p-4 shadow-lg shadow-primary/20 -mt-6">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-gray-400">{item.label}</span>
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
                {item.hasNotification && (
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
                  location.pathname === item.href ? "text-primary" : "text-gray-400"
                )} />
                <span className={cn(
                  "text-xs",
                  location.pathname === item.href ? "text-primary" : "text-gray-400"
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
      
      <SellModal isOpen={isSellModalOpen} onClose={() => setIsSellModalOpen(false)} />
    </>
  );
};
