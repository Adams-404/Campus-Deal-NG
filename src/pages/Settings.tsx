import { PageTransition } from "@/components/PageTransition";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  Type, 
  Bell, 
  Share2, 
  User, 
  Moon,
  Sun,
  HelpCircle,
  Shield,
  MessageSquare,
  Info,
  LogOut
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Settings() {
  const { fontSize, setFontSize } = useSettings();
  const [isDarkMode, setIsDarkMode] = useState(true); // We'll implement theme context later

  const sections = [
    {
      title: "Preferences",
      items: [
        {
          icon: Type,
          label: "Font Size",
          content: (
            <div className="flex gap-2">
              <Button
                variant={fontSize === 'small' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFontSize('small')}
                className="h-8 text-xs"
              >
                Small
              </Button>
              <Button
                variant={fontSize === 'medium' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFontSize('medium')}
                className="h-8 text-xs"
              >
                Medium
              </Button>
              <Button
                variant={fontSize === 'large' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFontSize('large')}
                className="h-8 text-xs"
              >
                Large
              </Button>
            </div>
          )
        },
        {
          icon: isDarkMode ? Moon : Sun,
          label: "Theme",
          content: (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="h-8"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )
        }
      ]
    },
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Profile Settings",
          href: "/profile",
          iconColor: "text-blue-500",
          bgColor: "bg-blue-500/10"
        },
        {
          icon: Bell,
          label: "Notifications",
          href: "/notifications",
          iconColor: "text-purple-500",
          bgColor: "bg-purple-500/10"
        }
      ]
    },
    {
      title: "Support & About",
      items: [
        {
          icon: HelpCircle,
          label: "Help Center",
          href: "/help",
          iconColor: "text-green-500",
          bgColor: "bg-green-500/10"
        },
        {
          icon: Shield,
          label: "Privacy Policy",
          href: "/privacy",
          iconColor: "text-yellow-500",
          bgColor: "bg-yellow-500/10"
        },
        {
          icon: MessageSquare,
          label: "Feedback",
          href: "/feedback",
          iconColor: "text-pink-500",
          bgColor: "bg-pink-500/10"
        },
        {
          icon: Info,
          label: "About App",
          href: "/about",
          iconColor: "text-cyan-500",
          bgColor: "bg-cyan-500/10"
        },
        {
          icon: Share2,
          label: "Share App",
          href: "/share",
          iconColor: "text-orange-500",
          bgColor: "bg-orange-500/10"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 text-foreground pb-24">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-20">
        <PageTransition>
          <section className="py-6">
            <h1 className="text-2xl font-bold mb-8">Settings</h1>

            <div className="space-y-8">
              {sections.map((section) => (
                <div key={section.title}>
                  <h2 className="text-sm font-medium text-gray-400 mb-4">{section.title}</h2>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      item.href ? (
                        <Link
                          key={item.label}
                          to={item.href}
                          className="bg-secondary/50 rounded-lg border border-white/10 p-4 flex items-center justify-between hover:bg-secondary/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-full", item.bgColor)}>
                              <item.icon className={cn("w-5 h-5", item.iconColor)} />
                            </div>
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </Link>
                      ) : (
                        <div
                          key={item.label}
                          className="bg-secondary/50 rounded-lg border border-white/10 p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-full", item.bgColor || "bg-primary/10")}>
                              <item.icon className={cn("w-5 h-5", item.iconColor || "text-primary")} />
                            </div>
                            <span>{item.label}</span>
                          </div>
                          {item.content}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Button
                variant="ghost"
                className="w-full p-4 flex items-center justify-center gap-2 text-red-500 hover:text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </Button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">GSU Market v1.0.0</p>
            </div>
          </section>
        </PageTransition>
      </main>
    </div>
  );
}
