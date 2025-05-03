
import { Home, MessageSquare, Plus, Heart, Settings, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SellModal } from "./SellModal";
import SafetyTipsDialog from "./SafetyTipsDialog";

export const DesktopSideNav = () => {
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showSellSafetyTips, setShowSellSafetyTips] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const { hideSellTips } = useSettings();
  const { unreadMessagesByUser } = useNotifications();
  
  useEffect(() => {
    // Check for existing user session
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        setUserProfile(profileData);
      }
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

  // If there's no user, don't render the navigation
  if (!user) {
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
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const navItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: MessageSquare, label: "Messages", href: "/messages", hasNotification: hasNewMessages, count: totalUnreadMessages },
    { icon: Plus, label: "Sell", href: "#" },
    { icon: Heart, label: "Saved", href: "/saved" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <>
      <aside className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 bg-secondary border-r border-white/10 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link to="/home" className={cn(
            "flex items-center gap-2",
            isCollapsed && "justify-center"
          )}>
            <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            {!isCollapsed && <span className="text-xl font-bold">Tradezy</span>}
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-white"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? "→" : "←"}
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6">
          <div className="px-2 space-y-4">
            {navItems.map((item, index) => (
              index === 2 ? (
                <button
                  key={item.label}
                  onClick={handleSellClick}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-lg transition-colors",
                    "bg-primary text-white hover:bg-primary/90",
                    isCollapsed && "justify-center"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              ) : (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors relative",
                    location.pathname === item.href 
                      ? "bg-white/10 text-primary" 
                      : "text-gray-400 hover:bg-white/5 hover:text-white",
                    isCollapsed && "justify-center"
                  )}
                >
                  {item.hasNotification && item.count > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1"
                    >
                      {item.count}
                    </Badge>
                  )}
                  <item.icon className="w-5 h-5" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              )
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-white/10">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={userProfile?.avatar_url} />
                <AvatarFallback>
                  {(userProfile?.first_name?.[0] || '') + (userProfile?.last_name?.[0] || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {userProfile?.first_name} {userProfile?.last_name}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-full flex items-center justify-center text-gray-400 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          )}
        </div>
      </aside>
      
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
