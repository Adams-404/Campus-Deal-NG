
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, User, Bell, Search, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/contexts/SettingsContext";
import { useNotification } from "@/contexts/NotificationContext";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";

interface NavItemProps {
  to: string;
  icon: JSX.Element;
  label: string;
  badge?: number;
}

export const BottomNav = () => {
  const location = useLocation();
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const { theme } = useTheme();
  const { fontSizeClass } = useSettings();
  const { unreadCount } = useNotification();

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserLoggedIn(true);
        fetchSavedCount(data.user.id);
      } else {
        setUserLoggedIn(false);
        setSavedCount(0);
      }
    };

    checkUser();
  }, [location.pathname]);

  const fetchSavedCount = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('saved_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching saved count:', error);
      } else if (count !== null) {
        setSavedCount(count);
      }
    } catch (error) {
      console.error('Error fetching saved count:', error);
    }
  };

  const fontSize = {
    small: 'text-[10px]',
    medium: 'text-xs',
    large: 'text-sm',
  }[fontSizeClass] || 'text-xs';

  // Hide BottomNav on specific routes
  const hiddenPaths = [
    '/auth',
    '/admin',
    '/',
  ];

  const shouldHide = hiddenPaths.some((path) => location.pathname.startsWith(path));
  if (shouldHide) return null;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 border-t z-30 bg-background/80 backdrop-blur-lg",
      "dark:border-white/10 dark:bg-black/80",
      "light:border-gray-200 light:bg-white/90",
      "transition-all duration-300"
    )}>
      <AnimatePresence>
        <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
          <NavItem to="/home" icon={<Home className="h-5 w-5" />} label="Home" />
          <NavItem 
            to="/saved" 
            icon={<Heart className="h-5 w-5" />} 
            label="Saved" 
            badge={savedCount > 0 ? savedCount : undefined} 
          />
          <NavItem to="/search" icon={<Search className="h-5 w-5" />} label="Search" />
          <NavItem 
            to="/notifications" 
            icon={<Bell className="h-5 w-5" />} 
            label="Alerts"
            badge={unreadCount > 0 ? unreadCount : undefined} 
          />
          <NavItem to="/profile" icon={<User className="h-5 w-5" />} label="Profile" />
        </div>
      </AnimatePresence>
    </div>
  );
};

const NavItem = ({ to, icon, label, badge }: NavItemProps) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "flex flex-col items-center justify-center py-2 px-4 w-1/5 relative",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {({ isActive }) => (
        <>
          <div className="relative">
            {icon}
            {typeof badge === 'number' && badge > 0 && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "absolute -top-1.5 -right-1.5 rounded-full bg-primary flex items-center justify-center",
                  badge >= 10 ? "min-w-5 h-5 text-[10px]" : "min-w-4 h-4 text-[9px]"
                )}
              >
                <span className="text-primary-foreground">{badge}</span>
              </motion.div>
            )}
          </div>
          <span className="text-xs mt-1">{label}</span>
          {isActive && (
            <motion.div 
              layoutId="bottomNavIndicator"
              className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
};
