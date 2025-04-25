import { Home, MessageSquare, Plus, Heart, Settings, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { SellModal } from "./SellModal";
import { Link, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "../contexts/SettingsContext";
import SafetyTipsDialog from "./SafetyTipsDialog";

const lockedFeatures = ['/messages', '/saved', '#'];

export const DesktopSideNav = () => {
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showSellSafetyTips, setShowSellSafetyTips] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const { hideSellTips } = useSettings();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  const handleLockedFeature = (href: string) => {
    if (!user) {
      toast({
        title: "Feature Locked",
        description: "Please sign in to access this feature",
        variant: "destructive",
        className: "bg-black text-white border border-red-500",
      });
    }
  };

  const handleSellClick = () => {
    if (isLocked('#')) {
      handleLockedFeature('#');
    } else {
      if (!hideSellTips) {
        setShowSellSafetyTips(true);
      } else {
        setIsSellModalOpen(true);
      }
    }
  };

  const isLocked = (href: string) => !user && lockedFeatures.includes(href);

  const navItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: Plus, label: "Sell", href: "#" },
    { icon: Heart, label: "Saved", href: "/saved" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <>
      <nav className="hidden lg:flex fixed left-0 top-[80px] h-[calc(100vh-80px)] w-[80px] flex-col bg-secondary/80 backdrop-blur-md border-r border-white/10">
        <div className="flex flex-col items-center justify-between h-full py-6">
          <div className="w-full space-y-6">
            {navItems.map((item, index) => (
              index === 2 ? (
                <button
                  key={item.label}
                  onClick={handleSellClick}
                  className={cn(
                    "w-full flex flex-col items-center gap-1 p-3 relative group hover:bg-white/5 transition-colors"
                  )}
                >
                  <div className="bg-primary rounded-full p-3 shadow-lg shadow-primary/20 relative">
                    <item.icon className="w-5 h-5 text-white" />
                    {isLocked(item.href) && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <Lock className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{item.label}</span>
                </button>
              ) : (
                <div
                  key={item.label}
                  onClick={() => isLocked(item.href) && handleLockedFeature(item.href)}
                  className="relative"
                >
                  <Link
                    to={isLocked(item.href) ? '#' : item.href}
                    className={cn(
                      "w-full flex flex-col items-center gap-1 p-3 group hover:bg-white/5 transition-colors",
                      location.pathname === item.href && "bg-white/5"
                    )}
                  >
                    <div className="relative">
                      <item.icon className={cn(
                        "w-5 h-5",
                        location.pathname === item.href ? "text-primary" : "text-gray-400"
                      )} />
                      {isLocked(item.href) && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <Lock className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs",
                      location.pathname === item.href ? "text-primary" : "text-gray-400"
                    )}>{item.label}</span>
                  </Link>
                </div>
              )
            ))}
          </div>
        </div>
      </nav>
      
      {/* Safety Tips Dialog for Sell */}
      <SafetyTipsDialog 
        open={showSellSafetyTips} 
        onClose={() => {
          setShowSellSafetyTips(false);
          setIsSellModalOpen(true);
        }} 
        trigger="sell"
      />
      
      {/* Sell Modal */}
      <SellModal isOpen={isSellModalOpen} onClose={() => setIsSellModalOpen(false)} />
    </>
  );
};
