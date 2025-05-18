import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, User, Bell, Search, Heart, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/contexts/SettingsContext";
import { useNotification } from "@/contexts/NotificationContext";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "@/contexts/UserContext";

interface SideNavItemProps {
  to: string;
  icon: JSX.Element;
  label: string;
  badge?: number;
  onClick?: () => void;
}

export const DesktopSideNav = () => {
  const location = useLocation();
  const [savedCount, setSavedCount] = useState(0);
  const { theme } = useTheme();
  const { fontSizeClass } = useSettings();
  const { unreadCount } = useNotification();
  const { user } = useUser();

  useEffect(() => {
    // Fetch saved count if user is logged in
    const fetchSavedCount = async () => {
      if (user) {
        try {
          const { count, error } = await supabase
            .from('saved_items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (error) {
            console.error('Error fetching saved count:', error);
          } else if (count !== null) {
            setSavedCount(count);
          }
        } catch (error) {
          console.error('Error fetching saved count:', error);
        }
      } else {
        setSavedCount(0);
      }
    };

    fetchSavedCount();
  }, [user, location.pathname]);

  // Hide SideNav on specific routes
  const hiddenPaths = [
    '/auth',
    '/admin',
    '/',
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/signin';
  };

  const shouldHide = hiddenPaths.some((path) => location.pathname.startsWith(path));
  if (shouldHide) return null;

  return (
    <div className={cn(
      "fixed left-0 top-0 bottom-0 w-[300px] hidden lg:flex flex-col z-40 px-6 py-8 border-r",
      "dark:border-white/10 dark:bg-black/80 backdrop-blur-lg",
      "light:border-gray-200 light:bg-white/90",
      "transition-all duration-300"
    )}>
      <div className="mb-10 px-4">
        <h1 className="text-2xl font-bold">GSU Market</h1>
        <p className="text-sm text-muted-foreground">Buy & sell with ease</p>
      </div>

      <div className="flex-1 space-y-1.5">
        <SideNavItem to="/home" icon={<Home className="h-5 w-5" />} label="Home" />
        <SideNavItem 
          to="/saved" 
          icon={<Heart className="h-5 w-5" />} 
          label="Saved Items" 
          badge={savedCount > 0 ? savedCount : undefined} 
        />
        <SideNavItem to="/search" icon={<Search className="h-5 w-5" />} label="Search" />
        <SideNavItem 
          to="/notifications" 
          icon={<Bell className="h-5 w-5" />} 
          label="Notifications"
          badge={unreadCount > 0 ? unreadCount : undefined} 
        />
        <SideNavItem to="/profile" icon={<User className="h-5 w-5" />} label="Profile" />
        <SideNavItem to="/settings" icon={<Settings className="h-5 w-5" />} label="Settings" />
      </div>

      <div className="px-4 mt-auto">
        <Button 
          variant="ghost" 
          className="w-full justify-start pl-3 text-red-500 hover:text-red-600 hover:bg-red-500/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
};

const SideNavItem = ({ to, icon, label, badge, onClick }: SideNavItemProps) => {
  if (onClick) {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start pl-3 hover:bg-accent"
        onClick={onClick}
      >
        <div className="flex items-center w-full">
          <span className="mr-3">{icon}</span>
          <span className="flex-1">{label}</span>
          {typeof badge === 'number' && badge > 0 && (
            <Badge variant="default" className="ml-auto">
              {badge}
            </Badge>
          )}
        </div>
      </Button>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center px-3 py-2.5 rounded-lg transition-colors relative",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      {({ isActive }) => (
        <>
          <div className="mr-3 relative">
            {icon}
            {typeof badge === 'number' && badge > 0 && (
              <Badge 
                variant="default" 
                className="absolute -top-2 -right-2 min-w-5 h-5 flex items-center justify-center p-0"
              >
                {badge}
              </Badge>
            )}
          </div>
          <span className="flex-1">{label}</span>
          {isActive && (
            <motion.div
              layoutId="sideNavIndicator"
              className="absolute left-0 w-1 h-full bg-primary rounded-r-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
};
