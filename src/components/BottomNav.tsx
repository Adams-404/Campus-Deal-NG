
import { Home, MessageSquare, Plus, Heart, Settings, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { SellModal } from "./SellModal";
import { Link, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "../contexts/SettingsContext";
import SafetyTipsDialog from "./SafetyTipsDialog";

export const BottomNav = () => {
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showSellSafetyTips, setShowSellSafetyTips] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const { hideSellTips } = useSettings();
  
  useEffect(() => {
    // Check for existing user session
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check for unread messages when component mounts
        checkUnreadMessages(user.id);
      }
    };
    
    checkUser();
    
    // Set up auth state listener for real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        checkUnreadMessages(currentUser.id);
      }
    });

    // Listen for new messages
    const handleNewMessage = (event: any) => {
      const payload = event.detail;
      if (payload.new && user && payload.new.receiver_id === user.id) {
        console.log('New message received for current user!', payload);
        setHasNewMessages(true);
      }
    };

    window.addEventListener('new-message', handleNewMessage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('new-message', handleNewMessage);
    };
  }, [user]);

  // Check for unread messages in the database
  const checkUnreadMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', userId)
        .eq('is_read', false);
        
      if (error) {
        console.error('Error fetching unread messages:', error);
        return;
      }
      
      setHasNewMessages(data && data.length > 0);
      console.log(`User has ${data?.length || 0} unread messages`);
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  };

  // Reset the new messages indicator when navigating to messages
  useEffect(() => {
    if (location.pathname.startsWith('/messages')) {
      setHasNewMessages(false);
    }
  }, [location.pathname]);

  // If there's no user, don't render the navigation
  if (!user) {
    return null;
  }

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
                  <CircleDot className="absolute -right-1 -top-1 h-3 w-3 text-green-500" />
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
