import { PageTransition } from "@/components/PageTransition";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { ExpandableSection } from "@/components/ui/expandable-section";
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
  LogOut,
  Monitor,
  BellRing,
  BellOff,
  Mail,
  ArrowLeft
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/NotificationContext";
import { toast } from "sonner";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const { fontSize, setFontSize } = useSettings();
  const { theme, setTheme } = useTheme();
  const { isEnabled, isPushSupported, toggleNotifications } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const notificationTypes = [
    {
      icon: BellRing,
      label: "Push Notifications",
      description: "Get notified about new messages and updates",
      enabled: isEnabled,
      supported: isPushSupported,
      onToggle: toggleNotifications
    },
    {
      icon: Mail,
      label: "Email Notifications",
      description: "Receive email updates about your activity",
      enabled: false,
      supported: true,
      onToggle: () => toast.info("Email notification settings coming soon!")
    },
    {
      icon: BellOff,
      label: "Do Not Disturb",
      description: "Temporarily disable all notifications",
      enabled: false,
      supported: true,
      onToggle: () => toast.info("Do Not Disturb settings coming soon!")
    }
  ];

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
          icon: LogOut,
          label: "Sign Out",
          iconColor: "text-red-500",
          bgColor: "bg-red-500/10",
          onClick: async () => {
            await supabase.auth.signOut();
            navigate('/');
            toast.success('Signed out successfully');
          }
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
    <div className="bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10">
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-center">
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6">
        <PageTransition>
          <div className="pt-24 pb-32 space-y-8">
            <div className="space-y-8">
              {/* Theme Section */}
              <div>
                <h2 className="text-sm font-medium text-gray-400 mb-4">Preferences</h2>
                <div className="space-y-4">
                  <ExpandableSection
                    icon={theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor}
                    label="Theme"
                    iconColor="text-purple-500"
                    bgColor="bg-purple-500/10"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={theme === 'light' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setTheme('light')}
                        className="w-full"
                      >
                        <Sun className="w-4 h-4 mr-2" />
                        Light
                      </Button>
                      <Button
                        variant={theme === 'dark' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setTheme('dark')}
                        className="w-full"
                      >
                        <Moon className="w-4 h-4 mr-2" />
                        Dark
                      </Button>
                      <Button
                        variant={theme === 'system' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setTheme('system')}
                        className="w-full"
                      >
                        <Monitor className="w-4 h-4 mr-2" />
                        System
                      </Button>
                    </div>
                  </ExpandableSection>

                  <ExpandableSection
                    icon={Bell}
                    label="Notifications"
                    iconColor="text-pink-500"
                    bgColor="bg-pink-500/10"
                  >
                    <div className="space-y-6">
                      {notificationTypes.map((type) => (
                        <div key={type.label} className="flex items-start gap-4 py-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <type.icon className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{type.label}</span>
                              {!type.supported && (
                                <span className="text-xs text-yellow-500">(Not supported)</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-2">{type.description}</p>
                          </div>
                          <Button
                            variant={type.enabled ? 'default' : 'ghost'}
                            size="sm"
                            onClick={type.onToggle}
                            className="h-8"
                            disabled={!type.supported}
                          >
                            {type.enabled ? 'On' : 'Off'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ExpandableSection>

                  <ExpandableSection
                    icon={Type}
                    label="Font Size"
                    iconColor="text-blue-500"
                    bgColor="bg-blue-500/10"
                  >
                    <div className="flex gap-2">
                      <Button
                        variant={fontSize === 'small' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFontSize('small')}
                        className="flex-1"
                      >
                        Small
                      </Button>
                      <Button
                        variant={fontSize === 'medium' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFontSize('medium')}
                        className="flex-1"
                      >
                        Medium
                      </Button>
                      <Button
                        variant={fontSize === 'large' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFontSize('large')}
                        className="flex-1"
                      >
                        Large
                      </Button>
                    </div>
                  </ExpandableSection>
                </div>
              </div>

              {/* Other Sections */}
              {sections.slice(1).map((section) => (
                <div key={section.title}>
                  <h2 className="text-sm font-medium text-gray-400 mb-4">{section.title}</h2>
                  <div className="space-y-2">
                    {section.items.map((item) => (
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
          </div>
        </PageTransition>
      </main>
    </div>
  );
}
