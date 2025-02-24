
import { Bell, Shield, CreditCard, HelpCircle, LogOut } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

const settingsItems = [
  { icon: Bell, label: "Notifications", href: "#" },
  { icon: Shield, label: "Privacy & Security", href: "#" },
  { icon: CreditCard, label: "Payments", href: "#" },
  { icon: HelpCircle, label: "Help & Support", href: "#" },
];

const Settings = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-4">
          {settingsItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-4 bg-secondary p-4 rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <item.icon className="w-5 h-5 text-primary" />
              <span className="flex-1">{item.label}</span>
            </a>
          ))}

          <button className="flex items-center gap-4 w-full bg-secondary p-4 rounded-lg hover:bg-danger/10 text-danger transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Settings;
