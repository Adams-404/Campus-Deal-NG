import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { DesktopSideNav } from "@/components/DesktopSideNav";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { trackPageView } from "@/utils/analytics"; // Import analytics tracking
import { initializeGemini } from "@/services/nlpService"; // Import Gemini initializer
import Index from "./pages/Index";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import SavedItems from "./pages/SavedItems";
import Help from "./pages/Help";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Share from "./pages/Share";
import { NotificationProvider } from "./contexts/NotificationContext";
import AuthLayout from "./components/AuthLayout";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Admin from "./pages/Admin";
import MyListings from "./pages/MyListings";
import UserProfile from "./pages/UserProfile";
import { SearchProvider } from "./contexts/SearchContext";
import NotificationsPage from "./pages/NotificationsPage";
import CategoryPage from "./pages/CategoryPage";
import SafetyTipsDialog from "./components/SafetyTipsDialog";
import Support from "./pages/Support";
import LazyHomepage from "./pages/LazyHomepage";
import LazyViewItem from "./pages/LazyViewItem";
import { useDeviceType } from "./hooks/use-mobile";
import DeliveryCoordinator from "./pages/DeliveryCoordinator";
import Feedback from "./pages/Feedback";
import { usePWATheme } from "./hooks/usePWATheme";

const queryClient = new QueryClient();

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  if (user) {
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
    "/admin", 
    "/notifications",
    "/support"
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  // Determine if we should show the desktop sidenav
  const shouldShowSideNav = user && deviceType !== 'mobile';
  
  // Determine if we should show the header
  const shouldShowNavbar = (path: string) => {
    // For mobile, always show navbar on home
    if (deviceType === 'mobile' && path === '/home') return true;
    
    // For desktop, only show navbar on home
    if (deviceType !== 'mobile') {
      if (path === '/home') return true;
      
      // Don't show navbar on saved page for desktop specifically
      if (path === '/saved') return false;
      
      // In other cases, no navbar for desktop
      return false;
    }
    
    // Default case for mobile
    return path === '/home';
  };
  
  // Apply main content padding based on device and sidenav visibility
  const getContentClass = () => {
    const isHomePage = location.pathname === '/home';
    
    if (deviceType === 'mobile') {
      // No top padding for mobile to fix the spacing issue
      return isHomePage ? "pb-24" : "pb-24"; 
    } else if (shouldShowSideNav) {
      return "ml-[300px]"; // Add left margin for desktop/tablet with sidenav
    } else {
      return ""; // Default case
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
              </Route>

              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
              <Route path="/help" element={<Help />} />
              <Route path="/support" element={<Support />} />
              <Route path="/feedback" element={<Feedback />} />

              <Route path="/home" element={<ProtectedRoute allowGuest><LazyHomepage /></ProtectedRoute>} />
              <Route path="/category/:category" element={<ProtectedRoute allowGuest><CategoryPage /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/messages/:conversationId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/user/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute allowGuest><Settings /></ProtectedRoute>} />
              <Route path="/saved" element={<ProtectedRoute><SavedItems /></ProtectedRoute>} />
              <Route path="/share" element={<ProtectedRoute><Share /></ProtectedRoute>} />
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
              <TooltipProvider>
                <BrowserRouter>
                  <AnimatedRoutes />
                  <Toaster />
                  <Sonner />
                </BrowserRouter>
              </TooltipProvider>
            </SearchProvider>
          </NotificationProvider>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
