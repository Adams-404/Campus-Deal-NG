
import { Home, MessageSquare, Plus, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { SellModal } from "./SellModal";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: MessageSquare, label: "Messages", href: "/messages" },
  { icon: Plus, label: "Sell", href: "#" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export const BottomNav = () => {
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-secondary border-t border-white/10 px-6 pb-6 pt-3">
        <div className="flex justify-between items-center max-w-md mx-auto relative">
          {navItems.map((item, index) => (
            <a
              key={item.label}
              href={item.href}
              onClick={index === 2 ? (e) => {
                e.preventDefault();
                setIsSellModalOpen(true);
              } : undefined}
              className={cn(
                "flex flex-col items-center gap-1",
                index === 2 && "-mt-8"
              )}
            >
              {index === 2 ? (
                <div className="bg-primary rounded-full p-4 shadow-lg shadow-primary/20 -mt-6">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <item.icon className="w-6 h-6 text-gray-400" />
              )}
              <span className="text-xs text-gray-400">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
      <SellModal isOpen={isSellModalOpen} onClose={() => setIsSellModalOpen(false)} />
    </>
  );
};
