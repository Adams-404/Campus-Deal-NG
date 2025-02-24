import { Bell, Shield, CreditCard, HelpCircle, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { PageTransition } from "@/components/PageTransition";

const settingsItems = [
  { 
    icon: Bell, 
    label: "Notifications", 
    href: "#"
  },
  { 
    icon: Shield, 
    label: "Privacy & Security", 
    href: "#"
  },
  { 
    icon: CreditCard, 
    label: "Payments", 
    href: "#"
  },
  { 
    icon: HelpCircle, 
    label: "Help & Support", 
    href: "#"
  },
];

const Settings = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <PageTransition>
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          
          <div className="space-y-4">
            {settingsItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="flex items-center gap-4 p-4 rounded-lg transition-all
                  bg-transparent hover:bg-transparent
                  border-2 border-blue-500 hover:border-blue-600"
              >
                <item.icon className="w-5 h-5 text-blue-500" />
                <span className="flex-1 text-white">{item.label}</span>
              </Link>
            ))}

            <div className="pt-12">
              <button 
                className="flex items-center gap-4 w-full p-4 rounded-lg transition-all
                  bg-transparent hover:bg-transparent
                  border-2 border-red-500 hover:border-red-600"
              >
                <LogOut className="w-5 h-5 text-red-500" />
                <span className="flex-1 text-white">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
};

export default Settings;
