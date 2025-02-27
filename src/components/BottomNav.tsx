import { Home, MessageSquare, Plus, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { SellModal } from "./SellModal";
import { Link, useLocation } from "react-router-dom";

export const BottomNav = () => {
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: Plus, label: "Sell", href: "#" },
    { icon: User, label: "Profile", href: "/profile" },
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
                onClick={() => setIsSellModalOpen(true)}
                className={cn(
                  "flex flex-col items-center gap-1",
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
                  "flex flex-col items-center gap-1",
                  location.pathname === item.href && "text-primary"
                )}
              >
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
      <SellModal isOpen={isSellModalOpen} onClose={() => setIsSellModalOpen(false)} />
    </>
  );
};
