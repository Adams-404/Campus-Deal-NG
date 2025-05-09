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
  ArrowLeft,
  Headphones,
  Headset
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/NotificationContext";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { isEnabled, isPushSupported, toggleNotifications } = useNotifications();
  const navigate = useNavigate();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(isEnabled);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      await checkAuthStatus();
      await checkAdminStatus();
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      setIsAdmin(roles?.some(r => r.role === 'admin') ?? false);
    }
  };

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
      items: []
    },
    {
      title: "Account",
      items: user ? [
        {
          icon: User,
          label: "Profile",
          href: "/profile",
          iconColor: "text-blue-500",
          bgColor: "bg-blue-500/10"
        },
        ...(isAdmin ? [{
          icon: Shield,
          label: "Admin Dashboard",
          href: "/admin",
          iconColor: "text-purple-500",
          bgColor: "bg-purple-500/10"
        }] : [])
      ] : [
        {
          icon: User,
          label: "Login",
          href: "/auth/SignIn",
          iconColor: "text-blue-500",
          bgColor: "bg-blue-500/10"
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10
  ml-0 lg:ml-[300px] transition-all duration-300">

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-center relative">
            <h1 className="text-lg font-semibold">Settings</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/support')}
              className="text-blue-500 hover:text-blue-400 absolute right-0"
            >
              <Headset className="h-9 w-9" />
            </Button>
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>
      </div>

      <main className="w-full max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 lg:ml-[300px] transition-all duration-300">
        <PageTransition>
          {isLoading ? (
            <div className="pt-24 pb-32 space-y-8 animate-pulse">
              <div className="space-y-8">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gray-200 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-4 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-24 pb-32 space-y-8">
              <div className="space-y-8">
                {/* Theme Section */}
                <div>
                  <h2 className="text-sm font-medium text-gray-400 mb-4">Preferences</h2>
                  <div className="space-y-4">
                    <ExpandableSection
                      icon={theme === 'dark' ? Moon : Sun}
                      label="Theme"
                      iconColor="text-purple-500"
                      bgColor="bg-purple-500/10"
                    >
                      <div className="flex gap-2">
                        <Button
                          variant={theme === 'dark' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setTheme('dark')}
                          className="flex-1"
                        >
                          Dark
                        </Button>
                        <Button
                          variant={theme === 'light' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setTheme('light')}
                          className="flex-1"
                        >
                          Light
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
                  </div>
                </div>

                {/* Other Sections */}
                {sections.map((section) => (
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

              {user && (
                <div className="mt-24">
                  <Button
                    variant="ghost"
                    className="w-full h-[60px] bg-secondary/50 rounded-lg border border-white/10 flex items-center justify-between hover:bg-secondary/80 transition-colors group"
                    onClick={() => setShowSignOutDialog(true)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-red-500/10">
                        <LogOut className="w-5 h-5 text-red-500" />
                      </div>
                      <span className="text-red-500">Sign Out</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-500 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>
              )}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-400">GSU Market v1.0.0</p>
              </div>
            </div>
          )}
        </PageTransition>
      </main>

      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSignOut}
              className="bg-red-500 hover:bg-red-600"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
