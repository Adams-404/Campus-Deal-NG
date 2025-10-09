import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { DesktopSideNav } from "@/components/DesktopSideNav";
import { useEffect, useState, Suspense, lazy } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { trackPageView } from "@/utils/analytics";
import { initializeGemini } from "@/services/nlpService";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { SearchProvider } from "./contexts/SearchContext";
import { AppModeProvider } from "./contexts/AppModeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { useDeviceType } from "./hooks/use-mobile";
import { usePWATheme } from "./hooks/usePWATheme";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { PerformanceMonitor } from "./components/PerformanceMonitor";


// Lazy load all major components and pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Messages = lazy(() => import("./pages/Messages"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SavedItems = lazy(() => import("./pages/SavedItems"));
const Help = lazy(() => import("./pages/Help"));
const Privacy = lazy(() => import("./pages/Privacy"));
const About = lazy(() => import("./pages/About"));
const Share = lazy(() => import("./pages/Share"));
const AuthLayout = lazy(() => import("./components/AuthLayout"));
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const EmailVerification = lazy(() => import("./pages/auth/EmailVerification"));
const EmailConfirmed = lazy(() => import("./pages/auth/EmailConfirmed"));
const Admin = lazy(() => import("./pages/Admin"));
const MyListings = lazy(() => import("./pages/MyListings"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Wallet = lazy(() => import("./pages/Wallet"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const SafetyTipsDialog = lazy(() => import("./components/SafetyTipsDialog"));
const Support = lazy(() => import("./pages/Support"));
const LazyHomepage = lazy(() => import("./pages/LazyHomepage"));
const LazyViewItem = lazy(() => import("./pages/LazyViewItem"));
const LazySettings = lazy(() => import("./components/LazySettings"));
const LazySavedItems = lazy(() => import("./components/LazySavedItems"));
const LazyInviteFriends = lazy(() => import("./components/LazyInviteFriends"));
const SettingsChangePassword = lazy(() => import("./pages/SettingsChangePassword"));
const DeliveryCoordinator = lazy(() => import("./pages/DeliveryCoordinator"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const InviteFriends = lazy(() => import("./pages/InviteFriends"));
const Gigs = lazy(() => import("./pages/Gigs"));
const MyGigs = lazy(() => import("./pages/gigs/MyGigs"));
const Applications = lazy(() => import("./pages/gigs/Applications"));

// Create a single query client instance outside of the component with better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Reduced retries for faster loading
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      gcTime: 10 * 60 * 1000, // 10 minutes cache (renamed from cacheTime)
    },
  },
});

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if this is a password reset link by looking at URL hash or current path
  const isPasswordResetFlow = location.pathname === '/auth/reset-password' || 
                              location.hash.includes('type=recovery') || 
                              location.hash.includes('access_token') ||
                              window.location.hash.includes('type=recovery');

  // Don't redirect if user is on password reset flow
  if (user && !isPasswordResetFlow) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const showNav = location.pathname === '/home'; 
  const hideBottomNav = [
    "/", 
    "/auth", 
    "/auth/signin", 
    "/auth/signup", 
    "/auth/forgot-password",
    "/auth/reset-password",
    "/email-verification",
    "/email-confirmed",
    "/admin", 
    "/notifications",
    "/support",
    "/leaderboard"
  ].includes(location.pathname) || location.pathname.match(/^\/messages\/[^/]+$/);
  
  const { hideSafetyTips, showSafetyTips, setShowSafetyTips, loadingSettings } = useSettings();
  const [user, setUser] = useState<any>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const deviceType = useDeviceType();
  
  // Initialize PWA theme adaptation
  usePWATheme();
  
  // Track page views when route changes
  useEffect(() => {
    // Track page view with Google Analytics
    trackPageView(location.pathname);
  }, [location.pathname]);
  
  useEffect(() => {
    const checkUserAndSettings = async () => {
      if (loadingSettings) {
        return; 
      }

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoaded(true);
      
      if (user && !hideSafetyTips && location.pathname === '/home') {
        if (!showSafetyTips) { 
           setShowSafetyTips(true);
        }
      }
    };
    
    checkUserAndSettings();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, [location.pathname, hideSafetyTips, loadingSettings, showSafetyTips, setShowSafetyTips]);
  
  useEffect(() => {
    if (location.pathname !== '/') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);
  
  const fallbackLoader = (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  );

  // Determine if we should show the desktop sidenav
  const isAuthPage = location.pathname.startsWith('/auth') || location.pathname === '/email-verification' || location.pathname === '/email-confirmed';
  const shouldShowSideNav = user && deviceType !== 'mobile' && !isAuthPage;
  
  // Define routes where navbar should be shown - only on home and gigs pages
  const shouldShowNavbar = (path: string) => {
    // Only show navbar on these exact routes
    return ['/home', '/gigs'].includes(path);
  };
  
  // Apply main content padding based on device and sidenav visibility
  const getContentClass = () => {
    const showNav = shouldShowNavbar(location.pathname);
    
    if (deviceType === 'mobile') {
      // Add bottom padding to account for bottom nav
      return 'pb-24';
    } else if (shouldShowSideNav) {
      // Add left margin for desktop/tablet with sidenav, and top padding if navbar is visible
      return showNav ? "ml-[300px] pt-14" : "ml-[300px]";
    } else {
      // Add top padding if navbar is visible
      return showNav ? "pt-14" : "";
    }
  };

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-background">
      {shouldShowNavbar(location.pathname) && <Navbar />}
      {shouldShowSideNav && <DesktopSideNav />}
      
      <main className={cn("flex-1", getContentClass())}>
        <AnimatePresence mode="wait">
          <Suspense fallback={fallbackLoader}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
              <Route path="/auth" element={<AuthGuard><AuthLayout /></AuthGuard>}>
                <Route index element={<SignIn />} />
                <Route path="signin" element={<SignIn />} />
                <Route path="signup" element={<SignUp />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
              </Route>
              <Route path="/email-verification" element={<EmailVerification />} />
              <Route path="/email-confirmed" element={<EmailConfirmed />} />

              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
              <Route path="/help" element={<Help />} />
              <Route path="/support" element={<Support />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/leaderboard" element={<Leaderboard />} />

              <Route path="/home" element={<ProtectedRoute allowGuest><LazyHomepage /></ProtectedRoute>} />
              <Route path="/category/:category" element={<ProtectedRoute allowGuest><CategoryPage /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/messages/:conversationId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/user/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute allowGuest><LazySettings /></ProtectedRoute>} />
              <Route path="/settings/reset-password" element={<ProtectedRoute><SettingsChangePassword /></ProtectedRoute>} />
              <Route path="/saved" element={<ProtectedRoute><LazySavedItems /></ProtectedRoute>} />
              <Route path="/gigs" element={<ProtectedRoute allowGuest><Gigs /></ProtectedRoute>} />
              <Route path="/gigs/my-gigs" element={<ProtectedRoute><MyGigs /></ProtectedRoute>} />
              <Route path="/gigs/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
              <Route path="/share" element={<ProtectedRoute><Share /></ProtectedRoute>} />
              <Route path="/invite-friends" element={<ProtectedRoute><LazyInviteFriends /></ProtectedRoute>} />
              <Route path="/item/:id" element={<ProtectedRoute allowGuest><LazyViewItem /></ProtectedRoute>} />
              <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              
              {/* Delivery Coordinator route */}
              <Route path="/delivery" element={<ProtectedRoute><DeliveryCoordinator /></ProtectedRoute>} />

              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>
      
      {!hideBottomNav && deviceType === 'mobile' && authLoaded && <BottomNav />}
      
      <SafetyTipsDialog 
        open={showSafetyTips} 
        onClose={() => setShowSafetyTips(false)} 
        trigger="app_open"
      />
      
      <PWAInstallPrompt />
    </div>
  );
};

const App = () => {
  // Initialize Gemini with API key from environment variables
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (geminiApiKey) {
    initializeGemini(geminiApiKey);
  } else {
    console.warn('Gemini API key not found. Some features may be limited.');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SettingsProvider>
          <NotificationProvider>
            <SearchProvider>
              <BrowserRouter>
                <AppModeProvider>
                  <TooltipProvider>
                    <AnimatedRoutes />
                    <Toaster />
                    <Sonner />
                    {import.meta.env.DEV && <PerformanceMonitor />}
                  </TooltipProvider>
                </AppModeProvider>
              </BrowserRouter>
            </SearchProvider>
          </NotificationProvider>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
