import { Home, MessageSquare, Plus, Heart, Settings, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { SellModal } from "./SellModal";
import { Link, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const lockedFeatures = ['/messages', '/saved', '#'];

export const BottomNav = () => {
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const { toast } = useToast();

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
      <nav data-bottom-nav className="fixed bottom-0 left-0 right-0 bg-secondary border-t border-white/10 px-6 pb-6 pt-3">
        <div className="flex justify-between items-center max-w-md mx-auto relative">
          {navItems.map((item, index) => (
            index === 2 ? (
              <button
                key={item.label}
                onClick={() => {
                  if (isLocked(item.href)) {
                    handleLockedFeature(item.href);
                  } else {
                    setIsSellModalOpen(true);
                  }
                }}
                className={cn(
                  "flex flex-col items-center gap-1 relative",
                  "-mt-8"
                )}
              >
                <div className="bg-primary rounded-full p-4 shadow-lg shadow-primary/20 -mt-6 relative">
                  <item.icon className="w-6 h-6 text-white" />
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
                    "flex flex-col items-center gap-1",
                    location.pathname === item.href && "text-primary"
                  )}
                >
                  <div className="relative">
                    <item.icon className={cn(
                      "w-6 h-6",
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
      </nav>
      <SellModal isOpen={isSellModalOpen} onClose={() => setIsSellModalOpen(false)} />
    </>
  );
};
