
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SideNavItem } from "@/components/navigation/SideNavItem";
import { SellButton } from "@/components/navigation/SellButton";
import { UserProfileSection } from "@/components/navigation/UserProfileSection";
import { LogoutButton } from "@/components/navigation/LogoutButton";
import { useDeviceType } from "@/hooks/use-mobile";
import {
  Home,
  MessageCircle,
  Heart,
  Settings,
  User,
} from "lucide-react";

export const DesktopSideNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const deviceType = useDeviceType();

  // Don't render on mobile devices
  if (deviceType === 'mobile') {
    return null;
  }

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigationItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: MessageCircle, label: "Messages", href: "/messages" },
    { icon: Heart, label: "Saved", href: "/saved" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    setShowLogoutConfirm(false);
  };

  return (
    <div className="fixed left-0 top-0 h-full w-[300px] bg-card border-r border-border z-40 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">GSU Market</h1>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => (
          <SideNavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            isActive={location.pathname === item.href}
          />
        ))}

        {/* Sell Button */}
        <div className="pt-4">
          <SellButton />
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-4">
        {user && <UserProfileSection user={user} />}
        <LogoutButton 
          onLogout={() => setShowLogoutConfirm(true)}
          showConfirm={showLogoutConfirm}
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      </div>
    </div>
  );
};
